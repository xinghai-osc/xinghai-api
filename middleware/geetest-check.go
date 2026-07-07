package middleware

import (
	"crypto/hmac"
	"crypto/md5"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

type geetestValidateRequest struct {
	CaptchaID     string `json:"captcha_id"`
	CaptchaKey    string `json:"captcha_key"`
	LotNumber     string `json:"lot_number"`
	PassToken     string `json:"pass_token"`
	GenTime       string `json:"gen_time"`
	CaptchaOutput string `json:"captcha_output"`
	MarshalFormat string `json:"marshal_format"`
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
	if err := common.UnmarshalJsonStr(response, &req); err != nil {
		return nil
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
	if req.CaptchaID == "" || captchaKey == "" || req.LotNumber == "" || req.CaptchaOutput == "" || req.PassToken == "" || req.GenTime == "" {
		return false
	}

	postData := url.Values{}
	postData.Set("captcha_id", req.CaptchaID)
	postData.Set("lot_number", req.LotNumber)
	postData.Set("captcha_output", req.CaptchaOutput)
	postData.Set("pass_token", req.PassToken)
	postData.Set("gen_time", req.GenTime)
	postData.Set("sign_token", hmacSha256Hex(captchaKey, req.LotNumber))

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
		Status string `json:"status"`
		Result string `json:"result"`
		Reason string `json:"reason"`
		Code   string `json:"code"`
		Msg    string `json:"msg"`
	}
	if err := common.DecodeJson(resp.Body, &result); err != nil {
		common.SysLog("Geetest v4 response decode error: " + err.Error())
		return false
	}
	if result.Result != "success" {
		common.SysLog(fmt.Sprintf("Geetest v4 validate failed: status=%s result=%s code=%s reason=%s msg=%s", result.Status, result.Result, result.Code, result.Reason, result.Msg))
		return false
	}

	return true
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
	if err := common.DecodeJson(resp.Body, &result); err != nil {
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

func hmacSha256Hex(key string, message string) string {
	mac := hmac.New(sha256.New, []byte(key))
	mac.Write([]byte(message))
	return hex.EncodeToString(mac.Sum(nil))
}
