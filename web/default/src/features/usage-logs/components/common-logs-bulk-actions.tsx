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
import type { Table } from '@tanstack/react-table'
import { Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { batchDeleteLogs } from '../api'
import { LogsMultiDeleteDialog } from './logs-multi-delete-dialog'

interface CommonLogsBulkActionsProps<TData> {
  table: Table<TData>
  triggerRefresh: () => void
}

export function CommonLogsBulkActions<TData>({
  table,
  triggerRefresh,
}: CommonLogsBulkActionsProps<TData>) {
  const { t } = useTranslation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBatchDelete = async () => {
    if (selectedRows.length === 0) return
    setIsDeleting(true)
    try {
      const ids = selectedRows.map(
        (row) => (row.original as Record<string, unknown>).id as number
      )
      const result = await batchDeleteLogs(ids)
      if (result.success) {
        toast.success(
          t('Deleted {{count}} log(s)', { count: result.data ?? ids.length })
        )
        table.resetRowSelection()
        triggerRefresh()
      } else {
        toast.error(result.message || t('Failed to delete logs'))
      }
    } catch {
      toast.error(t('Failed to delete logs'))
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='log'>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='destructive'
                size='icon'
                onClick={() => setShowDeleteConfirm(true)}
                className='size-8'
                aria-label={t('Delete selected logs')}
                disabled={isDeleting}
              />
            }
          >
            {isDeleting ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Trash2 />
            )}
            <span className='sr-only'>{t('Delete selected logs')}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Delete selected logs')}</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <LogsMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
        onConfirm={handleBatchDelete}
        isDeleting={isDeleting}
      />
    </>
  )
}
