package controller

import (
	"errors"
	"regexp"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RealNameVerifyRequest struct {
	Name   string `json:"name"`
	IdCard string `json:"id_card"`
}

// RealNameStartSessionResponse 启动 H5 刷脸流程的响应。
type RealNameStartSessionResponse struct {
	BizToken        string `json:"biz_token"`
	VerificationURL string `json:"verification_url"`
	RequestId       string `json:"request_id"`
}

// RealNameFinishRequest 前端把腾讯云 H5 回跳 URL 中的 token 提交给后端查询结果。
type RealNameFinishRequest struct {
	BizToken string `json:"biz_token"`
}

type RealNameStatusResponse struct {
	Enabled        bool                `json:"enabled"`
	Verified       bool                `json:"verified"`
	Provider       string              `json:"provider"`
	RequireUnique  bool                `json:"require_unique"`
	RealNameRecord *model.UserRealName `json:"record,omitempty"`
}

var idCardPattern = regexp.MustCompile(`^[0-9]{17}[0-9Xx]$|^[0-9]{15}$`)

func GetRealNameStatus(c *gin.Context) {
	userId := c.GetInt("id")
	settings := system_setting.GetRealNameSettings()
	record, err := model.GetUserRealNameByUserId(userId)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		common.ApiError(c, err)
		return
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		record = nil
	}
	common.ApiSuccess(c, RealNameStatusResponse{
		Enabled:        settings.Enabled,
		Verified:       record != nil && record.Status == model.RealNameStatusPassed,
		Provider:       settings.Provider,
		RequireUnique:  settings.RequireUnique,
		RealNameRecord: record,
	})
}

func VerifyRealName(c *gin.Context) {
	settings := system_setting.GetRealNameSettings()
	if !settings.Enabled {
		common.ApiErrorMsg(c, "实名认证功能未启用")
		return
	}
	if settings.Provider != "" && settings.Provider != "tencent_faceid" {
		common.ApiErrorMsg(c, "不支持的实名认证服务商")
		return
	}
	var req RealNameVerifyRequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	name := strings.TrimSpace(req.Name)
	idCard := strings.ToUpper(strings.TrimSpace(req.IdCard))
	if name == "" || idCard == "" || !idCardPattern.MatchString(idCard) {
		common.ApiErrorMsg(c, "姓名或身份证号格式不正确")
		return
	}
	userId := c.GetInt("id")
	idCardHash := model.BuildIdCardHash(idCard)
	if settings.RequireUnique {
		taken, err := model.IsIdCardHashTaken(idCardHash, userId)
		if err != nil {
			common.ApiError(c, err)
			return
		}
		if taken {
			common.ApiErrorMsg(c, "该身份证已完成实名认证")
			return
		}
	}
	resp, err := service.VerifyIdCardWithTencentFaceID(name, idCard)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	status := model.RealNameStatusFailed
	verifiedAt := int64(0)
	if resp.Result == "0" {
		status = model.RealNameStatusPassed
		verifiedAt = common.GetTimestamp()
	}
	record := &model.UserRealName{
		UserId:         userId,
		RealName:       name,
		IdCardHash:     idCardHash,
		IdCardLastFour: model.IdCardLastFour(idCard),
		Provider:       "tencent_faceid",
		Status:         status,
		ResultCode:     resp.Result,
		Description:    resp.Description,
		RequestId:      resp.RequestId,
		VerifiedAt:     verifiedAt,
	}
	if err := model.UpsertUserRealName(record); err != nil {
		common.ApiError(c, err)
		return
	}
	if status != model.RealNameStatusPassed {
		common.ApiErrorMsg(c, resp.Description)
		return
	}
	common.ApiSuccess(c, record)
}

// StartRealNameSession 启动腾讯云实名核身鉴权，返回 BizToken + VerificationURL，
// 前端跳转到 VerificationURL 即可打开 H5 刷脸弹窗。
func StartRealNameSession(c *gin.Context) {
	settings := system_setting.GetRealNameSettings()
	if !settings.Enabled {
		common.ApiErrorMsg(c, "实名认证功能未启用")
		return
	}
	if strings.TrimSpace(settings.RuleId) == "" {
		common.ApiErrorMsg(c, "腾讯云 FaceID RuleId 未配置")
		return
	}
	// 避免同一位已通过用户重复发起
	userId := c.GetInt("id")
	if existing, err := model.GetUserRealNameByUserId(userId); err == nil &&
		existing != nil && existing.Status == model.RealNameStatusPassed {
		common.ApiErrorMsg(c, "您已完成实名认证")
		return
	}
	resp, err := service.CreateFaceIdVerifySession(settings.RuleId, settings.RedirectUrl)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	if resp.BizToken == "" || resp.VerificationURL == "" {
		common.ApiErrorMsg(c, "腾讯云 FaceID 返回数据不完整")
		return
	}
	common.ApiSuccess(c, RealNameStartSessionResponse{
		BizToken:        resp.BizToken,
		VerificationURL: resp.VerificationURL,
		RequestId:       resp.RequestId,
	})
}

// FinishRealNameSession 前端拿到 H5 回跳 URL 中的 token 之后，调用此接口拉取核身结果。
func FinishRealNameSession(c *gin.Context) {
	settings := system_setting.GetRealNameSettings()
	if !settings.Enabled {
		common.ApiErrorMsg(c, "实名认证功能未启用")
		return
	}
	var req RealNameFinishRequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	bizToken := strings.TrimSpace(req.BizToken)
	if bizToken == "" {
		common.ApiErrorMsg(c, "BizToken 不能为空")
		return
	}
	resp, err := service.GetFaceIdVerifyResult(bizToken)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	if resp.Status == 0 {
		common.ApiErrorMsg(c, "用户尚未完成刷脸")
		return
	}
	name := strings.TrimSpace(resp.Name)
	idCard := strings.ToUpper(strings.TrimSpace(resp.IdCard))
	if name == "" || idCard == "" || !idCardPattern.MatchString(idCard) {
		common.ApiErrorMsg(c, "实名认证返回数据不合法")
		return
	}
	// 腾讯云 DetectAuth Result 字段："0"=通过，其他值表示失败。
	passed := resp.Result == "0" && resp.Status == 1
	status := model.RealNameStatusFailed
	verifiedAt := int64(0)
	if passed {
		status = model.RealNameStatusPassed
		verifiedAt = common.GetTimestamp()
	}
	userId := c.GetInt("id")
	idCardHash := model.BuildIdCardHash(idCard)
	if passed && settings.RequireUnique {
		taken, err := model.IsIdCardHashTaken(idCardHash, userId)
		if err != nil {
			common.ApiError(c, err)
			return
		}
		if taken {
			common.ApiErrorMsg(c, "该身份证已完成实名认证")
			return
		}
	}
	record := &model.UserRealName{
		UserId:         userId,
		RealName:       name,
		IdCardHash:     idCardHash,
		IdCardLastFour: model.IdCardLastFour(idCard),
		Provider:       "tencent_faceid",
		Status:         status,
		ResultCode:     resp.Result,
		Description:    resp.Description,
		RequestId:      resp.RequestId,
		VerifiedAt:     verifiedAt,
	}
	if err := model.UpsertUserRealName(record); err != nil {
		common.ApiError(c, err)
		return
	}
	if !passed {
		common.ApiErrorMsg(c, resp.Description)
		return
	}
	common.ApiSuccess(c, record)
}

// AdminRealNameUpdateRequest 管理员修改用户实名信息/状态的请求体。
// 字段允许部分更新；不传的字段保持原值。IdCard 非空时会重新计算哈希与尾号。
type AdminRealNameUpdateRequest struct {
	RealName    *string `json:"real_name"`
	IdCard      *string `json:"id_card"`
	Status      *int    `json:"status"`
	Description *string `json:"description"`
	Provider    *string `json:"provider"`
}

// AdminGetUserRealName 管理员查询指定用户的实名认证记录。
func AdminGetUserRealName(c *gin.Context) {
	userId, ok := parseAdminUserRealNameParam(c)
	if !ok {
		return
	}
	record, err := model.GetUserRealNameByUserId(userId)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		common.ApiError(c, err)
		return
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		record = nil
	}
	common.ApiSuccess(c, record)
}

// AdminUpdateUserRealName 管理员修改用户的实名信息与状态。
// 当新状态为已通过时，会刷新 VerifiedAt；其它字段按需局部更新。
func AdminUpdateUserRealName(c *gin.Context) {
	userId, ok := parseAdminUserRealNameParam(c)
	if !ok {
		return
	}
	var req AdminRealNameUpdateRequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorI18n(c, i18n.MsgInvalidParams)
		return
	}
	if req.Status != nil {
		switch *req.Status {
		case model.RealNameStatusPending, model.RealNameStatusPassed, model.RealNameStatusFailed:
		default:
			common.ApiErrorMsg(c, "非法的实名状态值")
			return
		}
	}
	if req.RealName != nil {
		trimmed := strings.TrimSpace(*req.RealName)
		if trimmed == "" {
			common.ApiErrorMsg(c, "姓名不能为空")
			return
		}
		req.RealName = &trimmed
	}
	if req.IdCard != nil {
		normalized := strings.ToUpper(strings.TrimSpace(*req.IdCard))
		if normalized != "" && !idCardPattern.MatchString(normalized) {
			common.ApiErrorMsg(c, "身份证号格式不正确")
			return
		}
		req.IdCard = &normalized
	}
	settings := system_setting.GetRealNameSettings()
	record, err := model.GetUserRealNameByUserId(userId)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		common.ApiError(c, err)
		return
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		record = &model.UserRealName{UserId: userId}
	}
	// 当提供新身份证号且需去重时，校验不会与其它已通过用户冲突。
	if req.IdCard != nil && *req.IdCard != "" {
		newHash := model.BuildIdCardHash(*req.IdCard)
		if settings.RequireUnique {
			targetStatus := record.Status
			if req.Status != nil {
				targetStatus = *req.Status
			}
			if targetStatus == model.RealNameStatusPassed {
				taken, err := model.IsIdCardHashTaken(newHash, userId)
				if err != nil {
					common.ApiError(c, err)
					return
				}
				if taken {
					common.ApiErrorMsg(c, "该身份证已被其它用户实名使用")
					return
				}
			}
		}
		record.IdCardHash = newHash
		record.IdCardLastFour = model.IdCardLastFour(*req.IdCard)
	}
	if req.RealName != nil {
		record.RealName = *req.RealName
	}
	if req.Description != nil {
		record.Description = *req.Description
	}
	if req.Provider != nil {
		provider := strings.TrimSpace(*req.Provider)
		if provider == "" {
			common.ApiErrorMsg(c, "服务商不能为空")
			return
		}
		record.Provider = provider
	}
	statusChanged := req.Status != nil && *req.Status != record.Status
	if req.Status != nil {
		record.Status = *req.Status
	}
	if record.Status == model.RealNameStatusPassed && (statusChanged || record.VerifiedAt == 0) {
		record.VerifiedAt = common.GetTimestamp()
	}
	if record.RealName == "" {
		common.ApiErrorMsg(c, "姓名不能为空")
		return
	}
	if record.IdCardHash == "" {
		common.ApiErrorMsg(c, "身份证号不能为空")
		return
	}
	if record.Provider == "" {
		record.Provider = "tencent_faceid"
	}
	if err := model.UpsertUserRealName(record); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, record)
}

// AdminDeleteUserRealName 管理员清空指定用户的实名认证记录。
func AdminDeleteUserRealName(c *gin.Context) {
	userId, ok := parseAdminUserRealNameParam(c)
	if !ok {
		return
	}
	if err := model.DeleteUserRealName(userId); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"user_id": userId})
}

func parseAdminUserRealNameParam(c *gin.Context) (int, bool) {
	idStr := c.Param("id")
	userId, err := strconv.Atoi(idStr)
	if err != nil || userId <= 0 {
		common.ApiErrorI18n(c, i18n.MsgInvalidId)
		return 0, false
	}
	return userId, true
}
