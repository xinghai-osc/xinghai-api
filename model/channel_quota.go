package model

import (
	"fmt"
	"time"

	"github.com/QuantumNous/new-api/common"

	"github.com/bytedance/gopkg/util/gopool"
	"github.com/samber/lo"
)

// --- Redis cache helpers ---

func channelQuotaCacheKey(channelId int) string {
	return fmt.Sprintf("channel_quota:%d", channelId)
}

type channelQuotaCache struct {
	QuotaLimit int64 `json:"quota_limit"`
	UsedQuota  int64 `json:"used_quota"`
}

// getChannelQuotaCache reads the cached quota_limit and used_quota for a channel.
func getChannelQuotaCache(channelId int) (*channelQuotaCache, error) {
	if !common.RedisEnabled {
		return nil, fmt.Errorf("redis is not enabled")
	}
	var cache channelQuotaCache
	err := common.RedisHGetObj(channelQuotaCacheKey(channelId), &cache)
	if err != nil {
		return nil, err
	}
	return &cache, nil
}

// populateChannelQuotaCache sets the full quota cache from DB values.
func populateChannelQuotaCache(channelId int, quotaLimit int64, usedQuota int64) error {
	if !common.RedisEnabled {
		return nil
	}
	return common.RedisHSetObj(
		channelQuotaCacheKey(channelId),
		&channelQuotaCache{QuotaLimit: quotaLimit, UsedQuota: usedQuota},
		time.Duration(common.RedisKeyCacheSeconds())*time.Second,
	)
}

// cacheIncrChannelUsedQuota atomically increments the cached used_quota.
func cacheIncrChannelUsedQuota(channelId int, delta int64) error {
	if !common.RedisEnabled {
		return nil
	}
	return common.RedisHIncrBy(channelQuotaCacheKey(channelId), "UsedQuota", delta)
}

// updateChannelQuotaLimitCache updates the cached quota_limit field.
func updateChannelQuotaLimitCache(channelId int, quotaLimit int64) error {
	if !common.RedisEnabled {
		return nil
	}
	return common.RedisHSetField(channelQuotaCacheKey(channelId), "QuotaLimit", fmt.Sprintf("%d", quotaLimit))
}

// invalidateChannelQuotaCache clears the channel quota cache.
func invalidateChannelQuotaCache(channelId int) error {
	if !common.RedisEnabled {
		return nil
	}
	return common.RedisDelKey(channelQuotaCacheKey(channelId))
}

// --- Public API ---

// GetChannelQuotaLimit returns the quota limit and used quota for a channel.
// It tries Redis first, then falls back to the database.
func GetChannelQuotaLimit(channelId int, fromDB bool) (quotaLimit int64, usedQuota int64, err error) {
	defer func() {
		if shouldUpdateRedis(fromDB, err) {
			gopool.Go(func() {
				if e := populateChannelQuotaCache(channelId, quotaLimit, usedQuota); e != nil {
					common.SysLog(fmt.Sprintf("failed to update channel quota cache: channel_id=%d, error=%v", channelId, e))
				}
			})
		}
	}()

	if !fromDB && common.RedisEnabled {
		cache, e := getChannelQuotaCache(channelId)
		if e == nil {
			return cache.QuotaLimit, cache.UsedQuota, nil
		}
	}

	fromDB = true
	var ch Channel
	err = DB.Model(&Channel{}).Where("id = ?", channelId).Select("quota_limit", "used_quota").First(&ch).Error
	if err != nil {
		return 0, 0, err
	}
	return ch.QuotaLimit, ch.UsedQuota, nil
}

// UpdateChannelQuotaLimit sets the quota_limit for a channel and refreshes the cache.
// If channelId is 0, the function does nothing.
func UpdateChannelQuotaLimit(channelId int, quotaLimit int64) error {
	if channelId == 0 {
		return nil
	}
	err := DB.Model(&Channel{}).Where("id = ?", channelId).Update("quota_limit", quotaLimit).Error
	if err != nil {
		return err
	}
	if e := updateChannelQuotaLimitCache(channelId, quotaLimit); e != nil {
		common.SysLog(fmt.Sprintf("failed to update channel quota_limit cache: channel_id=%d, error=%v", channelId, e))
	}
	return nil
}

// ChannelQuotaExceeded returns true when the channel has a non-zero quota_limit
// and used_quota >= quota_limit.
func ChannelQuotaExceeded(channelId int) bool {
	quotaLimit, usedQuota, err := GetChannelQuotaLimit(channelId, false)
	if err != nil {
		return false
	}
	if quotaLimit <= 0 {
		return false
	}
	return usedQuota >= quotaLimit
}

// IncreaseChannelUsedQuota atomically increases the channel's used_quota by delta.
// It updates both Redis cache (immediate) and the database (via the existing
// batch-update or direct path). This wraps UpdateChannelUsedQuota with Redis sync.
func IncreaseChannelUsedQuota(channelId int, quota int) {
	if quota == 0 {
		return
	}
	gopool.Go(func() {
		if e := cacheIncrChannelUsedQuota(channelId, int64(quota)); e != nil {
			common.SysLog(fmt.Sprintf("failed to increase channel used quota cache: channel_id=%d, error=%v", channelId, e))
		}
	})
	UpdateChannelUsedQuota(channelId, quota)
}

// DecreaseChannelUsedQuota atomically decreases the channel's used_quota by delta.
// It updates both Redis cache (immediate) and the database (via the existing
// batch-update or direct path). This wraps UpdateChannelUsedQuota with Redis sync.
func DecreaseChannelUsedQuota(channelId int, quota int) {
	if quota == 0 {
		return
	}
	gopool.Go(func() {
		if e := cacheIncrChannelUsedQuota(channelId, int64(-quota)); e != nil {
			common.SysLog(fmt.Sprintf("failed to decrease channel used quota cache: channel_id=%d, error=%v", channelId, e))
		}
	})
	UpdateChannelUsedQuota(channelId, -quota)
}

// ResetChannelUsedQuota resets the channel's used_quota to 0 and refreshes the cache.
func ResetChannelUsedQuota(channelId int) error {
	err := DB.Model(&Channel{}).Where("id = ?", channelId).Update("used_quota", 0).Error
	if err != nil {
		return err
	}
	if common.RedisEnabled {
		_ = common.RedisHSetField(channelQuotaCacheKey(channelId), "UsedQuota", "0")
	}
	return nil
}

// BatchUpdateChannelQuotaLimit sets quota_limit for multiple channels.
func BatchUpdateChannelQuotaLimit(ids []int, quotaLimit int64) error {
	if len(ids) == 0 {
		return nil
	}
	for _, chunk := range lo.Chunk(ids, 200) {
		if err := DB.Model(&Channel{}).Where("id in (?)", chunk).Update("quota_limit", quotaLimit).Error; err != nil {
			return err
		}
		for _, id := range chunk {
			_ = updateChannelQuotaLimitCache(id, quotaLimit)
		}
	}
	return nil
}
