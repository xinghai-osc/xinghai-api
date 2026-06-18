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
import {
  DownloadIcon,
  Loader2Icon,
  Mic2Icon,
  SendIcon,
  Settings2Icon,
  Trash2Icon,
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
import { generateSpeech } from '../api'
import type { GroupOption, ModelOption } from '../types'

interface PlaygroundSpeechGeneratorProps {
  models: ModelOption[]
  groups: GroupOption[]
  modelValue: string
  groupValue: string
  onModelChange: (value: string) => void
  onGroupChange: (value: string) => void
  isModelLoading?: boolean
}

interface SpeechTurn {
  id: string
  input: string
  audioUrl: string
  model: string
  voice: string
  responseFormat: string
}

const fallbackModel = 'tts-1'
const voiceOptions = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer']
const responseFormatOptions = ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm']

function getAudioMimeType(responseFormat: string) {
  if (responseFormat === 'mp3') return 'audio/mpeg'
  if (responseFormat === 'opus') return 'audio/ogg'
  if (responseFormat === 'aac') return 'audio/aac'
  if (responseFormat === 'flac') return 'audio/flac'
  if (responseFormat === 'wav') return 'audio/wav'
  if (responseFormat === 'pcm') return 'audio/L16'
  return 'audio/mpeg'
}

export function PlaygroundSpeechGenerator(props: PlaygroundSpeechGeneratorProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [voice, setVoice] = useState('alloy')
  const [responseFormat, setResponseFormat] = useState('mp3')
  const [speed, setSpeed] = useState(1)
  const [instructions, setInstructions] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [turns, setTurns] = useState<SpeechTurn[]>([])

  const selectedModel = props.modelValue || fallbackModel
  const modelOptions = useMemo(() => {
    if (props.models.some((model) => model.value === fallbackModel)) {
      return props.models
    }
    return [{ label: fallbackModel, value: fallbackModel }, ...props.models]
  }, [props.models])

  useEffect(() => {
    return () => {
      turns.forEach((turn) => URL.revokeObjectURL(turn.audioUrl))
    }
  }, [turns])

  const handleGenerate = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput) {
      toast.error(t('Input text is required'))
      return
    }

    setIsGenerating(true)
    try {
      const audio = await generateSpeech({
        model: selectedModel,
        group: props.groupValue,
        input: trimmedInput,
        voice,
        response_format: responseFormat,
        speed,
        instructions: instructions.trim() || undefined,
      })
      const typedAudio = audio.type
        ? audio
        : new Blob([audio], { type: getAudioMimeType(responseFormat) })
      const audioUrl = URL.createObjectURL(typedAudio)
      audioUrlsRef.current.push(audioUrl)

      setTurns((current) => [
        ...current,
        {
          id: `speech-${Date.now()}-${crypto.randomUUID()}`,
          input: trimmedInput,
          audioUrl,
          model: selectedModel,
          voice,
          responseFormat,
        },
      ])
      setInput('')
      toast.success(t('Speech generated successfully'))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('Speech generation failed')
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRemove = (id: string) => {
    setTurns((current) => {
      const target = current.find((turn) => turn.id === id)
      if (target) URL.revokeObjectURL(target.audioUrl)
      return current.filter((turn) => turn.id !== id)
    })
  }

  const handleDownload = (turn: SpeechTurn) => {
    const link = document.createElement('a')
    link.href = turn.audioUrl
    link.download = `speech-${turn.id}.${turn.responseFormat}`
    link.click()
  }

  return (
    <div className='mx-auto flex size-full max-w-6xl flex-col overflow-hidden p-4 md:p-6'>
      <Card className='mb-4 shrink-0'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2'>
            <Settings2Icon className='size-5' />
            {t('Speech generation settings')}
          </CardTitle>
          <CardDescription>
            {t('Generate speech audio from text using the selected voice and model.')}
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='speech-model'>
                {t('Model')}
              </label>
              <NativeSelect
                id='speech-model'
                className='w-full'
                disabled={isGenerating || props.isModelLoading}
                onChange={(event) => props.onModelChange(event.target.value)}
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
              <label className='text-sm font-medium' htmlFor='speech-group'>
                {t('Group')}
              </label>
              <NativeSelect
                id='speech-group'
                className='w-full'
                disabled={isGenerating || props.groups.length === 0}
                onChange={(event) => props.onGroupChange(event.target.value)}
                value={props.groupValue}
              >
                {props.groups.map((group) => (
                  <NativeSelectOption key={group.value} value={group.value}>
                    {group.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='speech-voice'>
                {t('Voice')}
              </label>
              <NativeSelect
                id='speech-voice'
                className='w-full'
                disabled={isGenerating}
                onChange={(event) => setVoice(event.target.value)}
                value={voice}
              >
                {voiceOptions.map((option) => (
                  <NativeSelectOption key={option} value={option}>
                    {option}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='speech-format'>
                {t('Response format')}
              </label>
              <NativeSelect
                id='speech-format'
                className='w-full'
                disabled={isGenerating}
                onChange={(event) => setResponseFormat(event.target.value)}
                value={responseFormat}
              >
                {responseFormatOptions.map((option) => (
                  <NativeSelectOption key={option} value={option}>
                    {option}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium' htmlFor='speech-speed'>
                {t('Speed')}
              </label>
              <Input
                id='speech-speed'
                disabled={isGenerating}
                max={4}
                min={0.25}
                onChange={(event) => setSpeed(Number(event.target.value) || 1)}
                step={0.05}
                type='number'
                value={speed}
              />
            </div>
          </div>

          <div className='grid gap-2'>
            <label className='text-sm font-medium' htmlFor='speech-instructions'>
              {t('Instructions')}
            </label>
            <Textarea
              id='speech-instructions'
              className='min-h-16 resize-none'
              disabled={isGenerating}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder={t('Optional voice style or speaking instructions')}
              value={instructions}
            />
          </div>
        </CardContent>
      </Card>

      <Conversation className='min-h-0 rounded-xl border bg-background'>
        <ConversationContent className='grid gap-5 p-4 md:p-6'>
          {turns.length === 0 ? (
            <ConversationEmptyState
              icon={<Mic2Icon className='size-10' />}
              title={t('Start generating speech')}
              description={t('Enter text to generate playable speech audio.')}
            />
          ) : (
            turns.map((turn) => (
              <div key={turn.id} className='grid gap-3'>
                <Message from='user'>
                  <MessageContent className='max-w-[85%] px-4 py-3' variant='contained'>
                    <p className='whitespace-pre-wrap'>{turn.input}</p>
                  </MessageContent>
                </Message>
                <Message from='assistant'>
                  <MessageContent className='max-w-[92%] bg-secondary p-3' variant='contained'>
                    <div className='grid gap-3'>
                      <audio className='w-full' controls src={turn.audioUrl} />
                      <div className='flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground'>
                        <span>
                          {turn.model} · {turn.voice} · {turn.responseFormat}
                        </span>
                        <div className='flex gap-2'>
                          <Button
                            onClick={() => handleDownload(turn)}
                            size='sm'
                            type='button'
                            variant='outline'
                          >
                            <DownloadIcon className='size-4' />
                            {t('Download')}
                          </Button>
                          <Button
                            disabled={isGenerating}
                            onClick={() => handleRemove(turn.id)}
                            size='sm'
                            type='button'
                            variant='outline'
                          >
                            <Trash2Icon className='size-4' />
                            {t('Delete')}
                          </Button>
                        </div>
                      </div>
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
            id='speech-input'
            className='min-h-20 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0'
            disabled={isGenerating}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                void handleGenerate()
              }
            }}
            placeholder={t('Enter the text you want to convert to speech')}
            value={input}
          />
          <div className='flex flex-col justify-end'>
            <Button
              disabled={isGenerating || !input.trim()}
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
