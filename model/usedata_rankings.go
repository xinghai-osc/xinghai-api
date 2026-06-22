package model

import (
	"fmt"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"gorm.io/gorm"
)

type RankingQuotaTotal struct {
	ModelName   string `json:"model_name"`
	TotalTokens int64  `json:"total_tokens"`
}

type RankingQuotaBucket struct {
	ModelName string `json:"model_name"`
	Bucket    int64  `json:"bucket"`
	Tokens    int64  `json:"tokens"`
}

type PersonalRankingTotal struct {
	Rank         int     `json:"rank" gorm:"-"`
	UserID       int     `json:"user_id"`
	Username     string  `json:"username"`
	DisplayName  string  `json:"display_name"`
	AvatarUrl    string  `json:"avatar_url" gorm:"-"`
	Setting      string  `json:"-"`
	TotalQuota   int64   `json:"total_quota"`
	RequestCount int64   `json:"request_count"`
	Share        float64 `json:"share" gorm:"-"`
}

func GetRankingQuotaTotals(startTime int64, endTime int64) ([]RankingQuotaTotal, error) {
	var rows []RankingQuotaTotal
	usageExpr := rankingUsageExpr()
	query := DB.Table("quota_data").
		Select(fmt.Sprintf("model_name, sum(%s) as total_tokens", usageExpr)).
		Where("model_name <> ''").
		Group("model_name").
		Having(fmt.Sprintf("sum(%s) > 0", usageExpr)).
		Order("total_tokens DESC")
	query = applyRankingQuotaTimeRange(query, startTime, endTime)
	err := query.Find(&rows).Error
	return rows, err
}

func GetRankingQuotaBuckets(startTime int64, endTime int64, bucketSize int64) ([]RankingQuotaBucket, error) {
	if bucketSize <= 0 {
		bucketSize = 3600
	}
	bucketExpr := rankingBucketExpr(bucketSize)
	usageExpr := rankingUsageExpr()
	var rows []RankingQuotaBucket
	query := DB.Table("quota_data").
		Select(fmt.Sprintf("model_name, %s as bucket, sum(%s) as tokens", bucketExpr, usageExpr)).
		Where("model_name <> ''").
		Group(fmt.Sprintf("model_name, %s", bucketExpr)).
		Having(fmt.Sprintf("sum(%s) > 0", usageExpr)).
		Order("bucket ASC")
	query = applyRankingQuotaTimeRange(query, startTime, endTime)
	err := query.Find(&rows).Error
	return rows, err
}

func GetPersonalRankingQuotaTotals(startTime int64, endTime int64, limit int) ([]PersonalRankingTotal, error) {
	if limit <= 0 {
		limit = 20
	}

	var rows []PersonalRankingTotal
	query := DB.Table("quota_data").
		Select("quota_data.user_id, users.username, users.display_name, users.setting, sum(quota_data.quota) as total_quota, sum(quota_data.count) as request_count").
		Joins("JOIN users ON users.id = quota_data.user_id").
		Where("quota_data.user_id > 0").
		Where("users.deleted_at IS NULL").
		Where("users.setting LIKE ?", "%\""+dto.ShowInPersonalRankingKey+"\":true%").
		Group("quota_data.user_id, users.username, users.display_name, users.setting").
		Having("sum(quota_data.quota) > 0").
		Order("total_quota DESC").
		Limit(limit)
	query = applyRankingQuotaTimeRange(query, startTime, endTime)
	if err := query.Find(&rows).Error; err != nil {
		return nil, err
	}

	var total int64
	for _, row := range rows {
		total += row.TotalQuota
	}
	for i := range rows {
		rows[i].Rank = i + 1
		rows[i].AvatarUrl = parseRankingAvatarUrl(rows[i].Setting)
		if total > 0 {
			rows[i].Share = float64(rows[i].TotalQuota) / float64(total)
		}
	}
	return rows, nil
}

func parseRankingAvatarUrl(settingJson string) string {
	if settingJson == "" {
		return ""
	}
	setting := dto.UserSetting{}
	if err := common.UnmarshalJsonStr(settingJson, &setting); err != nil {
		return ""
	}
	return setting.AvatarUrl
}

func rankingBucketExpr(bucketSize int64) string {
	if common.UsingMainDatabase(common.DatabaseTypeMySQL) {
		return fmt.Sprintf("FLOOR(quota_data.created_at / %d) * %d", bucketSize, bucketSize)
	}
	return fmt.Sprintf("(quota_data.created_at / %d) * %d", bucketSize, bucketSize)
}

func rankingUsageExpr() string {
	return "CASE WHEN token_used > 0 THEN token_used ELSE quota END"
}

func applyRankingQuotaTimeRange(query *gorm.DB, startTime int64, endTime int64) *gorm.DB {
	if startTime > 0 {
		query = query.Where("quota_data.created_at >= ?", startTime)
	}
	if endTime > 0 {
		query = query.Where("quota_data.created_at <= ?", endTime)
	}
	return query
}
