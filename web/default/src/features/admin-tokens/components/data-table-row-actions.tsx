import type { Row } from '@tanstack/react-table'
import {
  Trash2,
  Edit,
  Power,
  PowerOff,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { DataTableRowActionMenu } from '@/components/data-table/core/row-action-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { updateAdminToken, deleteAdminToken, resetAdminToken } from '../api'
import { API_KEY_STATUS } from '../constants'
import { adminApiKeySchema, type AdminApiKey } from '../types'
import { useAdminTokens } from './admin-tokens-provider'
import { AdminTokensMutateDrawer } from './admin-tokens-mutate-drawer'

type DataTableRowActionsProps<TData> = {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const { t } = useTranslation()
  const apiKey = adminApiKeySchema.parse(row.original)
  const { triggerRefresh } = useAdminTokens()
  const isEnabled = apiKey.status === API_KEY_STATUS.ENABLED
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const toggleLabel = isEnabled ? t('Disable') : t('Enable')

  const handleToggleStatus = useCallback(async () => {
    const newStatus = isEnabled
      ? API_KEY_STATUS.DISABLED
      : API_KEY_STATUS.ENABLED

    setIsTogglingStatus(true)
    try {
      const result = await updateAdminToken({
        id: apiKey.id,
        status: newStatus,
      })
      if (result.success) {
        toast.success(
          isEnabled
            ? t('API Key disabled successfully')
            : t('API Key enabled successfully')
        )
        triggerRefresh()
      } else {
        toast.error(result.message || t('Failed to update API key status'))
      }
    } catch {
      toast.error(t('An unexpected error occurred'))
    } finally {
      setIsTogglingStatus(false)
    }
  }, [apiKey.id, isEnabled, t, triggerRefresh])

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      const result = await deleteAdminToken(apiKey.id)
      if (result.success) {
        toast.success(t('API Key deleted successfully'))
        triggerRefresh()
      } else {
        toast.error(result.message || t('Failed to delete API key'))
      }
    } catch {
      toast.error(t('An unexpected error occurred'))
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }, [apiKey.id, t, triggerRefresh])

  const handleReset = useCallback(async () => {
    setIsResetting(true)
    try {
      const result = await resetAdminToken(apiKey.id)
      if (result.success) {
        toast.success(t('API Key quota reset successfully'))
        triggerRefresh()
      } else {
        toast.error(result.message || t('Failed to reset API key quota'))
      }
    } catch {
      toast.error(t('An unexpected error occurred'))
    } finally {
      setIsResetting(false)
      setShowResetConfirm(false)
    }
  }, [apiKey.id, t, triggerRefresh])

  let statusIcon = <Power className='size-4' />
  if (isTogglingStatus) {
    statusIcon = <Loader2 className='size-4 animate-spin' />
  } else if (isEnabled) {
    statusIcon = <PowerOff className='size-4' />
  }

  return (
    <>
      <div className='-ml-1.5 flex items-center gap-1'>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={handleToggleStatus}
                disabled={isTogglingStatus}
                aria-label={toggleLabel}
                className={
                  isEnabled
                    ? 'text-destructive hover:text-destructive'
                    : 'text-emerald-600 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-400'
                }
              />
            }
          >
            {statusIcon}
          </TooltipTrigger>
          <TooltipContent>{toggleLabel}</TooltipContent>
        </Tooltip>

        <DataTableRowActionMenu
          ariaLabel={t('Open menu')}
          contentClassName='w-[200px]'
          modal={false}
        >
          <DropdownMenuItem onClick={() => setShowEditDrawer(true)}>
            <Edit className='mr-2 size-4' />
            {t('Rename')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowResetConfirm(true)}
            disabled={apiKey.used_quota <= 0}
          >
            <RotateCcw className='mr-2 size-4' />
            {t('Reset Quota')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteConfirm(true)}
            className='text-destructive focus:text-destructive'
          >
            <Trash2 className='mr-2 size-4' />
            {t('Delete')}
          </DropdownMenuItem>
        </DataTableRowActionMenu>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('Delete API Key')}</DialogTitle>
            <DialogDescription>
              {t(
                'Are you sure you want to delete this key? This action cannot be undone.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? t('Deleting...') : t('Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminTokensMutateDrawer
        open={showEditDrawer}
        onOpenChange={setShowEditDrawer}
        currentRow={apiKey}
      />

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <div className='mb-3 flex items-center gap-3'>
              <div className='bg-warning/10 flex size-10 items-center justify-center rounded-full'>
                <RotateCcw className='text-warning size-5' />
              </div>
              <div>
                <DialogTitle>{t('Reset API Key Quota')}</DialogTitle>
                <DialogDescription>
                  {t(
                    'This will reset the used quota ({{used}}) back to available quota. The key will be re-enabled if it was exhausted.',
                    { used: apiKey.used_quota }
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowResetConfirm(false)}
              disabled={isResetting}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant='default'
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className='mr-2 size-4 animate-spin' />
                  {t('Resetting...')}
                </>
              ) : (
                t('Reset')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
