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

import type { AdminApiKey } from '../types'
import { deleteAdminTokenBatch } from '../api'
import { useAdminTokens } from './admin-tokens-provider'
import { AdminTokensMultiDeleteDialog } from './admin-tokens-multi-delete-dialog'
import { AdminTokensGroupSwitchDialog } from './admin-tokens-group-switch-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const { t } = useTranslation()
  const { triggerRefresh } = useAdminTokens()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showGroupSwitch, setShowGroupSwitch] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBatchDelete = async () => {
    if (selectedRows.length === 0) return
    setIsDeleting(true)
    try {
      const ids = selectedRows.map((row) => (row.original as AdminApiKey).id)
      const result = await deleteAdminTokenBatch(ids)
      if (result.success) {
        toast.success(
          t('Deleted {{count}} API key(s)', { count: result.data ?? ids.length })
        )
        table.resetRowSelection()
        triggerRefresh()
      } else {
        toast.error(result.message || t('Failed to delete API keys'))
      }
    } catch {
      toast.error(t('Failed to delete API keys'))
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='API key'>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                onClick={() => setShowGroupSwitch(true)}
                className='size-8'
                aria-label={t('Switch group')}
              />
            }
          >
            <span className='text-xs font-medium'>G</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Switch group')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='destructive'
                size='icon'
                onClick={() => setShowDeleteConfirm(true)}
                className='size-8'
                aria-label={t('Delete selected API keys')}
                disabled={isDeleting}
              />
            }
          >
            {isDeleting ? <Loader2 className='size-4 animate-spin' /> : <Trash2 />}
            <span className='sr-only'>{t('Delete selected API keys')}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('Delete selected API keys')}</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <AdminTokensGroupSwitchDialog
        open={showGroupSwitch}
        onOpenChange={setShowGroupSwitch}
        table={table}
      />

      <AdminTokensMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
        onConfirm={handleBatchDelete}
        isDeleting={isDeleting}
      />
    </>
  )
}
