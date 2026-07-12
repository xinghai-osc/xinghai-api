package service

import (
	"testing"

	"github.com/QuantumNous/new-api/dto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseContentCheckResult(t *testing.T) {
	tests := []struct {
		name        string
		input       string
		wantAllowed bool
		wantReason  string
		wantErr     bool
	}{
		{
			name:        "allowed with empty reason",
			input:       `{"allowed": true, "reason": ""}`,
			wantAllowed: true,
			wantReason:  "",
		},
		{
			name:        "blocked with reason",
			input:       `{"allowed": false, "reason": "contains hate speech"}`,
			wantAllowed: false,
			wantReason:  "contains hate speech",
		},
		{
			name:        "allowed without reason field",
			input:       `{"allowed": true}`,
			wantAllowed: true,
			wantReason:  "",
		},
		{
			name:    "invalid JSON",
			input:   `not json`,
			wantErr: true,
		},
		{
			name:        "empty object",
			input:       `{}`,
			wantAllowed: false,
			wantReason:  "",
		},
		{
			name:        "blocked with Chinese reason",
			input:       `{"allowed": false, "reason": "包含暴力内容"}`,
			wantAllowed: false,
			wantReason:  "包含暴力内容",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := parseContentCheckResult(tt.input)
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.wantAllowed, result.Allowed)
			assert.Equal(t, tt.wantReason, result.Reason)
		})
	}
}

func TestInterpretContentCheckText(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{"explicit allowed", `{"allowed": true, "reason": ""}`, true},
		{"explicit blocked", `{"allowed": false, "reason": "bad"}`, false},
		{"block keyword", "this content should be block", false},
		{"blocked keyword", "content is blocked", false},
		{"not allowed phrase", "this is not allowed", false},
		{"violation keyword", "policy violation detected", false},
		{"inappropriate keyword", "content is inappropriate", false},
		{"clean text", "this content is perfectly fine", true},
		{"empty text", "", true},
		{"allowed text", "content is allowed", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := interpretContentCheckText(tt.input)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestExtractResponseText(t *testing.T) {
	tests := []struct {
		name     string
		response *dto.OpenAITextResponse
		want     string
	}{
		{
			name:     "nil response",
			response: nil,
			want:     "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ExtractResponseText(tt.response)
			assert.Equal(t, tt.want, got)
		})
	}
}
