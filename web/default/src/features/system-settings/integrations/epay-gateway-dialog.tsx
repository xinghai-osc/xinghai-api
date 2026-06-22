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
import { useEffect } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
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
import { Dialog } from '@/components/dialog'

const createEpayGatewayDialogSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('Gateway name is required')),
    pay_address: z
      .string()
      .refine((value) => {
        const trimmed = value.trim()
        if (!trimmed) return false
        return /^https?:\/\//.test(trimmed)
      }, t('Provide a valid URL starting with http:// or https://')),
    epay_id: z.string().min(1, t('Merchant ID is required')),
    epay_key: z.string(),
  })

type EpayGatewayDialogFormValues = z.infer<
  ReturnType<typeof createEpayGatewayDialogSchema>
>

const EPAY_GATEWAY_FORM_ID = 'epay-gateway-form'

export type EpayGatewayData = {
  id: string
  name: string
  pay_address: string
  epay_id: string
  epay_key: string
}

type EpayGatewayDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: EpayGatewayData) => void
  editData?: EpayGatewayData | null
}

export function EpayGatewayDialog({
  open,
  onOpenChange,
  onSave,
  editData,
}: EpayGatewayDialogProps) {
  const { t } = useTranslation()
  const isEditMode = !!editData
  const schema = createEpayGatewayDialogSchema(t)

  const form = useForm<EpayGatewayDialogFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      pay_address: '',
      epay_id: '',
      epay_key: '',
    },
  })

  useEffect(() => {
    if (editData) {
      form.reset({
        name: editData.name,
        pay_address: editData.pay_address,
        epay_id: editData.epay_id,
        epay_key: '', // Always empty on edit — leave blank to keep existing
      })
    } else {
      form.reset({
        name: '',
        pay_address: '',
        epay_id: '',
        epay_key: '',
      })
    }
  }, [editData, form, open])

  const handleSubmit = (values: EpayGatewayDialogFormValues) => {
    const data: EpayGatewayData = {
      id: editData?.id ?? '',
      name: values.name,
      pay_address: values.pay_address,
      epay_id: values.epay_id,
      epay_key: values.epay_key,
    }
    onSave(data)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? t('Edit Epay gateway') : t('Add Epay gateway')}
      description={t(
        'Configure an Epay-protocol-compatible payment gateway.'
      )}
      contentClassName='sm:max-w-[520px]'
      contentHeight='auto'
      bodyClassName='space-y-4'
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button type='submit' form={EPAY_GATEWAY_FORM_ID}>
            {isEditMode ? t('Update') : t('Add')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id={EPAY_GATEWAY_FORM_ID}
          onSubmit={form.handleSubmit(handleSubmit)}
          className='space-y-4'
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Gateway name')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('e.g., Primary Alipay Gateway')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t('Display name to identify this gateway.')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='pay_address'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Epay endpoint')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('https://pay.example.com')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t('Base address provided by your Epay service')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='epay_id'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Epay merchant ID')}</FormLabel>
                <FormControl>
                  <Input placeholder='10001' autoComplete='off' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='epay_key'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Epay secret key')}</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder={
                      isEditMode
                        ? t('Enter new key to update')
                        : t('Enter secret key')
                    }
                    autoComplete='new-password'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {isEditMode
                    ? t('Leave blank unless rotating the secret')
                    : t('Secret key from your Epay provider')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Dialog>
  )
}
