/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { nanoid } from 'nanoid'
import { STORAGE_KEYS } from '../constants'
import type {
  PlaygroundConfig,
  ParameterEnabled,
  Message,
  PlaygroundSession,
} from '../types'
import { sanitizeMessagesOnLoad } from './message-utils'

/**
 * Load playground config from localStorage
 */
export function loadConfig(): Partial<PlaygroundConfig> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load config:', error)
  }
  return {}
}

/**
 * Save playground config to localStorage
 */
export function saveConfig(config: Partial<PlaygroundConfig>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save config:', error)
  }
}

/**
 * Load parameter enabled state from localStorage
 */
export function loadParameterEnabled(): Partial<ParameterEnabled> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PARAMETER_ENABLED)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load parameter enabled:', error)
  }
  return {}
}

/**
 * Save parameter enabled state to localStorage
 */
export function saveParameterEnabled(
  parameterEnabled: Partial<ParameterEnabled>
): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.PARAMETER_ENABLED,
      JSON.stringify(parameterEnabled)
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save parameter enabled:', error)
  }
}

/**
 * Load messages from localStorage
 */
export function loadMessages(): Message[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES)
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (!Array.isArray(parsed)) {
        return null
      }
      const sanitized = sanitizeMessagesOnLoad(parsed as Message[])
      // Persist sanitized result to avoid re-sanitizing on subsequent loads
      if (sanitized !== parsed) {
        saveMessages(sanitized)
      }
      return sanitized
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load messages:', error)
  }
  return null
}

/**
 * Save messages to localStorage
 */
export function saveMessages(messages: Message[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save messages:', error)
  }
}

export function createSession(messages: Message[] = []): PlaygroundSession {
  const now = Date.now()
  return {
    id: nanoid(),
    title: getSessionTitle(messages),
    messages,
    createdAt: now,
    updatedAt: now,
  }
}

export function getSessionTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((message) => message.from === 'user')
  const content = firstUserMessage?.versions[0]?.content.trim()

  if (!content) {
    return 'New conversation'
  }

  return content.length > 32 ? `${content.slice(0, 32)}...` : content
}

export function loadSessions(): PlaygroundSession[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS)
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        return parsed.map((session) => {
          const current = session as PlaygroundSession
          const messages = sanitizeMessagesOnLoad(current.messages || [])
          return {
            ...current,
            title: current.title || getSessionTitle(messages),
            messages,
            createdAt: current.createdAt || Date.now(),
            updatedAt: current.updatedAt || Date.now(),
          }
        })
      }
    }

    const legacyMessages = loadMessages()
    if (legacyMessages?.length) {
      const session = createSession(legacyMessages)
      saveSessions([session])
      saveActiveSessionId(session.id)
      return [session]
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load sessions:', error)
  }

  const session = createSession()
  saveSessions([session])
  saveActiveSessionId(session.id)
  return [session]
}

export function saveSessions(sessions: PlaygroundSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save sessions:', error)
  }
}

export function loadActiveSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load active session:', error)
  }
  return null
}

export function saveActiveSessionId(sessionId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, sessionId)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save active session:', error)
  }
}

/**
 * Clear all playground data
 */
export function clearPlaygroundData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONFIG)
    localStorage.removeItem(STORAGE_KEYS.PARAMETER_ENABLED)
    localStorage.removeItem(STORAGE_KEYS.MESSAGES)
    localStorage.removeItem(STORAGE_KEYS.SESSIONS)
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to clear playground data:', error)
  }
}
