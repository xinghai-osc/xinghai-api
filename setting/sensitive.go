package setting

import "strings"

var CheckSensitiveEnabled = true
var CheckSensitiveOnPromptEnabled = true
var CheckSensitiveOnCompletionEnabled = false
var SensitiveBlockResponse = "Sensitive words detected"
var SensitiveWordResponses = map[string]string{}

// StopOnSensitiveEnabled 如果检测到敏感词，是否立刻停止生成，否则替换敏感词
var StopOnSensitiveEnabled = true

// StreamCacheQueueLength 流模式缓存队列长度，0表示无缓存
var StreamCacheQueueLength = 0

// SensitiveWords 敏感词
// var SensitiveWords []string
var SensitiveWords = []string{
	"test_sensitive",
}

func SensitiveWordsToString() string {
	return strings.Join(SensitiveWords, "\n")
}

func SensitiveWordsFromString(s string) {
	SensitiveWords = []string{}
	sw := strings.Split(s, "\n")
	for _, w := range sw {
		w = strings.TrimSpace(w)
		if w != "" {
			SensitiveWords = append(SensitiveWords, w)
		}
	}
}

func SensitiveWordResponsesToString() string {
	lines := make([]string, 0, len(SensitiveWordResponses))
	for _, word := range SensitiveWords {
		response, ok := SensitiveWordResponses[strings.ToLower(strings.TrimSpace(word))]
		if !ok || strings.TrimSpace(response) == "" {
			continue
		}
		lines = append(lines, strings.TrimSpace(word)+"=>"+response)
	}
	return strings.Join(lines, "\n")
}

func SensitiveWordResponsesFromString(s string) {
	SensitiveWordResponses = map[string]string{}
	lines := strings.Split(s, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, "=>", 2)
		if len(parts) != 2 {
			continue
		}
		word := strings.ToLower(strings.TrimSpace(parts[0]))
		response := strings.TrimSpace(parts[1])
		if word != "" && response != "" {
			SensitiveWordResponses[word] = response
		}
	}
}

func ShouldCheckPromptSensitive() bool {
	return CheckSensitiveEnabled && CheckSensitiveOnPromptEnabled
}

func ShouldCheckCompletionSensitive() bool {
	return CheckSensitiveEnabled && CheckSensitiveOnCompletionEnabled
}
