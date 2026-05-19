package service

import (
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func resetSubscriptionTestData() {
	_ = model.DB.Exec("DELETE FROM subscription_pre_consume_records").Error
	_ = model.DB.Exec("DELETE FROM user_subscriptions").Error
	_ = model.DB.Exec("DELETE FROM subscription_plans").Error
}

func TestPreConsumeBilling_UsesGenericSubscriptionWithAutoGroup(t *testing.T) {
	truncate(t)
	resetSubscriptionTestData()

	const userID, tokenID, subID = 1001, 1001, 1001
	const userQuota = 10000
	const tokenRemain = 10000
	const preConsumed = 3000
	const subTotal int64 = 50000

	seedUser(t, userID, userQuota)
	seedToken(t, tokenID, userID, "sk-generic-sub", tokenRemain)
	seedSubscription(t, subID, userID, subTotal, 0)

	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Set("token_quota", tokenRemain)

	relayInfo := &relaycommon.RelayInfo{
		RequestId:       "req-generic-sub-auto-group",
		UserId:          userID,
		TokenId:         tokenID,
		TokenKey:        "sk-generic-sub",
		UsingGroup:      "auto",
		OriginModelName: "test-model",
		UserSetting: dto.UserSetting{
			BillingPreference: "subscription_first",
		},
	}

	apiErr := PreConsumeBilling(c, preConsumed, relayInfo)
	require.Nil(t, apiErr)
	require.NotNil(t, relayInfo.Billing)
	assert.Equal(t, BillingSourceSubscription, relayInfo.BillingSource)
	assert.Equal(t, subID, relayInfo.SubscriptionId)
	assert.Equal(t, preConsumed, relayInfo.FinalPreConsumedQuota)
	assert.Equal(t, int64(preConsumed), relayInfo.SubscriptionPreConsumed)
	assert.Equal(t, int64(preConsumed), getSubscriptionUsed(t, subID))
	assert.Equal(t, userQuota, getUserQuota(t, userID))
	assert.Equal(t, tokenRemain-preConsumed, getTokenRemainQuota(t, tokenID))
}

func TestPreConsumeBilling_FallsBackToWalletWhenGroupSubscriptionDoesNotMatch(t *testing.T) {
	truncate(t)
	resetSubscriptionTestData()

	const userID, tokenID, subID = 1002, 1002, 1002
	const userQuota = 10000
	const tokenRemain = 10000
	const preConsumed = 3000
	const subTotal int64 = 50000

	seedUser(t, userID, userQuota)
	seedToken(t, tokenID, userID, "sk-group-sub", tokenRemain)
	seedSubscription(t, subID, userID, subTotal, 0)
	require.NoError(t, model.DB.Model(&model.UserSubscription{}).Where("id = ?", subID).Update("upgrade_group", "vip").Error)

	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Set("token_quota", tokenRemain)

	relayInfo := &relaycommon.RelayInfo{
		RequestId:       "req-group-sub-mismatch",
		UserId:          userID,
		TokenId:         tokenID,
		TokenKey:        "sk-group-sub",
		UsingGroup:      "default",
		OriginModelName: "test-model",
		UserSetting: dto.UserSetting{
			BillingPreference: "subscription_first",
		},
	}

	apiErr := PreConsumeBilling(c, preConsumed, relayInfo)
	require.Nil(t, apiErr)
	require.NotNil(t, relayInfo.Billing)
	assert.Equal(t, BillingSourceWallet, relayInfo.BillingSource)
	assert.Equal(t, 0, relayInfo.SubscriptionId)
	assert.Equal(t, int64(0), getSubscriptionUsed(t, subID))
	assert.Equal(t, userQuota-preConsumed, getUserQuota(t, userID))
	assert.Equal(t, tokenRemain-preConsumed, getTokenRemainQuota(t, tokenID))
}

func TestPreConsumeBilling_UsesMatchingGroupSubscription(t *testing.T) {
	truncate(t)
	resetSubscriptionTestData()

	const userID, tokenID, subID = 1003, 1003, 1003
	const userQuota = 10000
	const tokenRemain = 10000
	const preConsumed = 3000
	const subTotal int64 = 50000

	seedUser(t, userID, userQuota)
	seedToken(t, tokenID, userID, "sk-matching-group-sub", tokenRemain)
	seedSubscription(t, subID, userID, subTotal, 0)
	require.NoError(t, model.DB.Model(&model.UserSubscription{}).Where("id = ?", subID).Update("upgrade_group", "vip").Error)

	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Set("token_quota", tokenRemain)

	relayInfo := &relaycommon.RelayInfo{
		RequestId:       "req-group-sub-match",
		UserId:          userID,
		TokenId:         tokenID,
		TokenKey:        "sk-matching-group-sub",
		UsingGroup:      "vip",
		OriginModelName: "test-model",
		UserSetting: dto.UserSetting{
			BillingPreference: "subscription_first",
		},
	}

	apiErr := PreConsumeBilling(c, preConsumed, relayInfo)
	require.Nil(t, apiErr)
	require.NotNil(t, relayInfo.Billing)
	assert.Equal(t, BillingSourceSubscription, relayInfo.BillingSource)
	assert.Equal(t, subID, relayInfo.SubscriptionId)
	assert.Equal(t, int64(preConsumed), getSubscriptionUsed(t, subID))
	assert.Equal(t, userQuota, getUserQuota(t, userID))
	assert.Equal(t, tokenRemain-preConsumed, getTokenRemainQuota(t, tokenID))
}

func TestHasActiveUserSubscriptionForGroup_GenericSubscription(t *testing.T) {
	truncate(t)
	resetSubscriptionTestData()

	const userID, subID = 1004, 1004
	seedUser(t, userID, 0)
	seedSubscription(t, subID, userID, 10000, 0)

	for _, group := range []string{"", "auto", "default", "vip"} {
		t.Run(group, func(t *testing.T) {
			hasSub, err := model.HasActiveUserSubscriptionForGroup(userID, group)
			require.NoError(t, err)
			assert.True(t, hasSub)
		})
	}
}

func TestHasActiveUserSubscriptionForGroup_GroupLimitedSubscription(t *testing.T) {
	truncate(t)
	resetSubscriptionTestData()

	const userID, subID = 1005, 1005
	seedUser(t, userID, 0)
	seedSubscription(t, subID, userID, 10000, 0)
	require.NoError(t, model.DB.Model(&model.UserSubscription{}).Where("id = ?", subID).Update("upgrade_group", "vip").Error)

	tests := []struct {
		name       string
		usingGroup string
		want       bool
	}{
		{name: "empty", usingGroup: "", want: false},
		{name: "auto", usingGroup: "auto", want: false},
		{name: "default", usingGroup: "default", want: false},
		{name: "vip", usingGroup: "vip", want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hasSub, err := model.HasActiveUserSubscriptionForGroup(userID, tt.usingGroup)
			require.NoError(t, err)
			assert.Equal(t, tt.want, hasSub)
		})
	}
}
