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
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useTableUrlState, type NavigateFn } from '@/hooks/use-table-url-state'
import {
  DataTablePage,
  useDataTable,
} from '@/components/data-table'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { getAdminTopups } from '../api'
import type { AdminTopup } from '../types'
import { useAdminTopupsColumns } from './admin-topups-columns'

const ADMIN_TOPUPS_COLUMN_VISIBILITY_STORAGE_KEY =
  'admin-topups:column-visibility'

function AdminTopupsMobileSkeleton() {
  return (
    <div className='divide-border overflow-hidden rounded-lg border'>
      {Array.from({ length: 5 }, (_, index) => `topup-skeleton-${index}`).map((key) => (
        <div key={key} className='space-y-2 border-b px-3 py-2.5 last:border-b-0'>
          <Skeleton className='h-4 w-48' />
          <Skeleton className='h-3 w-32' />
          <div className='flex items-center justify-between gap-3'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-5 w-16 rounded-md' />
          </div>
        </div>
      ))}
    </div>
  )
}

function AdminTopupsMobileList({ rows, isLoading }: { rows: AdminTopup[]; isLoading: boolean }) {
  const { t } = useTranslation()

  if (isLoading) return <AdminTopupsMobileSkeleton />

  if (!rows.length) {
    return (
      <div className='text-muted-foreground flex min-h-40 flex-col items-center justify-center py-10 text-center'>
        <p className='text-sm font-medium'>{t('No orders found')}</p>
      </div>
    )
  }

  return (
    <div className='divide-border overflow-hidden rounded-lg border'>
      {rows.map((topup) => (
        <div key={topup.id} className='bg-card space-y-2 border-b px-3 py-2.5 last:border-b-0'>
          <div className='truncate font-mono text-xs font-medium'>
            {topup.trade_no}
          </div>
          <div className='text-xs text-muted-foreground'>
            {topup.username || '-'} ({t('User ID')}: {topup.user_id})
          </div>
          <div className='flex items-center justify-between gap-2 text-sm'>
            <span className='font-semibold'>{topup.amount}</span>
            <span className='font-semibold tabular-nums text-red-600'>
              {topup.money}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

interface AdminTopupsTableProps {
  routeSearch?: Record<string, unknown>
  routeNavigate?: NavigateFn
}

export function AdminTopupsTable(props: AdminTopupsTableProps) {
  const { t } = useTranslation()
  const columns = useAdminTopupsColumns()

  const tableUrlState = useTableUrlState({
    search: props.routeSearch ?? {},
    navigate: props.routeNavigate ?? (() => {}),
    pagination: { defaultPage: 1, defaultPageSize: 20 },
    globalFilter: { enabled: true, key: 'filter' },
  })

  const {
    globalFilter,
    onGlobalFilterChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = tableUrlState

  const keyword = globalFilter?.trim() || ''

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'admin-topups',
      pagination.pageIndex + 1,
      pagination.pageSize,
      keyword,
    ],
    queryFn: async () => {
      const result = await getAdminTopups(
        pagination.pageIndex + 1,
        pagination.pageSize,
        keyword || undefined
      )

      if (!result.success) {
        toast.error(result.message || t('Failed to load orders'))
        return { items: [], total: 0 }
      }

      return {
        items: result.data?.items || [],
        total: result.data?.total || 0,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const topups = data?.items || []

  const { table } = useDataTable({
    data: topups,
    columns,
    columnVisibilityStorageKey: ADMIN_TOPUPS_COLUMN_VISIBILITY_STORAGE_KEY,
    globalFilter,
    pagination,
    globalFilterFn: () => true,
    onPaginationChange,
    onGlobalFilterChange,
    manualPagination: true,
    totalCount: data?.total || 0,
    ensurePageInRange,
  })

  return (
    <DataTablePage
      table={table}
      columns={columns}
      isLoading={isLoading}
      isFetching={isFetching}
      emptyTitle={t('No orders found')}
      emptyDescription={t('Adjust your search or check back later')}
      skeletonKeyPrefix='topup-skeleton'
      applyHeaderSize
      toolbarProps={{
        searchPlaceholder: t('Search by order number or username...'),
        additionalSearch: (
          <Input
            placeholder={t('Search by order number, username, or user ID...')}
            aria-label={t('Search...')}
            value={globalFilter ?? ''}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            className='w-full sm:w-80'
          />
        ),
      }}
      mobile={
        <AdminTopupsMobileList rows={topups} isLoading={isLoading} />
      }
    />
  )
}