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
import { useEffect, useState } from 'react'
import { BadgeCheck, IdCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import { getRealNameStatus, verifyRealName } from '../api'
import type { RealNameStatusResponse } from '../types'

interface RealNameCardProps {
  enabled: boolean
}

export function RealNameCard({ enabled }: RealNameCardProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<RealNameStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [idCard, setIdCard] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadStatus() {
      try {
        setLoading(true)
        const response = await getRealNameStatus()
        if (mounted && response.success && response.data) {
          setStatus(response.data)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (enabled) {
      loadStatus()
    } else {
      setLoading(false)
    }
    return () => {
      mounted = false
    }
  }, [enabled])

  if (!enabled) return null

  if (loading) {
    return (
      <Card className='gap-0 overflow-hidden py-0'>
        <CardHeader className='border-b p-3 !pb-3 sm:p-5 sm:!pb-5'>
          <Skeleton className='h-6 w-40' />
          <Skeleton className='mt-2 h-4 w-64' />
        </CardHeader>
        <CardContent className='space-y-3 p-3 sm:p-5'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </CardContent>
      </Card>
    )
  }

  const verified = status?.verified && status.record?.status === 1

  const handleSubmit = async () => {
    if (!name.trim() || !idCard.trim()) {
      toast.error(t('Please enter your real name and ID card number'))
      return
    }
    try {
      setSubmitting(true)
      const response = await verifyRealName({
        name: name.trim(),
        id_card: idCard.trim(),
      })
      if (response.success) {
        toast.success(t('Real-name verification completed'))
        const latest = await getRealNameStatus()
        if (latest.success && latest.data) setStatus(latest.data)
        setIdCard('')
      } else {
        toast.error(response.message || t('Real-name verification failed'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <TitledCard
      title={t('Real-name Verification')}
      description={t('Verify your identity through Tencent Cloud FaceID')}
      icon={<IdCard className='h-4 w-4' />}
    >
      {verified ? (
        <div className='flex items-center gap-3 rounded-lg border p-4'>
          <div className='bg-success/10 text-success rounded-md p-2'>
            <BadgeCheck className='h-5 w-5' />
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-medium'>{t('Verified')}</p>
            <p className='text-muted-foreground text-xs'>
              {t('Name')}: {status.record?.real_name} · {t('ID card ending')}: {status.record?.id_card_last_four}
            </p>
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='real-name'>{t('Real Name')}</Label>
              <Input
                id='real-name'
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete='name'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='id-card'>{t('ID Card Number')}</Label>
              <Input
                id='id-card'
                value={idCard}
                onChange={(event) => setIdCard(event.target.value)}
                autoComplete='off'
              />
            </div>
          </div>
          <p className='text-muted-foreground text-xs'>
            {t('Your full ID card number is only sent to Tencent Cloud for verification and is not stored locally')}
          </p>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? t('Verifying...') : t('Verify Now')}
          </Button>
        </div>
      )}
    </TitledCard>
  )
}
