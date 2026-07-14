/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SectionPageLayout } from '@/components/layout'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useBillingHistory } from '@/features/wallet/hooks/use-billing-history'
import { getPaymentMethodName, getStatusConfig, formatTimestamp } from '@/features/wallet/lib/billing'
import { formatCurrencyFromUSD } from '@/lib/currency'
import { formatNumber } from '@/lib/format'

export function BillingHistory() {
  const { t } = useTranslation()
  const history = useBillingHistory({ initialPageSize: 20 })
  const totalPages = Math.max(1, Math.ceil(history.total / history.pageSize))
  let content

  if (history.loading) {
    content = <div className='space-y-3'>{Array.from({ length: 5 }, (_, index) => (
      <div key={index} className='rounded-lg border p-4'>
        <Skeleton className='h-4 w-48' />
        <div className='mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4'>
          <Skeleton className='h-4 w-24' /><Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-24' /><Skeleton className='h-4 w-32' />
        </div>
      </div>
    ))}</div>
  } else if (history.records.length === 0) {
    content = <div className='text-muted-foreground flex min-h-56 flex-col items-center justify-center rounded-lg border text-center'>
      <p className='text-sm font-medium'>{t('No billing records found')}</p>
      <p className='mt-1 text-xs'>{history.keyword ? t('Try adjusting your search') : t('Your transaction history will appear here')}</p>
    </div>
  } else {
    content = <div className='space-y-3'>{history.records.map((record) => {
      const status = getStatusConfig(record.status)
      return <article key={record.id} className='rounded-lg border p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'><code className='block truncate font-mono text-sm'>{record.trade_no}</code><div className='text-muted-foreground mt-1 text-xs'>{formatTimestamp(record.create_time)}</div></div>
          <StatusBadge label={t(status.label)} variant={status.variant} showDot copyable={false} />
        </div>
        <div className='mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4'>
          <div><Label className='text-muted-foreground text-xs'>{t('Payment Method')}</Label><p className='mt-1 text-sm font-medium'>{getPaymentMethodName(record.payment_method, t)}</p></div>
          <div><Label className='text-muted-foreground text-xs'>{t('Amount')}</Label><p className='mt-1 text-sm font-semibold'>{formatCurrencyFromUSD(record.amount, { digitsLarge: 2, digitsSmall: 2, abbreviate: false })}</p></div>
          <div><Label className='text-muted-foreground text-xs'>{t('Payment')}</Label><p className='mt-1 text-sm font-semibold text-red-600'>{formatNumber(record.money)}</p></div>
          <div><Label className='text-muted-foreground text-xs'>{t('Completed')}</Label><p className='text-muted-foreground mt-1 text-sm'>{record.complete_time ? formatTimestamp(record.complete_time) : '-'}</p></div>
        </div>
      </article>
    })}</div>
  }

  return <SectionPageLayout fixedContent>
    <SectionPageLayout.Title>{t('Billing History')}</SectionPageLayout.Title>
    <SectionPageLayout.Content><div className='mx-auto w-full max-w-6xl space-y-4'>
      <div className='text-muted-foreground text-sm'>{t('View your topup transaction records and payment history')}</div>
      <div className='relative max-w-md'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' aria-hidden='true' />
        <Input aria-label={t('Search by order number...')} placeholder={t('Search by order number...')} value={history.keyword} onChange={(event) => history.handleSearch(event.target.value)} className='pl-9' />
      </div>
      {content}
      {!history.loading && history.records.length > 0 && <div className='flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row'>
        <span className='text-muted-foreground text-sm'>{t('Showing')} {(history.page - 1) * history.pageSize + 1}-{Math.min(history.page * history.pageSize, history.total)} {t('of')} {history.total}</span>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={() => history.handlePageChange(history.page - 1)} disabled={history.page <= 1} aria-label={t('Previous')}><ChevronLeft className='h-4 w-4' aria-hidden='true' /></Button>
          <span className='text-muted-foreground text-sm'>{history.page} / {totalPages}</span>
          <Button variant='outline' size='sm' onClick={() => history.handlePageChange(history.page + 1)} disabled={history.page >= totalPages} aria-label={t('Next')}><ChevronRight className='h-4 w-4' aria-hidden='true' /></Button>
        </div>
      </div>}
    </div></SectionPageLayout.Content>
  </SectionPageLayout>
}
