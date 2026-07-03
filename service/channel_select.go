package service

import (
	"errors"
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
)

type RetryParam struct {
	Ctx             *gin.Context
	TokenGroup      string
	ModelName       string
	RequestPath     string
	Retry           *int
	RelayFormat     types.RelayFormat
	AllowedApiTypes map[int]bool
	DeniedApiTypes  map[int]bool
	resetNextTry    bool
	// crossFormatFallback 标记当前 RetryParam 已经进入"跨格式 fallback"分支，
	// 防止 fallback 选出的渠道在后续请求中再次触发二次 fallback，造成无限放宽。
	crossFormatFallback bool
	// ExcludeChannelIds 记录本次请求已失败的 channel ID，重试时回避它们。
	ExcludeChannelIds map[int]bool
}

// AddFailedChannel 将一个已失败的 channel ID 加入排除列表，重试时不再选中它。
func (p *RetryParam) AddFailedChannel(channelId int) {
	if p.ExcludeChannelIds == nil {
		p.ExcludeChannelIds = make(map[int]bool)
	}
	p.ExcludeChannelIds[channelId] = true
}

func (p *RetryParam) GetRetry() int {
	if p.Retry == nil {
		return 0
	}
	return *p.Retry
}

func (p *RetryParam) SetRetry(retry int) {
	p.Retry = &retry
}

func (p *RetryParam) IncreaseRetry() {
	if p.resetNextTry {
		p.resetNextTry = false
		return
	}
	if p.Retry == nil {
		p.Retry = new(int)
	}
	*p.Retry++
}

func (p *RetryParam) ResetRetryNextTry() {
	p.resetNextTry = true
}

// CacheGetRandomSatisfiedChannel tries to get a random channel that satisfies the requirements.
// 尝试获取一个满足要求的随机渠道。
//
// For "auto" tokenGroup with cross-group Retry enabled:
// 对于启用了跨分组重试的 "auto" tokenGroup：
//
//   - Each group will exhaust all its priorities before moving to the next group.
//     每个分组会用完所有优先级后才会切换到下一个分组。
//
//   - Uses ContextKeyAutoGroupIndex to track current group index.
//     使用 ContextKeyAutoGroupIndex 跟踪当前分组索引。
//
//   - Uses ContextKeyAutoGroupRetryIndex to track the global Retry count when current group started.
//     使用 ContextKeyAutoGroupRetryIndex 跟踪当前分组开始时的全局重试次数。
//
//   - priorityRetry = Retry - startRetryIndex, represents the priority level within current group.
//     priorityRetry = Retry - startRetryIndex，表示当前分组内的优先级级别。
//
//   - When GetRandomSatisfiedChannel returns nil (priorities exhausted), moves to next group.
//     当 GetRandomSatisfiedChannel 返回 nil（优先级用完）时，切换到下一个分组。
//
// Example flow (2 groups, each with 2 priorities, RetryTimes=3):
// 示例流程（2个分组，每个有2个优先级，RetryTimes=3）：
//
//	Retry=0: GroupA, priority0 (startRetryIndex=0, priorityRetry=0)
//	         分组A, 优先级0
//
//	Retry=1: GroupA, priority1 (startRetryIndex=0, priorityRetry=1)
//	         分组A, 优先级1
//
//	Retry=2: GroupA exhausted → GroupB, priority0 (startRetryIndex=2, priorityRetry=0)
//	         分组A用完 → 分组B, 优先级0
//
//	Retry=3: GroupB, priority1 (startRetryIndex=2, priorityRetry=1)
//	         分组B, 优先级1
func CacheGetRandomSatisfiedChannel(param *RetryParam) (*model.Channel, string, error) {
	var channel *model.Channel
	var err error
	selectGroup := param.TokenGroup
	userGroup := common.GetContextKeyString(param.Ctx, constant.ContextKeyUserGroup)

	if param.TokenGroup == "auto" {
		if len(setting.GetAutoGroups()) == 0 {
			return nil, selectGroup, errors.New("auto groups is not enabled")
		}
		autoGroups := GetUserAutoGroup(userGroup)

		// startGroupIndex: the group index to start searching from
		// startGroupIndex: 开始搜索的分组索引
		startGroupIndex := 0
		crossGroupRetry := common.GetContextKeyBool(param.Ctx, constant.ContextKeyTokenCrossGroupRetry)

		if lastGroupIndex, exists := common.GetContextKey(param.Ctx, constant.ContextKeyAutoGroupIndex); exists {
			if idx, ok := lastGroupIndex.(int); ok {
				startGroupIndex = idx
			}
		}

		for i := startGroupIndex; i < len(autoGroups); i++ {
			autoGroup := autoGroups[i]
			// Calculate priorityRetry for current group
			// 计算当前分组的 priorityRetry
			priorityRetry := param.GetRetry()
			// If moved to a new group, reset priorityRetry and update startRetryIndex
			// 如果切换到新分组，重置 priorityRetry 并更新 startRetryIndex
			if i > startGroupIndex {
				priorityRetry = 0
			}
			logger.LogDebug(param.Ctx, "Auto selecting group: %s, priorityRetry: %d", autoGroup, priorityRetry)

			channel, _ = model.GetRandomSatisfiedChannelWithCondition(autoGroup, param.ModelName, priorityRetry, param.RequestPath, param.channelSatisfied)
			if channel == nil {
				// Current group has no available channel for this model, try next group
				// 当前分组没有该模型的可用渠道，尝试下一个分组
				logger.LogDebug(param.Ctx, "No available channel in group %s for model %s at priorityRetry %d, trying next group", autoGroup, param.ModelName, priorityRetry)
				// 重置状态以尝试下一个分组
				common.SetContextKey(param.Ctx, constant.ContextKeyAutoGroupIndex, i+1)
				common.SetContextKey(param.Ctx, constant.ContextKeyAutoGroupRetryIndex, 0)
				// Reset retry counter so outer loop can continue for next group
				// 重置重试计数器，以便外层循环可以为下一个分组继续
				param.SetRetry(0)
				continue
			}
			common.SetContextKey(param.Ctx, constant.ContextKeyAutoGroup, autoGroup)
			selectGroup = autoGroup
			logger.LogDebug(param.Ctx, "Auto selected group: %s", autoGroup)

			// Prepare state for next retry
			// 为下一次重试准备状态
			if crossGroupRetry && priorityRetry >= common.RetryTimes {
				// Current group has exhausted all retries, prepare to switch to next group
				// This request still uses current group, but next retry will use next group
				// 当前分组已用完所有重试次数，准备切换到下一个分组
				// 本次请求仍使用当前分组，但下次重试将使用下一个分组
				logger.LogDebug(param.Ctx, "Current group %s retries exhausted (priorityRetry=%d >= RetryTimes=%d), preparing switch to next group for next retry", autoGroup, priorityRetry, common.RetryTimes)
				common.SetContextKey(param.Ctx, constant.ContextKeyAutoGroupIndex, i+1)
				// Reset retry counter so outer loop can continue for next group
				// 重置重试计数器，以便外层循环可以为下一个分组继续
				param.SetRetry(0)
				param.ResetRetryNextTry()
			} else {
				// Stay in current group, save current state
				// 保持在当前分组，保存当前状态
				common.SetContextKey(param.Ctx, constant.ContextKeyAutoGroupIndex, i)
			}
			break
		}
	} else {
		channel, err = model.GetRandomSatisfiedChannelWithCondition(param.TokenGroup, param.ModelName, param.GetRetry(), param.RequestPath, param.channelSatisfied)
		if err != nil {
			return nil, param.TokenGroup, err
		}
	}
	// 跨格式 fallback：当首轮选不到渠道时，按入口格式放宽一次允许的 API 类型，
	// 由对应适配器完成请求/响应的格式互转：
	//   - OpenAI 系入口缺渠道 → 允许选 Anthropic（含 Moonshot）渠道，由 claude 适配器完成 OpenAI<->Claude 转换。
	//   - Claude 入口缺 Anthropic 渠道 → 允许选 OpenAI2Claude 渠道，由 openai2claude 适配器完成 Claude<->OpenAI 转换。
	if channel == nil && param.allowCrossFormatFallback() {
		fallbackParam := *param
		fallbackParam.crossFormatFallback = true
		fallbackParam.AllowedApiTypes = crossFormatFallbackAllowed(param.AllowedApiTypes)
		fallbackParam.DeniedApiTypes = crossFormatFallbackDenied(param.DeniedApiTypes)
		if param.TokenGroup == "auto" {
			// auto 分组在上方已遍历过；此处对当前 selectGroup 直接再尝试一次
			if selectGroup != "" {
				channel, _ = model.GetRandomSatisfiedChannelWithCondition(selectGroup, param.ModelName, param.GetRetry(), fallbackParam.RequestPath, fallbackParam.channelSatisfied)
			}
		} else {
			channel, err = model.GetRandomSatisfiedChannelWithCondition(param.TokenGroup, param.ModelName, param.GetRetry(), fallbackParam.RequestPath, fallbackParam.channelSatisfied)
			if err != nil {
				return nil, param.TokenGroup, err
			}
		}
		if channel != nil {
			logger.LogInfo(param.Ctx, fmt.Sprintf("cross-format fallback engaged: relayFormat=%s, model=%s, channelId=%d, channelType=%d", param.RelayFormat, param.ModelName, channel.Id, channel.Type))
		}
	}
	return channel, selectGroup, nil
}

func (p *RetryParam) channelSatisfied(channel *model.Channel) bool {
	if p == nil || channel == nil {
		return true
	}
	// 排除本次请求已失败的 channel
	if p.ExcludeChannelIds != nil && p.ExcludeChannelIds[channel.Id] {
		return false
	}
	apiType, _ := common.ChannelType2APIType(channel.Type)
	if len(p.AllowedApiTypes) > 0 {
		return p.AllowedApiTypes[apiType]
	}
	if len(p.DeniedApiTypes) > 0 {
		return !p.DeniedApiTypes[apiType]
	}
	return true
}

// allowCrossFormatFallback 判断当前 RetryParam 是否允许"跨格式 fallback"：
//   - 已经在 fallback 分支（crossFormatFallback==true）时不再触发，避免无限放宽。
//   - 当 DeniedApiTypes 中显式禁用了 Anthropic（典型 OpenAI 入口的特征）时，可以放开 Anthropic 试一次。
//   - 当 AllowedApiTypes 中显式只允许 Anthropic 类（典型 Claude 入口的特征）时，可以放开 OpenAI2Claude 试一次。
//   - 其他情况（例如 Gemini 入口）不动。
func (p *RetryParam) allowCrossFormatFallback() bool {
	if p == nil || p.crossFormatFallback {
		return false
	}
	if len(p.DeniedApiTypes) > 0 && p.DeniedApiTypes[constant.APITypeAnthropic] {
		return true
	}
	if len(p.AllowedApiTypes) > 0 && p.AllowedApiTypes[constant.APITypeAnthropic] && !p.AllowedApiTypes[constant.APITypeOpenAI2Claude] {
		return true
	}
	return false
}

// crossFormatFallbackAllowed 在 fallback 时把允许列表扩展为目标格式的"反向桥"渠道。
// 只在原本就是白名单模式（AllowedApiTypes 非空，例如 Claude 入口）下生效，避免覆盖 deny 模式语义。
func crossFormatFallbackAllowed(original map[int]bool) map[int]bool {
	if len(original) == 0 {
		return nil
	}
	merged := make(map[int]bool, len(original)+1)
	for k, v := range original {
		merged[k] = v
	}
	// Claude 入口（Allowed 含 Anthropic）允许 fallback 选 OpenAI2Claude 桥渠道。
	if merged[constant.APITypeAnthropic] {
		merged[constant.APITypeOpenAI2Claude] = true
	}
	return merged
}

// crossFormatFallbackDenied 在 fallback 时把 deny 列表中"反向桥"目标 API 类型移除。
// 只在原本就是黑名单模式（DeniedApiTypes 非空，例如 OpenAI 入口）下生效。
func crossFormatFallbackDenied(original map[int]bool) map[int]bool {
	if len(original) == 0 {
		return nil
	}
	merged := make(map[int]bool, len(original))
	for k, v := range original {
		merged[k] = v
	}
	// OpenAI 系入口（Denied 含 Anthropic）允许 fallback 选 Anthropic / Moonshot 渠道；Gemini 仍保持禁用。
	if merged[constant.APITypeAnthropic] {
		delete(merged, constant.APITypeAnthropic)
		delete(merged, constant.APITypeMoonshot)
	}
	return merged
}

func AllowedApiTypesForRelayFormat(relayFormat types.RelayFormat) map[int]bool {
	switch relayFormat {
	case types.RelayFormatClaude:
		return map[int]bool{constant.APITypeAnthropic: true, constant.APITypeMoonshot: true}
	case types.RelayFormatGemini:
		return map[int]bool{constant.APITypeGemini: true}
	default:
		return nil
	}
}

func DeniedApiTypesForRelayFormat(relayFormat types.RelayFormat) map[int]bool {
	switch relayFormat {
	case types.RelayFormatOpenAI, types.RelayFormatOpenAIResponses, types.RelayFormatOpenAIResponsesCompaction, types.RelayFormatOpenAIAudio, types.RelayFormatOpenAIImage, types.RelayFormatOpenAIRealtime, types.RelayFormatEmbedding:
		return map[int]bool{constant.APITypeAnthropic: true, constant.APITypeGemini: true, constant.APITypeMoonshot: true}
	default:
		return nil
	}
}

func AllowedApiTypesForRequestPath(path string) map[int]bool {
	if strings.HasPrefix(path, "/v1/messages") {
		return AllowedApiTypesForRelayFormat(types.RelayFormatClaude)
	}
	if strings.HasPrefix(path, "/v1beta/models/") || strings.HasPrefix(path, "/v1/models/") || strings.HasPrefix(path, "/v1/engines/") {
		return AllowedApiTypesForRelayFormat(types.RelayFormatGemini)
	}
	return nil
}

func DeniedApiTypesForRequestPath(path string) map[int]bool {
	if strings.HasPrefix(path, "/v1/") && !strings.HasPrefix(path, "/v1/messages") && !strings.HasPrefix(path, "/v1/models/") && !strings.HasPrefix(path, "/v1/engines/") {
		return DeniedApiTypesForRelayFormat(types.RelayFormatOpenAI)
	}
	return nil
}

func IsChannelAllowedForApiTypes(channel *model.Channel, allowedApiTypes map[int]bool) bool {
	return IsChannelMatchedForApiTypes(channel, allowedApiTypes, nil)
}

func IsChannelMatchedForApiTypes(channel *model.Channel, allowedApiTypes map[int]bool, deniedApiTypes map[int]bool) bool {
	if channel == nil {
		return true
	}
	apiType, _ := common.ChannelType2APIType(channel.Type)
	if len(allowedApiTypes) > 0 {
		return allowedApiTypes[apiType]
	}
	if len(deniedApiTypes) > 0 {
		return !deniedApiTypes[apiType]
	}
	return true
}
