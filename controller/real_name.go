package controller

import (
	"errors"
	"regexp"
	"strings"

	"github.com/QuantumNous/new-api/common"
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
