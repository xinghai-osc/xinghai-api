package service

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/types"
)

func formatNotifyType(channelId int, status int) string {
	return fmt.Sprintf("%s_%d_%d", dto.NotifyTypeChannelUpdate, channelId, status)
}

// CheckAndDisableChannelOnQuotaExceeded checks if a channel's used_quota has
// reached its quota_limit. If so, it disables the channel and sends a notification.
// This is called after each billing settlement to provide real-time enforcement.
func CheckAndDisableChannelOnQuotaExceeded(channelId int) {
	quotaLimit, usedQuota, err := model.GetChannelQuotaLimit(channelId, false)
	if err != nil || quotaLimit <= 0 {
		return
	}
	if usedQuota < quotaLimit {
		return
	}

	channel, err := model.GetChannelById(channelId, false)
	if err != nil {
		common.SysError(fmt.Sprintf("failed to get channel for quota-exceeded check: channel_id=%d, error=%v", channelId, err))
		return
	}
	if channel.Status != common.ChannelStatusEnabled {
		return
	}

	reason := fmt.Sprintf("渠道额度已达上限（限额 %s，已用 %s）", logger.FormatQuota(int(quotaLimit)), logger.FormatQuota(int(usedQuota)))
	common.SysLog(fmt.Sprintf("通道「%s」（#%d）额度已达上限，自动禁用", channel.Name, channelId))

	success := model.UpdateChannelStatus(channelId, "", common.ChannelStatusAutoDisabled, reason)
	if success {
		subject := fmt.Sprintf("通道「%s」（#%d）已被禁用", channel.Name, channelId)
		content := fmt.Sprintf("通道「%s」（#%d）已被禁用，原因：%s", channel.Name, channelId, reason)
		NotifyRootUser(formatNotifyType(channelId, common.ChannelStatusAutoDisabled), subject, content)
	}
}

// disable & notify
func DisableChannel(channelError types.ChannelError, reason string) {
	common.SysLog(fmt.Sprintf("通道「%s」（#%d）发生错误，准备禁用，原因：%s", channelError.ChannelName, channelError.ChannelId, common.LocalLogPreview(reason)))

	// 检查是否启用自动禁用功能
	if !channelError.AutoBan {
		common.SysLog(fmt.Sprintf("通道「%s」（#%d）未启用自动禁用功能，跳过禁用操作", channelError.ChannelName, channelError.ChannelId))
		return
	}

	success := model.UpdateChannelStatus(channelError.ChannelId, channelError.UsingKey, common.ChannelStatusAutoDisabled, reason)
	if success {
		subject := fmt.Sprintf("通道「%s」（#%d）已被禁用", channelError.ChannelName, channelError.ChannelId)
		content := fmt.Sprintf("通道「%s」（#%d）已被禁用，原因：%s", channelError.ChannelName, channelError.ChannelId, reason)
		NotifyRootUser(formatNotifyType(channelError.ChannelId, common.ChannelStatusAutoDisabled), subject, content)
	}
}

func EnableChannel(channelId int, usingKey string, channelName string) {
	success := model.UpdateChannelStatus(channelId, usingKey, common.ChannelStatusEnabled, "")
	if success {
		subject := fmt.Sprintf("通道「%s」（#%d）已被启用", channelName, channelId)
		content := fmt.Sprintf("通道「%s」（#%d）已被启用", channelName, channelId)
		NotifyRootUser(formatNotifyType(channelId, common.ChannelStatusEnabled), subject, content)
	}
}

func ShouldDisableChannel(err *types.NewAPIError) bool {
	if !common.AutomaticDisableChannelEnabled {
		return false
	}
	if err == nil {
		return false
	}
	if types.IsChannelError(err) {
		return true
	}
	if types.IsSkipRetryError(err) {
		return false
	}
	if operation_setting.ShouldDisableByStatusCode(err.StatusCode) {
		return true
	}

	lowerMessage := strings.ToLower(err.Error())
	search, _ := AcSearch(lowerMessage, operation_setting.AutomaticDisableKeywords, true)
	return search
}

func ShouldEnableChannel(newAPIError *types.NewAPIError, status int) bool {
	if !common.AutomaticEnableChannelEnabled {
		return false
	}
	if newAPIError != nil {
		return false
	}
	if status != common.ChannelStatusAutoDisabled {
		return false
	}
	return true
}
