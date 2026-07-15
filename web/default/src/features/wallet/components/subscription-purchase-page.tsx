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
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { getSelf } from '@/lib/api'
import { SectionPageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatQuota } from '@/lib/format'
import { SubscriptionPlansCard } from './subscription-plans-card'
import { useTopupInfo } from '../hooks'
import type { UserWalletData } from '../types'

export function SubscriptionPurchasePage() {
  const { t } = useTranslation()
  const [user, setUser] = useState<UserWalletData | null>(null)
  const { topupInfo } = useTopupInfo()

  const fetchUser = useCallback(async () => {
    const response = await getSelf().catch(() => null)
    if (response?.success && response.data) {
      setUser(response.data as UserWalletData)
    }
  }, [])

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Purchase Subscription')}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button variant='outline' render={<Link to='/wallet' />}>
          {t('Recharge Balance')}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='mx-auto w-full max-w-5xl'>
          <Card className='mb-4'>
            <CardContent className='flex flex-wrap items-center justify-between gap-3 p-4'>
              <div>
                <p className='text-muted-foreground text-xs'>
                  {t('Available Balance')}
                </p>
                <p className='mt-1 text-xl font-semibold'>
                  {formatQuota(user?.quota ?? 0)}
                </p>
              </div>
              <Button variant='outline' render={<Link to='/wallet' />}>
                {t('Recharge Balance')}
              </Button>
            </CardContent>
          </Card>
          <SubscriptionPlansCard
            topupInfo={topupInfo}
            userQuota={user?.quota}
            onPurchaseSuccess={fetchUser}
          />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
