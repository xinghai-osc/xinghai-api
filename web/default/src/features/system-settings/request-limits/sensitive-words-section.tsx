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
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { StatusBadge } from '@/components/status-badge'

import {
  SettingsForm,
  SettingsSwitchContent,
  SettingsSwitchItem,
} from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

const sensitiveSchema = z.object({
  CheckSensitiveEnabled: z.boolean(),
  CheckSensitiveOnPromptEnabled: z.boolean(),
  CheckSensitiveOnCompletionEnabled: z.boolean(),
  StopOnSensitiveEnabled: z.boolean(),
  SensitiveBlockResponse: z.string().optional(),
  SensitiveWords: z.string().optional(),
  SensitiveWordResponses: z.string().optional(),
  SensitiveWordActions: z.string().optional(),
})

type SensitiveFormValues = z.infer<typeof sensitiveSchema>

type SensitiveWordsSectionProps = {
  defaultValues: SensitiveFormValues
}

function parseWords(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split('\n')
    .map((w) => w.trim())
    .filter(Boolean)
}

function parseWordResponses(
  raw: string | undefined
): Map<string, string> {
  const map = new Map<string, string>()
  if (!raw) return map
  raw.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    const idx = trimmed.indexOf('=>')
    if (idx === -1) return
    const word = trimmed.slice(0, idx).trim()
    const response = trimmed.slice(idx + 2).trim()
    if (word && response) {
      map.set(word, response)
    }
  })
  return map
}

function formatWordResponses(map: Map<string, string>): string {
  const lines: string[] = []
  map.forEach((response, word) => {
    lines.push(`${word}=>${response}`)
  })
  return lines.join('\n')
}

function parseWordActions(raw: string | undefined): Map<string, string> {
  const map = new Map<string, string>()
  if (!raw) return map
  raw.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    const idx = trimmed.indexOf('=>')
    if (idx === -1) return
    const word = trimmed.slice(0, idx).trim()
    const action = trimmed.slice(idx + 2).trim()
    if (word && action) {
      map.set(word, action)
    }
  })
  return map
}

function formatWordActions(map: Map<string, string>): string {
  const lines: string[] = []
  map.forEach((action, word) => {
    lines.push(`${word}=>${action}`)
  })
  return lines.join('\n')
}

export function SensitiveWordsSection({
  defaultValues,
}: SensitiveWordsSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const form = useForm<SensitiveFormValues>({
    resolver: zodResolver(sensitiveSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const words = useMemo(
    () => parseWords(form.watch('SensitiveWords')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.watch('SensitiveWords')]
  )

  const wordResponsesMap = useMemo(
    () => parseWordResponses(form.watch('SensitiveWordResponses')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.watch('SensitiveWordResponses')]
  )

  const wordActionsMap = useMemo(
    () => parseWordActions(form.watch('SensitiveWordActions')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.watch('SensitiveWordActions')]
  )

  const [newWord, setNewWord] = useState('')
  const [newResponseWord, setNewResponseWord] = useState('')
  const [newResponseText, setNewResponseText] = useState('')
  const [newResponseAction, setNewResponseAction] = useState('error')

  const addWord = useCallback(() => {
    const lines = newWord
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) return
    const existing = new Set(words)
    const unique = lines.filter((w) => !existing.has(w))
    if (unique.length === 0) return
    const updated = [...words, ...unique]
    form.setValue('SensitiveWords', updated.join('\n'), { shouldDirty: true })
    setNewWord('')
  }, [newWord, words, form])

  const removeWord = useCallback(
    (word: string) => {
      const updated = words.filter((w) => w !== word)
      form.setValue('SensitiveWords', updated.join('\n'), { shouldDirty: true })
      // also remove any per-word response and action for this word
      const nextResponses = new Map(wordResponsesMap)
      if (nextResponses.has(word)) {
        nextResponses.delete(word)
        form.setValue(
          'SensitiveWordResponses',
          formatWordResponses(nextResponses),
          { shouldDirty: true }
        )
      }
      const nextActions = new Map(wordActionsMap)
      if (nextActions.has(word)) {
        nextActions.delete(word)
        form.setValue(
          'SensitiveWordActions',
          formatWordActions(nextActions),
          { shouldDirty: true }
        )
      }
    },
    [words, wordResponsesMap, wordActionsMap, form]
  )

  const addWordResponse = useCallback(() => {
    const word = newResponseWord.trim()
    const text = newResponseText.trim()
    if (!word || !text) return
    const next = new Map(wordResponsesMap)
    next.set(word, text)
    form.setValue('SensitiveWordResponses', formatWordResponses(next), {
      shouldDirty: true,
    })
    const action = newResponseAction === 'return' ? 'return' : 'error'
    const nextActions = new Map(wordActionsMap)
    if (action === 'return') {
      nextActions.set(word, action)
    } else {
      nextActions.delete(word)
    }
    form.setValue('SensitiveWordActions', formatWordActions(nextActions), {
      shouldDirty: true,
    })
    setNewResponseWord('')
    setNewResponseText('')
    setNewResponseAction('error')
  }, [newResponseWord, newResponseText, newResponseAction, wordResponsesMap, wordActionsMap, form])

  const removeWordResponse = useCallback(
    (word: string) => {
      const next = new Map(wordResponsesMap)
      next.delete(word)
      form.setValue('SensitiveWordResponses', formatWordResponses(next), {
        shouldDirty: true,
      })
      const nextActions = new Map(wordActionsMap)
      nextActions.delete(word)
      form.setValue('SensitiveWordActions', formatWordActions(nextActions), {
        shouldDirty: true,
      })
    },
    [wordResponsesMap, wordActionsMap, form]
  )

  const onSubmit = async (values: SensitiveFormValues) => {
    const updates = Object.entries(values).filter(
      ([key, value]) =>
        value !== defaultValues[key as keyof SensitiveFormValues]
    )

    for (const [key, value] of updates) {
      await updateOption.mutateAsync({ key, value: value ?? '' })
    }
  }

  return (
    <SettingsSection title={t('Sensitive Words')}>
      <Form {...form}>
        <SettingsForm onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsPageFormActions
            onSave={form.handleSubmit(onSubmit)}
            isSaving={updateOption.isPending}
            saveLabel='Save sensitive words'
          />

          {/* ── Basic toggles ── */}
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='CheckSensitiveEnabled'
              render={({ field }) => (
                <SettingsSwitchItem>
                  <SettingsSwitchContent>
                    <FormLabel>{t('Enable filtering')}</FormLabel>
                    <FormDescription>
                      {t(
                        'Blocks messages when sensitive keywords are detected.'
                      )}
                    </FormDescription>
                  </SettingsSwitchContent>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </SettingsSwitchItem>
              )}
            />

            <FormField
              control={form.control}
              name='CheckSensitiveOnPromptEnabled'
              render={({ field }) => (
                <SettingsSwitchItem>
                  <SettingsSwitchContent>
                    <FormLabel>{t('Inspect user prompts')}</FormLabel>
                    <FormDescription>
                      {t(
                        'When enabled, prompts are scanned before reaching upstream models.'
                      )}
                    </FormDescription>
                  </SettingsSwitchContent>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </SettingsSwitchItem>
              )}
            />

            <FormField
              control={form.control}
              name='CheckSensitiveOnCompletionEnabled'
              render={({ field }) => (
                <SettingsSwitchItem>
                  <SettingsSwitchContent>
                    <FormLabel>
                      {t('Inspect model completions')}
                    </FormLabel>
                    <FormDescription>
                      {t(
                        'When enabled, model responses are scanned before being returned to the user.'
                      )}
                    </FormDescription>
                  </SettingsSwitchContent>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </SettingsSwitchItem>
              )}
            />

            <FormField
              control={form.control}
              name='StopOnSensitiveEnabled'
              render={({ field }) => (
                <SettingsSwitchItem>
                  <SettingsSwitchContent>
                    <FormLabel>
                      {t('Stop generation on match')}
                    </FormLabel>
                    <FormDescription>
                      {t(
                        'When enabled, the response is immediately stopped when a sensitive word is detected. When disabled, sensitive words in the output are replaced with placeholders instead.'
                      )}
                    </FormDescription>
                  </SettingsSwitchContent>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </SettingsSwitchItem>
              )}
            />
          </div>

          {/* ── Default block response ── */}
          <FormField
            control={form.control}
            name='SensitiveBlockResponse'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Default block response')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      'Message returned when a sensitive word is detected'
                    )}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'This message is shown when a sensitive word is detected and no keyword-specific response is configured.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Sensitive words tag list ── */}
          <FormField
            control={form.control}
            name='SensitiveWords'
            render={() => (
              <FormItem>
                <FormLabel>{t('Blocked keywords')}</FormLabel>
                <div className='space-y-3'>
                  {/* Tag list */}
                  <div className='bg-muted/30 flex min-h-[40px] flex-wrap items-start gap-1.5 rounded-lg border p-2.5'>
                    {words.length === 0 ? (
                      <span className='text-muted-foreground py-1 text-xs'>
                        {t('No keywords added yet')}
                      </span>
                    ) : (
                      words.map((word) => (
                        <StatusBadge
                          key={word}
                          size='sm'
                          className='group/badge pr-0.5'
                        >
                          <span className='min-w-0 truncate leading-normal'>
                            {word}
                          </span>
                          <button
                            type='button'
                            className='hover:bg-foreground/10 ml-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full transition-colors'
                            onClick={() => removeWord(word)}
                            title={t('Remove')}
                          >
                            <X className='size-3' />
                          </button>
                        </StatusBadge>
                      ))
                    )}
                  </div>

                  {/* Add word input */}
                  <div className='flex gap-2'>
                    <FormControl>
                      <Textarea
                        placeholder={t('Enter one keyword per line')}
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        rows={3}
                      />
                    </FormControl>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={addWord}
                      disabled={!newWord.trim()}
                      className='self-end'
                    >
                      {t('Add')}
                    </Button>
                  </div>
                </div>
                <FormDescription>
                  {t(
                    'Enter multiple keywords separated by newlines. Duplicate keywords will be ignored. Remove a keyword by clicking the X on its tag.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Per-word responses ── */}
          <FormField
            control={form.control}
            name='SensitiveWordResponses'
            render={() => (
              <FormItem>
                <FormLabel>{t('Keyword-specific responses')}</FormLabel>
                <div className='space-y-3'>
                  {/* Existing mappings */}
                  {wordResponsesMap.size > 0 && (
                    <div className='space-y-1.5'>
                      {[...wordResponsesMap.entries()].map(
                        ([word, response]) => (
                          <div
                            key={word}
                            className='bg-muted/20 flex items-center gap-2 rounded-lg border px-3 py-2'
                          >
                            <StatusBadge size='sm'>
                              {word}
                            </StatusBadge>
                            <span className='text-muted-foreground text-xs'>
                              &rarr;
                            </span>
                            <span className='min-w-0 flex-1 truncate text-sm'>
                              {response}
                            </span>
                            <Select
                              value={wordActionsMap.get(word) || 'error'}
                              onValueChange={(val) => {
                                if (val === null) return
                                const nextActions = new Map(wordActionsMap)
                                if (val === 'return') {
                                  nextActions.set(word, val)
                                } else {
                                  nextActions.delete(word)
                                }
                                form.setValue(
                                  'SensitiveWordActions',
                                  formatWordActions(nextActions),
                                  { shouldDirty: true }
                                )
                              }}
                            >
                              <SelectTrigger className='h-6 w-auto min-w-[90px] px-2 text-xs'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value='error'>
                                    {t('Block')}
                                  </SelectItem>
                                  <SelectItem value='return'>
                                    {t('Reply')}
                                  </SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <button
                              type='button'
                              className='hover:bg-foreground/10 inline-flex size-5 shrink-0 items-center justify-center rounded-full transition-colors'
                              onClick={() => removeWordResponse(word)}
                              title={t('Remove')}
                            >
                              <X className='size-3.5' />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Add mapping */}
                  <div className='flex items-center gap-2'>
                    <Input
                      placeholder={t('keyword=>Custom response')}
                      value={newResponseWord}
                      onChange={(e) => setNewResponseWord(e.target.value)}
                      className='max-w-[200px]'
                    />
                    <span className='text-muted-foreground text-sm shrink-0'>
                      &rarr;
                    </span>
                    <Input
                      placeholder={t('Custom response text')}
                      value={newResponseText}
                      onChange={(e) => setNewResponseText(e.target.value)}
                    />
                    <Select
                      value={newResponseAction}
                      onValueChange={(val) => { if (val !== null) setNewResponseAction(val) }}
                    >
                      <SelectTrigger className='h-8 w-auto min-w-[90px] px-2 text-xs'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value='error'>
                            {t('Block')}
                          </SelectItem>
                          <SelectItem value='return'>
                            {t('Reply')}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={addWordResponse}
                      disabled={!newResponseWord.trim() || !newResponseText.trim()}
                    >
                      {t('Add')}
                    </Button>
                  </div>
                </div>
                <FormDescription>
                  {t(
                    'Configure one mapping per line using keyword=>response. When multiple keywords match, the first matched keyword response is used; otherwise the default block response is returned.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingsForm>
      </Form>
    </SettingsSection>
  )
}
