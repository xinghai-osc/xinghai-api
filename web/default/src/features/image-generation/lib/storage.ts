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
import type { ImageGenerationConfig, ImageGenerationSession } from '../types'
import { STORAGE_KEYS, DEFAULT_CONFIG, MAX_SESSIONS } from '../constants'

export function loadConfig(): Partial<ImageGenerationConfig> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load image generation config:', error)
  }
  return {}
}

export function saveConfig(config: Partial<ImageGenerationConfig>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save image generation config:', error)
  }
}

export function loadSessions(): ImageGenerationSession[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load image generation sessions:', error)
  }
  return []
}

export function saveSessions(sessions: ImageGenerationSession[]): void {
  try {
    // Keep only the most recent sessions
    const trimmed = sessions.slice(0, MAX_SESSIONS)
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(trimmed))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save image generation sessions:', error)
  }
}

export function loadCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION)
  } catch {
    return null
  }
}

export function saveCurrentSessionId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, id)
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION)
    }
  } catch {
    /* empty */
  }
}

export function createNewSession(
  model: string = DEFAULT_CONFIG.model,
  group: string = DEFAULT_CONFIG.group
): ImageGenerationSession {
  return {
    id: `session-${Date.now()}-${crypto.randomUUID()}`,
    title: '',
    model,
    group,
    turns: [],
    contextImages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
