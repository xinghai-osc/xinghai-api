package operation_setting

import (
	"crypto/rand"
	"math/big"
	"strings"

	"github.com/QuantumNous/new-api/setting/config"
)

type UserAgentPool struct {
	Name         string   `json:"name"`
	ChannelTypes []int    `json:"channel_types,omitempty"`
	ChannelNames []string `json:"channel_names,omitempty"`
	UserAgents   []string `json:"user_agents"`
}

type UserAgentPoolSetting struct {
	Enabled bool            `json:"enabled"`
	Pools   []UserAgentPool `json:"pools"`
}

var userAgentPoolSetting = UserAgentPoolSetting{
	Enabled: false,
	Pools:   []UserAgentPool{},
}

func init() {
	config.GlobalConfig.Register("user_agent_pool_setting", &userAgentPoolSetting)
}

func GetUserAgentPoolSetting() *UserAgentPoolSetting {
	return &userAgentPoolSetting
}

func (s *UserAgentPoolSetting) RandomUserAgent(channelType int, channelName string) string {
	if s == nil || !s.Enabled {
		return ""
	}

	candidates := make([]string, 0)
	for _, pool := range s.Pools {
		if !pool.matches(channelType, channelName) {
			continue
		}
		for _, userAgent := range pool.UserAgents {
			userAgent = strings.TrimSpace(userAgent)
			if userAgent != "" {
				candidates = append(candidates, userAgent)
			}
		}
	}
	if len(candidates) == 0 {
		return ""
	}
	if len(candidates) == 1 {
		return candidates[0]
	}

	index, err := rand.Int(rand.Reader, big.NewInt(int64(len(candidates))))
	if err != nil {
		return candidates[0]
	}
	return candidates[index.Int64()]
}

func (p UserAgentPool) matches(channelType int, channelName string) bool {
	if len(p.ChannelTypes) == 0 && len(p.ChannelNames) == 0 {
		return true
	}
	for _, candidate := range p.ChannelTypes {
		if candidate == channelType {
			return true
		}
	}
	for _, candidate := range p.ChannelNames {
		if strings.EqualFold(strings.TrimSpace(candidate), strings.TrimSpace(channelName)) {
			return true
		}
	}
	return false
}
