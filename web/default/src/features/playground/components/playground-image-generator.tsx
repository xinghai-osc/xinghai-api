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
import { ImageIcon, Loader2Icon, UploadIcon, XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
}

interface ImageContextItem {
  id: string
  name: string
  source: string
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
  return image.url || `data:image/${outputFormat};base64,${image.b64_json}`
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
  const [images, setImages] = useState<ImageData[]>([])
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
          contextImages.length > 0
            ? contextImages.map((image) => image.source)
            : undefined,
      })
      setImages(response.data ?? [])
      toast.success(
        contextImages.length > 0
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

    const imageFiles = Array.from(files).filter((file) =>
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

  const handleUseGeneratedAsContext = (image: ImageData, index: number) => {
    const source = getImageSource(image, outputFormat)
    if (!source || source.includes('undefined')) {
      toast.error(t('Generated image is unavailable'))
      return
    }
    setContextImages((current) => [
      ...current,
      {
        id: `generated-${Date.now()}-${index}`,
        name: `${t('Generated image')} ${index + 1}`,
        source,
      },
    ])
    toast.success(t('Added to image context'))
  }

  const removeContextImage = (id: string) => {
    setContextImages((current) => current.filter((image) => image.id !== id))
  }

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 overflow-auto p-4 md:p-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ImageIcon className='size-5' />
            {t('Image generation')}
          </CardTitle>
          <CardDescription>
            {t('Generate images with gpt-image-2 from the console.')}
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='grid gap-2'>
            <label className='text-sm font-medium' htmlFor='image-prompt'>
              {t('Prompt')}
            </label>
            <Textarea
              id='image-prompt'
              className='min-h-32 resize-none'
              disabled={isGenerating}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={
                contextImages.length > 0
                  ? t('Describe how you want to modify the image')
                  : t('Describe the image you want to generate')
              }
              value={prompt}
            />
          </div>

          <div className='grid gap-2'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div>
                <label className='text-sm font-medium' htmlFor='image-context'>
                  {t('Image context')}
                </label>
                <p className='text-muted-foreground text-xs'>
                  {t(
                    'Upload images or reuse generated images to edit them with the next prompt.'
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
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
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
                {t(
                  'No image context yet. Upload an image or add a generated result as context.'
                )}
              </div>
            )}
          </div>

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

            <div className='flex items-end'>
              <Button
                className='w-full'
                disabled={isGenerating || !prompt.trim()}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <Loader2Icon className='animate-spin' />
                ) : (
                  <ImageIcon />
                )}
                {isGenerating
                  ? t('Generating')
                  : contextImages.length > 0
                    ? t('Edit image')
                    : t('Generate')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {images.length > 0 && (
        <div className='grid gap-4 md:grid-cols-2'>
          {images.map((image, index) => {
            const source = getImageSource(image, outputFormat)
            return (
              <Card key={`${source}-${index}`}>
                <img
                  alt={image.revised_prompt || prompt}
                  className='aspect-square w-full object-contain'
                  src={source}
                />
                <CardContent className='grid gap-3 pt-0'>
                  {image.revised_prompt && (
                    <p className='text-muted-foreground text-sm'>
                      {image.revised_prompt}
                    </p>
                  )}
                  <Button
                    onClick={() => handleUseGeneratedAsContext(image, index)}
                    type='button'
                    variant='outline'
                  >
                    <ImageIcon />
                    {t('Use as image context')}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
