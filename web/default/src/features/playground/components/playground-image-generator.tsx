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
import { useMemo, useRef, useState } from 'react'
import {
  ImageIcon,
  Loader2Icon,
  SendIcon,
  Settings2Icon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { generateImage } from '../api'
import type { GroupOption, ImageData, ModelOption } from '../types'

interface PlaygroundImageGeneratorProps {
  models: ModelOption[]
  groups: GroupOption[]
  modelValue: string
  groupValue: string
  onModelChange: (value: string) => void
  onGroupChange: (value: string) => void
  isModelLoading?: boolean
  onStop?: () => void
  onSubmit?: (text: string) => void
  hasMessages?: boolean
}

interface ImageContextItem {
  id: string
  name: string
  source: string
}

interface ImageMessageItem {
  id: string
  name: string
  source: string
  revisedPrompt?: string
}

interface ImageConversationTurn {
  id: string
  prompt: string
  images: ImageMessageItem[]
  contextCount: number
}

const fallbackModel = 'gpt-image-2'

const sizeOptions = ['auto', '1024x1024', '1536x1024', '1024x1536']
const qualityOptions = ['auto', 'low', 'medium', 'high']
const backgroundOptions = ['auto', 'transparent', 'opaque']
const outputFormatOptions = ['png', 'jpeg', 'webp']

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

function getImageSource(image: ImageData, outputFormat: string) {
  if (image.url) return image.url
  if (image.b64_json) return `data:image/${outputFormat};base64,${image.b64_json}`
  return ''
}

export function PlaygroundImageGenerator({
  models,
  groups,
  modelValue,
  groupValue,
  onModelChange,
  onGroupChange,
  isModelLoading = false,
}: PlaygroundImageGeneratorProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [prompt, setPrompt] = useState('')
  const [size, setSize] = useState('1024x1024')
  const [quality, setQuality] = useState('auto')
  const [background, setBackground] = useState('auto')
  const [outputFormat, setOutputFormat] = useState('png')
  const [n, setN] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [conversation, setConversation] = useState<ImageConversationTurn[]>([])
  const [contextImages, setContextImages] = useState<ImageContextItem[]>([])

  const selectedModel = modelValue || fallbackModel
  const modelOptions = useMemo(() => {
    if (models.some((model) => model.value === fallbackModel)) return models
    return [{ label: fallbackModel, value: fallbackModel }, ...models]
  }, [models])

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      toast.error(t('Prompt is required'))
      return
    }

    const requestContextImages = contextImages
    setIsGenerating(true)
    try {
      const response = await generateImage({
        model: selectedModel,
        group: groupValue,
        prompt: trimmedPrompt,
        n,
        size,
        quality,
        background,
        output_format: outputFormat,
        response_format: 'b64_json',
        images:
          requestContextImages.length > 0
            ? requestContextImages.map((image) => image.source)
            : undefined,
      })

      const generatedImages = [] as ImageMessageItem[]
      ;(response.data ?? []).forEach((image, index) => {
        const source = getImageSource(image, outputFormat)
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

      setContextImages((current) => [...current, ...generatedImages])
      setConversation((current) => [
        ...current,
        {
          id: `turn-${Date.now()}-${crypto.randomUUID()}`,
          prompt: trimmedPrompt,
          images: generatedImages,
          contextCount: requestContextImages.length,
        },
      ])
      setPrompt('')
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

  const handleContextUpload = async (files: FileList | null) => {
    if (!files?.length) return

    const imageFiles = [...files].filter((file) =>
      file.type.startsWith('image/')
    )
    if (imageFiles.length === 0) {
      toast.error(t('Please upload image files'))
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
      setContextImages((current) => [...current, ...uploadedImages])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('Failed to read image file')
      toast.error(message)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeContextImage = (id: string) => {
    setContextImages((current) => current.filter((image) => image.id !== id))
  }

  const removeGeneratedImage = (id: string) => {
    setContextImages((current) => current.filter((image) => image.id !== id))
    setConversation((current) =>
      current.map((turn) => ({
        ...turn,
        images: turn.images.filter((image) => image.id !== id),
      }))
    )
  }

  return (
    <div className='mx-auto flex size-full max-w-6xl flex-col overflow-hidden p-4 md:p-6'>
      <Card className='mb-4 shrink-0'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2'>
            <Settings2Icon className='size-5' />
            {t('Image generation settings')}
          </CardTitle>
          <CardDescription>
            {t('Generated images are automatically added to image context.')}
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='image-model'>
                {t('Model')}
              </label>
              <NativeSelect
                id='image-model'
                className='w-full'
                disabled={isGenerating || isModelLoading}
                onChange={(event) => onModelChange(event.target.value)}
                value={selectedModel}
              >
                {modelOptions.map((model) => (
                  <NativeSelectOption key={model.value} value={model.value}>
                    {model.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='image-group'>
                {t('Group')}
              </label>
              <NativeSelect
                id='image-group'
                className='w-full'
                disabled={isGenerating || groups.length === 0}
                onChange={(event) => onGroupChange(event.target.value)}
                value={groupValue}
              >
                {groups.map((group) => (
                  <NativeSelectOption key={group.value} value={group.value}>
                    {group.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='image-size'>
                {t('Size')}
              </label>
              <NativeSelect
                id='image-size'
                className='w-full'
                disabled={isGenerating}
                onChange={(event) => setSize(event.target.value)}
                value={size}
              >
                {sizeOptions.map((option) => (
                  <NativeSelectOption key={option} value={option}>
                    {option}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='image-quality'>
                {t('Quality')}
              </label>
              <NativeSelect
                id='image-quality'
                className='w-full'
                disabled={isGenerating}
                onChange={(event) => setQuality(event.target.value)}
                value={quality}
              >
                {qualityOptions.map((option) => (
                  <NativeSelectOption key={option} value={option}>
                    {option}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='image-background'>
                {t('Background')}
              </label>
              <NativeSelect
                id='image-background'
                className='w-full'
                disabled={isGenerating}
                onChange={(event) => setBackground(event.target.value)}
                value={background}
              >
                {backgroundOptions.map((option) => (
                  <NativeSelectOption key={option} value={option}>
                    {option}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='image-format'>
                {t('Output format')}
              </label>
              <NativeSelect
                id='image-format'
                className='w-full'
                disabled={isGenerating}
                onChange={(event) => setOutputFormat(event.target.value)}
                value={outputFormat}
              >
                {outputFormatOptions.map((option) => (
                  <NativeSelectOption key={option} value={option}>
                    {option}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='image-count'>
                {t('Count')}
              </label>
              <Input
                id='image-count'
                disabled={isGenerating}
                max={4}
                min={1}
                onChange={(event) => setN(Number(event.target.value) || 1)}
                type='number'
                value={n}
              />
            </div>
          </div>

          <div className='grid gap-2'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div>
                <label className='text-sm font-medium' htmlFor='image-context'>
                  {t('Image context')}
                </label>
                <p className='text-muted-foreground text-xs'>
                  {t(
                    'Generated images are kept as context for the next prompt. Delete any image you do not want to use.'
                  )}
                </p>
              </div>
              <div className='flex gap-2'>
                {contextImages.length > 0 && (
                  <Button
                    disabled={isGenerating}
                    onClick={() => setContextImages([])}
                    type='button'
                    variant='outline'
                  >
                    {t('Clear')}
                  </Button>
                )}
                <Button
                  disabled={isGenerating}
                  onClick={() => fileInputRef.current?.click()}
                  type='button'
                  variant='outline'
                >
                  <UploadIcon />
                  {t('Upload images')}
                </Button>
              </div>
            </div>
            <Input
              ref={fileInputRef}
              id='image-context'
              accept='image/*'
              className='hidden'
              disabled={isGenerating}
              multiple
              onChange={(event) => handleContextUpload(event.target.files)}
              type='file'
            />
            {contextImages.length > 0 ? (
              <div className='grid max-h-40 gap-3 overflow-auto sm:grid-cols-3 lg:grid-cols-6'>
                {contextImages.map((image) => (
                  <Card key={image.id} className='overflow-hidden'>
                    <div className='relative'>
                      <img
                        alt={image.name}
                        className='aspect-square w-full object-cover'
                        src={image.source}
                      />
                      <Button
                        className='absolute top-2 right-2 size-8 rounded-full'
                        disabled={isGenerating}
                        onClick={() => removeContextImage(image.id)}
                        size='icon'
                        type='button'
                        variant='secondary'
                      >
                        <XIcon className='size-4' />
                      </Button>
                    </div>
                    <CardContent className='text-muted-foreground truncate p-2 text-xs'>
                      {image.name}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='text-muted-foreground rounded-lg border border-dashed p-4 text-sm'>
                {t('No image context yet. Generated images will appear here automatically.')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Conversation className='min-h-0 rounded-xl border bg-background'>
        <ConversationContent className='grid gap-5 p-4 md:p-6'>
          {conversation.length === 0 ? (
            <ConversationEmptyState
              icon={<ImageIcon className='size-10' />}
              title={t('Start generating images')}
              description={t(
                'Send a prompt to generate an image. Each result is automatically added to the next turn context.'
              )}
            />
          ) : (
            conversation.map((turn) => (
              <div key={turn.id} className='grid gap-3'>
                <Message from='user'>
                  <MessageContent className='max-w-[85%] px-4 py-3' variant='contained'>
                    <p className='whitespace-pre-wrap'>{turn.prompt}</p>
                    {turn.contextCount > 0 && (
                      <p className='text-xs opacity-80'>
                        {t('Used {{count}} context images', {
                          count: turn.contextCount,
                        })}
                      </p>
                    )}
                  </MessageContent>
                </Message>
                <Message from='assistant'>
                  <MessageContent className='max-w-[92%] bg-secondary p-3' variant='contained'>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      {turn.images.map((image) => (
                        <div key={image.id} className='group/image relative overflow-hidden rounded-lg border bg-background'>
                          <img
                            alt={image.revisedPrompt || image.name}
                            className='aspect-square w-full object-contain'
                            src={image.source}
                          />
                          <Button
                            className='absolute top-2 right-2 size-8 rounded-full opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover/image:opacity-100'
                            disabled={isGenerating}
                            onClick={() => removeGeneratedImage(image.id)}
                            size='icon'
                            type='button'
                            variant='secondary'
                          >
                            <Trash2Icon className='size-4' />
                          </Button>
                          {image.revisedPrompt && (
                            <div className='text-muted-foreground border-t p-3 text-xs'>
                              {image.revisedPrompt}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </MessageContent>
                </Message>
              </div>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className='mt-4 shrink-0 rounded-xl border bg-background p-3 shadow-sm'>
        <div className='flex gap-2'>
          <Textarea
            id='image-prompt'
            className='min-h-20 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0'
            disabled={isGenerating}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                void handleGenerate()
              }
            }}
            placeholder={
              contextImages.length > 0
                ? t('Describe how you want to modify the image')
                : t('Describe the image you want to generate')
            }
            value={prompt}
          />
          <div className='flex flex-col justify-end gap-2'>
            <Button
              disabled={isGenerating}
              onClick={() => fileInputRef.current?.click()}
              size='icon'
              type='button'
              variant='outline'
            >
              <UploadIcon className='size-4' />
            </Button>
            <Button
              disabled={isGenerating || !prompt.trim()}
              onClick={handleGenerate}
              size='icon'
              type='button'
            >
              {isGenerating ? (
                <Loader2Icon className='size-4 animate-spin' />
              ) : (
                <SendIcon className='size-4' />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
