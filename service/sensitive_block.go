package service

import (
	"strings"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/setting"
)

func GetSensitiveBlockResponse(words ...string) string {
	for _, word := range words {
		response := strings.TrimSpace(setting.SensitiveWordResponses[strings.ToLower(strings.TrimSpace(word))])
		if response != "" {
			return response
		}
	}
	text := strings.TrimSpace(setting.SensitiveBlockResponse)
	if text == "" {
		return "Sensitive words detected"
	}
	return setting.SensitiveBlockResponse
}

func BuildSensitiveBlockedOpenAIResponse(id string, created any, model string, usage dto.Usage, words ...string) *dto.OpenAITextResponse {
	return &dto.OpenAITextResponse{
		Id:      id,
		Model:   model,
		Object:  "chat.completion",
		Created: created,
		Choices: []dto.OpenAITextResponseChoice{
			{
				Index: 0,
				Message: dto.Message{
					Role:    "assistant",
					Content: GetSensitiveBlockResponse(words...),
				},
				FinishReason: constant.FinishReasonContentFilter,
			},
		},
		Usage: usage,
	}
}

func BuildSensitiveBlockedStreamResponse(id string, created int64, model string, systemFingerprint *string, words ...string) *dto.ChatCompletionsStreamResponse {
	return &dto.ChatCompletionsStreamResponse{
		Id:                id,
		Object:            "chat.completion.chunk",
		Created:           created,
		Model:             model,
		SystemFingerprint: systemFingerprint,
		Choices: []dto.ChatCompletionsStreamResponseChoice{
			{
				Index: 0,
				Delta: dto.ChatCompletionsStreamResponseChoiceDelta{
					Content: stringPointer(GetSensitiveBlockResponse(words...)),
				},
				FinishReason: stringPointer(constant.FinishReasonContentFilter),
			},
		},
	}
}

func stringPointer(s string) *string {
	return &s
}
