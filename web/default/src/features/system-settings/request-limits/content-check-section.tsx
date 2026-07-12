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
import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import {
  SettingsForm,
  SettingsSwitchContent,
  SettingsSwitchItem,
} from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

const contentCheckSchema = z.object({
  ContentCheckEnabled: z.boolean(),
  ContentCheckOnPromptEnabled: z.boolean(),
  ContentCheckOnCompletionEnabled: z.boolean(),
  ContentCheckCompletionStreamBuffered: z.boolean(),
  ContentCheckModel: z.string().optional(),
  ContentCheckBaseURL: z.string().optional(),
  ContentCheckAPIKey: z.string().optional(),
  ContentCheckSystemPrompt: z.string().optional(),
  ContentCheckTimeout: z.number().min(1).max(120).optional(),
  ContentCheckMaxInputLength: z.number().min(100).max(100000).optional(),
  ContentCheckBlockResponse: z.string().optional(),
  ContentCheckAction: z.string().optional(),
  ContentCheckFailAction: z.string().optional(),
})

type ContentCheckFormValues = z.infer<typeof contentCheckSchema>

type ContentCheckSectionProps = {
  defaultValues: ContentCheckFormValues
}

export function ContentCheckSection(props: ContentCheckSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()

  const form = useForm<ContentCheckFormValues>({
    resolver: zodResolver(contentCheckSchema),
    defaultValues: props.defaultValues,
  })

  const onSubmit = useCallback(
    async (values: ContentCheckFormValues) => {
      const updates = Object.entries(values).filter(
        ([key, value]) =>
          value !==
          props.defaultValues[key as keyof ContentCheckFormValues]
      )

      for (const [key, value] of updates) {
        await updateOption.mutateAsync({ key, value: value ?? '' })
      }
    },
    [props.defaultValues, updateOption]
  )

  return (
    <SettingsSection title={t('External Content Check')}>
      <Form {...form}>
        <SettingsForm onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsPageFormActions
            onSave={form.handleSubmit(onSubmit)}
            isSaving={updateOption.isPending}
            saveLabel={t('Save content check settings')}
          />

          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='ContentCheckEnabled'
              render={({ field }) => (
                <SettingsSwitchItem>
                  <SettingsSwitchContent>
                    <FormLabel>{t('Enable external content check')}</FormLabel>
                    <FormDescription>
                      {t(
                        'Use an external model to verify request content legality before processing.'
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
              name='ContentCheckOnPromptEnabled'
              render={({ field }) => (
                <SettingsSwitchItem>
                  <SettingsSwitchContent>
                    <FormLabel>{t('Check user prompts')}</FormLabel>
                    <FormDescription>
                      {t(
                        'When enabled, user input is sent to the external model for content verification before reaching upstream models.'
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
              name='ContentCheckOnCompletionEnabled'
              render={({ field }) => (
                <SettingsSwitchItem>
                  <SettingsSwitchContent>
                    <FormLabel>{t('Check model completions')}</FormLabel>
                    <FormDescription>
                      {t(
                        'When enabled, model output is sent to the external model for content verification before being returned to the user.'
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
              name='ContentCheckCompletionStreamBuffered'
              render={({ field }) => (
                <SettingsSwitchItem>
                  <SettingsSwitchContent>
                    <FormLabel>{t('Buffer stream for completion check')}</FormLabel>
                    <FormDescription>
                      {t(
                        'When enabled, streaming responses are buffered and checked before delivery. Increases latency but ensures content safety.'
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
              name='ContentCheckModel'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Detection model')}</FormLabel>
                  <FormControl>
                    <Input placeholder='gpt-4o-mini' {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('Model name for the external content check API.')}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ContentCheckBaseURL'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('API base URL')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='https://api.openai.com'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('Base URL of the OpenAI-compatible API endpoint.')}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ContentCheckAPIKey'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('API key')}</FormLabel>
                  <FormControl>
                    <Input type='password' placeholder='sk-...' {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('API key for the external content check service.')}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ContentCheckSystemPrompt'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('System prompt')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder={t(
                        'Leave empty to use the built-in default prompt.'
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Custom system prompt for the detection model. The model should respond with JSON: {"allowed": true/false, "reason": "..."}'
                    )}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ContentCheckTimeout'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Timeout (seconds)')}</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={1}
                      max={120}
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value) || 10)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Maximum seconds to wait for the external model response.'
                    )}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ContentCheckMaxInputLength'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Max input length (chars)')}</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={100}
                      max={100000}
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          Number.parseInt(e.target.value) || 10000
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Maximum characters to send to the detection model. Longer text is truncated.'
                    )}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ContentCheckBlockResponse'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Block response message')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'Request blocked by content policy'
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Message returned when content is blocked by the external model.'
                    )}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ContentCheckAction'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Block action')}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='error'>
                          {t('Return HTTP error')}
                        </SelectItem>
                        <SelectItem value='return'>
                          {t('Return content filter response')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    {t(
                      'How to respond when content is blocked: return an HTTP error or return a normal response with finish_reason=content_filter.'
                    )}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ContentCheckFailAction'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Check failure policy')}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='allow'>
                          {t('Allow (fail open)')}
                        </SelectItem>
                        <SelectItem value='block'>
                          {t('Block (fail closed)')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    {t(
                      'What to do when the external model is unreachable or returns an error: allow the request through or block it.'
                    )}
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </SettingsForm>
      </Form>
    </SettingsSection>
  )
}
