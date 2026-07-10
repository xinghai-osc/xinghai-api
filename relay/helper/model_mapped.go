package helper

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	commonx "github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/gin-gonic/gin"
	"github.com/tidwall/sjson"
)

// ResponseModelName returns the model name that should appear in the response
// sent to the client. When model mapping is active (info.IsModelMapped), the
// user-facing OriginModelName is returned; otherwise the upstream model name is
// returned unchanged.
func ResponseModelName(info *common.RelayInfo) string {
	if info == nil {
		return ""
	}
	if info.IsModelMapped && info.OriginModelName != "" {
		return info.OriginModelName
	}
	return info.UpstreamModelName
}

// RewriteResponseModel rewrites the "model" field in a raw JSON response body
// to the user-facing model name when model mapping is active. It returns the
// (possibly modified) bytes. If the rewrite fails or mapping is inactive, the
// original data is returned unchanged.
func RewriteResponseModel(info *common.RelayInfo, data []byte) []byte {
	if info == nil || !info.IsModelMapped || info.OriginModelName == "" {
		return data
	}
	result, err := sjson.SetBytes(data, "model", info.OriginModelName)
	if err != nil {
		return data
	}
	return result
}

// RewriteResponseModelStr is the string variant of RewriteResponseModel.
func RewriteResponseModelStr(info *common.RelayInfo, data string) string {
	if info == nil || !info.IsModelMapped || info.OriginModelName == "" {
		return data
	}
	result, err := sjson.Set(data, "model", info.OriginModelName)
	if err != nil {
		return data
	}
	return result
}

// ModelMappingEntry 表示模型映射中单个条目的目标模型和可见性
// 支持两种格式：
//   - 旧格式（纯字符串）: "target-model" → 视为 Target="target-model", Visible=true
//   - 新格式（对象）: {"target": "target-model", "visible": true/false}
type ModelMappingEntry struct {
	Target  string `json:"target"`
	Visible *bool  `json:"visible,omitempty"`
}

// IsVisible 返回该映射条目是否对用户可见，默认为 true
func (e ModelMappingEntry) IsVisible() bool {
	if e.Visible == nil {
		return true
	}
	return *e.Visible
}

// parseModelMappingValue 解析单个映射值，支持 string（旧格式）和 object（新格式）
func parseModelMappingValue(raw json.RawMessage) (ModelMappingEntry, error) {
	var entry ModelMappingEntry
	// 尝试作为对象解析
	if err := commonx.Unmarshal(raw, &entry); err == nil && entry.Target != "" {
		return entry, nil
	}
	// 尝试作为纯字符串解析（旧格式）
	var target string
	if err := commonx.Unmarshal(raw, &target); err == nil {
		return ModelMappingEntry{Target: target, Visible: nil}, nil
	}
	return entry, fmt.Errorf("invalid_model_mapping_value")
}

// ParseModelMapping 解析 model_mapping JSON，返回 sourceModel -> ModelMappingEntry 的映射
// 支持新旧两种格式
func ParseModelMapping(rawMapping string) map[string]ModelMappingEntry {
	if rawMapping == "" || rawMapping == "{}" {
		return nil
	}
	raw := make(map[string]json.RawMessage)
	if err := commonx.UnmarshalJsonStr(rawMapping, &raw); err != nil {
		return nil
	}
	result := make(map[string]ModelMappingEntry, len(raw))
	for source, value := range raw {
		entry, err := parseModelMappingValue(value)
		if err != nil || entry.Target == "" {
			continue
		}
		normalizedSource := strings.TrimSpace(source)
		entry.Target = strings.TrimSpace(entry.Target)
		if normalizedSource == "" || entry.Target == "" {
			continue
		}
		result[normalizedSource] = entry
	}
	if len(result) == 0 {
		return nil
	}
	return result
}

// GetInvisibleModelsFromMapping 从 model_mapping 中提取 visible=false 的源模型名列表
func GetInvisibleModelsFromMapping(rawMapping string) []string {
	parsed := ParseModelMapping(rawMapping)
	if len(parsed) == 0 {
		return nil
	}
	var invisible []string
	for source, entry := range parsed {
		if !entry.IsVisible() {
			invisible = append(invisible, source)
		}
	}
	return invisible
}

// NormalizeModelMappingToTargets 将 model_mapping 规范化为源模型到目标模型字符串的映射（仅可见条目）
// 用于 relay 链路中的模型重定向
func NormalizeModelMappingToTargets(rawMapping string) map[string]string {
	parsed := ParseModelMapping(rawMapping)
	if len(parsed) == 0 {
		return nil
	}
	result := make(map[string]string, len(parsed))
	for source, entry := range parsed {
		if entry.IsVisible() {
			result[source] = entry.Target
		}
	}
	if len(result) == 0 {
		return nil
	}
	return result
}

func ModelMappedHelper(c *gin.Context, info *common.RelayInfo, request dto.Request) error {
	if info.ChannelMeta == nil {
		info.ChannelMeta = &common.ChannelMeta{}
	}

	isResponsesCompact := info.RelayMode == relayconstant.RelayModeResponsesCompact
	originModelName := info.OriginModelName
	mappingModelName := originModelName
	if isResponsesCompact && strings.HasSuffix(originModelName, ratio_setting.CompactModelSuffix) {
		mappingModelName = strings.TrimSuffix(originModelName, ratio_setting.CompactModelSuffix)
	}

	// map model name
	modelMapping := c.GetString("model_mapping")
	if modelMapping != "" && modelMapping != "{}" {
		modelMap := ParseModelMapping(modelMapping)
		if modelMap == nil {
			return nil
		}
		// 构建用于链式重定向的映射（所有条目都参与，不管 visible）
		redirectMap := make(map[string]string, len(modelMap))
		for source, entry := range modelMap {
			redirectMap[source] = entry.Target
		}

		// 支持链式模型重定向，最终使用链尾的模型
		currentModel := mappingModelName
		visitedModels := map[string]bool{
			currentModel: true,
		}
		for {
			if mappedModel, exists := redirectMap[currentModel]; exists && mappedModel != "" {
				// 模型重定向循环检测，避免无限循环
				if visitedModels[mappedModel] {
					if mappedModel == currentModel {
						if currentModel == info.OriginModelName {
							info.IsModelMapped = false
							return nil
						} else {
							info.IsModelMapped = true
							break
						}
					}
					return errors.New("model_mapping_contains_cycle")
				}
				visitedModels[mappedModel] = true
				currentModel = mappedModel
				info.IsModelMapped = true
			} else {
				break
			}
		}
		if info.IsModelMapped {
			info.UpstreamModelName = currentModel
		}
	}

	if isResponsesCompact {
		finalUpstreamModelName := mappingModelName
		if info.IsModelMapped && info.UpstreamModelName != "" {
			finalUpstreamModelName = info.UpstreamModelName
		}
		info.UpstreamModelName = finalUpstreamModelName
		info.OriginModelName = ratio_setting.WithCompactModelSuffix(finalUpstreamModelName)
	}
	if request != nil {
		request.SetModelName(info.UpstreamModelName)
	}
	return nil
}
