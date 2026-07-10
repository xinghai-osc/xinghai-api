package helper

import (
	"testing"

	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
)

func makeRelayInfo(originModel, upstreamModel string, isMapped bool) *relaycommon.RelayInfo {
	info := &relaycommon.RelayInfo{
		OriginModelName: originModel,
	}
	info.ChannelMeta = &relaycommon.ChannelMeta{
		UpstreamModelName: upstreamModel,
		IsModelMapped:     isMapped,
	}
	return info
}

func TestResponseModelName(t *testing.T) {
	tests := []struct {
		name     string
		info     *relaycommon.RelayInfo
		expected string
	}{
		{
			name:     "nil info returns empty",
			info:     nil,
			expected: "",
		},
		{
			name:     "mapped returns origin model name",
			info:     makeRelayInfo("gpt-4o", "gpt-4o-2024-08-06", true),
			expected: "gpt-4o",
		},
		{
			name:     "not mapped returns upstream model name",
			info:     makeRelayInfo("gpt-4o", "gpt-4o", false),
			expected: "gpt-4o",
		},
		{
			name:     "not mapped but upstream differs returns upstream",
			info:     makeRelayInfo("gpt-4", "gpt-4-0613", false),
			expected: "gpt-4-0613",
		},
		{
			name:     "mapped but origin empty returns upstream",
			info:     makeRelayInfo("", "gpt-4o-2024-08-06", true),
			expected: "gpt-4o-2024-08-06",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, ResponseModelName(tt.info))
		})
	}
}

func TestRewriteResponseModel(t *testing.T) {
	t.Run("mapped rewrites model field", func(t *testing.T) {
		info := makeRelayInfo("gpt-4o", "gpt-4o-2024-08-06", true)
		data := []byte(`{"id":"chatcmpl-1","object":"chat.completion","model":"gpt-4o-2024-08-06","choices":[]}`)
		result := RewriteResponseModel(info, data)
		assert.Equal(t, "gpt-4o", gjson.GetBytes(result, "model").String())
		// other fields preserved
		assert.Equal(t, "chatcmpl-1", gjson.GetBytes(result, "id").String())
	})

	t.Run("not mapped returns data unchanged", func(t *testing.T) {
		info := makeRelayInfo("gpt-4o", "gpt-4o", false)
		data := []byte(`{"model":"gpt-4o","choices":[]}`)
		result := RewriteResponseModel(info, data)
		assert.Equal(t, data, result)
	})

	t.Run("nil info returns data unchanged", func(t *testing.T) {
		data := []byte(`{"model":"gpt-4o"}`)
		result := RewriteResponseModel(nil, data)
		assert.Equal(t, data, result)
	})

	t.Run("streaming chunk model rewritten", func(t *testing.T) {
		info := makeRelayInfo("gpt-4o", "gpt-4o-2024-08-06", true)
		data := `{"id":"chatcmpl-1","object":"chat.completion.chunk","model":"gpt-4o-2024-08-06","choices":[{"delta":{"content":"hi"}}]}`
		result := RewriteResponseModelStr(info, data)
		require.JSONEq(t, `{"id":"chatcmpl-1","object":"chat.completion.chunk","model":"gpt-4o","choices":[{"delta":{"content":"hi"}}]}`, result)
	})

	t.Run("streaming chunk not mapped unchanged", func(t *testing.T) {
		info := makeRelayInfo("gpt-4o", "gpt-4o", false)
		data := `{"model":"gpt-4o","choices":[]}`
		result := RewriteResponseModelStr(info, data)
		assert.Equal(t, data, result)
	})
}
