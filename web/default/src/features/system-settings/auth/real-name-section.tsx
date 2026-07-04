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
import { useMemo } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Form, FormControl, FormDescription, FormField, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  SettingsForm,
  SettingsSwitchContent,
  SettingsSwitchItem,
} from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useResetForm } from '../hooks/use-reset-form'
import { useUpdateOption } from '../hooks/use-update-option'

const realNameSchema = z.object({
  real_name: z.object({
    enabled: z.boolean(),
    provider: z.string(),
    secret_id: z.string(),
    secret_key: z.string(),
    endpoint: z.string(),
    region: z.string(),
    rule_id: z.string(),
    redirect_url: z.string(),
    require_unique: z.boolean(),
  }),
})

type RealNameFormValues = z.infer<typeof realNameSchema>

type FlatRealNameDefaults = {
  'real_name.enabled': boolean
  'real_name.provider': string
  'real_name.secret_id': string
  'real_name.secret_key': string
  'real_name.endpoint': string
  'real_name.region': string
  'real_name.rule_id': string
  'real_name.redirect_url': string
  'real_name.require_unique': boolean
}

type RealNameSectionProps = {
  defaultValues: FlatRealNameDefaults
}

const buildFormDefaults = (defaults: FlatRealNameDefaults): RealNameFormValues => ({
  real_name: {
    enabled: defaults['real_name.enabled'],
    provider: defaults['real_name.provider'] || 'tencent_faceid',
    secret_id: defaults['real_name.secret_id'] ?? '',
    secret_key: defaults['real_name.secret_key'] ?? '',
    endpoint: defaults['real_name.endpoint'] || 'faceid.tencentcloudapi.com',
    region: defaults['real_name.region'] ?? '',
    rule_id: defaults['real_name.rule_id'] ?? '',
    redirect_url: defaults['real_name.redirect_url'] ?? '',
    require_unique: defaults['real_name.require_unique'],
  },
})

const normalizeFormValues = (values: RealNameFormValues): FlatRealNameDefaults => ({
  'real_name.enabled': values.real_name.enabled,
  'real_name.provider': values.real_name.provider || 'tencent_faceid',
  'real_name.secret_id': values.real_name.secret_id.trim(),
  'real_name.secret_key': values.real_name.secret_key.trim(),
  'real_name.endpoint': values.real_name.endpoint.trim() || 'faceid.tencentcloudapi.com',
  'real_name.region': values.real_name.region.trim(),
  'real_name.rule_id': values.real_name.rule_id.trim(),
  'real_name.redirect_url': values.real_name.redirect_url.trim(),
  'real_name.require_unique': values.real_name.require_unique,
})

export function RealNameSection({ defaultValues }: RealNameSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const formDefaults = useMemo(() => buildFormDefaults(defaultValues), [defaultValues])
  const form = useForm<RealNameFormValues>({
    resolver: zodResolver(realNameSchema),
    defaultValues: formDefaults,
  })

  useResetForm(form, formDefaults)

  const onSubmit = async (values: RealNameFormValues) => {
    const normalized = normalizeFormValues(values)
    const updates = Object.entries(normalized)
      .filter(([key, value]) => value !== defaultValues[key as keyof FlatRealNameDefaults])
      .map(([key, value]) => ({ key, value }))

    for (const update of updates) {
      await updateOption.mutateAsync(update)
    }
  }

  return (
    <SettingsSection title={t('Real-name Verification')}>
      <Form {...form}>
        <SettingsForm onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsPageFormActions
            onSave={form.handleSubmit(onSubmit)}
            isSaving={updateOption.isPending}
          />
          <FormField
            control={form.control}
            name='real_name.enabled'
            render={({ field }) => (
              <SettingsSwitchItem>
                <SettingsSwitchContent>
                  <FormLabel>{t('Enable Real-name Verification')}</FormLabel>
                  <FormDescription>
                    {t('Allow users to verify their identity through Tencent Cloud FaceID')}
                  </FormDescription>
                </SettingsSwitchContent>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </SettingsSwitchItem>
            )}
          />
          <FormField
            control={form.control}
            name='real_name.require_unique'
            render={({ field }) => (
              <SettingsSwitchItem>
                <SettingsSwitchContent>
                  <FormLabel>{t('Require unique identity')}</FormLabel>
                  <FormDescription>
                    {t('Prevent the same ID card from being verified by multiple accounts')}
                  </FormDescription>
                </SettingsSwitchContent>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </SettingsSwitchItem>
            )}
          />
          <div className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='real_name.secret_id'
              render={({ field }) => (
                <div className='space-y-2'>
                  <FormLabel>{t('Tencent Cloud SecretId')}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete='off' />
                  </FormControl>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name='real_name.secret_key'
              render={({ field }) => (
                <div className='space-y-2'>
                  <FormLabel>{t('Tencent Cloud SecretKey')}</FormLabel>
                  <FormControl>
                    <Input {...field} type='password' autoComplete='new-password' />
                  </FormControl>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name='real_name.endpoint'
              render={({ field }) => (
                <div className='space-y-2'>
                  <FormLabel>{t('Tencent Cloud FaceID Endpoint')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='faceid.tencentcloudapi.com' />
                  </FormControl>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name='real_name.region'
              render={({ field }) => (
                <div className='space-y-2'>
                  <FormLabel>{t('Tencent Cloud Region')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='ap-guangzhou' />
                  </FormControl>
                  <FormDescription>{t('Optional for ID card two-factor verification')}</FormDescription>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name='real_name.rule_id'
              render={({ field }) => (
                <div className='space-y-2'>
                  <FormLabel>{t('Tencent Cloud FaceID RuleId')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='1' />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Required to open the H5 face-scan window. Create the rule in the Tencent Cloud FaceID console first.'
                    )}
                  </FormDescription>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name='real_name.redirect_url'
              render={({ field }) => (
                <div className='space-y-2'>
                  <FormLabel>{t('Redirect URL after verification')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='https://example.com/real-name/callback' />
                  </FormControl>
                  <FormDescription>
                    {t('Optional. The URL the H5 window redirects to after the user finishes face verification.')}
                  </FormDescription>
                </div>
              )}
            />
          </div>
        </SettingsForm>
      </Form>
    </SettingsSection>
  )
}
