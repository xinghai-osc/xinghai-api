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
import { ArrowUpRight, Crown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Dialog } from '@/components/dialog'
import { GroupBadge } from '@/components/group-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useSystemConfig } from '@/hooks/use-system-config'
import { formatLocalCurrencyAmount } from '@/lib/currency'
import { formatQuota } from '@/lib/format'
import { DEFAULT_CURRENCY_CONFIG } from '@/stores/system-config-store'

import {
  getSubscriptionUpgradeQuote,
  paySubscriptionStripe,
  paySubscriptionCreem,
  paySubscriptionEpay,
  paySubscriptionWaffoPancake,
  upgradeSubscriptionBalance,
} from '../../api'
import { formatDuration } from '../../lib'
import type { PlanRecord } from '../../types'

interface PaymentMethod {
  type: string
  name?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceSubscriptionId: number
  sourcePlanTitle: string
  sourcePriceAmount: number
  plans: PlanRecord[]
  enableStripe?: boolean
  enableCreem?: boolean
  enableWaffoPancake?: boolean
  enableOnlineTopUp?: boolean
  epayMethods?: PaymentMethod[]
  userQuota?: number
  onUpgradeSuccess?: () => void | Promise<void>
}

export function SubscriptionUpgradeDialog(props: Props) {
  const { t } = useTranslation()
  const { currency } = useSystemConfig()
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [quoteDue, setQuoteDue] = useState<number | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [selectedEpayMethod, setSelectedEpayMethod] = useState('')

  useEffect(() => {
    if (props.open && props.epayMethods && props.epayMethods.length > 0) {
      setSelectedEpayMethod(props.epayMethods[0].type)
    } else if (!props.open) {
      setSelectedEpayMethod('')
    }
  }, [props.open, props.epayMethods])

  const quotaPerUnit =
    currency?.quotaPerUnit && currency.quotaPerUnit > 0
      ? currency.quotaPerUnit
      : DEFAULT_CURRENCY_CONFIG.quotaPerUnit

  // Candidate plans are more expensive enabled plans other than the source plan.
  const candidatePlans = props.plans.filter((p) => {
    const plan = p?.plan
    if (!plan?.enabled) return false
    return plan.price_amount > props.sourcePriceAmount
  })

  const selectedPlan = candidatePlans.find((p) => p.plan.id === selectedPlanId)

  const handleSelectPlan = async (planId: number) => {
    setSelectedPlanId(planId)
    setQuoteDue(null)
    setLoadingQuote(true)
    try {
      const res = await getSubscriptionUpgradeQuote({
        source_subscription_id: props.sourceSubscriptionId,
        target_plan_id: planId,
      })
      if (res.success && res.data) {
        setQuoteDue(Number(res.data.due_amount) || 0)
      } else {
        toast.error(res.message || t('Request failed'))
        setSelectedPlanId(null)
      }
    } catch {
      toast.error(t('Request failed'))
      setSelectedPlanId(null)
    } finally {
      setLoadingQuote(false)
    }
  }

  const balanceCost =
    quoteDue !== null
      ? Math.max(0, Math.ceil(quoteDue * quotaPerUnit))
      : 0
  const userQuota = Math.max(0, Number(props.userQuota || 0))
  const insufficientBalance = balanceCost > userQuota

  const handleUpgrade = async () => {
    if (!selectedPlanId) return
    setUpgrading(true)
    try {
      const res = await upgradeSubscriptionBalance({
        source_subscription_id: props.sourceSubscriptionId,
        target_plan_id: selectedPlanId,
      })
      if (res.success) {
        toast.success(t('Subscription upgraded successfully'))
        await props.onUpgradeSuccess?.()
        props.onOpenChange(false)
      } else {
        toast.error(res.message || t('Upgrade failed'))
      }
    } catch {
      toast.error(t('Upgrade failed'))
    } finally {
      setUpgrading(false)
    }
  }

  const handlePayStripeUpgrade = async () => {
    if (!selectedPlanId) return
    setUpgrading(true)
    try {
      const res = await paySubscriptionStripe({
        plan_id: selectedPlanId,
        source_subscription_id: props.sourceSubscriptionId,
      })
      if (res.message === 'success' && res.data?.pay_link) {
        window.open(res.data.pay_link, '_blank')
        toast.success(t('Payment page opened'))
        props.onOpenChange(false)
      } else {
        toast.error(
          res.message && res.message !== 'success'
            ? res.message
            : t('Payment request failed')
        )
      }
    } catch {
      toast.error(t('Payment request failed'))
    } finally {
      setUpgrading(false)
    }
  }

  const handlePayCreemUpgrade = async () => {
    if (!selectedPlanId) return
    setUpgrading(true)
    try {
      const res = await paySubscriptionCreem({
        plan_id: selectedPlanId,
        source_subscription_id: props.sourceSubscriptionId,
      })
      if (res.message === 'success' && res.data?.checkout_url) {
        window.open(res.data.checkout_url, '_blank')
        toast.success(t('Payment page opened'))
        props.onOpenChange(false)
      } else {
        toast.error(
          res.message && res.message !== 'success'
            ? res.message
            : t('Payment request failed')
        )
      }
    } catch {
      toast.error(t('Payment request failed'))
    } finally {
      setUpgrading(false)
    }
  }

  const isSafari =
    typeof navigator !== 'undefined' &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

  const handlePayWaffoPancakeUpgrade = async () => {
    if (!selectedPlanId) return
    setUpgrading(true)
    try {
      const res = await paySubscriptionWaffoPancake({
        plan_id: selectedPlanId,
        source_subscription_id: props.sourceSubscriptionId,
      })
      if (res.message === 'success' && res.data?.checkout_url) {
        toast.success(t('Redirecting to payment page...'))
        window.location.href = res.data.checkout_url
      } else {
        toast.error(
          res.message && res.message !== 'success'
            ? res.message
            : t('Payment request failed')
        )
      }
    } catch {
      toast.error(t('Payment request failed'))
    } finally {
      setUpgrading(false)
    }
  }

  const handlePayEpayUpgrade = async () => {
    if (!selectedPlanId) return
    if (!selectedEpayMethod) {
      toast.error(t('Please select a payment method'))
      return
    }
    setUpgrading(true)
    try {
      const res = await paySubscriptionEpay({
        plan_id: selectedPlanId,
        payment_method: selectedEpayMethod,
        source_subscription_id: props.sourceSubscriptionId,
      })
      if (res.message === 'success' && res.url) {
        const form = document.createElement('form')
        form.action = res.url
        form.method = 'POST'
        if (!isSafari) {
          form.target = '_blank'
        }
        Object.entries(res.data || {}).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        })
        document.body.appendChild(form)
        form.submit()
        document.body.removeChild(form)
        toast.success(t('Payment initiated'))
        props.onOpenChange(false)
      } else {
        toast.error(
          res.message && res.message !== 'success'
            ? res.message
            : t('Payment request failed')
        )
      }
    } catch {
      toast.error(t('Payment request failed'))
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        props.onOpenChange(open)
        if (!open) {
          setSelectedPlanId(null)
          setQuoteDue(null)
        }
      }}
      title={
        <>
          <Crown className='h-5 w-5' />
          {t('Upgrade Subscription')}
        </>
      }
      contentClassName='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-lg'
      titleClassName='flex items-center gap-2'
      contentHeight='auto'
      bodyClassName='space-y-4'
    >
      <div className='space-y-3'>
        <div className='bg-muted/50 space-y-2.5 rounded-lg border p-3 sm:p-4'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground text-sm'>
              {t('Current Plan')}
            </span>
            <span className='text-sm font-medium'>{props.sourcePlanTitle}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground text-sm'>
              {t('Current Price')}
            </span>
            <span className='text-sm'>
              {formatLocalCurrencyAmount(props.sourcePriceAmount)}
            </span>
          </div>
        </div>

        {candidatePlans.length === 0 ? (
          <p className='text-muted-foreground text-center text-sm'>
            {t('No upgradeable plans available')}
          </p>
        ) : (
          <>
            <div>
              <p className='text-muted-foreground mb-2 text-xs'>
                {t('Select a plan to upgrade to')}
              </p>
              <div className='space-y-2'>
                {candidatePlans.map((p) => {
                  const plan = p.plan
                  const isSelected = plan.id === selectedPlanId
                  return (
                    <button
                      key={plan.id}
                      type='button'
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2'>
                          <ArrowUpRight className='text-primary h-3.5 w-3.5 shrink-0' />
                          <span className='truncate text-sm font-medium'>
                            {plan.title}
                          </span>
                        </div>
                        <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs'>
                          <span>{formatDuration(plan, t)}</span>
                          {plan.total_amount > 0 && (
                            <span>
                              {t('Total Quota')}: {formatQuota(plan.total_amount)}
                            </span>
                          )}
                          {plan.upgrade_group && (
                            <GroupBadge group={plan.upgrade_group} />
                          )}
                        </div>
                      </div>
                      <span className='text-primary ml-2 shrink-0 text-sm font-bold'>
                        {formatLocalCurrencyAmount(plan.price_amount)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedPlan && quoteDue !== null && (
              <>
                <Separator />
                <div className='bg-muted/50 space-y-2 rounded-lg border p-3'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground text-sm'>
                      {t('New Plan Price')}
                    </span>
                    <span className='text-sm'>
                      {formatLocalCurrencyAmount(
                        selectedPlan.plan.price_amount
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground text-sm'>
                      {t('Unused Credit')}
                    </span>
                    <span className='text-sm text-green-600'>
                      -
                      {formatLocalCurrencyAmount(
                        Math.max(
                          0,
                          selectedPlan.plan.price_amount - quoteDue
                        )
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      {t('Amount Due')}
                    </span>
                    <span className='text-primary text-lg font-bold'>
                      {formatLocalCurrencyAmount(quoteDue)}
                    </span>
                  </div>
                </div>

                <div className='flex flex-col gap-2 rounded-md border p-3'>
                  <div className='flex items-center justify-between gap-2 text-xs'>
                    <span className='text-muted-foreground'>{t('Required')}</span>
                    <span>{formatQuota(balanceCost)}</span>
                  </div>
                  <div className='flex items-center justify-between gap-2 text-xs'>
                    <span className='text-muted-foreground'>
                      {t('Available')}
                    </span>
                    <span>{formatQuota(userQuota)}</span>
                  </div>
                  {insufficientBalance && (
                    <Alert variant='default'>
                      <AlertDescription>
                        {t('Insufficient balance')}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button
                    onClick={handleUpgrade}
                    disabled={upgrading || balanceCost <= 0}
                  >
                    {t('Pay Difference & Upgrade')}
                  </Button>
                </div>

                {(() => {
                  const selPlan = selectedPlan.plan
                  const upgradeHasStripe = props.enableStripe && !!selPlan.stripe_price_id
                  const upgradeHasCreem = props.enableCreem && !!selPlan.creem_product_id
                  const upgradeHasWaffoPancake = props.enableWaffoPancake && !!selPlan.waffo_pancake_product_id
                  const upgradeHasEpay = props.enableOnlineTopUp && (props.epayMethods || []).length > 0
                  const upgradeHasAnyPayment = upgradeHasStripe || upgradeHasCreem || upgradeHasWaffoPancake || upgradeHasEpay
                  if (!upgradeHasAnyPayment) return null
                  return (
                    <div className='space-y-3'>
                      <p className='text-muted-foreground text-xs'>
                        {t('Select payment method')}
                      </p>
                      {(upgradeHasStripe || upgradeHasCreem || upgradeHasWaffoPancake) && (
                        <div className='grid grid-cols-2 gap-2 sm:flex'>
                          {upgradeHasStripe && (
                            <Button
                              variant='outline'
                              className='flex-1'
                              onClick={handlePayStripeUpgrade}
                              disabled={upgrading}
                            >
                              Stripe
                            </Button>
                          )}
                          {upgradeHasCreem && (
                            <Button
                              variant='outline'
                              className='flex-1'
                              onClick={handlePayCreemUpgrade}
                              disabled={upgrading}
                            >
                              Creem
                            </Button>
                          )}
                          {upgradeHasWaffoPancake && (
                            <Button
                              variant='outline'
                              className='flex-1'
                              onClick={handlePayWaffoPancakeUpgrade}
                              disabled={upgrading}
                            >
                              Waffo Pancake
                            </Button>
                          )}
                        </div>
                      )}
                      {upgradeHasEpay && (
                        <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-2'>
                          <Select
                            items={(props.epayMethods || []).map((m) => ({
                              value: m.type,
                              label: m.name || m.type,
                            }))}
                            value={selectedEpayMethod}
                            onValueChange={(v) => v !== null && setSelectedEpayMethod(v)}
                          >
                            <SelectTrigger className='flex-1'>
                              <SelectValue>{selectedEpayMethod || t('Select payment method')}</SelectValue>
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false}>
                              <SelectGroup>
                                {(props.epayMethods || []).map((m) => (
                                  <SelectItem key={m.type} value={m.type}>
                                    {m.name || m.type}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={handlePayEpayUpgrade}
                            disabled={upgrading || !selectedEpayMethod}
                          >
                            {t('Pay')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </>
            )}

            {selectedPlanId && loadingQuote && (
              <p className='text-muted-foreground text-center text-sm'>
                {t('Calculating upgrade price...')}
              </p>
            )}
          </>
        )}
      </div>
    </Dialog>
  )
}