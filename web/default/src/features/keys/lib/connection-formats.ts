/**
 * Connection format types for API key sharing
 */
export type ConnectionFormat = 'generic' | 'opencode' | 'cherrystudio'

export interface ConnectionFormatConfig {
  value: ConnectionFormat
  labelKey: string
  descriptionKey: string
}

export const CONNECTION_FORMATS: ConnectionFormatConfig[] = [
  {
    value: 'generic',
    labelKey: 'Generic',
    descriptionKey: 'Standard URL format with protocol, host, port and path',
  },
  {
    value: 'opencode',
    labelKey: 'OpenCode',
    descriptionKey: 'OpenCode platform connection string format',
  },
  {
    value: 'cherrystudio',
    labelKey: 'CherryStudio',
    descriptionKey: 'CherryStudio IDE connection configuration format',
  },
]

export interface FormatConnectionParams {
  key: string
  serverAddress: string
  format: ConnectionFormat
  models?: string[]
}

/**
 * Format connection info based on selected format
 */
export function formatConnectionInfo(params: FormatConnectionParams): string {
  const { key, serverAddress, format, models } = params

  switch (format) {
    case 'generic':
      return formatGenericConnection(key, serverAddress)
    case 'opencode':
      return formatOpenCodeConnection(key, serverAddress, models)
    case 'cherrystudio':
      return formatCherryStudioConnection(key, serverAddress)
    default:
      return formatGenericConnection(key, serverAddress)
  }
}

/**
 * Generic format: standard URL with key info
 * Example: https://api.example.com/v1/chat/completions?api_key=sk-xxx
 */
function formatGenericConnection(_key: string, serverAddress: string): string {
  const baseUrl =
    serverAddress ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  // Ensure no trailing slash for clean URL construction
  const cleanBase = baseUrl.replace(/\/$/, '')
  return `${cleanBase}/v1/chat/completions`
}

/**
 * OpenCode format: platform-specific connection string
 * Uses a structured JSON with OpenCode metadata
 */
function formatOpenCodeConnection(
  key: string,
  serverAddress: string,
  models?: string[]
): string {
  const baseUrl =
    serverAddress ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  const cleanBase = baseUrl.replace(/\/$/, '')

  const modelsConfig: Record<string, { name: string }> = {}
  if (models && models.length > 0) {
    for (const model of models) {
      modelsConfig[model] = {
        name: `${model}(proxy)`,
      }
    }
  }

  const payload = {
    $schema: 'https://opencode.ai/config.json',
    provider: {
      'new-api': {
        npm: '@ai-sdk/openai',
        name: 'new-api',
        options: {
          baseURL: `${cleanBase}/v1`,
          apiKey: key,
        },
        models: modelsConfig,
      },
    },
  }

  return JSON.stringify(payload, null, 2)
}

/**
 * CherryStudio format: IDE-compatible configuration
 * Uses CherryStudio's expected base64-encoded config structure
 */
function formatCherryStudioConnection(
  key: string,
  serverAddress: string
): string {
  const baseUrl =
    serverAddress ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  const payload = {
    id: 'new-api',
    baseUrl,
    apiKey: key,
  }

  try {
    const jsonStr = JSON.stringify(payload)
    // Use browser btoa if available, otherwise fallback
    let encoded: string
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      encoded = window.btoa(jsonStr)
    } else {
      const bufferCtor = (globalThis as Record<string, unknown>)?.Buffer
      if (
        typeof bufferCtor === 'function' &&
        typeof (bufferCtor as unknown as { from: (data: string, encoding: string) => { toString: (encoding: string) => string } }).from === 'function'
      ) {
        encoded = (bufferCtor as unknown as { from: (data: string, encoding: string) => { toString: (encoding: string) => string } }).from(jsonStr, 'utf-8').toString('base64')
      } else {
        // Fallback: return raw JSON if encoding unavailable
        return jsonStr
      }
    }
    return `cherrystudio://config?data=${encodeURIComponent(encoded)}`
  } catch {
    // Fallback to plain JSON if anything fails
    return JSON.stringify(payload)
  }
}
