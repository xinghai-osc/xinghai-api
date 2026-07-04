package system_setting

import "github.com/QuantumNous/new-api/setting/config"

type RealNameSettings struct {
	Enabled       bool   `json:"enabled"`
	Provider      string `json:"provider"`
	SecretId      string `json:"secret_id"`
	SecretKey     string `json:"secret_key"`
	Endpoint      string `json:"endpoint"`
	Region        string `json:"region"`
	RuleId        string `json:"rule_id"`
	RedirectUrl   string `json:"redirect_url"`
	RequireUnique bool   `json:"require_unique"`
}

var realNameSettings = RealNameSettings{
	Enabled:       false,
	Provider:      "tencent_faceid",
	SecretId:      "",
	SecretKey:     "",
	Endpoint:      "faceid.tencentcloudapi.com",
	Region:        "",
	RuleId:        "",
	RedirectUrl:   "",
	RequireUnique: true,
}

func init() {
	config.GlobalConfig.Register("real_name", &realNameSettings)
}

func GetRealNameSettings() *RealNameSettings {
	if realNameSettings.Provider == "" {
		realNameSettings.Provider = "tencent_faceid"
	}
	if realNameSettings.Endpoint == "" {
		realNameSettings.Endpoint = "faceid.tencentcloudapi.com"
	}
	return &realNameSettings
}
