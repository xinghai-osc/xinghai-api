package service

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/system_setting"
)

const (
	tencentFaceIDService = "faceid"
	tencentFaceIDVersion = "2018-03-01"
	tencentFaceIDAction  = "IdCardVerification"
	// tencentFaceIDDetectAuthAction 实名核身鉴权：返回 BizToken + VerificationURL，
	// 前端跳转 VerificationURL 即可打开 H5 刷脸窗口。
	tencentFaceIDDetectAuthAction = "DetectAuth"
	// tencentFaceIDGetDetectInfoAction 根据 BizToken 查询核身结果（增强版）。
	tencentFaceIDGetDetectInfoAction = "GetDetectInfoEnhanced"
)

type TencentFaceIDVerificationResponse struct {
	Result      string `json:"Result"`
	Description string `json:"Description"`
	RequestId   string `json:"RequestId"`
}

type tencentCloudAPIResponse struct {
	Response TencentFaceIDVerificationResponse `json:"Response"`
}

type tencentCloudAPIErrorResponse struct {
	Response struct {
		Error struct {
			Code    string `json:"Code"`
			Message string `json:"Message"`
		} `json:"Error"`
		RequestId string `json:"RequestId"`
	} `json:"Response"`
}

// TencentDetectAuthResponse 实名核身鉴权 DetectAuth 响应。
type TencentDetectAuthResponse struct {
	BizToken        string `json:"BizToken"`
	VerificationURL string `json:"VerificationURL"`
	RequestId       string `json:"RequestId"`
}

// TencentGetDetectInfoResponse 增强版查询核身结果响应。
type TencentGetDetectInfoResponse struct {
	IdCard      string  `json:"IdCard"`
	Name        string  `json:"Name"`
	Result      string  `json:"Result"`
	Description string  `json:"Description"`
	Similarity  float64 `json:"Similarity"`
	RequestId   string  `json:"RequestId"`
	// 0=待处理，1=通过，2=不通过
	Status int `json:"Status"`
}

func VerifyIdCardWithTencentFaceID(name string, idCard string) (*TencentFaceIDVerificationResponse, error) {
	settings := system_setting.GetRealNameSettings()
	if !settings.Enabled {
		return nil, fmt.Errorf("实名认证功能未启用")
	}
	if strings.TrimSpace(settings.SecretId) == "" || strings.TrimSpace(settings.SecretKey) == "" {
		return nil, fmt.Errorf("腾讯云 FaceID 密钥未配置")
	}
	payloadMap := map[string]string{
		"Name":   strings.TrimSpace(name),
		"IdCard": strings.ToUpper(strings.TrimSpace(idCard)),
	}
	body, err := invokeTencentFaceID(settings, tencentFaceIDAction, payloadMap)
	if err != nil {
		return nil, err
	}
	var apiResp tencentCloudAPIResponse
	if err := common.Unmarshal(body, &apiResp); err != nil {
		return nil, err
	}
	return &apiResp.Response, nil
}

// CreateFaceIdVerifySession 调用腾讯云 DetectAuth 鉴权接口，拿到 BizToken 与
// VerificationURL，前端跳转 VerificationURL 即可打开 H5 刷脸弹窗。
// redirectUrl 是用户完成刷脸后腾讯云 H5 页面跳转回业务方的回跳地址（可选）。
func CreateFaceIdVerifySession(ruleId string, redirectUrl string) (*TencentDetectAuthResponse, error) {
	settings := system_setting.GetRealNameSettings()
	if !settings.Enabled {
		return nil, fmt.Errorf("实名认证功能未启用")
	}
	if strings.TrimSpace(settings.SecretId) == "" || strings.TrimSpace(settings.SecretKey) == "" {
		return nil, fmt.Errorf("腾讯云 FaceID 密钥未配置")
	}
	if strings.TrimSpace(ruleId) == "" {
		return nil, fmt.Errorf("腾讯云 FaceID RuleId 未配置")
	}
	payloadMap := map[string]string{
		"RuleId":      strings.TrimSpace(ruleId),
		"IdCard":      "",
		"Name":        "",
		"RedirectUrl": strings.TrimSpace(redirectUrl),
	}
	body, err := invokeTencentFaceID(settings, tencentFaceIDDetectAuthAction, payloadMap)
	if err != nil {
		return nil, err
	}
	var resp struct {
		Response TencentDetectAuthResponse `json:"Response"`
	}
	if err := common.Unmarshal(body, &resp); err != nil {
		return nil, err
	}
	return &resp.Response, nil
}

// GetFaceIdVerifyResult 使用 BizToken 调用 GetDetectInfoEnhanced 增强版查询接口
// 获取实名核身结果（包含姓名、身份证号、Result 0/非0、Status 0/1/2）。
func GetFaceIdVerifyResult(bizToken string) (*TencentGetDetectInfoResponse, error) {
	settings := system_setting.GetRealNameSettings()
	if !settings.Enabled {
		return nil, fmt.Errorf("实名认证功能未启用")
	}
	if strings.TrimSpace(settings.SecretId) == "" || strings.TrimSpace(settings.SecretKey) == "" {
		return nil, fmt.Errorf("腾讯云 FaceID 密钥未配置")
	}
	if strings.TrimSpace(bizToken) == "" {
		return nil, fmt.Errorf("BizToken 不能为空")
	}
	payloadMap := map[string]string{
		"BizToken": strings.TrimSpace(bizToken),
	}
	body, err := invokeTencentFaceID(settings, tencentFaceIDGetDetectInfoAction, payloadMap)
	if err != nil {
		return nil, err
	}
	var resp struct {
		Response TencentGetDetectInfoResponse `json:"Response"`
	}
	if err := common.Unmarshal(body, &resp); err != nil {
		return nil, err
	}
	return &resp.Response, nil
}

// invokeTencentFaceID 通用调用腾讯云 faceid 服务下任意 action 接口。
func invokeTencentFaceID(settings *system_setting.RealNameSettings, action string, payloadMap map[string]string) ([]byte, error) {
	payloadBytes, err := common.Marshal(payloadMap)
	if err != nil {
		return nil, err
	}
	endpoint := strings.TrimSpace(settings.Endpoint)
	if endpoint == "" {
		endpoint = "faceid.tencentcloudapi.com"
	}
	timestamp := time.Now().Unix()
	authorization := buildTencentCloudAuthorization(settings.SecretId, settings.SecretKey, endpoint, tencentFaceIDService, action, timestamp, string(payloadBytes))
	url := "https://" + endpoint
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", authorization)
	req.Header.Set("Content-Type", "application/json; charset=utf-8")
	req.Header.Set("Host", endpoint)
	req.Header.Set("X-TC-Action", action)
	req.Header.Set("X-TC-Timestamp", fmt.Sprintf("%d", timestamp))
	req.Header.Set("X-TC-Version", tencentFaceIDVersion)
	if strings.TrimSpace(settings.Region) != "" {
		req.Header.Set("X-TC-Region", strings.TrimSpace(settings.Region))
	}
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf("腾讯云 FaceID HTTP 状态异常: %d", resp.StatusCode)
	}
	var errorResp tencentCloudAPIErrorResponse
	if err := common.Unmarshal(body, &errorResp); err == nil && errorResp.Response.Error.Code != "" {
		if errorResp.Response.Error.Message != "" {
			return nil, fmt.Errorf("%s: %s", errorResp.Response.Error.Code, errorResp.Response.Error.Message)
		}
		return nil, errors.New(errorResp.Response.Error.Code)
	}
	return body, nil
}

func buildTencentCloudAuthorization(secretId string, secretKey string, host string, service string, action string, timestamp int64, payload string) string {
	algorithm := "TC3-HMAC-SHA256"
	date := time.Unix(timestamp, 0).UTC().Format("2006-01-02")
	canonicalRequest := strings.Join([]string{
		"POST",
		"/",
		"",
		"content-type:application/json; charset=utf-8\n" + "host:" + host + "\n" + "x-tc-action:" + strings.ToLower(action) + "\n",
		"content-type;host;x-tc-action",
		hashSHA256(payload),
	}, "\n")
	credentialScope := date + "/" + service + "/tc3_request"
	stringToSign := strings.Join([]string{
		algorithm,
		fmt.Sprintf("%d", timestamp),
		credentialScope,
		hashSHA256(canonicalRequest),
	}, "\n")
	secretDate := hmacSHA256([]byte("TC3"+secretKey), date)
	secretService := hmacSHA256(secretDate, service)
	secretSigning := hmacSHA256(secretService, "tc3_request")
	signature := hex.EncodeToString(hmacSHA256(secretSigning, stringToSign))
	return fmt.Sprintf("%s Credential=%s/%s, SignedHeaders=content-type;host;x-tc-action, Signature=%s", algorithm, secretId, credentialScope, signature)
}

func hashSHA256(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func hmacSHA256(key []byte, value string) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(value))
	return mac.Sum(nil)
}
