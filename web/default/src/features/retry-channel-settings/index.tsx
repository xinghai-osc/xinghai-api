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
import { useEffect, useMemo, useRef } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { RotateCcw, Route } from 'lucide-react'
import { SectionPageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { parseHttpStatusCodeRules } from '@/lib/http-status-code-rules'
import { getOptionValue, useSystemOptions } from '@/features/system-settings/hooks/use-system-options'
import { useUpdateOption } from '@/features/system-settings/hooks/use-update-option'

const DEFAULT_RETRY_STATUS_CODES =
  '100-199,300-399,401-407,409-499,500-503,505-523,525-599'
const DEFAULT_RETRY_ERROR_CODES = [
  'channel:no_available_key',
  'channel:param_override_invalid',
  'channel:header_override_invalid',
  'channel:model_mapped_error',
  'channel:aws_client_error',
  'channel:invalid_key',
  'channel:response_time_exceeded',
].join('\n')

const fallbackSettings = {
  AutomaticRetryStatusCodes: DEFAULT_RETRY_STATUS_CODES,
  AutomaticRetryErrorCodes: DEFAULT_RETRY_ERROR_CODES.replace(/\n/g, ','),
}

const retryChannelSchema = z
  .object({
    AutomaticRetryStatusCodes: z.string(),
    AutomaticRetryErrorCodes: z.string(),
  })
  .superRefine((values, ctx) => {
    const retryParsed = parseHttpStatusCodeRules(
      values.AutomaticRetryStatusCodes
    )
    if (!retryParsed.ok) {
      ctx.addIssue({
        code: 'custom',
        path: ['AutomaticRetryStatusCodes'],
        message: `Invalid status code rules: ${retryParsed.invalidTokens.join(
          ', '
        )}`,
      })
    }
  })

type RetryChannelFormValues = z.output<typeof retryChannelSchema>

type NormalizedRetryChannelValues = {
  AutomaticRetryStatusCodes: string
  AutomaticRetryErrorCodes: string
}

function normalizeErrorCodes(value: string) {
  const seen = new Set<string>()
  return value
    .replace(/，/g, ',')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item)) return false
      seen.add(item)
      return true
    })
    .join(',')
}

function formatErrorCodes(value: string) {
  return normalizeErrorCodes(value).replace(/,/g, '\n')
}

function normalizeFormValues(
  values: RetryChannelFormValues
): NormalizedRetryChannelValues {
  return {
    AutomaticRetryStatusCodes: parseHttpStatusCodeRules(
      values.AutomaticRetryStatusCodes
    ).normalized,
    AutomaticRetryErrorCodes: normalizeErrorCodes(values.AutomaticRetryErrorCodes),
  }
}

export function RetryChannelSettings() {
  const { t } = useTranslation()
  const { data, isLoading } = useSystemOptions()
  const updateOption = useUpdateOption()

  const settings = useMemo(
    () => getOptionValue(data?.data, fallbackSettings),
    [data?.data]
  )

  const formDefaults = useMemo(
    () => ({
      AutomaticRetryStatusCodes: settings.AutomaticRetryStatusCodes,
      AutomaticRetryErrorCodes: formatErrorCodes(settings.AutomaticRetryErrorCodes),
    }),
    [settings]
  )

  const baselineRef = useRef<NormalizedRetryChannelValues>({
    AutomaticRetryStatusCodes: parseHttpStatusCodeRules(
      fallbackSettings.AutomaticRetryStatusCodes
    ).normalized,
    AutomaticRetryErrorCodes: normalizeErrorCodes(
      fallbackSettings.AutomaticRetryErrorCodes
    ),
  })

  const form = useForm<RetryChannelFormValues>({
    resolver: zodResolver(retryChannelSchema),
    values: formDefaults,
  })

  const retryStatusCodes = form.watch('AutomaticRetryStatusCodes')
  const retryParsed = useMemo(
    () => parseHttpStatusCodeRules(retryStatusCodes),
    [retryStatusCodes]
  )

  useEffect(() => {
    baselineRef.current = normalizeFormValues(formDefaults)
  }, [formDefaults])

  const resetDefaults = () => {
    form.reset({
      AutomaticRetryStatusCodes: DEFAULT_RETRY_STATUS_CODES,
      AutomaticRetryErrorCodes: DEFAULT_RETRY_ERROR_CODES,
    })
  }

  const onSubmit = async (values: RetryChannelFormValues) => {
    const normalized = normalizeFormValues(values)
    const updates = (
      Object.keys(normalized) as Array<keyof NormalizedRetryChannelValues>
    ).filter((key) => normalized[key] !== baselineRef.current[key])

    if (updates.length === 0) {
      toast.info(t('No changes to save'))
      return
    }

    for (const key of updates) {
      await updateOption.mutateAsync({
        key,
        value: normalized[key],
      })
    }

    baselineRef.current = normalized
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {t('Retry channel settings')}
      </SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='text-muted-foreground mb-4 text-sm'>
          {t(
            'Configure which upstream errors should switch to another channel for the current request only.'
          )}
        </div>
        <div className='grid gap-6 lg:grid-cols-[1fr_320px]'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Route className='size-4' />
                {t('Error retry rules')}
              </CardTitle>
              <CardDescription>
                {t(
                  'When a request fails with a matching status code or error code, the gateway will try another available channel before returning the final error.'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-6'
                >
                  <FormField
                    control={form.control}
                    name='AutomaticRetryStatusCodes'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Retry status codes')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('e.g. 401, 403, 429, 500-599')}
                            disabled={isLoading}
                            value={field.value}
                            onChange={(event) =>
                              field.onChange(event.target.value)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t(
                            'Use comma-separated HTTP status codes and inclusive ranges.'
                          )}{' '}
                          {retryParsed.ok &&
                            retryParsed.normalized &&
                            retryParsed.normalized !== field.value.trim() && (
                              <span className='text-muted-foreground'>
                                {t('Normalized:')} {retryParsed.normalized}
                              </span>
                            )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='AutomaticRetryErrorCodes'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Retry error codes')}</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={10}
                            placeholder={t('one error code per line')}
                            disabled={isLoading}
                            value={field.value}
                            onChange={(event) =>
                              field.onChange(event.target.value)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t(
                            'These values match the internal or upstream error code, for example channel:no_available_key or insufficient_quota.'
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='flex flex-wrap gap-3'>
                    <Button type='submit' disabled={updateOption.isPending}>
                      {updateOption.isPending
                        ? t('Saving...')
                        : t('Save retry rules')}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={resetDefaults}
                      disabled={updateOption.isPending || isLoading}
                    >
                      <RotateCcw className='size-4' />
                      {t('Restore default rules')}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('How it works')}</CardTitle>
              <CardDescription>
                {t('Rules only affect automatic channel switching.')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4 text-sm text-muted-foreground'>
              <p>
                {t(
                  'The selected channel is changed only inside the current request context. It does not change token settings, channel bindings, or future requests.'
                )}
              </p>
              <p>
                {t(
                  'If all matching channels fail, the last error is returned to the client.'
                )}
              </p>
              <p>
                {t(
                  'Requests pinned to a specific channel still do not switch channels automatically.'
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
