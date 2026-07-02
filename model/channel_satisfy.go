package model

import (
	"errors"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

func IsChannelEnabledForGroupModel(group string, modelName string, channelID int) bool {
	if group == "" || modelName == "" || channelID <= 0 {
		return false
	}
	if !common.MemoryCacheEnabled {
		return isChannelEnabledForGroupModelDB(group, modelName, channelID)
	}

	channelSyncLock.RLock()
	defer channelSyncLock.RUnlock()

	if group2model2channels == nil {
		return false
	}

	if isChannelIDInList(group2model2channels[group][modelName], channelID) {
		return true
	}
	normalized := ratio_setting.FormatMatchingModelName(modelName)
	if normalized != "" && normalized != modelName {
		return isChannelIDInList(group2model2channels[group][normalized], channelID)
	}
	return false
}

func IsChannelEnabledForAnyGroupModel(groups []string, modelName string, channelID int) bool {
	if len(groups) == 0 {
		return false
	}
	for _, g := range groups {
		if IsChannelEnabledForGroupModel(g, modelName, channelID) {
			return true
		}
	}
	return false
}

func isChannelEnabledForGroupModelDB(group string, modelName string, channelID int) bool {
	var count int64
	err := DB.Model(&Ability{}).
		Where(commonGroupCol+" = ? and model = ? and channel_id = ? and enabled = ?", group, modelName, channelID, true).
		Count(&count).Error
	if err == nil && count > 0 {
		return true
	}
	normalized := ratio_setting.FormatMatchingModelName(modelName)
	if normalized == "" || normalized == modelName {
		return false
	}
	count = 0
	err = DB.Model(&Ability{}).
		Where(commonGroupCol+" = ? and model = ? and channel_id = ? and enabled = ?", group, normalized, channelID, true).
		Count(&count).Error
	return err == nil && count > 0
}

func isChannelIDInList(list []int, channelID int) bool {
	for _, id := range list {
		if id == channelID {
			return true
		}
	}
	return false
}

// ToggleChannelModelDisabled enables or disables a single model on a channel.
// When disabled is true, the model is added to the channel's DisabledModels
// list and its abilities are marked as disabled. When false, the model is
// removed from the disabled list and its abilities are re-enabled (only if the
// channel itself is enabled).
func ToggleChannelModelDisabled(channelId int, model string, disabled bool) (*Channel, error) {
	channel, err := GetChannelById(channelId, true)
	if err != nil {
		return nil, err
	}
	model = strings.TrimSpace(model)
	if model == "" {
		return nil, errors.New("model name cannot be empty")
	}
	// Verify the model is part of the channel's model list.
	modelFound := false
	for _, m := range channel.GetModels() {
		if m == model {
			modelFound = true
			break
		}
	}
	if !modelFound {
		return nil, errors.New("model is not in the channel's model list")
	}

	disabledSet := channel.GetDisabledModelSet()
	if disabledSet == nil {
		disabledSet = make(map[string]bool)
	}
	changed := false
	if disabled {
		if !disabledSet[model] {
			disabledSet[model] = true
			changed = true
		}
	} else {
		if disabledSet[model] {
			delete(disabledSet, model)
			changed = true
		}
	}
	if !changed {
		return channel, nil
	}
	channel.DisabledModels = joinDisabledModels(disabledSet)
	if err := channel.SaveWithoutKey(); err != nil {
		return nil, err
	}

	// Update abilities for this specific model.
	enabled := channel.Status == common.ChannelStatusEnabled && !disabled
	err = DB.Model(&Ability{}).
		Where("channel_id = ? and model = ?", channelId, model).
		Update("enabled", enabled).Error
	if err != nil {
		return nil, err
	}

	// Incrementally update the in-memory cache.
	CacheUpdateChannelDisabledModels(channelId, disabledSet)
	return channel, nil
}
