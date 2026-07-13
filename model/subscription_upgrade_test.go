package model

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/shopspring/decimal"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func seedUpgradeSub(t *testing.T, sub *UserSubscription) {
	t.Helper()
	require.NoError(t, DB.Create(sub).Error)
}

func boolPtr(b bool) *bool { return &b }

func getUserQuota(t *testing.T, userId int) int64 {
	t.Helper()
	var user User
	require.NoError(t, DB.Where("id = ?", userId).First(&user).Error)
	return int64(user.Quota)
}

func TestGetSubscriptionUpgradeQuoteCreditsUnusedTime(t *testing.T) {
	truncateTables(t)

	now := GetDBTimestamp()
	sourcePlan := &SubscriptionPlan{
		Id: 9701, Title: "Basic", PriceAmount: 10, DurationUnit: SubscriptionDurationMonth,
		DurationValue: 1, TotalAmount: 1000,
	}
	targetPlan := &SubscriptionPlan{
		Id: 9702, Title: "Pro", PriceAmount: 30, DurationUnit: SubscriptionDurationMonth,
		DurationValue: 1, TotalAmount: 3000, Enabled: true,
	}
	seedSubscriptionResetPlan(t, sourcePlan)
	seedSubscriptionResetPlan(t, targetPlan)

	// Half of the month remains: credit = 10 * 0.5 = 5, due = 30 - 5 = 25
	start := now - 15*24*3600
	end := now + 15*24*3600
	seedUpgradeSub(t, &UserSubscription{
		Id: 9703, UserId: 501, PlanId: sourcePlan.Id, PriceAmount: 10,
		StartTime: start, EndTime: end, Status: "active", AmountTotal: 1000, AmountUsed: 0,
	})

	due, err := GetSubscriptionUpgradeQuote(501, 9703, targetPlan.Id)
	require.NoError(t, err)
	assert.InDelta(t, 25.0, due, 0.001)
}

func TestGetSubscriptionUpgradeQuoteRejectsCheaperPlan(t *testing.T) {
	truncateTables(t)

	now := GetDBTimestamp()
	sourcePlan := &SubscriptionPlan{
		Id: 9801, Title: "Pro", PriceAmount: 30, DurationUnit: SubscriptionDurationMonth,
		DurationValue: 1, TotalAmount: 3000, Enabled: true,
	}
	targetPlan := &SubscriptionPlan{
		Id: 9802, Title: "Basic", PriceAmount: 10, DurationUnit: SubscriptionDurationMonth,
		DurationValue: 1, TotalAmount: 1000, Enabled: true,
	}
	seedSubscriptionResetPlan(t, sourcePlan)
	seedSubscriptionResetPlan(t, targetPlan)

	seedUpgradeSub(t, &UserSubscription{
		Id: 9803, UserId: 601, PlanId: sourcePlan.Id, PriceAmount: 30,
		StartTime: now - 3600, EndTime: now + 30*24*3600, Status: "active", AmountTotal: 3000, AmountUsed: 0,
	})

	_, err := GetSubscriptionUpgradeQuote(601, 9803, targetPlan.Id)
	require.Error(t, err)
}

func TestUpgradeSubscriptionWithBalanceChargesProratedDifference(t *testing.T) {
	truncateTables(t)

	now := GetDBTimestamp()
	sourcePlan := &SubscriptionPlan{
		Id: 9901, Title: "Basic", PriceAmount: 10, DurationUnit: SubscriptionDurationMonth,
		DurationValue: 1, TotalAmount: 1000, Enabled: true,
	}
	targetPlan := &SubscriptionPlan{
		Id: 9902, Title: "Pro", PriceAmount: 30, DurationUnit: SubscriptionDurationMonth,
		DurationValue: 1, TotalAmount: 3000, Enabled: true, AllowBalancePay: boolPtr(true),
	}
	seedSubscriptionResetPlan(t, sourcePlan)
	seedSubscriptionResetPlan(t, targetPlan)

	start := now - 15*24*3600
	end := now + 15*24*3600
	seedUpgradeSub(t, &UserSubscription{
		Id: 9903, UserId: 701, PlanId: sourcePlan.Id, PriceAmount: 10,
		StartTime: start, EndTime: end, Status: "active", AmountTotal: 1000, AmountUsed: 0,
	})

	user := &User{Id: 701, Quota: 100 * 1000 * 1000, Status: 1}
	require.NoError(t, DB.Create(user).Error)
	before := getUserQuota(t, 701)

	err := UpgradeSubscriptionWithBalance(701, 9903, targetPlan.Id)
	require.NoError(t, err)

	source := getSubscriptionResetSub(t, 9903)
	assert.Equal(t, "cancelled", source.Status)

	var subs []UserSubscription
	require.NoError(t, DB.Where("user_id = ? AND plan_id = ?", 701, targetPlan.Id).Find(&subs).Error)
	assert.Len(t, subs, 1)

	after := getUserQuota(t, 701)
	expectedCharged := int(decimal.NewFromFloat(25).
		Mul(decimal.NewFromFloat(common.QuotaPerUnit)).Ceil().IntPart())
	assert.Equal(t, before-int64(expectedCharged), after)
}
