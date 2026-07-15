import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, type SubmitErrorHandler } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  SideDrawerSection,
  SideDrawerSectionHeader,
  sideDrawerContentClassName,
  sideDrawerFooterClassName,
  sideDrawerFormClassName,
  sideDrawerHeaderClassName,
} from '@/components/drawer-layout'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { updateAdminToken } from '../api'
import type { AdminApiKey } from '../types'
import { useAdminTokens } from './admin-tokens-provider'

const formSchema = z.object({
  name: z.string().max(50, 'Name must be at most 50 characters'),
})

type FormValues = z.infer<typeof formSchema>

type AdminTokensMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: AdminApiKey
}

export function AdminTokensMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: AdminTokensMutateDrawerProps) {
  const { t } = useTranslation()
  const { triggerRefresh } = useAdminTokens()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (open && currentRow) {
      form.reset({ name: currentRow.name })
    } else if (open) {
      form.reset({ name: '' })
    }
  }, [open, currentRow, form])

  const onSubmit = async (data: FormValues) => {
    if (!currentRow) return
    setIsSubmitting(true)
    try {
      const result = await updateAdminToken({
        id: currentRow.id,
        name: data.name,
      })
      if (result.success) {
        toast.success(t('API Key updated successfully'))
        onOpenChange(false)
        triggerRefresh()
      } else {
        toast.error(result.message || t('Failed to update API key'))
      }
    } catch {
      toast.error(t('An unexpected error occurred'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const onInvalid: SubmitErrorHandler<FormValues> = () => {
    toast.error(t('Please fix the highlighted fields before saving'))
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) form.reset()
      }}
    >
      <SheetContent
        className={sideDrawerContentClassName('max-w-none sm:!max-w-[480px]')}
      >
        <SheetHeader className={sideDrawerHeaderClassName()}>
          <SheetTitle>{t('Rename API Key')}</SheetTitle>
          <SheetDescription>
            {t('Update the API key name.')}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='admin-token-rename-form'
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className={sideDrawerFormClassName('gap-5')}
          >
            <SideDrawerSection>
              <SideDrawerSectionHeader
                title={t('Basic Information')}
                description={t('Set API key basic information')}
              />
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('Enter a name')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SideDrawerSection>
          </form>
        </Form>
        <SheetFooter className={sideDrawerFooterClassName()}>
          <SheetClose
            render={<Button variant='outline' className='w-full sm:w-auto' />}
          >
            {t('Close')}
          </SheetClose>
          <Button
            type='button'
            onClick={form.handleSubmit(onSubmit, onInvalid)}
            disabled={isSubmitting}
            className='w-full sm:w-auto'
          >
            {isSubmitting ? t('Saving...') : t('Save changes')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
