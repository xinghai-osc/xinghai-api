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
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Dialog } from '@/components/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ProviderBadge } from '@/components/provider-badge'
import { getVendors } from '../../api'
import { vendorsQueryKeys, modelsQueryKeys } from '../../lib'
import { handleDeleteVendor } from '../../lib/vendor-actions'
import { useModels } from '../models-provider'
import type { Vendor } from '../../types'

type VendorManagementDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VendorManagementDialog({
  open,
  onOpenChange,
}: VendorManagementDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { setOpen, setCurrentVendor } = useModels()
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<Vendor | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: vendorsQueryKeys.list({ page_size: 1000 }),
    queryFn: () => getVendors({ page_size: 1000 }),
    enabled: open,
  })

  const vendors = useMemo(
    () => data?.data?.items || [],
    [data?.data?.items]
  )

  const filteredVendors = useMemo(() => {
    if (!searchTerm.trim()) return vendors
    const keyword = searchTerm.toLowerCase().trim()
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(keyword) ||
        v.description?.toLowerCase().includes(keyword)
    )
  }, [vendors, searchTerm])

  const handleCreateVendor = () => {
    setCurrentVendor(null)
    onOpenChange(false)
    setOpen('create-vendor')
  }

  const handleEditVendor = (vendor: Vendor) => {
    setCurrentVendor(vendor)
    onOpenChange(false)
    setOpen('update-vendor')
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await handleDeleteVendor(deleteConfirm.id, queryClient, () => {
      queryClient.invalidateQueries({ queryKey: vendorsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: modelsQueryKeys.lists() })
    })
    setDeleteConfirm(null)
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={t('Manage Vendors')}
        description={t(
          'View, create, edit, or delete vendors in the system'
        )}
        contentClassName='flex max-h-[85vh] max-w-xl flex-col gap-3 p-4'
        headerClassName='flex-shrink-0 text-start'
        contentHeight='min(60vh, 600px)'
        bodyClassName='space-y-3'
      >
        {/* Search + Create */}
        <div className='flex items-center gap-2'>
          <div className='relative flex-1'>
            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('Search vendors...')}
              className='pl-9'
              aria-label={t('Search vendors')}
            />
            {searchTerm && (
              <Button
                variant='ghost'
                size='icon'
                className='absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2'
                onClick={() => setSearchTerm('')}
                aria-label={t('Clear search')}
              >
                <X className='h-3.5 w-3.5' />
              </Button>
            )}
          </div>
          <Button size='sm' onClick={handleCreateVendor}>
            <Plus className='h-4 w-4' />
            {t('Create Vendor')}
          </Button>
        </div>

        {/* Vendor List */}
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        ) : filteredVendors.length === 0 ? (
          <Empty className='border'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Search className='h-5 w-5' />
              </EmptyMedia>
              <EmptyTitle>
                {searchTerm
                  ? t('No matches found')
                  : t('No vendors found')}
              </EmptyTitle>
              <EmptyDescription>
                {searchTerm
                  ? t('Try adjusting your search.')
                  : t('Create your first vendor to get started.')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className='rounded-lg border'>
            <div className='divide-y'>
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className='flex items-center justify-between gap-3 p-3'
                >
                  <div className='min-w-0 flex-1'>
                    <ProviderBadge
                      iconKey={vendor.icon}
                      label={vendor.name}
                    />
                    {vendor.description && (
                      <p className='text-muted-foreground mt-1 truncate text-xs'>
                        {vendor.description}
                      </p>
                    )}
                  </div>
                  <div className='flex flex-shrink-0 items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      onClick={() => handleEditVendor(vendor)}
                      aria-label={t('Edit {{name}}', { name: vendor.name })}
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      className='text-destructive hover:text-destructive'
                      onClick={() => setDeleteConfirm(vendor)}
                      aria-label={t('Delete {{name}}', { name: vendor.name })}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className='bg-muted/40 text-muted-foreground flex items-center justify-between border-t px-3 py-2 text-sm'>
              <span>
                {t('{{count}} vendors', { count: filteredVendors.length })}
              </span>
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(v) => !v && setDeleteConfirm(null)}
        title={t('Delete Vendor')}
        desc={t(
          'Are you sure you want to delete vendor "{{name}}"? This action cannot be undone.',
          { name: deleteConfirm?.name || '' }
        )}
        confirmText={t('Delete')}
        destructive
        handleConfirm={handleDelete}
      />
    </>
  )
}
