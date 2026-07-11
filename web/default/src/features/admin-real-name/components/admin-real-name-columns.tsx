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
import type { ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { IdCard } from 'lucide-react'
import { formatTimestampToDate } from '@/lib/format'
import { BadgeCell } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { TableId } from '@/components/table-id'
import { REAL_NAME_STATUSES } from '../constants'
import type { AdminRealNameRecord } from '../types'

export function useAdminRealNameColumns(): ColumnDef<AdminRealNameRecord>[] {
  const { t } = useTranslation()
  return [
    {
      accessorKey: 'id',
      header: t('ID'),
      cell: ({ row }) => (
        <TableId value={row.getValue('id') as number} className='w-[60px]' />
      ),
      size: 80,
      meta: { mobileHidden: true },
    },
    {
      accessorKey: 'user_id',
      header: t('User ID'),
      cell: ({ row }) => {
        const record = row.original
        return (
          <div className='flex flex-col'>
            <TableId value={record.user_id} className='w-[60px]' />
            <span className='text-muted-foreground text-[11px]'>
              {record.username || record.display_name || '-'}
            </span>
          </div>
        )
      },
      size: 140,
      meta: { mobileTitle: true },
    },
    {
      accessorKey: 'real_name',
      header: t('Real Name'),
      cell: ({ row }) => (
        <div className='flex items-center gap-1.5'>
          <IdCard className='text-muted-foreground size-3.5' />
          <span className='font-medium'>{row.getValue('real_name')}</span>
        </div>
      ),
      size: 160,
    },
    {
      accessorKey: 'id_card_last_four',
      header: t('ID card ending'),
      cell: ({ row }) => {
        const lastFour = row.getValue('id_card_last_four') as string
        return (
          <BadgeCell className='font-mono'>
            {lastFour ? `**** ${lastFour}` : '-'}
          </BadgeCell>
        )
      },
      size: 120,
      meta: { mobileHidden: true },
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => {
        const config =
          REAL_NAME_STATUSES[row.getValue('status') as number]
        if (!config) return null
        return (
          <StatusBadge variant={config.variant} className='-ml-1.5'>
            {t(config.label)}
          </StatusBadge>
        )
      },
      filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
      size: 110,
      meta: { mobileBadge: true },
    },
    {
      accessorKey: 'provider',
      header: t('Provider'),
      cell: ({ row }) => (
        <span className='text-muted-foreground text-xs'>
          {row.getValue('provider') || '-'}
        </span>
      ),
      size: 140,
      meta: { mobileHidden: true },
    },
    {
      accessorKey: 'verified_at',
      header: t('Verified At'),
      cell: ({ row }) => {
        const ts = row.getValue('verified_at') as number
        if (!ts) {
          return <span className='text-muted-foreground text-xs'>-</span>
        }
        return (
          <span className='text-muted-foreground block truncate font-mono text-xs tabular-nums'>
            {formatTimestampToDate(ts)}
          </span>
        )
      },
      size: 180,
      meta: { mobileHidden: true },
    },
    {
      accessorKey: 'updated_at',
      header: t('Updated'),
      cell: ({ row }) => {
        const ts = row.getValue('updated_at') as number
        if (!ts) {
          return <span className='text-muted-foreground text-xs'>-</span>
        }
        return (
          <span className='text-muted-foreground block truncate font-mono text-xs tabular-nums'>
            {formatTimestampToDate(ts)}
          </span>
        )
      },
      size: 180,
      meta: { mobileHidden: true },
    },
  ]
}
