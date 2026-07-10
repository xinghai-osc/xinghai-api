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
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface LogsMultiDeleteDialogProps<TData> {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
  onConfirm: () => void
  isDeleting: boolean
}

export function LogsMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
  onConfirm,
  isDeleting,
}: LogsMultiDeleteDialogProps<TData>) {
  const { t } = useTranslation()
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div className='mb-3 flex items-center gap-3'>
            <div className='bg-destructive/10 flex size-10 items-center justify-center rounded-full'>
              <AlertTriangle className='text-destructive size-5' />
            </div>
            <div>
              <DialogTitle>{t('Delete Logs')}</DialogTitle>
              <DialogDescription>
                {t(
                  'Are you sure you want to delete {{count}} log(s)? This action cannot be undone.',
                  { count: selectedCount }
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='max-h-[200px] overflow-y-auto rounded-md border p-2'>
          {selectedRows.map((row) => {
            const original = row.original as Record<string, unknown>
            return (
              <div
                key={String(original.id)}
                className='truncate px-2 py-1 text-sm'
              >
                #{String(original.id)} - {String(original.content ?? '')}
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t('Cancel')}
          </Button>
          <Button
            variant='destructive'
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? t('Deleting...') : t('Delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
