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

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { useRedemptions } from './redemptions-provider'

export function RedemptionsCreatedKeysDialog() {
  const { t } = useTranslation()
  const { createdKeys, setCreatedKeys } = useRedemptions()

  const allKeys = createdKeys.join('\n')

  return (
    <Dialog
      open={createdKeys.length > 0}
      onOpenChange={(open) => !open && setCreatedKeys([])}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('Redemption Codes')}</DialogTitle>
          <DialogDescription>
            {t('Successfully created {{count}} redemption codes', {
              count: createdKeys.length,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-60 overflow-y-auto rounded-md border'>
          {createdKeys.map((key) => (
            <div
              key={key}
              className='flex items-center justify-between gap-2 border-b px-3 py-1.5 last:border-b-0'
            >
              <span className='text-foreground font-mono text-sm break-all'>
                {key}
              </span>
              <CopyButton
                value={key}
                variant='ghost'
                size='icon'
                className='size-7 shrink-0'
                tooltip={t('Copy code')}
                successTooltip={t('Copied!')}
                aria-label={t('Copy code')}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <CopyButton
            value={allKeys}
            variant='outline'
            size='default'
            tooltip={t('Copy All')}
            successTooltip={t('Codes copied!')}
            aria-label={t('Copy All')}
          >
            {t('Copy All')}
          </CopyButton>
          <DialogClose render={<Button variant='outline' />}>
            {t('Close')}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
