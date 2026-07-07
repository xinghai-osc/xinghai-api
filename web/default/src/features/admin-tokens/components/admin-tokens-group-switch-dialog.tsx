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
import { useState, useEffect, useCallback } from 'react'
import type { Table } from '@tanstack/react-table'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { AdminApiKey } from '../types'
import { updateAdminToken } from '../api'
import { useAdminTokens } from './admin-tokens-provider'

interface AdminTokensGroupSwitchDialogProps<TData> {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function AdminTokensGroupSwitchDialog<TData>({
  open,
  onOpenChange,
  table,
}: AdminTokensGroupSwitchDialogProps<TData>) {
  const { t } = useTranslation()
  const { triggerRefresh } = useAdminTokens()
  const [group, setGroup] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  // Reset group input when dialog opens
  useEffect(() => {
    if (open) {
      setGroup('')
    }
  }, [open])

  const handleConfirm = useCallback(async () => {
    if (!group.trim()) {
      toast.error(t('Please enter a group name'))
      return
    }
    if (selectedRows.length === 0) return

    setIsUpdating(true)
    const ids = selectedRows.map((row) => (row.original as AdminApiKey).id)
    const newGroup = group.trim()

    let successCount = 0
    let failCount = 0

    for (const id of ids) {
      try {
        const result = await updateAdminToken({ id, group: newGroup })
        if (result.success) {
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    setIsUpdating(false)
    onOpenChange(false)

    if (failCount === 0) {
      toast.success(
        t('Switched group for {{count}} API key(s)', { count: successCount })
      )
    } else {
      toast.warning(
        t(
          'Switched group for {{success}} key(s), {{fail}} failed',
          { success: successCount, fail: failCount }
        )
      )
    }

    table.resetRowSelection()
    triggerRefresh()
  }, [group, selectedRows, triggerRefresh, t, onOpenChange, table])

  // Handle Enter key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isUpdating && group.trim()) {
        handleConfirm()
      }
    },
    [handleConfirm, isUpdating, group]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='sm:max-w-md'
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>
            {t('Switch Group for {{count}} API Key(s)', {
              count: selectedCount,
            })}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Enter a new group name. All selected API keys will be moved to this group.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 py-3'>
          <div className='space-y-2'>
            <Label htmlFor='group-name'>{t('Group Name')}</Label>
            <Input
              id='group-name'
              placeholder={t('e.g. group_1')}
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              autoFocus
              disabled={isUpdating}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!group.trim() || isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className='mr-2 size-4 animate-spin' />
                {t('Updating...')}
              </>
            ) : (
              t('Confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
