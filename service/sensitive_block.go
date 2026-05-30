package service

import (
	"strings"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/setting"
)

func GetSensitiveBlockResponse() string {
	text := strings.TrimSpace(setting.SensitiveBlockResponse)
	if text == "" {
		return "Sensitive words detected"
	}
	return setting.SensitiveBlockResponse
}

func BuildSensitiveBlockedOpenAIResponse(id string, created any, model string, usage dto.Usage) *dto.OpenAITextResponse {
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
					Content: GetSensitiveBlockResponse(),
				},
				FinishReason: constant.FinishReasonContentFilter,
			},
		},
		Usage: usage,
	}
}

func BuildSensitiveBlockedStreamResponse(id string, created int64, model string, systemFingerprint *string) *dto.ChatCompletionsStreamResponse {
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
					Content: stringPointer(GetSensitiveBlockResponse()),
				},
				FinishReason: stringPointer(constant.FinishReasonContentFilter),
			},
		},
	}
}

func stringPointer(s string) *string {
	return &s
}
