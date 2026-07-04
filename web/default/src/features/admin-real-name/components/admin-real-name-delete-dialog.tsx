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
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteAdminRealNameRecord } from '../api'
import { ERROR_MESSAGES } from '../constants'
import { useAdminRealName } from './admin-real-name-provider'

export function AdminRealNameDeleteDialog() {
  const { t } = useTranslation()
  const { deletingRecord, closeDeleteDialog, triggerRefresh } =
    useAdminRealName()
  const open = !!deletingRecord
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    if (!deletingRecord) return
    setIsLoading(true)
    try {
      const res = await deleteAdminRealNameRecord(deletingRecord.user_id)
      if (res.success) {
        toast.success(t('Real-name record deleted successfully'))
        closeDeleteDialog()
        triggerRefresh()
      } else {
        toast.error(res.message || t(ERROR_MESSAGES.DELETE_FAILED))
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t(ERROR_MESSAGES.UNEXPECTED)
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeDeleteDialog()
      }}
      title={t('Delete Real-name Record?')}
      desc={
        deletingRecord
          ? t(
              'This will permanently clear the real-name record for user {{user}} ({{id}}). The user will need to verify again.',
              {
                user:
                  deletingRecord.username ||
                  deletingRecord.display_name ||
                  '-',
                id: deletingRecord.user_id,
              }
            )
          : t('This action cannot be undone.')
      }
      destructive
      isLoading={isLoading}
      confirmText={t('Delete')}
      handleConfirm={handleConfirm}
    />
  )
}
