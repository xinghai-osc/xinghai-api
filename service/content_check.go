package service

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/setting"
)

type contentCheckRequest struct {
	Model          string          `json:"model"`
	Messages       []dto.Message   `json:"messages"`
	Stream         *bool           `json:"stream"`
	Temperature    *float64        `json:"temperature,omitempty"`
	ResponseFormat *responseFormat `json:"response_format,omitempty"`
}

type responseFormat struct {
	Type string `json:"type"`
}

type contentCheckResponse struct {
	Choices []contentCheckChoice `json:"choices"`
}

type contentCheckChoice struct {
	Message contentCheckMessage `json:"message"`
}

type contentCheckMessage struct {
	Content string `json:"content"`
}

type ContentCheckResult struct {
	Allowed bool   `json:"allowed"`
	Reason  string `json:"reason"`
}

// CheckContentWithExternalModel sends text to the configured external model
// for content moderation. Returns (true, "", nil) on allow,
// (false, reason, nil) on block, (true, "", error) on check failure.
func CheckContentWithExternalModel(ctx context.Context, text string) (bool, string, error) {
	model := setting.ContentCheckModel
	baseURL := setting.ContentCheckBaseURL
	apiKey := setting.ContentCheckAPIKey

	if model == "" || baseURL == "" {
		return true, "", fmt.Errorf("content check model or base URL not configured")
	}

	maxLen := setting.ContentCheckMaxInputLength
	if maxLen > 0 && len(text) > maxLen {
		text = text[:maxLen] + "\n...(truncated)"
	}

	temp := 0.0
	respFormat := &responseFormat{Type: "json_object"}

	reqBody := contentCheckRequest{
		Model: model,
		Messages: []dto.Message{
			{
				Role:    "system",
				Content: setting.GetContentCheckSystemPrompt(),
			},
			{
				Role:    "user",
				Content: text,
			},
		},
		Stream:         common.GetPointer(false),
		Temperature:    &temp,
		ResponseFormat: respFormat,
	}

	jsonData, err := common.Marshal(reqBody)
	if err != nil {
		return true, "", fmt.Errorf("failed to marshal content check request: %w", err)
	}

	url := strings.TrimRight(baseURL, "/") + "/v1/chat/completions"
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(string(jsonData)))
	if err != nil {
		return true, "", fmt.Errorf("failed to create content check request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	if apiKey != "" {
		httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	}

	timeout := time.Duration(setting.ContentCheckTimeout) * time.Second
	if timeout <= 0 {
		timeout = 10 * time.Second
	}
	client := &http.Client{Timeout: timeout}

	resp, err := client.Do(httpReq)
	if err != nil {
		return true, "", fmt.Errorf("content check request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return true, "", fmt.Errorf("content check returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return true, "", fmt.Errorf("failed to read content check response: %w", err)
	}

	var checkResp contentCheckResponse
	if err := common.Unmarshal(body, &checkResp); err != nil {
		return true, "", fmt.Errorf("failed to parse content check response: %w", err)
	}

	if len(checkResp.Choices) == 0 {
		return true, "", fmt.Errorf("content check response has no choices")
	}

	content := strings.TrimSpace(checkResp.Choices[0].Message.Content)
	if content == "" {
		return true, "", fmt.Errorf("content check response has empty content")
	}

	result, err := parseContentCheckResult(content)
	if err != nil {
		logger.LogWarn(nil, fmt.Sprintf("failed to parse content check result as JSON, raw: %s, error: %v", content, err))
		return interpretContentCheckText(content), "", nil
	}

	return result.Allowed, result.Reason, nil
}

func parseContentCheckResult(content string) (*ContentCheckResult, error) {
	var result ContentCheckResult
	if err := common.Unmarshal([]byte(content), &result); err != nil {
		return nil, err
	}
	return &result, nil
}

func interpretContentCheckText(text string) bool {
	lower := strings.ToLower(text)
	blockedPhrases := []string{
		"\"allowed\": false",
		"\"allowed\":false",
		"allowed: false",
		"block",
		"blocked",
		"not allowed",
		"violation",
		"inappropriate",
	}
	for _, phrase := range blockedPhrases {
		if strings.Contains(lower, phrase) {
			return false
		}
	}
	return true
}

// ExtractResponseText extracts text content from an OpenAI text response.
func ExtractResponseText(response *dto.OpenAITextResponse) string {
	if response == nil {
		return ""
	}
	var texts []string
	for _, choice := range response.Choices {
		text := choice.Message.StringContent()
		if text != "" {
			texts = append(texts, text)
		}
		reasoning := choice.Message.GetReasoningContent()
		if reasoning != "" {
			texts = append(texts, reasoning)
		}
	}
	return strings.Join(texts, "\n")
}
