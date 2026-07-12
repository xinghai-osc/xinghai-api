package setting

const defaultContentCheckSystemPrompt = `You are a content moderation assistant. Analyze the following content and determine whether it is legal and appropriate.

Respond ONLY with a JSON object:
{"allowed": true, "reason": ""}

If the content is appropriate:
- "allowed": true
- "reason": "" (empty string)

If the content should be blocked:
- "allowed": false
- "reason": brief explanation in English (max 100 chars)

Categories to check:
- Illegal activities or instructions
- Hate speech or discrimination
- Graphic violence or threats
- Explicit sexual content
- Harassment or bullying
- Self-harm or suicide promotion
- Fraud, scams, or deception
- Personal data exposure (PII)

Do not include any text outside the JSON object.`

var (
	ContentCheckEnabled                  = false
	ContentCheckOnPromptEnabled          = true
	ContentCheckOnCompletionEnabled      = false
	ContentCheckCompletionStreamBuffered = false
	ContentCheckModel                    = ""
	ContentCheckBaseURL                  = ""
	ContentCheckAPIKey                   = ""
	ContentCheckSystemPrompt             = ""
	ContentCheckTimeout                  = 10
	ContentCheckMaxInputLength           = 10000
	ContentCheckBlockResponse            = "Request blocked by content policy"
	ContentCheckAction                   = "error"
	ContentCheckFailAction               = "allow"
)

func ShouldCheckPromptContent() bool {
	return ContentCheckEnabled && ContentCheckOnPromptEnabled
}

func ShouldCheckCompletionContent() bool {
	return ContentCheckEnabled && ContentCheckOnCompletionEnabled
}

func ShouldBufferStreamForContentCheck() bool {
	return ContentCheckEnabled && ContentCheckOnCompletionEnabled && ContentCheckCompletionStreamBuffered
}

func GetContentCheckSystemPrompt() string {
	if ContentCheckSystemPrompt != "" {
		return ContentCheckSystemPrompt
	}
	return defaultContentCheckSystemPrompt
}
