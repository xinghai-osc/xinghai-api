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
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuota } from '@/lib/format'

import type { UserWalletData } from '../types'

interface WalletStatsCardProps {
  user: UserWalletData | null
  loading?: boolean
}

export function WalletStatsCard(props: WalletStatsCardProps) {
  const { t } = useTranslation()

  if (props.loading) {
    return (
      <Card data-card-hover='false' className='gap-0 py-0'>
        <div className='divide-border/60 grid grid-cols-3 divide-x'>
          {['balance', 'usage', 'requests'].map((key) => (
            <div key={key} className='px-4 py-3 sm:px-5 sm:py-4'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='mt-2 h-7 w-28' />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const stats = [
    {
      label: t('Current Balance'),
      value: formatQuota(props.user?.quota ?? 0),
    },
    {
      label: t('Total Usage'),
      value: formatQuota(props.user?.used_quota ?? 0),
    },
    {
      label: t('API Requests'),
      value: (props.user?.request_count ?? 0).toLocaleString(),
    },
  ]

  return (
    <Card data-card-hover='false' className='relative overflow-hidden py-0'>
      <div className='absolute inset-0 bg-gradient-to-r from-warning/5 via-transparent to-success/5' aria-hidden='true' />
      <div className='relative divide-border/60 grid grid-cols-3 divide-x'>
        {stats.map((item, index) => (
          <div key={item.label} className='min-w-0 px-4 py-3 sm:px-5 sm:py-4'>
            <div className='text-muted-foreground truncate text-sm'>
              {item.label}
            </div>
            <div
              className={
                index === 0
                  ? 'text-foreground mt-1 truncate text-lg font-semibold tracking-tight tabular-nums sm:text-2xl'
                  : 'text-foreground mt-1 truncate text-lg font-semibold tracking-tight tabular-nums sm:text-2xl'
              }
            >
              {index === 0 ? (
                <span className='bg-gradient-to-r from-warning/80 via-foreground to-foreground bg-clip-text text-transparent'>
                  {item.value}
                </span>
              ) : (
                item.value
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
