import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  SettingsForm,
  SettingsSwitchContent,
  SettingsSwitchItem,
} from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

const userAgentPoolSchema = z.object({
  user_agent_pool_setting: z.object({
    enabled: z.boolean(),
    pools: z.string().refine((value) => {
      try {
        const parsed: unknown = JSON.parse(value)
        return Array.isArray(parsed)
      } catch {
        return false
      }
    }, 'Enter a valid JSON array'),
  }),
})

type UserAgentPoolFormInput = z.input<typeof userAgentPoolSchema>
type UserAgentPoolFormValues = z.output<typeof userAgentPoolSchema>

type FlatUserAgentPoolDefaults = {
  'user_agent_pool_setting.enabled': boolean
  'user_agent_pool_setting.pools': string
}

type UserAgentPoolSectionProps = {
  defaultValues: FlatUserAgentPoolDefaults
}

const examplePools = JSON.stringify(
  [
    {
      name: 'OpenAI browsers',
      channel_types: [1],
      user_agents: ['Mozilla/5.0 Example', 'curl/8.0 Example'],
    },
    {
      name: 'Gemini browsers',
      channel_names: ['Gemini'],
      user_agents: ['Mozilla/5.0 Gemini Example'],
    },
  ],
  null,
  2
)

function parsePools(value: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
  } catch {
    return []
  }
  return []
}

function formatJsonArray(value: string): string {
  return JSON.stringify(parsePools(value), null, 2)
}

const buildFormDefaults = (
  defaults: FlatUserAgentPoolDefaults
): UserAgentPoolFormInput => ({
  user_agent_pool_setting: {
    enabled: defaults['user_agent_pool_setting.enabled'],
    pools: formatJsonArray(defaults['user_agent_pool_setting.pools'] || '[]'),
  },
})

const normalizeFormValues = (
  values: UserAgentPoolFormValues
): FlatUserAgentPoolDefaults => ({
  'user_agent_pool_setting.enabled': values.user_agent_pool_setting.enabled,
  'user_agent_pool_setting.pools': JSON.stringify(
    JSON.parse(values.user_agent_pool_setting.pools)
  ),
})

export function UserAgentPoolSection(props: UserAgentPoolSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const formDefaults = useMemo(
    () => buildFormDefaults(props.defaultValues),
    [props.defaultValues]
  )

  const form = useForm<
    UserAgentPoolFormInput,
    unknown,
    UserAgentPoolFormValues
  >({
    resolver: zodResolver(userAgentPoolSchema),
    defaultValues: formDefaults,
  })

  const [initialBaseline] = useState(() =>
    normalizeFormValues(buildFormDefaults(props.defaultValues))
  )
  const baselineRef = useRef<FlatUserAgentPoolDefaults>(initialBaseline)
  const baselineSerializedRef = useRef<string>(JSON.stringify(initialBaseline))

  useEffect(() => {
    const normalized = normalizeFormValues(buildFormDefaults(props.defaultValues))
    const serialized = JSON.stringify(normalized)
    if (serialized === baselineSerializedRef.current) return
    baselineRef.current = normalized
    baselineSerializedRef.current = serialized
    form.reset(buildFormDefaults(props.defaultValues))
  }, [props.defaultValues, form])

  const onSubmit = useCallback(
    async (values: UserAgentPoolFormValues) => {
      const normalized = normalizeFormValues(values)
      const changedKeys = (
        Object.keys(normalized) as Array<keyof FlatUserAgentPoolDefaults>
      ).filter((key) => normalized[key] !== baselineRef.current[key])

      if (changedKeys.length === 0) {
        toast.info(t('No changes to save'))
        return
      }

      for (const key of changedKeys) {
        await updateOption.mutateAsync({
          key,
          value: normalized[key],
        })
      }

      baselineRef.current = normalized
      baselineSerializedRef.current = JSON.stringify(normalized)
      form.reset(buildFormDefaults(normalized))
    },
    [form, t, updateOption]
  )

  const submitForm = useCallback(() => {
    void form.handleSubmit(onSubmit)()
  }, [form, onSubmit])

  return (
    <SettingsSection title={t('User-Agent Pool Settings')}>
      <Form {...form}>
        <SettingsForm onSubmit={submitForm}>
          <SettingsPageFormActions
            onSave={submitForm}
            isSaving={updateOption.isPending}
          />

          <FormField
            control={form.control}
            name='user_agent_pool_setting.enabled'
            render={({ field }) => (
              <SettingsSwitchItem>
                <SettingsSwitchContent>
                  <FormLabel>{t('Enable User-Agent pool')}</FormLabel>
                  <FormDescription>
                    {t(
                      'When enabled, upstream requests randomly use a User-Agent from the pool matching the current adapter.'
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
            name='user_agent_pool_setting.pools'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('User-Agent pools')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={18}
                    className='font-mono text-xs'
                    placeholder={examplePools}
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'Configure a JSON array. Each pool may use channel_types, channel_names, and user_agents. Empty match fields apply to all adapters.'
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
