package system_setting

import (
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/config"
)

type GeetestSettings struct {
	Enabled       bool   `json:"enabled"`
	CaptchaID     string `json:"captcha_id"`
	CaptchaKey    string `json:"captcha_key"`
	ValidateURL   string `json:"validate_url"`
	Version       int    `json:"version"`
}

var defaultGeetestSettings = GeetestSettings{
	Enabled:     false,
	CaptchaID:   "",
	CaptchaKey:  "",
	ValidateURL: "https://gcaptcha4.geetest.com/validate",
	Version:     4,
}

func init() {
	config.GlobalConfig.Register("geetest", &defaultGeetestSettings)
}

func GetGeetestSettings() *GeetestSettings {
	return &defaultGeetestSettings
}

func IsGeetestEnabled() bool {
	return common.GeetestEnabled
}

func GetGeetestCaptchaID() string {
	return common.GeetestCaptchaID
}

func GetGeetestCaptchaKey() string {
	return common.GeetestCaptchaKey
}

func GetGeetestValidateURL() string {
	return common.GeetestValidateURL
}

func GetGeetestVersion() int {
	return common.GeetestVersion
}