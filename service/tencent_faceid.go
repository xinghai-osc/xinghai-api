package service

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
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
	payloadBytes, err := common.Marshal(payloadMap)
	if err != nil {
		return nil, err
	}
	endpoint := strings.TrimSpace(settings.Endpoint)
	if endpoint == "" {
		endpoint = "faceid.tencentcloudapi.com"
	}
	timestamp := time.Now().Unix()
	authorization := buildTencentCloudAuthorization(settings.SecretId, settings.SecretKey, endpoint, tencentFaceIDService, tencentFaceIDAction, timestamp, string(payloadBytes))
	url := "https://" + endpoint
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", authorization)
	req.Header.Set("Content-Type", "application/json; charset=utf-8")
	req.Header.Set("Host", endpoint)
	req.Header.Set("X-TC-Action", tencentFaceIDAction)
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
		return nil, fmt.Errorf(errorResp.Response.Error.Code)
	}
	var apiResp tencentCloudAPIResponse
	if err := common.Unmarshal(body, &apiResp); err != nil {
		return nil, err
	}
	return &apiResp.Response, nil
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
