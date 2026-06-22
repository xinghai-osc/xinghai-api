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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@/components/dialog'
import { AdminTokensProvider } from './admin-tokens-provider'
import { AdminTokensTable } from './admin-tokens-table'

interface UserTokensDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number
  username: string
}

export function UserTokensDialog(props: UserTokensDialogProps) {
  const { t } = useTranslation()
  // Use a key to reset internal state when userId changes
  const [dialogKey] = useState(() => `user-tokens-${props.userId}`)

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('API Keys - {{username}}', { username: props.username })}
      description={t(
        'View API keys created by this user. Click a key to reveal the full value.'
      )}
      contentClassName='sm:max-w-5xl'
      contentHeight='60vh'
    >
      <AdminTokensProvider key={dialogKey} initialUserId={props.userId}>
        <AdminTokensTable fixedUserId={props.userId} />
      </AdminTokensProvider>
    </Dialog>
  )
}
