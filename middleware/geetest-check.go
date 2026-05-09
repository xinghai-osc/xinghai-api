package middleware

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

type geetestValidateRequest struct {
	CaptchaID    string `json:"captcha_id"`
	CaptchaKey   string `json:"captcha_key"`
	LotNumber    string `json:"lot_number"`
	PassToken    string `json:"pass_token"`
	GenTime      string `json:"gen_time"`
	MarshalFormat string `json:"marshal_format"`
}

type geetestValidateResponse struct {
	Success int `json:"success"`
}

func GeetestCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		if common.GeetestEnabled {
			response := c.Query("geetest")
			if response == "" {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": "Geetest token 为空",
				})
				c.Abort()
				return
			}

			parsedResp := parseGeetestResponse(response)
			if parsedResp == nil {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": "Geetest 验证参数解析失败",
				})
				c.Abort()
				return
			}

			valid := validateGeetest(parsedResp)
			if !valid {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": "Geetest 校验失败，请刷新重试！",
				})
				c.Abort()
				return
			}
		}
		c.Next()
	}
}

func parseGeetestResponse(response string) *geetestValidateRequest {
	var req geetestValidateRequest
	err := json.Unmarshal([]byte(response), &req)
	if err != nil {
		var simpleResp struct {
			CaptchaID  string `json:"captcha_id"`
			LotNumber  string `json:"lot_number"`
			PassToken  string `json:"pass_token"`
			GenTime    string `json:"gen_time"`
		}
		if json.Unmarshal([]byte(response), &simpleResp) == nil {
			req.CaptchaID = simpleResp.CaptchaID
			req.LotNumber = simpleResp.LotNumber
			req.PassToken = simpleResp.PassToken
			req.GenTime = simpleResp.GenTime
			req.CaptchaKey = common.GeetestCaptchaKey
			req.MarshalFormat = "json"
		} else {
			return nil
		}
	}
	if req.CaptchaID == "" {
		req.CaptchaID = common.GeetestCaptchaID
	}
	if req.CaptchaKey == "" {
		req.CaptchaKey = common.GeetestCaptchaKey
	}
	return &req
}

func validateGeetest(req *geetestValidateRequest) bool {
	if common.GeetestVersion == 4 {
		return validateGeetestV4(req)
	}
	return validateGeetestV3(req)
}

func validateGeetestV4(req *geetestValidateRequest) bool {
	captchaKey := req.CaptchaKey
	if captchaKey == "" {
		captchaKey = common.GeetestCaptchaKey
	}

	signToken := md5Sum(captchaKey + "44b28f34e850a93f069e3d4c7f1eb08a" + req.LotNumber + req.GenTime)

	postData := url.Values{}
	postData.Set("captcha_id", req.CaptchaID)
	postData.Set("lot_number", req.LotNumber)
	postData.Set("pass_token", req.PassToken)
	postData.Set("gen_time", req.GenTime)
	postData.Set("sign_token", signToken)
	postData.Set("client_type", "web")
	postData.Set("ip_address", "")

	validateURL := common.GeetestValidateURL
	if validateURL == "" {
		validateURL = "https://gcaptcha4.geetest.com/validate"
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.PostForm(validateURL, postData)
	if err != nil {
		common.SysLog("Geetest v4 validate error: " + err.Error())
		return false
	}
	defer resp.Body.Close()

	var result struct {
		Success int `json:"success"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		common.SysLog("Geetest v4 response decode error: " + err.Error())
		return false
	}

	return result.Success == 1
}

func validateGeetestV3(req *geetestValidateRequest) bool {
	challenge := req.LotNumber
	validate := req.PassToken
	seccode := req.GenTime

	if challenge == "" || validate == "" || seccode == "" {
		return false
	}

	captchaID := req.CaptchaID
	if captchaID == "" {
		captchaID = common.GeetestCaptchaID
	}
	captchaKey := req.CaptchaKey
	if captchaKey == "" {
		captchaKey = common.GeetestCaptchaKey
	}

	resultStr := md5Sum(captchaKey + "geetest" + challenge)
	if resultStr != validate {
		return false
	}

	postData := url.Values{}
	postData.Set("seccode", seccode)

	validateURL := strings.Replace(common.GeetestValidateURL, "verify", "secverify", -1)
	if validateURL == "" {
		validateURL = "https://api.geetest.com/secverify"
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.PostForm(validateURL, postData)
	if err != nil {
		common.SysLog("Geetest v3 secverify error: " + err.Error())
		return false
	}
	defer resp.Body.Close()

	var result struct {
		Success int `json:"success"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		common.SysLog("Geetest v3 secverify response decode error: " + err.Error())
		return false
	}

	return result.Success == 1
}

func md5Sum(input string) string {
	data := []byte(input)
	sum := md5.Sum(data)
	return fmt.Sprintf("%x", sum)
}

func sortParams(params map[string]string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	result := make([]string, 0, len(params))
	for _, k := range keys {
		result = append(result, k+"="+params[k])
	}
	return strings.Join(result, "&")
}