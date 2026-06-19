package openaicompat

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
)

func ResponsesRequestToChatCompletionsRequest(req *dto.OpenAIResponsesRequest) (*dto.GeneralOpenAIRequest, error) {
	if req == nil {
		return nil, errors.New("request is nil")
	}
	if req.Model == "" {
		return nil, errors.New("model is required")
	}

	messages := make([]dto.Message, 0)
	if len(req.Instructions) > 0 {
		instructions := common.JsonRawMessageToString(req.Instructions)
		if strings.TrimSpace(instructions) != "" {
			messages = append(messages, dto.Message{Role: "system", Content: instructions})
		}
	}

	inputMessages, err := responsesInputToChatMessages(req.Input)
	if err != nil {
		return nil, err
	}
	messages = append(messages, inputMessages...)
	if len(messages) == 0 {
		messages = append(messages, dto.Message{Role: "user", Content: ""})
	}

	out := &dto.GeneralOpenAIRequest{
		Model:            req.Model,
		Messages:         messages,
		Stream:           req.Stream,
		StreamOptions:    req.StreamOptions,
		MaxTokens:        req.MaxOutputTokens,
		Temperature:      req.Temperature,
		TopP:             req.TopP,
		ToolChoice:       req.ToolChoice,
		Tools:            responsesToolsToChatTools(req.Tools),
		User:             req.User,
		Metadata:         req.Metadata,
		Store:            req.Store,
		ReasoningEffort:  "",
		ParallelTooCalls: responsesParallelToolCalls(req.ParallelToolCalls),
		SafetyIdentifier: req.SafetyIdentifier,
	}
	if req.Reasoning != nil {
		out.ReasoningEffort = req.Reasoning.Effort
	}
	return out, nil
}

func responsesInputToChatMessages(input []byte) ([]dto.Message, error) {
	if len(input) == 0 {
		return nil, nil
	}
	if common.GetJsonType(input) == "string" {
		return []dto.Message{{Role: "user", Content: common.JsonRawMessageToString(input)}}, nil
	}

	var items []map[string]any
	if err := common.Unmarshal(input, &items); err != nil {
		return nil, fmt.Errorf("invalid responses input: %w", err)
	}

	messages := make([]dto.Message, 0, len(items))
	for _, item := range items {
		itemType := common.Interface2String(item["type"])
		if itemType == "function_call_output" {
			messages = append(messages, dto.Message{
				Role:       "tool",
				ToolCallId: common.Interface2String(item["call_id"]),
				Content:    item["output"],
			})
			continue
		}

		role := common.Interface2String(item["role"])
		if role == "" {
			role = "user"
		}
		messages = append(messages, dto.Message{
			Role:    role,
			Content: responsesInputContentToChatContent(item["content"]),
		})
	}
	return messages, nil
}

func responsesInputContentToChatContent(content any) any {
	switch value := content.(type) {
	case []any:
		parts := make([]dto.MediaContent, 0, len(value))
		for _, rawPart := range value {
			part, ok := rawPart.(map[string]any)
			if !ok {
				continue
			}
			switch common.Interface2String(part["type"]) {
			case "input_text":
				parts = append(parts, dto.MediaContent{Type: dto.ContentTypeText, Text: common.Interface2String(part["text"])})
			case "input_image":
				parts = append(parts, dto.MediaContent{Type: dto.ContentTypeImageURL, ImageUrl: map[string]any{
					"url":    part["image_url"],
					"detail": part["detail"],
				}})
			case "input_file":
				parts = append(parts, dto.MediaContent{Type: dto.ContentTypeFile, File: map[string]any{
					"file_data": part["file_url"],
					"file_id":   part["file_id"],
				}})
			}
		}
		if len(parts) > 0 {
			return parts
		}
	}
	return content
}

func responsesToolsToChatTools(tools []byte) []dto.ToolCallRequest {
	if len(tools) == 0 {
		return nil
	}
	var rawTools []map[string]any
	if err := common.Unmarshal(tools, &rawTools); err != nil {
		return nil
	}
	chatTools := make([]dto.ToolCallRequest, 0, len(rawTools))
	for _, rawTool := range rawTools {
		if common.Interface2String(rawTool["type"]) != "function" {
			continue
		}
		function, ok := rawTool["function"].(map[string]any)
		if !ok {
			function = rawTool
		}
		chatTools = append(chatTools, dto.ToolCallRequest{
			Type: "function",
			Function: dto.FunctionRequest{
				Name:        common.Interface2String(function["name"]),
				Description: common.Interface2String(function["description"]),
				Parameters:  function["parameters"],
			},
		})
	}
	return chatTools
}

func responsesParallelToolCalls(value []byte) *bool {
	if len(value) == 0 {
		return nil
	}
	var enabled bool
	if err := common.Unmarshal(value, &enabled); err != nil {
		return nil
	}
	return &enabled
}

func ChatCompletionsResponseToResponsesResponse(resp *dto.OpenAITextResponse) (*dto.OpenAIResponsesResponse, *dto.Usage, error) {
	if resp == nil {
		return nil, nil, errors.New("response is nil")
	}
	out := &dto.OpenAIResponsesResponse{
		ID:        resp.Id,
		Object:    "response",
		CreatedAt: int(time.Now().Unix()),
		Model:     resp.Model,
		Usage:     &resp.Usage,
	}
	if created, ok := resp.Created.(float64); ok && created > 0 {
		out.CreatedAt = int(created)
	}
	if created, ok := resp.Created.(int); ok && created > 0 {
		out.CreatedAt = created
	}
	if created, ok := resp.Created.(int64); ok && created > 0 {
		out.CreatedAt = int(created)
	}

	for _, choice := range resp.Choices {
		for _, toolCall := range choice.Message.ParseToolCalls() {
			arguments, _ := common.Marshal(toolCall.Function.Arguments)
			out.Output = append(out.Output, dto.ResponsesOutput{
				Type:      "function_call",
				ID:        toolCall.ID,
				Status:    "completed",
				CallId:    toolCall.ID,
				Name:      toolCall.Function.Name,
				Arguments: arguments,
			})
		}
		content := choice.Message.StringContent()
		if content != "" || len(choice.Message.ToolCalls) == 0 {
			out.Output = append(out.Output, dto.ResponsesOutput{
				Type:   "message",
				Status: "completed",
				Role:   "assistant",
				Content: []dto.ResponsesOutputContent{
					{Type: "output_text", Text: content},
				},
			})
		}
	}
	return out, &resp.Usage, nil
}
