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
import { type Row } from '@tanstack/react-table'
import { Database, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DataTablePage,
  useDataTable,
} from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useTableUrlState, type NavigateFn } from '@/hooks/use-table-url-state'
import { listAdminRealNameRecords } from '../api'
import { ERROR_MESSAGES, REAL_NAME_STATUSES } from '../constants'
import { type AdminRealNameRecord } from '../types'
import { useAdminRealName } from './admin-real-name-provider'
import { useAdminRealNameColumns } from './admin-real-name-columns'

const ADMIN_REAL_NAME_COLUMN_VISIBILITY_STORAGE_KEY =
  'admin-real-name:column-visibility'

function AdminRealNameMobileSkeleton() {
  return (
    <div className='divide-border overflow-hidden rounded-lg border'>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className='space-y-2 border-b px-3 py-2.5 last:border-b-0'
        >
          <div className='flex items-center justify-between'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-5 w-16 rounded-md' />
          </div>
          <div className='flex items-center justify-between gap-3'>
            <Skeleton className='h-3 w-24' />
          </div>
        </div>
      ))}
    </div>
  )
}

function AdminRealNameMobileList({
  rows,
  isLoading,
}: {
  rows: AdminRealNameRecord[]
  isLoading: boolean
}) {
  const { t } = useTranslation()
  const { openEditDialog, openDeleteDialog } = useAdminRealName()

  if (isLoading) return <AdminRealNameMobileSkeleton />

  if (!rows.length) {
    return (
      <div className='rounded-lg border p-8'>
        <Empty className='border-none p-0'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Database className='size-6' />
            </EmptyMedia>
            <EmptyTitle>{t('No Real-name Records Found')}</EmptyTitle>
            <EmptyDescription>
              {t('No real-name records available.')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className='divide-border overflow-hidden rounded-lg border'>
      {rows.map((record) => {
        const statusConfig = REAL_NAME_STATUSES[record.status]
        return (
          <div
            key={record.id}
            className='bg-card space-y-2 border-b px-3 py-2.5 last:border-b-0'
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <div className='truncate text-sm font-semibold'>
                  {record.real_name || '-'}
                </div>
                <div className='text-muted-foreground text-[11px]'>
                  {t('User ID')}: {record.user_id} ·{' '}
                  {record.username || record.display_name || '-'}
                </div>
              </div>
              {statusConfig && (
                <StatusBadge
                  label={t(statusConfig.label)}
                  variant={statusConfig.variant}
                  copyable={false}
                />
              )}
            </div>
            <div className='flex items-center justify-end gap-1.5'>
              <Button
                variant='ghost'
                size='icon'
                className='size-7'
                onClick={() => openEditDialog(record)}
                aria-label={t('Edit')}
              >
                <Pencil className='size-3.5' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='size-7 text-destructive hover:text-destructive'
                onClick={() => openDeleteDialog(record)}
                aria-label={t('Delete')}
              >
                <Trash2 className='size-3.5' />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RowActions({ row }: { row: Row<AdminRealNameRecord> }) {
  const { t } = useTranslation()
  const { openEditDialog, openDeleteDialog } = useAdminRealName()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant='ghost' size='icon' className='size-7' />
        }
      >
        <MoreHorizontal className='size-4' />
        <span className='sr-only'>{t('Actions')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => openEditDialog(row.original)}>
          <Pencil className='size-3.5' />
          {t('Edit')}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant='destructive'
          onClick={() => openDeleteDialog(row.original)}
        >
          <Trash2 className='size-3.5' />
          {t('Delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface AdminRealNameTableProps {
  routeSearch?: Record<string, unknown>
  routeNavigate?: NavigateFn
}

export function AdminRealNameTable(props: AdminRealNameTableProps) {
  const { t } = useTranslation()
  const { refreshTrigger } = useAdminRealName()
  const baseColumns = useAdminRealNameColumns()
  const columns = [
    ...baseColumns,
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: Row<AdminRealNameRecord> }) => (
        <RowActions row={row} />
      ),
      size: 60,
      enableSorting: false,
      enableHiding: false,
    },
  ]

  const tableUrlState = useTableUrlState({
    search: props.routeSearch ?? {},
    navigate: props.routeNavigate ?? (() => {}),
    pagination: { defaultPage: 1, defaultPageSize: 20 },
    globalFilter: { enabled: true, key: 'keyword' },
    columnFilters: [
      { columnId: 'status', searchKey: 'status', type: 'array' },
    ],
  })

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = tableUrlState

  // Extract a single status filter value (the API expects a single int).
  const statusFilterRaw = columnFilters.find((f) => f.id === 'status')?.value
  const statusFilter = Array.isArray(statusFilterRaw)
    ? statusFilterRaw[0]
    : statusFilterRaw

  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'admin-real-name',
      pagination.pageIndex + 1,
      pagination.pageSize,
      globalFilter,
      statusFilter,
      refreshTrigger,
    ],
    queryFn: async () => {
      const result = await listAdminRealNameRecords({
        keyword: globalFilter,
        status: statusFilter != null ? Number(statusFilter) : undefined,
        p: pagination.pageIndex + 1,
        size: pagination.pageSize,
      })
      if (!result.success) {
        toast.error(result.message || t(ERROR_MESSAGES.LOAD_FAILED))
        return { items: [], total: 0 }
      }
      return {
        items: result.data?.items || [],
        total: result.data?.total || 0,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const items = data?.items || []

  const { table } = useDataTable({
    data: items,
    columns,
    columnFilters,
    columnVisibilityStorageKey: ADMIN_REAL_NAME_COLUMN_VISIBILITY_STORAGE_KEY,
    globalFilter,
    pagination,
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
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
      emptyTitle={t('No Real-name Records Found')}
      emptyDescription={t('No real-name records available.')}
      skeletonKeyPrefix='admin-real-name-skeleton'
      applyHeaderSize
      toolbarProps={{
        searchPlaceholder: t(
          'Search by username, display name, or user ID...'
        ),
        filters: [
          {
            columnId: 'status',
            title: t('Status'),
            options: REAL_NAME_STATUS_OPTIONS,
            singleSelect: true,
          },
        ],
      }}
      mobile={<AdminRealNameMobileList rows={items} isLoading={isLoading} />}
    />
  )
}
