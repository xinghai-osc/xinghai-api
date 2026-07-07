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
import { useRef, useState } from 'react'
import {
  Loader2Icon,
  PlusIcon,
  SendIcon,
  Settings2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import { ModelGroupSelector } from '@/components/model-group-selector'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  SIZE_OPTIONS,
  QUALITY_OPTIONS,
  BACKGROUND_OPTIONS,
  OUTPUT_FORMAT_OPTIONS,
} from '../constants'
import type { ImageGenerationConfig, ImageContextItem, ModelOption, GroupOption } from '../types'

interface ImageInputProps {
  config: ImageGenerationConfig
  onConfigChange: <K extends keyof ImageGenerationConfig>(
    key: K,
    value: ImageGenerationConfig[K]
  ) => void
  models: ModelOption[]
  groups: GroupOption[]
  isModelLoading?: boolean
  isGenerating: boolean
  contextImages: ImageContextItem[]
  onContextImagesChange: (
    updater: ImageContextItem[] | ((prev: ImageContextItem[]) => ImageContextItem[])
  ) => void
  onSubmit: (prompt: string) => void
  onNewSession: () => void
  disabled?: boolean
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Failed to read image file'))
    }
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

export function ImageInput({
  config,
  onConfigChange,
  models,
  groups,
  isModelLoading = false,
  isGenerating,
  contextImages,
  onContextImagesChange,
  onSubmit,
  onNewSession,
  disabled,
}: ImageInputProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [prompt, setPrompt] = useState('')

  const isModelSelectDisabled =
    disabled || isModelLoading || models.length === 0
  const isGroupSelectDisabled = disabled || groups.length === 0

  const handleContextUpload = async (files: FileList | null) => {
    if (!files?.length) return

    const imageFiles = [...files].filter((file) =>
      file.type.startsWith('image/')
    )
    if (imageFiles.length === 0) {
      return
    }

    try {
      const uploadedImages = await Promise.all(
        imageFiles.map(async (file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
          name: file.name,
          source: await fileToDataUrl(file),
        }))
      )
      onContextImagesChange((prev) => [...prev, ...uploadedImages])
    } catch {
      // Error handled silently
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className='grid shrink-0 gap-3 px-1 md:pb-4'>
      {/* Context images bar */}
      {contextImages.length > 0 && (
        <div className='flex items-center gap-2 overflow-x-auto rounded-lg border bg-background p-2'>
          {contextImages.map((image) => (
            <div
              key={image.id}
              className='group relative flex-shrink-0'
            >
              <img
                alt={image.name}
                className='size-12 rounded-md object-cover'
                src={image.source}
              />
              <button
                className='absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100'
                onClick={() =>
                  onContextImagesChange((prev) =>
                    prev.filter((img) => img.id !== image.id)
                  )
                }
                type='button'
              >
                <XIcon className='size-3' />
              </button>
            </div>
          ))}
          <Button
            size='sm'
            variant='ghost'
            className='flex-shrink-0 text-xs'
            onClick={() => onContextImagesChange([])}
          >
            {t('Clear')}
          </Button>
        </div>
      )}

      <PromptInput
        groupClassName='rounded-xl'
        onSubmit={({ text }) => {
          if (text?.trim()) {
            onSubmit(text.trim())
            setPrompt('')
          }
        }}
      >
        <PromptInputTextarea
          autoComplete='off'
          autoCorrect='off'
          autoCapitalize='off'
          spellCheck={false}
          className='px-5 md:text-base'
          disabled={disabled || isGenerating}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={
            contextImages.length > 0
              ? t('Describe how you want to modify the image')
              : t('Describe the image you want to generate')
          }
          value={prompt}
        />

        <PromptInputFooter className='p-2.5'>
          <PromptInputTools>
            <input
              ref={fileInputRef}
              accept='image/*'
              className='hidden'
              disabled={isGenerating}
              multiple
              onChange={(event) => handleContextUpload(event.target.files)}
              type='file'
            />
            <PromptInputButton
              className='border font-medium'
              disabled={isGenerating}
              onClick={() => fileInputRef.current?.click()}
              type='button'
              variant='outline'
            >
              <UploadIcon size={16} />
              <span className='hidden sm:inline'>{t('Upload images')}</span>
            </PromptInputButton>

            <ImageSettingsPopover
              config={config}
              onConfigChange={onConfigChange}
              disabled={isGenerating}
            />

            <PromptInputButton
              className='border font-medium'
              disabled={isGenerating}
              onClick={onNewSession}
              type='button'
              variant='outline'
            >
              <PlusIcon size={16} />
              <span className='hidden sm:inline'>{t('New session')}</span>
            </PromptInputButton>
          </PromptInputTools>

          <div className='flex items-center gap-1.5 md:gap-2'>
            <ModelGroupSelector
              selectedModel={config.model}
              models={models}
              onModelChange={(value) => onConfigChange('model', value)}
              selectedGroup={config.group}
              groups={groups}
              onGroupChange={(value) => onConfigChange('group', value)}
              disabled={isModelSelectDisabled || isGroupSelectDisabled}
            />

            {isGenerating ? (
              <PromptInputButton
                className='text-foreground font-medium'
                variant='secondary'
                disabled
              >
                <Loader2Icon className='animate-spin' size={16} />
                <span className='hidden sm:inline'>{t('Generating')}</span>
              </PromptInputButton>
            ) : (
              <PromptInputButton
                className='text-foreground font-medium'
                disabled={disabled || !prompt.trim()}
                type='submit'
                variant='secondary'
              >
                <SendIcon size={16} />
                <span className='hidden sm:inline'>{t('Generate')}</span>
              </PromptInputButton>
            )}
          </div>
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}

// Settings popover for advanced image generation options
function ImageSettingsPopover({
  config,
  onConfigChange,
  disabled,
}: {
  config: ImageGenerationConfig
  onConfigChange: <K extends keyof ImageGenerationConfig>(
    key: K,
    value: ImageGenerationConfig[K]
  ) => void
  disabled: boolean
}) {
  const { t } = useTranslation()

  return (
    <Popover>
      <PopoverTrigger
        render={
          <PromptInputButton
            className='border font-medium'
            disabled={disabled}
            type='button'
            variant='outline'
          >
            <Settings2Icon size={16} />
            <span className='hidden sm:inline'>{t('Settings')}</span>
          </PromptInputButton>
        }
      />
      <PopoverContent
        className='w-80 rounded-lg border p-4'
        align='start'
        side='top'
        sideOffset={8}
      >
        <div className='grid gap-3'>
          <div className='grid gap-2'>
            <label className='text-sm font-medium' htmlFor='img-size'>
              {t('Size')}
            </label>
            <NativeSelect
              id='img-size'
              className='w-full'
              disabled={disabled}
              onChange={(event) => onConfigChange('size', event.target.value)}
              value={config.size}
            >
              {SIZE_OPTIONS.map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {option}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className='grid gap-2'>
            <label className='text-sm font-medium' htmlFor='img-quality'>
              {t('Quality')}
            </label>
            <NativeSelect
              id='img-quality'
              className='w-full'
              disabled={disabled}
              onChange={(event) => onConfigChange('quality', event.target.value)}
              value={config.quality}
            >
              {QUALITY_OPTIONS.map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {option}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className='grid gap-2'>
            <label className='text-sm font-medium' htmlFor='img-background'>
              {t('Background')}
            </label>
            <NativeSelect
              id='img-background'
              className='w-full'
              disabled={disabled}
              onChange={(event) => onConfigChange('background', event.target.value)}
              value={config.background}
            >
              {BACKGROUND_OPTIONS.map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {option}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className='grid gap-2'>
            <label className='text-sm font-medium' htmlFor='img-format'>
              {t('Output format')}
            </label>
            <NativeSelect
              id='img-format'
              className='w-full'
              disabled={disabled}
              onChange={(event) => onConfigChange('outputFormat', event.target.value)}
              value={config.outputFormat}
            >
              {OUTPUT_FORMAT_OPTIONS.map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {option}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className='grid gap-2'>
            <label className='text-sm font-medium' htmlFor='img-count'>
              {t('Count')}
            </label>
            <Input
              id='img-count'
              disabled={disabled}
              max={4}
              min={1}
              onChange={(event) =>
                onConfigChange('n', Number(event.target.value) || 1)
              }
              type='number'
              value={config.n}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
