package controller

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/oauth"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/console_setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/setting/system_setting"

	"github.com/gin-gonic/gin"
)

func TestStatus(c *gin.Context) {
	err := model.PingDB()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false,
			"message": "数据库连接失败",
		})
		return
	}
	// 获取HTTP统计信息
	httpStats := middleware.GetStats()
	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Server is running",
		"http_stats": httpStats,
	})
	return
}

func GetStatus(c *gin.Context) {

	cs := console_setting.GetConsoleSetting()
	common.OptionMapRWMutex.RLock()
	defer common.OptionMapRWMutex.RUnlock()

	passkeySetting := system_setting.GetPasskeySettings()
	legalSetting := system_setting.GetLegalSettings()

	data := gin.H{
		"version":                     common.Version,
		"start_time":                  common.StartTime,
		"email_verification":          common.EmailVerificationEnabled,
		"github_oauth":                common.GitHubOAuthEnabled,
		"github_client_id":            common.GitHubClientId,
		"discord_oauth":               system_setting.GetDiscordSettings().Enabled,
		"discord_client_id":           system_setting.GetDiscordSettings().ClientId,
		"linuxdo_oauth":               common.LinuxDOOAuthEnabled,
		"linuxdo_client_id":           common.LinuxDOClientId,
		"linuxdo_minimum_trust_level": common.LinuxDOMinimumTrustLevel,
		"telegram_oauth":              common.TelegramOAuthEnabled,
		"telegram_bot_name":           common.TelegramBotName,
		"theme":                       system_setting.GetThemeSettings().Frontend,
		"system_name":                 common.SystemName,
		"logo":                        common.Logo,
		"footer_html":                 common.Footer,
		"wechat_qrcode":               common.WeChatAccountQRCodeImageURL,
		"wechat_login":                common.WeChatAuthEnabled,
		"server_address":              system_setting.ServerAddress,
		"turnstile_check":             common.TurnstileCheckEnabled,
		"turnstile_site_key":          common.TurnstileSiteKey,
		"geetest_enabled":             common.GeetestEnabled,
		"geetest_captcha_id":          common.GeetestCaptchaID,
		"docs_link":                   operation_setting.GetGeneralSetting().DocsLink,
		"quota_per_unit":              common.QuotaPerUnit,
		// 兼容旧前端：保留 display_in_currency，同时提供新的 quota_display_type
		"display_in_currency":           operation_setting.IsCurrencyDisplay(),
		"quota_display_type":            operation_setting.GetQuotaDisplayType(),
		"custom_currency_symbol":        operation_setting.GetGeneralSetting().CustomCurrencySymbol,
		"custom_currency_exchange_rate": operation_setting.GetGeneralSetting().CustomCurrencyExchangeRate,
		"enable_batch_update":           common.BatchUpdateEnabled,
		"enable_drawing":                common.DrawingEnabled,
		"enable_task":                   common.TaskEnabled,
		"enable_data_export":            common.DataExportEnabled,
		"data_export_default_time":      common.DataExportDefaultTime,
		"default_collapse_sidebar":      common.DefaultCollapseSidebar,
		"mj_notify_enabled":             setting.MjNotifyEnabled,
		"chats":                         setting.Chats,
		"demo_site_enabled":             operation_setting.DemoSiteEnabled,
		"self_use_mode_enabled":         operation_setting.SelfUseModeEnabled,
		"register_enabled":              common.RegisterEnabled,
		"password_login_enabled":        common.PasswordLoginEnabled,
		"password_register_enabled":     common.PasswordRegisterEnabled,
		"default_use_auto_group":        setting.DefaultUseAutoGroup,

		"usd_exchange_rate": operation_setting.USDExchangeRate,
		"price":             operation_setting.Price,
		"stripe_unit_price": setting.StripeUnitPrice,

		// 面板启用开关
		"api_info_enabled":      cs.ApiInfoEnabled,
		"uptime_kuma_enabled":   cs.UptimeKumaEnabled,
		"announcements_enabled": cs.AnnouncementsEnabled,
		"faq_enabled":           cs.FAQEnabled,

		// 模块管理配置
		"HeaderNavModules":    common.OptionMap["HeaderNavModules"],
		"SidebarModulesAdmin": common.OptionMap["SidebarModulesAdmin"],
		"CustomSidebarItems":  common.OptionMap["CustomSidebarItems"],

		"oidc_enabled":                system_setting.GetOIDCSettings().Enabled,
		"oidc_client_id":              system_setting.GetOIDCSettings().ClientId,
		"oidc_authorization_endpoint": system_setting.GetOIDCSettings().AuthorizationEndpoint,
		"passkey_login":               passkeySetting.Enabled,
		"passkey_display_name":        passkeySetting.RPDisplayName,
		"passkey_rp_id":               passkeySetting.RPID,
		"passkey_origins":             passkeySetting.Origins,
		"passkey_allow_insecure":      passkeySetting.AllowInsecureOrigin,
		"passkey_user_verification":   passkeySetting.UserVerification,
		"passkey_attachment":          passkeySetting.AttachmentPreference,
		"setup":                       constant.Setup,
		"user_agreement_enabled":      legalSetting.UserAgreement != "",
		"privacy_policy_enabled":      legalSetting.PrivacyPolicy != "",
		"checkin_enabled":             operation_setting.GetCheckinSetting().Enabled,
		"real_name_enabled":           system_setting.GetRealNameSettings().Enabled,
	}

	// 根据启用状态注入可选内容
	if cs.ApiInfoEnabled {
		data["api_info"] = console_setting.GetApiInfo()
	}
	if cs.AnnouncementsEnabled {
		data["announcements"] = console_setting.GetAnnouncements()
	}
	if cs.FAQEnabled {
		data["faq"] = console_setting.GetFAQ()
	}

	// Add enabled custom OAuth providers
	customProviders := oauth.GetEnabledCustomProviders()
	if len(customProviders) > 0 {
		type CustomOAuthInfo struct {
			Id                    int    `json:"id"`
			Name                  string `json:"name"`
			Slug                  string `json:"slug"`
			Icon                  string `json:"icon"`
			ClientId              string `json:"client_id"`
			AuthorizationEndpoint string `json:"authorization_endpoint"`
			Scopes                string `json:"scopes"`
		}
		providersInfo := make([]CustomOAuthInfo, 0, len(customProviders))
		for _, p := range customProviders {
			config := p.GetConfig()
			providersInfo = append(providersInfo, CustomOAuthInfo{
				Id:                    config.Id,
				Name:                  config.Name,
				Slug:                  config.Slug,
				Icon:                  config.Icon,
				ClientId:              config.ClientId,
				AuthorizationEndpoint: config.AuthorizationEndpoint,
				Scopes:                config.Scopes,
			})
		}
		data["custom_oauth_providers"] = providersInfo
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    data,
	})
	return
}

func GetNotice(c *gin.Context) {
	common.OptionMapRWMutex.RLock()
	defer common.OptionMapRWMutex.RUnlock()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    common.OptionMap["Notice"],
	})
	return
}

func GetAbout(c *gin.Context) {
	common.OptionMapRWMutex.RLock()
	defer common.OptionMapRWMutex.RUnlock()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    common.OptionMap["About"],
	})
	return
}

func GetUserAgreement(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    system_setting.GetLegalSettings().UserAgreement,
	})
	return
}

func GetPrivacyPolicy(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    system_setting.GetLegalSettings().PrivacyPolicy,
	})
	return
}

func GetMidjourney(c *gin.Context) {
	common.OptionMapRWMutex.RLock()
	defer common.OptionMapRWMutex.RUnlock()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    common.OptionMap["Midjourney"],
	})
	return
}

func GetHomePageContent(c *gin.Context) {
	common.OptionMapRWMutex.RLock()
	defer common.OptionMapRWMutex.RUnlock()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    common.OptionMap["HomePageContent"],
	})
	return
}

func SendEmailVerification(c *gin.Context) {
	email := c.Query("email")
	if err := common.Validate.Var(email, "required,email"); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的邮箱地址",
		})
		return
	}
	localPart := parts[0]
	domainPart := parts[1]
	if common.EmailDomainRestrictionEnabled {
		allowed := false
		for _, domain := range common.EmailDomainWhitelist {
			if domainPart == domain {
				allowed = true
				break
			}
		}
		if !allowed {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "The administrator has enabled the email domain name whitelist, and your email address is not allowed due to special symbols or it's not in the whitelist.",
			})
			return
		}
	}
	if common.EmailAliasRestrictionEnabled {
		containsSpecialSymbols := strings.Contains(localPart, "+") || strings.Contains(localPart, ".")
		if containsSpecialSymbols {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "管理员已启用邮箱地址别名限制，您的邮箱地址由于包含特殊符号而被拒绝。",
			})
			return
		}
	}

	if model.IsEmailAlreadyTaken(email) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "邮箱地址已被占用",
		})
		return
	}
	code := common.GenerateVerificationCode(6)
	common.RegisterVerificationCodeWithKey(email, code, common.EmailVerificationPurpose)
	subject := fmt.Sprintf("%s邮箱验证邮件", common.SystemName)
	content := fmt.Sprintf(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>邮箱验证</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%%; padding: 40px 20px; box-sizing: border-box; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #f1f5f9; }
        .header { background: linear-gradient(135deg, #4f46e5 0%%, #7c3aed 100%%); padding: 40px 32px; text-align: center; position: relative; }
        .header::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 40px; background: url("data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%%3E%%3Cpath fill='%%23ffffff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%%3E%%3C/path%%3E%%3C/svg%%3E") no-repeat bottom; background-size: cover; }
        .header .icon { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; backdrop-filter: blur(8px); }
        .header .icon svg { width: 28px; height: 28px; fill: none; stroke: #ffffff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 40px 32px; color: #334155; font-size: 15px; line-height: 1.7; }
        .body p { margin: 0 0 16px; }
        .greeting { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .code-wrapper { background: linear-gradient(135deg, #f8fafc 0%%, #f1f5f9 100%%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; text-align: center; margin: 24px 0; position: relative; }
        .code-wrapper::before { content: 'VERIFICATION CODE'; position: absolute; top: -10px; left: 50%%; transform: translateX(-50%%); background: #ffffff; padding: 0 12px; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; }
        .code { font-size: 36px; font-weight: 800; color: #4f46e5; letter-spacing: 6px; font-family: "SF Mono", Monaco, "Cascadia Code", monospace; line-height: 1; }
        .hint { font-size: 13px; color: #64748b; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .divider { height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent); margin: 24px 0; }
        .security-notice { background: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 16px 20px; font-size: 13px; color: #854d0e; display: flex; align-items: flex-start; gap: 10px; }
        .security-notice svg { width: 18px; height: 18px; fill: none; stroke: #ca8a04; stroke-width: 2; flex-shrink: 0; margin-top: 1px; }
        .footer { background: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 0; }
        .footer .brand { font-weight: 600; color: #64748b; }
        @media (max-width: 480px) {
            .wrapper { padding: 20px 12px; }
            .header { padding: 32px 24px; }
            .body { padding: 32px 24px; }
            .code { font-size: 28px; letter-spacing: 4px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="icon">
                    <svg viewBox="0 0 24 24"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path><path d="M18 8V6a4 4 0 0 0-4-4 4 4 0 0 0-4 4v2"></path></svg>
                </div>
                <h1>%s</h1>
                <p>邮箱验证</p>
            </div>
            <div class="body">
                <p class="greeting">您好！</p>
                <p>感谢您使用我们的服务。您正在进行邮箱验证操作，请使用以下验证码完成验证：</p>
                <div class="code-wrapper">
                    <div class="code">%s</div>
                    <div class="hint">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        验证码在 %d 分钟内有效
                    </div>
                </div>
                <div class="divider"></div>
                <div class="security-notice">
                    <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span>如果这不是您本人操作，请忽略此邮件。请勿将验证码透露给任何人。</span>
                </div>
            </div>
            <div class="footer">
                <p>此邮件由 <span class="brand">%s</span> 自动发送，请勿直接回复。</p>
            </div>
        </div>
    </div>
</body>
</html>`, common.SystemName, code, common.VerificationValidMinutes, common.SystemName)
	err := common.SendEmail(subject, email, content)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
	return
}

func SendPasswordResetEmail(c *gin.Context) {
	email := c.Query("email")
	if err := common.Validate.Var(email, "required,email"); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	if model.IsEmailAlreadyTaken(email) {
		code := common.GenerateVerificationCode(0)
		common.RegisterVerificationCodeWithKey(email, code, common.PasswordResetPurpose)
		link := fmt.Sprintf("%s/user/reset?email=%s&token=%s", system_setting.ServerAddress, email, code)
		subject := fmt.Sprintf("%s密码重置", common.SystemName)
		content := fmt.Sprintf(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>密码重置</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%%; padding: 40px 20px; box-sizing: border-box; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #f1f5f9; }
        .header { background: linear-gradient(135deg, #f59e0b 0%%, #ef4444 100%%); padding: 40px 32px; text-align: center; position: relative; }
        .header::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 40px; background: url("data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%%3E%%3Cpath fill='%%23ffffff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%%3E%%3C/path%%3E%%3C/svg%%3E") no-repeat bottom; background-size: cover; }
        .header .icon { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; backdrop-filter: blur(8px); }
        .header .icon svg { width: 28px; height: 28px; fill: none; stroke: #ffffff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 40px 32px; color: #334155; font-size: 15px; line-height: 1.7; }
        .body p { margin: 0 0 16px; }
        .greeting { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .btn-wrapper { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%%, #ef4444 100%%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(239,68,68,0.35); transition: transform 0.2s, box-shadow 0.2s; }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,68,68,0.45); }
        .link-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 16px 0; }
        .link-section .label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .link-box { background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px 12px; word-break: break-all; font-size: 12px; color: #475569; font-family: "SF Mono", Monaco, monospace; }
        .divider { height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent); margin: 24px 0; }
        .security-notice { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px 20px; font-size: 13px; color: #991b1b; display: flex; align-items: flex-start; gap: 10px; }
        .security-notice svg { width: 18px; height: 18px; fill: none; stroke: #dc2626; stroke-width: 2; flex-shrink: 0; margin-top: 1px; }
        .footer { background: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 0; }
        .footer .brand { font-weight: 600; color: #64748b; }
        @media (max-width: 480px) {
            .wrapper { padding: 20px 12px; }
            .header { padding: 32px 24px; }
            .body { padding: 32px 24px; }
            .btn { padding: 14px 28px; font-size: 14px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="icon">
                    <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h1>%s</h1>
                <p>密码重置</p>
            </div>
            <div class="body">
                <p class="greeting">您好！</p>
                <p>我们收到了您的密码重置请求。点击下方按钮即可重置您的密码：</p>
                <div class="btn-wrapper">
                    <a href="%s" class="btn">重置密码</a>
                </div>
                <div class="link-section">
                    <div class="label">或复制链接到浏览器</div>
                    <div class="link-box">%s</div>
                </div>
                <div class="divider"></div>
                <div class="security-notice">
                    <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span>重置链接在 %d 分钟内有效。如果这不是您本人操作，请忽略此邮件，您的账户仍然安全。</span>
                </div>
            </div>
            <div class="footer">
                <p>此邮件由 <span class="brand">%s</span> 自动发送，请勿直接回复。</p>
            </div>
        </div>
    </div>
</body>
</html>`, common.SystemName, link, link, common.VerificationValidMinutes, common.SystemName)
		err := common.SendEmail(subject, email, content)
		if err != nil {
			logger.LogError(c.Request.Context(), fmt.Sprintf("failed to send password reset email to %s: %s", email, err.Error()))
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

type PasswordResetRequest struct {
	Email string `json:"email"`
	Token string `json:"token"`
}

func ResetPassword(c *gin.Context) {
	var req PasswordResetRequest
	err := json.NewDecoder(c.Request.Body).Decode(&req)
	if req.Email == "" || req.Token == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的参数",
		})
		return
	}
	if !common.VerifyCodeWithKey(req.Email, req.Token, common.PasswordResetPurpose) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "重置链接非法或已过期",
		})
		return
	}
	password := common.GenerateVerificationCode(12)
	err = model.ResetUserPasswordByEmail(req.Email, password)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.DeleteKey(req.Email, common.PasswordResetPurpose)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    password,
	})
	return
}

type TestEmailRequest struct {
	Email string `json:"email" binding:"required,email"`
	Type  string `json:"type" binding:"required"`
}

func wrapTestEmailContent(title string, bodyContent string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>%s</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%%; padding: 40px 20px; box-sizing: border-box; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #f1f5f9; }
        .header { background: linear-gradient(135deg, #334155 0%%, #475569 100%%); padding: 32px; text-align: center; position: relative; }
        .header::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 32px; background: url("data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%%3E%%3Cpath fill='%%23ffffff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%%3E%%3C/path%%3E%%3C/svg%%3E") no-repeat bottom; background-size: cover; }
        .header h1 { color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
        .body { padding: 32px; color: #334155; font-size: 15px; line-height: 1.7; }
        .body p { margin: 0 0 14px; }
        .body a { color: #4f46e5; text-decoration: none; font-weight: 500; }
        .body a:hover { text-decoration: underline; }
        .body strong { color: #1e293b; }
        .alert { background: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 16px 20px; font-size: 14px; color: #854d0e; margin: 16px 0; }
        .alert-error { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
        .alert-success { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
        .alert-info { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
        .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 0; }
        .footer .brand { font-weight: 600; color: #64748b; }
        @media (max-width: 480px) {
            .wrapper { padding: 20px 12px; }
            .header { padding: 24px; }
            .body { padding: 24px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>%s</h1>
            </div>
            <div class="body">
                %s
            </div>
            <div class="footer">
                <p>此邮件由 <span class="brand">%s</span> 自动发送，请勿直接回复。</p>
            </div>
        </div>
    </div>
</body>
</html>`, title, title, bodyContent, common.SystemName)
}

func SendTestEmail(c *gin.Context) {
	var req TestEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的参数: " + err.Error(),
		})
		return
	}

	allowedTypes := map[string]bool{
		"verification": true,
		"reset":        true,
		"quota":        true,
		"channel":      true,
	}
	if !allowedTypes[req.Type] {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "不支持的邮件类型，支持: verification, reset, quota, channel",
		})
		return
	}

	var subject, content string
	switch req.Type {
	case "verification":
		code := "123456"
		subject = fmt.Sprintf("%s邮箱验证邮件", common.SystemName)
		content = fmt.Sprintf(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>邮箱验证</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%%; padding: 40px 20px; box-sizing: border-box; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #f1f5f9; }
        .header { background: linear-gradient(135deg, #4f46e5 0%%, #7c3aed 100%%); padding: 40px 32px; text-align: center; position: relative; }
        .header::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 40px; background: url("data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%%3E%%3Cpath fill='%%23ffffff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%%3E%%3C/path%%3E%%3C/svg%%3E") no-repeat bottom; background-size: cover; }
        .header .icon { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; backdrop-filter: blur(8px); }
        .header .icon svg { width: 28px; height: 28px; fill: none; stroke: #ffffff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 40px 32px; color: #334155; font-size: 15px; line-height: 1.7; }
        .body p { margin: 0 0 16px; }
        .greeting { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .code-wrapper { background: linear-gradient(135deg, #f8fafc 0%%, #f1f5f9 100%%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; text-align: center; margin: 24px 0; position: relative; }
        .code-wrapper::before { content: 'VERIFICATION CODE'; position: absolute; top: -10px; left: 50%%; transform: translateX(-50%%); background: #ffffff; padding: 0 12px; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; }
        .code { font-size: 36px; font-weight: 800; color: #4f46e5; letter-spacing: 6px; font-family: "SF Mono", Monaco, "Cascadia Code", monospace; line-height: 1; }
        .hint { font-size: 13px; color: #64748b; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .divider { height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent); margin: 24px 0; }
        .security-notice { background: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 16px 20px; font-size: 13px; color: #854d0e; display: flex; align-items: flex-start; gap: 10px; }
        .security-notice svg { width: 18px; height: 18px; fill: none; stroke: #ca8a04; stroke-width: 2; flex-shrink: 0; margin-top: 1px; }
        .footer { background: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 0; }
        .footer .brand { font-weight: 600; color: #64748b; }
        @media (max-width: 480px) {
            .wrapper { padding: 20px 12px; }
            .header { padding: 32px 24px; }
            .body { padding: 32px 24px; }
            .code { font-size: 28px; letter-spacing: 4px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="icon">
                    <svg viewBox="0 0 24 24"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path><path d="M18 8V6a4 4 0 0 0-4-4 4 4 0 0 0-4 4v2"></path></svg>
                </div>
                <h1>%s</h1>
                <p>邮箱验证</p>
            </div>
            <div class="body">
                <p class="greeting">您好！</p>
                <p>感谢您使用我们的服务。您正在进行邮箱验证操作，请使用以下验证码完成验证：</p>
                <div class="code-wrapper">
                    <div class="code">%s</div>
                    <div class="hint">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        验证码在 %d 分钟内有效
                    </div>
                </div>
                <div class="divider"></div>
                <div class="security-notice">
                    <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span>如果这不是您本人操作，请忽略此邮件。请勿将验证码透露给任何人。</span>
                </div>
            </div>
            <div class="footer">
                <p>此邮件由 <span class="brand">%s</span> 自动发送，请勿直接回复。</p>
            </div>
        </div>
    </div>
</body>
</html>`, common.SystemName, code, common.VerificationValidMinutes, common.SystemName)
	case "reset":
		link := fmt.Sprintf("%s/user/reset?email=%s&token=test_token", system_setting.ServerAddress, req.Email)
		subject = fmt.Sprintf("%s密码重置", common.SystemName)
		content = fmt.Sprintf(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>密码重置</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%%; padding: 40px 20px; box-sizing: border-box; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #f1f5f9; }
        .header { background: linear-gradient(135deg, #f59e0b 0%%, #ef4444 100%%); padding: 40px 32px; text-align: center; position: relative; }
        .header::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 40px; background: url("data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%%3E%%3Cpath fill='%%23ffffff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%%3E%%3C/path%%3E%%3C/svg%%3E") no-repeat bottom; background-size: cover; }
        .header .icon { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; backdrop-filter: blur(8px); }
        .header .icon svg { width: 28px; height: 28px; fill: none; stroke: #ffffff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 40px 32px; color: #334155; font-size: 15px; line-height: 1.7; }
        .body p { margin: 0 0 16px; }
        .greeting { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .btn-wrapper { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%%, #ef4444 100%%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(239,68,68,0.35); transition: transform 0.2s, box-shadow 0.2s; }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,68,68,0.45); }
        .link-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 16px 0; }
        .link-section .label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .link-box { background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px 12px; word-break: break-all; font-size: 12px; color: #475569; font-family: "SF Mono", Monaco, monospace; }
        .divider { height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent); margin: 24px 0; }
        .security-notice { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px 20px; font-size: 13px; color: #991b1b; display: flex; align-items: flex-start; gap: 10px; }
        .security-notice svg { width: 18px; height: 18px; fill: none; stroke: #dc2626; stroke-width: 2; flex-shrink: 0; margin-top: 1px; }
        .footer { background: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer p { margin: 0; }
        .footer .brand { font-weight: 600; color: #64748b; }
        @media (max-width: 480px) {
            .wrapper { padding: 20px 12px; }
            .header { padding: 32px 24px; }
            .body { padding: 32px 24px; }
            .btn { padding: 14px 28px; font-size: 14px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="icon">
                    <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h1>%s</h1>
                <p>密码重置</p>
            </div>
            <div class="body">
                <p class="greeting">您好！</p>
                <p>我们收到了您的密码重置请求。点击下方按钮即可重置您的密码：</p>
                <div class="btn-wrapper">
                    <a href="%s" class="btn">重置密码</a>
                </div>
                <div class="link-section">
                    <div class="label">或复制链接到浏览器</div>
                    <div class="link-box">%s</div>
                </div>
                <div class="divider"></div>
                <div class="security-notice">
                    <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span>重置链接在 %d 分钟内有效。如果这不是您本人操作，请忽略此邮件，您的账户仍然安全。</span>
                </div>
            </div>
            <div class="footer">
                <p>此邮件由 <span class="brand">%s</span> 自动发送，请勿直接回复。</p>
            </div>
        </div>
    </div>
</body>
</html>`, common.SystemName, link, link, common.VerificationValidMinutes, common.SystemName)
	case "quota":
		subject = fmt.Sprintf("%s额度预警", common.SystemName)
		bodyContent := fmt.Sprintf(`<p class="greeting">您好！</p>
<p>您的额度即将用尽，当前剩余额度为 <strong>%s</strong>，为了不影响您的使用，请及时充值。</p>
<p>充值链接：<a href="%s/console/topup">%s/console/topup</a></p>
<div class="divider"></div>
<div class="alert">
    <strong>提示：</strong>当额度低于预警阈值时，系统会自动发送此通知。您可以在个人设置中调整预警阈值或关闭通知。
</div>`, "123,456", system_setting.ServerAddress, system_setting.ServerAddress)
		content = wrapTestEmailContent(subject, bodyContent)
	case "channel":
		subject = fmt.Sprintf("%s通道状态变更", common.SystemName)
		bodyContent := `<p class="greeting">管理员您好！</p>
<p>通道「<strong>OpenAI Official</strong>」（#<strong>1</strong>）已被<strong>禁用</strong>。</p>
<p>原因：<strong>响应时间 15.23s 超过阈值 10.00s</strong></p>
<div class="divider"></div>
<div class="alert alert-error">
    <strong>注意：</strong>该通道已自动禁用，请及时检查并修复问题。修复后系统会自动重新启用。
</div>`
		content = wrapTestEmailContent(subject, bodyContent)
	}

	err := common.SendEmail(subject, req.Email, content)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "发送测试邮件失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("测试邮件（%s）已发送至 %s", req.Type, req.Email),
	})
	return
}
