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
import { useState, useCallback } from 'react'
import { DEFAULT_CONFIG, FALLBACK_MODEL } from '../constants'
import {
  loadConfig,
  saveConfig,
  loadSessions,
  saveSessions,
  loadCurrentSessionId,
  saveCurrentSessionId,
  createNewSession,
} from '../lib'
import type {
  ImageGenerationConfig,
  ImageGenerationSession,
  ImageConversationTurn,
  ImageContextItem,
  ModelOption,
  GroupOption,
} from '../types'

export function useImageGenerationState() {
  const [config, setConfig] = useState<ImageGenerationConfig>(() => {
    const saved = loadConfig()
    return { ...DEFAULT_CONFIG, ...saved }
  })

  const [sessions, setSessions] = useState<ImageGenerationSession[]>(() =>
    loadSessions()
  )

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    () => loadCurrentSessionId()
  )

  const [models, setModels] = useState<ModelOption[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])

  // Get current session
  const currentSession = sessions.find((s) => s.id === currentSessionId) ?? null

  const updateConfig = useCallback(
    <K extends keyof ImageGenerationConfig>(
      key: K,
      value: ImageGenerationConfig[K]
    ) => {
      setConfig((prev) => {
        const updated = { ...prev, [key]: value }
        saveConfig(updated)
        return updated
      })
    },
    []
  )

  // Switch to a session
  const switchSession = useCallback(
    (sessionId: string) => {
      setCurrentSessionId(sessionId)
      saveCurrentSessionId(sessionId)
      // Load config from session
      const session = sessions.find((s) => s.id === sessionId)
      if (session) {
        setConfig((prev) => {
          const updated = { ...prev, model: session.model, group: session.group }
          saveConfig(updated)
          return updated
        })
      }
    },
    [sessions]
  )

  // Create a new session
  const newSession = useCallback(() => {
    const session = createNewSession(config.model, config.group)
    setSessions((prev) => {
      const updated = [session, ...prev]
      saveSessions(updated)
      return updated
    })
    setCurrentSessionId(session.id)
    saveCurrentSessionId(session.id)
    return session
  }, [config.model, config.group])

  // Ensure a session exists
  const ensureSession = useCallback(() => {
    if (currentSession) return currentSession
    const session = createNewSession(config.model, config.group)
    setSessions((prev) => {
      const updated = [session, ...prev]
      saveSessions(updated)
      return updated
    })
    setCurrentSessionId(session.id)
    saveCurrentSessionId(session.id)
    return session
  }, [currentSession, config.model, config.group])

  // Add a turn to the current session
  const addTurn = useCallback(
    (turn: ImageConversationTurn, newContextImages: ImageContextItem[]) => {
      setSessions((prev) => {
        const sessionId = currentSessionId
        if (!sessionId) return prev

        const updated = prev.map((s) => {
          if (s.id !== sessionId) return s
          const title = s.title || turn.prompt.slice(0, 50)
          return {
            ...s,
            title,
            turns: [...s.turns, turn],
            contextImages: newContextImages,
            model: config.model,
            group: config.group,
            updatedAt: Date.now(),
          }
        })
        saveSessions(updated)
        return updated
      })
    },
    [currentSessionId, config.model, config.group]
  )

  // Update context images for current session
  const updateContextImages = useCallback(
    (updater: ImageContextItem[] | ((prev: ImageContextItem[]) => ImageContextItem[])) => {
      setSessions((prev) => {
        const sessionId = currentSessionId
        if (!sessionId) return prev

        const updated = prev.map((s) => {
          if (s.id !== sessionId) return s
          const newContextImages =
            typeof updater === 'function' ? updater(s.contextImages) : updater
          return { ...s, contextImages: newContextImages, updatedAt: Date.now() }
        })
        saveSessions(updated)
        return updated
      })
    },
    [currentSessionId]
  )

  // Remove a generated image from current session
  const removeImage = useCallback(
    (imageId: string) => {
      setSessions((prev) => {
        const sessionId = currentSessionId
        if (!sessionId) return prev

        const updated = prev.map((s) => {
          if (s.id !== sessionId) return s
          return {
            ...s,
            contextImages: s.contextImages.filter((img) => img.id !== imageId),
            turns: s.turns.map((turn) => ({
              ...turn,
              images: turn.images.filter((img) => img.id !== imageId),
            })),
            updatedAt: Date.now(),
          }
        })
        saveSessions(updated)
        return updated
      })
    },
    [currentSessionId]
  )

  // Delete a session
  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== sessionId)
        saveSessions(updated)
        return updated
      })
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null)
        saveCurrentSessionId(null)
      }
    },
    [currentSessionId]
  )

  // Get selected model with fallback
  const selectedModel = config.model || FALLBACK_MODEL

  return {
    // Config
    config,
    updateConfig,
    selectedModel,

    // Models & Groups
    models,
    groups,
    setModels,
    setGroups,

    // Sessions
    sessions,
    currentSession,
    currentSessionId,
    switchSession,
    newSession,
    ensureSession,
    deleteSession,

    // Turn management
    addTurn,
    updateContextImages,
    removeImage,
  }
}
