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
import { formatTimestampToDate, formatNumber } from '@/lib/format'
import { formatCurrencyFromUSD } from '@/lib/currency'
import { StatusBadge } from '@/components/status-badge'
import { TruncatedCell } from '@/components/data-table'
import { TableId } from '@/components/table-id'
import type { AdminTopup } from '../types'

const STATUS_CONFIG: Record<string, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  success: { variant: 'success', label: 'Success' },
  pending: { variant: 'warning', label: 'Pending' },
  expired: { variant: 'danger', label: 'Expired' },
}

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  stripe: 'Stripe',
  alipay: 'Alipay',
  wxpay: 'WeChat Pay',
  waffo: 'Waffo',
}

export function useAdminTopupsColumns(): ColumnDef<AdminTopup>[] {
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
      accessorKey: 'trade_no',
      header: t('Order No.'),
      cell: ({ row }) => (
        <TruncatedCell className='font-mono text-xs'>
          {row.getValue('trade_no')}
        </TruncatedCell>
      ),
      size: 220,
      meta: { mobileTitle: true },
    },
    {
      accessorKey: 'username',
      header: t('User'),
      cell: ({ row }) => {
        const topup = row.original
        return (
          <div className='min-w-0 space-y-0.5'>
            <div className='truncate text-sm font-medium'>
              {topup.username || '-'}
            </div>
            <div className='text-muted-foreground text-xs'>
              {t('User ID')}: {topup.user_id}
            </div>
          </div>
        )
      },
      size: 180,
    },
    {
      accessorKey: 'amount',
      header: t('Amount'),
      cell: ({ row }) => (
        <span className='font-semibold tabular-nums'>
          {formatCurrencyFromUSD(row.getValue('amount') as number, {
            digitsLarge: 2,
            digitsSmall: 2,
            abbreviate: false,
          })}
        </span>
      ),
      size: 130,
    },
    {
      accessorKey: 'money',
      header: t('Payment'),
      cell: ({ row }) => (
        <span className='font-semibold tabular-nums text-red-600'>
          {formatNumber(row.getValue('money') as number)}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: 'payment_method',
      header: t('Payment Method'),
      cell: ({ row }) => {
        const method = row.getValue('payment_method') as string
        const name = PAYMENT_METHOD_NAMES[method] || method
        return <span className='text-sm font-medium'>{t(name)}</span>
      },
      size: 150,
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const config = STATUS_CONFIG[status]
        if (!config) return <span className='text-sm'>{status}</span>
        return (
          <StatusBadge variant={config.variant} showDot className='-ml-1.5'>
            {t(config.label)}
          </StatusBadge>
        )
      },
      size: 120,
      meta: { mobileBadge: true },
    },
    {
      accessorKey: 'create_time',
      header: t('Created'),
      cell: ({ row }) => (
        <span className='text-muted-foreground block truncate font-mono text-xs tabular-nums'>
          {formatTimestampToDate(row.getValue('create_time') as number)}
        </span>
      ),
      size: 180,
      meta: { mobileHidden: true },
    },
    {
      accessorKey: 'complete_time',
      header: t('Completed'),
      cell: ({ row }) => {
        const time = row.getValue('complete_time') as number
        if (!time) return <span className='text-muted-foreground text-xs'>-</span>
        return (
          <span className='text-muted-foreground block truncate font-mono text-xs tabular-nums'>
            {formatTimestampToDate(time)}
          </span>
        )
      },
      size: 180,
      meta: { mobileHidden: true },
    },
  ]
}