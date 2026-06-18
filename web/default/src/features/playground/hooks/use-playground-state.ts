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
import { DEFAULT_CONFIG, DEFAULT_PARAMETER_ENABLED } from '../constants'
import {
  loadConfig,
  saveConfig,
  loadParameterEnabled,
  saveParameterEnabled,
  createSession,
  getSessionTitle,
  loadActiveSessionId,
  loadSessions,
  saveActiveSessionId,
  saveSessions,
} from '../lib'
import type {
  Message,
  PlaygroundConfig,
  ParameterEnabled,
  ModelOption,
  GroupOption,
  PlaygroundSession,
} from '../types'

/**
 * Main state management hook for playground
 */
export function usePlaygroundState() {
  // Load initial state from localStorage
  const [config, setConfig] = useState<PlaygroundConfig>(() => {
    const savedConfig = loadConfig()
    return { ...DEFAULT_CONFIG, ...savedConfig }
  })

  const [parameterEnabled, setParameterEnabled] = useState<ParameterEnabled>(
    () => {
      const saved = loadParameterEnabled()
      return { ...DEFAULT_PARAMETER_ENABLED, ...saved }
    }
  )

  const [sessions, setSessions] = useState<PlaygroundSession[]>(() => {
    return loadSessions()
  })

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const savedSessionId = loadActiveSessionId()
    const existingSession = sessions.find((session) => session.id === savedSessionId)
    return existingSession?.id || sessions[0].id
  })

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) || sessions[0]
  const messages = activeSession?.messages || []

  const [models, setModels] = useState<ModelOption[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])

  // Update config with automatic save
  const updateConfig = useCallback(
    <K extends keyof PlaygroundConfig>(key: K, value: PlaygroundConfig[K]) => {
      setConfig((prev) => {
        const updated = { ...prev, [key]: value }
        saveConfig(updated)
        return updated
      })
    },
    []
  )

  // Update parameter enabled with automatic save
  const updateParameterEnabled = useCallback(
    (key: keyof ParameterEnabled, value: boolean) => {
      setParameterEnabled((prev) => {
        const updated = { ...prev, [key]: value }
        saveParameterEnabled(updated)
        return updated
      })
    },
    []
  )

  // Update messages with automatic save
  const updateMessages = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setSessions((prev) => {
        const updated = prev.map((session) => {
          if (session.id !== activeSessionId) return session

          const newMessages =
            typeof updater === 'function' ? updater(session.messages) : updater
          return {
            ...session,
            title: getSessionTitle(newMessages),
            messages: newMessages,
            updatedAt: Date.now(),
          }
        })
        saveSessions(updated)
        return updated
      })
    },
    [activeSessionId]
  )

  // Clear all messages
  const clearMessages = useCallback(() => {
    updateMessages([])
  }, [updateMessages])

  const createNewSession = useCallback((messages: Message[] = []) => {
    const session = createSession(messages)
    setSessions((prev) => {
      const updated = [session, ...prev]
      saveSessions(updated)
      return updated
    })
    setActiveSessionId(session.id)
    saveActiveSessionId(session.id)
  }, [])

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
    saveActiveSessionId(sessionId)
  }, [])

  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const remaining = prev.filter((session) => session.id !== sessionId)
        const updated = remaining.length > 0 ? remaining : [createSession()]
        const nextActiveSessionId =
          activeSessionId === sessionId ? updated[0].id : activeSessionId

        setActiveSessionId(nextActiveSessionId)
        saveActiveSessionId(nextActiveSessionId)
        saveSessions(updated)
        return updated
      })
    },
    [activeSessionId]
  )

  // Reset config to defaults
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setParameterEnabled(DEFAULT_PARAMETER_ENABLED)
    saveConfig(DEFAULT_CONFIG)
    saveParameterEnabled(DEFAULT_PARAMETER_ENABLED)
  }, [])

  return {
    // State
    config,
    parameterEnabled,
    sessions,
    activeSessionId,
    messages,
    models,
    groups,

    // Setters
    setModels,
    setGroups,

    // Actions
    updateConfig,
    updateParameterEnabled,
    updateMessages,
    clearMessages,
    createNewSession,
    switchSession,
    deleteSession,
    resetConfig,
  }
}
