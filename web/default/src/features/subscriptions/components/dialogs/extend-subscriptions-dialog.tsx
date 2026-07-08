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
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { extendPlanSubscriptions } from '../../api'
import { DURATION_UNITS } from '../../constants'
import type { ExtendPlanSubscriptionsRequest } from '../../types'
import { useSubscriptions } from '../subscriptions-provider'

export function ExtendSubscriptionsDialog() {
  const { t } = useTranslation()
  const { open, setOpen, currentRow, triggerRefresh } = useSubscriptions()
  const [durationUnit, setDurationUnit] =
    useState<ExtendPlanSubscriptionsRequest['duration_unit']>('day')
  const [durationValue, setDurationValue] = useState('1')
  const [customSeconds, setCustomSeconds] = useState('')
  const [extending, setExtending] = useState(false)
  const isOpen = open === 'extend-subscriptions'
  const plan = currentRow?.plan
  const planLabel = plan?.title || (plan?.id ? `#${plan.id}` : '-')
  const isCustom = durationUnit === 'custom'
  const parsedDurationValue = Number.parseInt(durationValue, 10)
  const parsedCustomSeconds = Number.parseInt(customSeconds, 10)
  const disabled =
    !plan?.id ||
    (isCustom
      ? !Number.isInteger(parsedCustomSeconds) || parsedCustomSeconds <= 0
      : !Number.isInteger(parsedDurationValue) || parsedDurationValue <= 0)

  useEffect(() => {
    if (!isOpen) return
    setDurationUnit('day')
    setDurationValue('1')
    setCustomSeconds('')
  }, [isOpen])

  const handleConfirm = async () => {
    if (!plan?.id || disabled) return
    setExtending(true)
    try {
      const res = await extendPlanSubscriptions(plan.id, {
        duration_unit: durationUnit,
        duration_value: isCustom ? 0 : parsedDurationValue,
        custom_seconds: isCustom ? parsedCustomSeconds : 0,
      })
      if (res.success) {
        toast.success(
          t('Extended {{count}} active subscriptions', {
            count: res.data?.updated_count || 0,
          })
        )
        triggerRefresh()
        setOpen(null)
      }
    } catch {
      toast.error(t('Operation failed'))
    } finally {
      setExtending(false)
    }
  }

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(nextOpen) => !nextOpen && setOpen(null)}
      title={t('Extend subscriptions')}
      desc={t('Extend all active subscriptions under {{plan}}?', {
        plan: planLabel,
      })}
      confirmText={t('Extend')}
      handleConfirm={handleConfirm}
      disabled={disabled}
      isLoading={extending}
    >
      <div className='grid gap-3 text-sm'>
        <label className='grid gap-1.5'>
          <span>{t('Duration unit')}</span>
          <Select
            value={durationUnit}
            onValueChange={(value) =>
              setDurationUnit(
                value as ExtendPlanSubscriptionsRequest['duration_unit']
              )
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {DURATION_UNITS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {t(unit.labelKey)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>
        {isCustom ? (
          <label className='grid gap-1.5'>
            <span>{t('Custom seconds')}</span>
            <Input
              type='number'
              min={1}
              step={1}
              value={customSeconds}
              onChange={(event) => setCustomSeconds(event.target.value)}
              placeholder={t('Enter seconds')}
            />
          </label>
        ) : (
          <label className='grid gap-1.5'>
            <span>{t('Duration value')}</span>
            <Input
              type='number'
              min={1}
              step={1}
              value={durationValue}
              onChange={(event) => setDurationValue(event.target.value)}
              placeholder={t('Enter duration')}
            />
          </label>
        )}
      </div>
    </ConfirmDialog>
  )
}
