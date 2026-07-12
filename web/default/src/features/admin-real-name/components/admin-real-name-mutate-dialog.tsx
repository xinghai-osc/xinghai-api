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
import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  sideDrawerContentClassName,
  sideDrawerFooterClassName,
  sideDrawerFormClassName,
  sideDrawerHeaderClassName,
} from '@/components/drawer-layout'
import {
  getAdminRealNameRecord,
  updateAdminRealNameRecord,
} from '../api'
import { ERROR_MESSAGES, REAL_NAME_STATUS_OPTIONS } from '../constants'
import {
  REAL_NAME_STATUS,
  type AdminRealNameRecord,
} from '../types'
import { useAdminRealName } from './admin-real-name-provider'

export function AdminRealNameMutateDialog() {
  const { t } = useTranslation()
  const { editingRecord, closeEditDialog, triggerRefresh } = useAdminRealName()
  const open = !!editingRecord

  const [realName, setRealName] = useState('')
  const [idCard, setIdCard] = useState('')
  const [status, setStatus] = useState<number>(REAL_NAME_STATUS.PENDING)
  const [description, setDescription] = useState('')
  const [provider, setProvider] = useState('tencent_faceid')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingRecord, setIsLoadingRecord] = useState(false)

  useEffect(() => {
    if (!editingRecord) return
    setIsLoadingRecord(true)
    getAdminRealNameRecord(editingRecord.user_id)
      .then((res) => {
        if (!res.success || !res.data) {
          toast.error(
            res.message || t('Failed to load real-name record')
          )
          return
        }
        const record: AdminRealNameRecord = res.data
        setRealName(record.real_name || '')
        // 出于安全与隐私考虑，后端不返回完整身份证号；管理员只能整号改写。
        setIdCard('')
        setStatus(record.status)
        setDescription(record.description || '')
        setProvider(record.provider || 'tencent_faceid')
      })
      .catch(() => {})
      .finally(() => setIsLoadingRecord(false))
      .catch(() => {})
  }, [editingRecord, t])

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) closeEditDialog()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingRecord) return

    if (!realName.trim()) {
      toast.error(t('Name cannot be empty'))
      return
    }
    if (
      idCard.trim() !== '' &&
      !/^[0-9]{17}[0-9Xx]$|^[0-9]{15}$/.test(idCard.trim().toUpperCase())
    ) {
      toast.error(t('Invalid ID card format'))
      return
    }
    if (!provider.trim()) {
      toast.error(t('Provider cannot be empty'))
      return
    }

    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        real_name: realName.trim(),
        status,
        description: description.trim(),
        provider: provider.trim(),
      }
      if (idCard.trim()) {
        payload.id_card = idCard.trim().toUpperCase()
      }
      const res = await updateAdminRealNameRecord(
        editingRecord.user_id,
        payload
      )
      if (res.success) {
        toast.success(t('Real-name record updated successfully'))
        closeEditDialog()
        triggerRefresh()
      } else {
        toast.error(res.message || t(ERROR_MESSAGES.UPDATE_FAILED))
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t(ERROR_MESSAGES.UNEXPECTED)
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className={sideDrawerContentClassName('sm:max-w-[560px]')}>
        <SheetHeader className={sideDrawerHeaderClassName()}>
          <SheetTitle>{t('Edit Real-name Record')}</SheetTitle>
          <SheetDescription>
            {editingRecord
              ? t(
                  'Update the real-name record for user {{user}} ({{id}}).',
                  {
                    user:
                      editingRecord.username || editingRecord.display_name || '-',
                    id: editingRecord.user_id,
                  }
                )
              : t('Update the real-name record.')}
          </SheetDescription>
        </SheetHeader>
        <form
          id='admin-real-name-form'
          onSubmit={handleSubmit}
          className={sideDrawerFormClassName()}
        >
          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='admin-real-name-name'>{t('Real Name')}</Label>
              <Input
                id='admin-real-name-name'
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder={t('Enter real name')}
                disabled={isLoadingRecord}
                required
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='admin-real-name-idcard'>
                {t('ID Card Number')}
              </Label>
              <Input
                id='admin-real-name-idcard'
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                placeholder={t('Leave empty to keep current')}
                disabled={isLoadingRecord}
              />
              <p className='text-muted-foreground text-xs'>
                {t(
                  'Full ID card number is only shown when re-issuing. Leave empty to keep the current value.'
                )}
              </p>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='admin-real-name-status'>{t('Status')}</Label>
              <Select
                value={String(status)}
                onValueChange={(value) => setStatus(Number(value))}
                disabled={isLoadingRecord}
              >
                <SelectTrigger id='admin-real-name-status'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REAL_NAME_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='admin-real-name-provider'>
                {t('Provider')}
              </Label>
              <Input
                id='admin-real-name-provider'
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder='tencent_faceid'
                disabled={isLoadingRecord}
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='admin-real-name-description'>
                {t('Description')}
              </Label>
              <Input
                id='admin-real-name-description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('Optional note from the provider')}
                disabled={isLoadingRecord}
              />
            </div>
          </div>
        </form>
        <SheetFooter className={sideDrawerFooterClassName()}>
          <SheetClose render={<Button variant='outline' />}>
            {t('Cancel')}
          </SheetClose>
          <Button
            form='admin-real-name-form'
            type='submit'
            disabled={isSubmitting || isLoadingRecord}
          >
            {isSubmitting ? t('Saving...') : t('Save changes')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
