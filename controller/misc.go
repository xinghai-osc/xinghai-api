package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/i18n"
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

func verificationEmailHTML(systemName, code string, validMinutes int) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>邮箱验证</title>
<style>
body{margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{padding:40px 20px}
.card{max-width:480px;margin:0 auto;background:#fff;border-radius:8px;border-top:4px solid #18181b;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
.brand{padding:28px 32px 0;font-size:13px;font-weight:600;color:#18181b;letter-spacing:.3px}
.body{padding:20px 32px 32px}
.body h1{font-size:22px;font-weight:700;color:#18181b;margin:0 0 20px;line-height:1.3}
.body p{font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 16px}
.muted{color:#71717a;font-size:13px}
.code-box{background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:28px;text-align:center;margin:28px 0}
.code{font-size:32px;font-weight:700;color:#18181b;letter-spacing:8px;font-family:ui-monospace,"SF Mono",Monaco,"Cascadia Code",monospace}
.note{padding:12px 16px;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;font-size:13px;color:#52525b;line-height:1.5;margin:20px 0}
.footer{padding:20px 32px 28px;font-size:12px;color:#a1a1aa;text-align:center}
@media(max-width:480px){.wrap{padding:20px 12px}.body{padding:20px 24px 24px}.code{font-size:26px;letter-spacing:5px}}
</style>
</head>
<body>
<div class="wrap">
<div class="card">
<div class="brand">%s</div>
<div class="body">
<h1>邮箱验证</h1>
<p>您好，您正在进行邮箱验证。请使用以下验证码完成操作：</p>
<div class="code-box"><div class="code">%s</div></div>
<p class="muted">验证码在 %d 分钟内有效。</p>
<div class="note">如果这不是您本人操作，请忽略此邮件。请勿将验证码透露给任何人。</div>
</div>
<div class="footer">此邮件由 %s 自动发送，请勿回复。</div>
</div>
</div>
</body>
</html>`, systemName, code, validMinutes, systemName)
}

func passwordResetEmailHTML(systemName, link string, validMinutes int) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>密码重置</title>
<style>
body{margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{padding:40px 20px}
.card{max-width:480px;margin:0 auto;background:#fff;border-radius:8px;border-top:4px solid #18181b;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
.brand{padding:28px 32px 0;font-size:13px;font-weight:600;color:#18181b;letter-spacing:.3px}
.body{padding:20px 32px 32px}
.body h1{font-size:22px;font-weight:700;color:#18181b;margin:0 0 20px;line-height:1.3}
.body p{font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 16px}
.muted{color:#71717a;font-size:13px}
.btn{display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;font-size:14px}
.link-box{background:#f4f4f5;border:1px solid #e4e4e7;border-radius:6px;padding:12px;word-break:break-all;font-size:13px;color:#3f3f46;font-family:ui-monospace,Monaco,monospace;margin:16px 0}
.note{padding:12px 16px;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;font-size:13px;color:#52525b;line-height:1.5;margin:20px 0}
.footer{padding:20px 32px 28px;font-size:12px;color:#a1a1aa;text-align:center}
@media(max-width:480px){.wrap{padding:20px 12px}.body{padding:20px 24px 24px}.btn{padding:10px 24px;font-size:13px}}
</style>
</head>
<body>
<div class="wrap">
<div class="card">
<div class="brand">%s</div>
<div class="body">
<h1>密码重置</h1>
<p>您好，我们收到了您的密码重置请求。点击下方按钮即可重置密码：</p>
<p style="text-align:center;margin:28px 0"><a href="%s" class="btn">重置密码</a></p>
<p class="muted">或复制以下链接到浏览器：</p>
<div class="link-box">%s</div>
<div class="note">链接在 %d 分钟内有效。如果不是您本人操作，请忽略此邮件，您的账户仍然安全。</div>
</div>
<div class="footer">此邮件由 %s 自动发送，请勿回复。</div>
</div>
</div>
</body>
</html>`, systemName, link, link, validMinutes, systemName)
}

func SendEmailVerification(c *gin.Context) {
	email := model.NormalizeEmail(c.Query("email"))
	if err := common.Validate.Var(email, "required,email"); err != nil {
		common.ApiErrorI18n(c, i18n.MsgInvalidParams)
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
		common.ApiErrorI18n(c, i18n.MsgUserEmailAlreadyTaken)
		return
	}
	code := common.GenerateVerificationCode(6)
	common.RegisterVerificationCodeWithKey(email, code, common.EmailVerificationPurpose)
	subject := fmt.Sprintf("%s邮箱验证邮件", common.SystemName)
	content := verificationEmailHTML(common.SystemName, code, common.VerificationValidMinutes)
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
	email := model.NormalizeEmail(c.Query("email"))
	if err := common.Validate.Var(email, "required,email"); err != nil {
		common.ApiErrorI18n(c, i18n.MsgInvalidParams)
		return
	}
	if _, err := model.GetUniqueUserByEmail(email); err == nil {
		code := common.GenerateVerificationCode(0)
		common.RegisterVerificationCodeWithKey(email, code, common.PasswordResetPurpose)
		link := fmt.Sprintf("%s/user/reset?email=%s&token=%s", system_setting.ServerAddress, email, code)
		subject := fmt.Sprintf("%s密码重置", common.SystemName)
		content := passwordResetEmailHTML(common.SystemName, link, common.VerificationValidMinutes)
		err := common.SendEmail(subject, email, content)
		if err != nil {
			logger.LogError(c.Request.Context(), fmt.Sprintf("failed to send password reset email to %s: %s", email, err.Error()))
		}
	} else if err != nil && !errors.Is(err, model.ErrEmailNotFound) {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("skip password reset email for %s: %s", email, err.Error()))
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
	if err != nil {
		common.ApiError(c, err)
		return
	}
	req.Email = model.NormalizeEmail(req.Email)
	if req.Email == "" || req.Token == "" {
		common.ApiErrorI18n(c, i18n.MsgInvalidParams)
		return
	}
	if !common.VerifyCodeWithKey(req.Email, req.Token, common.PasswordResetPurpose) {
		common.ApiErrorI18n(c, i18n.MsgUserPasswordResetLinkInvalid)
		return
	}
	password := common.GenerateVerificationCode(12)
	err = model.ResetUserPasswordByEmail(req.Email, password)
	if err != nil {
		if errors.Is(err, model.ErrEmailNotFound) || errors.Is(err, model.ErrEmailAmbiguous) {
			common.ApiErrorI18n(c, i18n.MsgUserPasswordResetLinkInvalid)
			return
		}
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
body{margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{padding:40px 20px}
.card{max-width:480px;margin:0 auto;background:#fff;border-radius:8px;border-top:4px solid #18181b;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
.brand{padding:28px 32px 0;font-size:13px;font-weight:600;color:#18181b;letter-spacing:.3px}
.body{padding:20px 32px 32px}
.body h1{font-size:20px;font-weight:700;color:#18181b;margin:0 0 20px;line-height:1.3}
.body p{font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 14px}
.body a{color:#18181b;font-weight:500;text-decoration:underline}
.body strong{color:#18181b}
.muted{color:#71717a;font-size:13px}
.divider{border-top:1px solid #f4f4f5;margin:20px 0}
.alert{padding:12px 16px;border-radius:6px;font-size:13px;margin:16px 0;line-height:1.5}
.alert-warning{background:#fffbeb;color:#92400e;border:1px solid #fef3c7}
.alert-error{background:#fef2f2;color:#991b1b;border:1px solid #fee2e2}
.alert-success{background:#f0fdf4;color:#166534;border:1px solid #dcfce7}
.alert-info{background:#eff6ff;color:#1e40af;border:1px solid #dbeafe}
.footer{padding:20px 32px 28px;font-size:12px;color:#a1a1aa;text-align:center}
@media(max-width:480px){.wrap{padding:20px 12px}.body{padding:20px 24px 24px}}
</style>
</head>
<body>
<div class="wrap">
<div class="card">
<div class="brand">%s</div>
<div class="body">
%s
</div>
<div class="footer">此邮件由 %s 自动发送，请勿回复。</div>
</div>
</div>
</body>
</html>`, title, common.SystemName, bodyContent, common.SystemName)
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
		content = verificationEmailHTML(common.SystemName, code, common.VerificationValidMinutes)
	case "reset":
		link := fmt.Sprintf("%s/user/reset?email=%s&token=test_token", system_setting.ServerAddress, req.Email)
		subject = fmt.Sprintf("%s密码重置", common.SystemName)
		content = passwordResetEmailHTML(common.SystemName, link, common.VerificationValidMinutes)
	case "quota":
		subject = fmt.Sprintf("%s额度预警", common.SystemName)
		bodyContent := fmt.Sprintf(`<h1>额度预警</h1>
<p>您好，您的额度即将用尽，当前剩余额度为 <strong>%s</strong>，请及时充值以免影响使用。</p>
<p>充值链接：<a href="%s/console/topup">%s/console/topup</a></p>
<div class="divider"></div>
<div class="alert alert-warning">当额度低于预警阈值时系统会自动发送此通知。您可以在个人设置中调整预警阈值或关闭通知。</div>`, "123,456", system_setting.ServerAddress, system_setting.ServerAddress)
		content = wrapTestEmailContent(subject, bodyContent)
	case "channel":
		subject = fmt.Sprintf("%s通道状态变更", common.SystemName)
		bodyContent := `<h1>通道状态变更</h1>
<p>通道「<strong>OpenAI Official</strong>」（#<strong>1</strong>）已被<strong>禁用</strong>。</p>
<p>原因：<strong>响应时间 15.23s 超过阈值 10.00s</strong></p>
<div class="divider"></div>
<div class="alert alert-error">该通道已自动禁用，请及时检查并修复问题。修复后系统会自动重新启用。</div>`
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
