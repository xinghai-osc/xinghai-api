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
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PanelLeftIcon } from 'lucide-react'
import {
  generateImage,
  getUserGroups,
  getUserModels,
  type UserGroupsResult,
} from './api'
import { FALLBACK_MODEL } from './constants'
import { useImageGenerationState } from './hooks'
import { ImageConversation } from './components/image-conversation'
import { ImageInput } from './components/image-input'
import { ImageHistoryPanel } from './components/image-history-panel'
import type { ImageData, ImageMessageItem } from './types'

function getImageSource(image: ImageData, outputFormat: string) {
  if (image.url) return image.url
  if (image.b64_json) return `data:image/${outputFormat};base64,${image.b64_json}`
  return ''
}

export function ImageGeneration() {
  const { t } = useTranslation()
  const [isGenerating, setIsGenerating] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const state = useImageGenerationState()

  // Load models
  const { data: modelsData, isLoading: isLoadingModels } = useQuery({
    queryKey: ['image-generation-models', t],
    queryFn: async () => {
      try {
        return await getUserModels()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t('Failed to load models')
        )
        return []
      }
    },
  })

  // Load groups
  const { data: groupsData } = useQuery({
    queryKey: ['image-generation-groups', t],
    queryFn: async () => {
      try {
        return await getUserGroups()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t('Failed to load groups')
        )
        return { groups: [], userGroup: '' } satisfies UserGroupsResult
      }
    },
  })

  // Update models when data changes
  useEffect(() => {
    if (!modelsData) return
    state.setModels(modelsData)

    const isCurrentModelValid = modelsData.some(
      (m) => m.value === state.config.model
    )
    if (modelsData.length > 0 && !isCurrentModelValid) {
      state.updateConfig('model', modelsData[0].value)
    }
  }, [modelsData, state.config.model, state.setModels, state.updateConfig, state])

  // Update groups when data changes
  useEffect(() => {
    if (!groupsData) return

    const groupOptions = groupsData.groups
    state.setGroups(groupOptions)

    const hasCurrentGroup = groupOptions.some(
      (g) => g.value === state.config.group
    )
    if (!hasCurrentGroup && groupOptions.length > 0) {
      const fallback =
        groupOptions.find((g) => g.value === 'default')?.value ??
        groupOptions[0].value
      state.updateConfig('group', fallback)
    }
  }, [groupsData, state.config.group, state.setGroups, state.updateConfig, state])

  // Model options with fallback
  const modelOptions = useMemo(() => {
    if (state.models.some((model) => model.value === FALLBACK_MODEL)) {
      return state.models
    }
    return [{ label: FALLBACK_MODEL, value: FALLBACK_MODEL }, ...state.models]
  }, [state.models])

  const handleGenerate = async (prompt: string) => {
    const session = state.ensureSession()
    const requestContextImages = session.contextImages

    setIsGenerating(true)
    try {
      const response = await generateImage({
        model: state.selectedModel,
        group: state.config.group,
        prompt,
        n: state.config.n,
        size: state.config.size,
        quality: state.config.quality,
        background: state.config.background,
        output_format: state.config.outputFormat,
        response_format: 'b64_json',
        images:
          requestContextImages.length > 0
            ? requestContextImages.map((image) => image.source)
            : undefined,
      })

      const generatedImages = [] as ImageMessageItem[]
      ;(response.data ?? []).forEach((image, index) => {
        const source = getImageSource(image, state.config.outputFormat)
        if (!source) return
        generatedImages.push({
          id: `generated-${Date.now()}-${index}-${crypto.randomUUID()}`,
          name: `${t('Generated image')} ${index + 1}`,
          source,
          revisedPrompt: image.revised_prompt,
        })
      })

      if (generatedImages.length === 0) {
        toast.error(t('Generated image is unavailable'))
        return
      }

      // Add turn and update context images
      const turn = {
        id: `turn-${Date.now()}-${crypto.randomUUID()}`,
        prompt,
        images: generatedImages,
        contextCount: requestContextImages.length,
        model: state.selectedModel,
        group: state.config.group,
        size: state.config.size,
        quality: state.config.quality,
        createdAt: Date.now(),
      }

      const newContextImages = [...requestContextImages, ...generatedImages]
      state.addTurn(turn, newContextImages)

      toast.success(
        requestContextImages.length > 0
          ? t('Image edited successfully')
          : t('Image generated successfully')
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('Image generation failed')
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNewSession = () => {
    state.newSession()
  }

  const currentSession = state.currentSession
  const turns = currentSession?.turns ?? []
  const contextImages = currentSession?.contextImages ?? []

  return (
    <div className='relative flex size-full overflow-hidden'>
      {/* History panel - toggleable */}
      {showHistory && (
        <ImageHistoryPanel
          className='w-64 flex-shrink-0'
          sessions={state.sessions}
          currentSessionId={state.currentSessionId}
          onSwitchSession={state.switchSession}
          onNewSession={handleNewSession}
          onDeleteSession={state.deleteSession}
        />
      )}

      {/* Main content */}
      <div className='relative flex min-w-0 flex-1 flex-col overflow-hidden'>
        {/* Toggle history button */}
        <div className='absolute top-3 left-3 z-10'>
          <button
            className='text-muted-foreground hover:text-foreground rounded-md p-1.5 transition-colors hover:bg-accent'
            onClick={() => setShowHistory(!showHistory)}
            type='button'
          >
            <PanelLeftIcon className='size-4' />
          </button>
        </div>

        {/* Conversation area */}
        <div className='flex flex-1 flex-col overflow-hidden'>
          <ImageConversation
            turns={turns}
            isGenerating={isGenerating}
            onRemoveImage={state.removeImage}
          />
        </div>

        {/* Input area */}
        <div className='mx-auto w-full max-w-4xl'>
          <ImageInput
            config={state.config}
            onConfigChange={state.updateConfig}
            models={modelOptions}
            groups={state.groups}
            isModelLoading={isLoadingModels}
            isGenerating={isGenerating}
            contextImages={contextImages}
            onContextImagesChange={state.updateContextImages}
            onSubmit={handleGenerate}
            onNewSession={handleNewSession}
          />
        </div>
      </div>
    </div>
  )
}
