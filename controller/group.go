package controller

import (
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"

	"github.com/gin-gonic/gin"
)

func GetGroups(c *gin.Context) {
	groupNames := make([]string, 0)
	for groupName := range ratio_setting.GetGroupRatioCopy() {
		groupNames = append(groupNames, groupName)
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    groupNames,
	})
}

func GetUserGroups(c *gin.Context) {
	usableGroups := make(map[string]map[string]interface{})
	subscriptionGroups := make(map[string]bool)
	userGroup := ""
	userId := c.GetInt("id")
	userGroup, _ = model.GetUserGroup(userId, false)
	userUsableGroups := service.GetUserUsableGroups(userGroup)
	if summaries, err := model.GetAllActiveUserSubscriptions(userId); err == nil {
		for _, summary := range summaries {
			if summary.Subscription == nil {
				continue
			}
			for _, group := range strings.Split(summary.Subscription.UpgradeGroup, ",") {
				group = strings.TrimSpace(group)
				if group != "" {
					subscriptionGroups[group] = true
				}
			}
		}
	}
	for groupName, _ := range ratio_setting.GetGroupRatioCopy() {
		// UserUsableGroups contains the groups that the user can use
		if desc, ok := userUsableGroups[groupName]; ok {
			usableGroups[groupName] = map[string]interface{}{
				"ratio":        service.GetUserGroupRatio(userGroup, groupName),
				"desc":         desc,
				"subscription": subscriptionGroups[groupName],
			}
		}
	}
	if _, ok := userUsableGroups["auto"]; ok {
		usableGroups["auto"] = map[string]interface{}{
			"ratio": "自动",
			"desc":  setting.GetUsableGroupDescription("auto"),
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"success":             true,
		"message":             "",
		"data":                usableGroups,
		"user_group":          service.GetPrimaryUserGroup(userGroup),
		"user_groups":         service.SplitUserGroups(userGroup),
		"subscription_groups": subscriptionGroups,
	})
}
