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
import { useState } from 'react'
import {
  PaperclipIcon,
  FileIcon,
  ImageIcon,
  ScreenShareIcon,
  CameraIcon,
  GlobeIcon,
  SendIcon,
  SquareIcon,
  BarChartIcon,
  BoxIcon,
  NotepadTextIcon,
  CodeSquareIcon,
  GraduationCapIcon,
  SlidersHorizontalIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import { ModelGroupSelector } from '@/components/model-group-selector'
import type {
  ModelOption,
  GroupOption,
  PlaygroundConfig,
  ParameterEnabled,
} from '../types'

interface PlaygroundInputProps {
  onSubmit: (text: string) => void
  onStop?: () => void
  disabled?: boolean
  isGenerating?: boolean
  models: ModelOption[]
  modelValue: string
  onModelChange: (value: string) => void
  isModelLoading?: boolean
  groups: GroupOption[]
  groupValue: string
  onGroupChange: (value: string) => void
  config: PlaygroundConfig
  parameterEnabled: ParameterEnabled
  onConfigChange: <K extends keyof PlaygroundConfig>(
    key: K,
    value: PlaygroundConfig[K]
  ) => void
  onParameterEnabledChange: (key: keyof ParameterEnabled, value: boolean) => void
}

type NumberParameterKey = Exclude<keyof ParameterEnabled, 'seed'>

const numberParameters: Array<{
  key: NumberParameterKey
  min?: number
  max?: number
  step: number
}> = [
  { key: 'temperature', min: 0, max: 2, step: 0.1 },
  { key: 'top_p', min: 0, max: 1, step: 0.1 },
  { key: 'max_tokens', min: 1, step: 1 },
  { key: 'frequency_penalty', min: -2, max: 2, step: 0.1 },
  { key: 'presence_penalty', min: -2, max: 2, step: 0.1 },
]

const suggestions = [
  { icon: BarChartIcon, text: 'Analyze data', color: '#76d0eb' },
  { icon: BoxIcon, text: 'Surprise me', color: '#76d0eb' },
  { icon: NotepadTextIcon, text: 'Summarize text', color: '#ea8444' },
  { icon: CodeSquareIcon, text: 'Code', color: '#6c71ff' },
  { icon: GraduationCapIcon, text: 'Get advice', color: '#76d0eb' },
  { icon: null, text: 'More' },
]

export function PlaygroundInput({
  onSubmit,
  onStop,
  disabled,
  isGenerating,
  models,
  modelValue,
  onModelChange,
  isModelLoading = false,
  groups,
  groupValue,
  onGroupChange,
  config,
  parameterEnabled,
  onConfigChange,
  onParameterEnabledChange,
}: PlaygroundInputProps) {
  const { t } = useTranslation()
  const [text, setText] = useState('')

  const isModelSelectDisabled =
    disabled || isModelLoading || models.length === 0
  const isGroupSelectDisabled = disabled || groups.length === 0

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim() || disabled) return
    onSubmit(message.text)
    setText('')
  }

  const handleFileAction = (action: string) => {
    toast.info(t('Feature in development'), {
      description: action,
    })
  }

  const handleSuggestionClick = (suggestion: string) => {
    onSubmit(suggestion)
  }

  const handleNumberParameterChange = (
    key: NumberParameterKey,
    value: string
  ) => {
    const nextValue = key === 'max_tokens' ? Number.parseInt(value, 10) : Number(value)
    if (!Number.isFinite(nextValue)) return
    onConfigChange(key, nextValue)
  }

  const handleSeedChange = (value: string) => {
    if (!value.trim()) {
      onConfigChange('seed', null)
      return
    }

    const nextValue = Number.parseInt(value, 10)
    if (Number.isFinite(nextValue)) onConfigChange('seed', nextValue)
  }

  return (
    <div className='grid shrink-0 gap-4 px-1 md:pb-4'>
      <PromptInput groupClassName='rounded-xl' onSubmit={handleSubmit}>
        <PromptInputTextarea
          autoComplete='off'
          autoCorrect='off'
          autoCapitalize='off'
          spellCheck={false}
          className='px-5 md:text-base'
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
          placeholder={t('Ask anything')}
          value={text}
        />

        <PromptInputFooter className='p-2.5'>
          <PromptInputTools>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <PromptInputButton
                    className='border font-medium'
                    disabled={disabled}
                    variant='outline'
                  />
                }
              >
                <PaperclipIcon size={16} />
                <span className='hidden sm:inline'>{t('Attach')}</span>
                <span className='sr-only sm:hidden'>{t('Attach')}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                <DropdownMenuItem
                  onClick={() => handleFileAction('upload-file')}
                >
                  <FileIcon className='mr-2' size={16} />
                  {t('Upload file')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFileAction('upload-photo')}
                >
                  <ImageIcon className='mr-2' size={16} />
                  {t('Upload photo')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFileAction('take-screenshot')}
                >
                  <ScreenShareIcon className='mr-2' size={16} />
                  {t('Take screenshot')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFileAction('take-photo')}
                >
                  <CameraIcon className='mr-2' size={16} />
                  {t('Take photo')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <PromptInputButton
              className='border font-medium'
              disabled={disabled}
              onClick={() => toast.info(t('Search feature in development'))}
              variant='outline'
            >
              <GlobeIcon size={16} />
              <span className='hidden sm:inline'>{t('Search')}</span>
              <span className='sr-only sm:hidden'>{t('Search')}</span>
            </PromptInputButton>
          </PromptInputTools>

          <div className='flex items-center gap-1.5 md:gap-2'>
            <Popover>
              <PopoverTrigger
                render={
                  <PromptInputButton
                    className='border font-medium'
                    disabled={disabled}
                    variant='outline'
                  />
                }
              >
                <SlidersHorizontalIcon size={16} />
                <span className='hidden sm:inline'>{t('Parameters')}</span>
                <span className='sr-only sm:hidden'>{t('Parameters')}</span>
              </PopoverTrigger>
              <PopoverContent align='end' className='w-80 gap-3'>
                <PopoverHeader>
                  <PopoverTitle>{t('Parameters')}</PopoverTitle>
                </PopoverHeader>

                <div className='flex items-center justify-between gap-3'>
                  <Label htmlFor='playground-stream'>{t('Stream')}</Label>
                  <Switch
                    id='playground-stream'
                    checked={config.stream}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onConfigChange('stream', checked)
                    }
                    size='sm'
                  />
                </div>

                <div className='space-y-2'>
                  {numberParameters.map((parameter) => (
                    <div className='grid grid-cols-[1fr_auto] items-center gap-2' key={parameter.key}>
                      <div className='flex items-center gap-2'>
                        <Switch
                          checked={parameterEnabled[parameter.key]}
                          disabled={disabled}
                          onCheckedChange={(checked) =>
                            onParameterEnabledChange(parameter.key, checked)
                          }
                          size='sm'
                        />
                        <Label className='font-normal'>
                          {t(parameter.key)}
                        </Label>
                      </div>
                      <Input
                        className='h-7 w-24'
                        disabled={disabled || !parameterEnabled[parameter.key]}
                        max={parameter.max}
                        min={parameter.min}
                        onChange={(event) =>
                          handleNumberParameterChange(
                            parameter.key,
                            event.target.value
                          )
                        }
                        step={parameter.step}
                        type='number'
                        value={config[parameter.key]}
                      />
                    </div>
                  ))}
                </div>

                <div className='grid grid-cols-[1fr_auto] items-center gap-2'>
                  <div className='flex items-center gap-2'>
                    <Switch
                      checked={parameterEnabled.seed}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        onParameterEnabledChange('seed', checked)
                      }
                      size='sm'
                    />
                    <Label className='font-normal'>{t('seed')}</Label>
                  </div>
                  <Input
                    className='h-7 w-24'
                    disabled={disabled || !parameterEnabled.seed}
                    onChange={(event) => handleSeedChange(event.target.value)}
                    type='number'
                    value={config.seed ?? ''}
                  />
                </div>
              </PopoverContent>
            </Popover>

            <ModelGroupSelector
              selectedModel={modelValue}
              models={models}
              onModelChange={onModelChange}
              selectedGroup={groupValue}
              groups={groups}
              onGroupChange={onGroupChange}
              disabled={isModelSelectDisabled || isGroupSelectDisabled}
            />

            {isGenerating && onStop ? (
              <PromptInputButton
                className='text-foreground font-medium'
                onClick={onStop}
                variant='secondary'
              >
                <SquareIcon className='fill-current' size={16} />
                <span className='hidden sm:inline'>{t('Stop')}</span>
                <span className='sr-only sm:hidden'>{t('Stop')}</span>
              </PromptInputButton>
            ) : (
              <PromptInputButton
                className='text-foreground font-medium'
                disabled={disabled || !text.trim()}
                type='submit'
                variant='secondary'
              >
                <SendIcon size={16} />
                <span className='hidden sm:inline'>{t('Send')}</span>
                <span className='sr-only sm:hidden'>{t('Send')}</span>
              </PromptInputButton>
            )}
          </div>
        </PromptInputFooter>
      </PromptInput>

      <Suggestions>
        {suggestions.map(({ icon: Icon, text, color }) => (
          <Suggestion
            className={`text-xs font-normal sm:text-sm ${
              text === 'More' ? 'hidden sm:flex' : ''
            }`}
            key={text}
            onClick={() => handleSuggestionClick(text)}
            suggestion={text}
          >
            {Icon && <Icon size={16} style={{ color }} />}
            {text}
          </Suggestion>
        ))}
      </Suggestions>
    </div>
  )
}
