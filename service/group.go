package service

import (
	"strings"

	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

func GetPrimaryUserGroup(userGroup string) string {
	userGroups := SplitUserGroups(userGroup)
	if len(userGroups) == 0 {
		return ""
	}
	return userGroups[0]
}

func SplitUserGroups(userGroup string) []string {
	parts := strings.FieldsFunc(userGroup, func(r rune) bool {
		return r == ',' || r == '，' || r == ';' || r == '；' || r == '\n' || r == '\t' || r == ' '
	})
	groups := make([]string, 0, len(parts))
	seen := make(map[string]bool)
	for _, part := range parts {
		group := strings.TrimSpace(part)
		if group == "" || seen[group] {
			continue
		}
		seen[group] = true
		groups = append(groups, group)
	}
	return groups
}

func JoinUserGroups(userGroups []string) string {
	groups := make([]string, 0, len(userGroups))
	seen := make(map[string]bool)
	for _, userGroup := range userGroups {
		for _, group := range SplitUserGroups(userGroup) {
			if seen[group] {
				continue
			}
			seen[group] = true
			groups = append(groups, group)
		}
	}
	return strings.Join(groups, ",")
}

func GetUserUsableGroups(userGroup string) map[string]string {
	groupsCopy := setting.GetUserUsableGroupsCopy()
	for _, currentUserGroup := range SplitUserGroups(userGroup) {
		specialSettings, b := ratio_setting.GetGroupRatioSetting().GroupSpecialUsableGroup.Get(currentUserGroup)
		if b {
			for specialGroup, desc := range specialSettings {
				if strings.HasPrefix(specialGroup, "-:") {
					groupToRemove := strings.TrimPrefix(specialGroup, "-:")
					delete(groupsCopy, groupToRemove)
				} else if strings.HasPrefix(specialGroup, "+:") {
					groupToAdd := strings.TrimPrefix(specialGroup, "+:")
					groupsCopy[groupToAdd] = desc
				} else {
					groupsCopy[specialGroup] = desc
				}
			}
		}
		if _, ok := groupsCopy[currentUserGroup]; !ok {
			groupsCopy[currentUserGroup] = "用户分组"
		}
	}
	return groupsCopy
}

func GroupInUserUsableGroups(userGroup, groupName string) bool {
	_, ok := GetUserUsableGroups(userGroup)[groupName]
	return ok
}

func GetUserAutoGroup(userGroup string) []string {
	groups := GetUserUsableGroups(userGroup)
	autoGroups := make([]string, 0)
	for _, group := range setting.GetAutoGroups() {
		if _, ok := groups[group]; ok {
			autoGroups = append(autoGroups, group)
		}
	}
	return autoGroups
}

func GetUserGroupRatio(userGroup, group string) float64 {
	for _, currentUserGroup := range SplitUserGroups(userGroup) {
		ratio, ok := ratio_setting.GetGroupGroupRatio(currentUserGroup, group)
		if ok {
			return ratio
		}
	}
	return ratio_setting.GetGroupRatio(group)
}
