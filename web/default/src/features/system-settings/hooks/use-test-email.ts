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
import { useMutation } from '@tanstack/react-query'
import i18next from 'i18next'
import { toast } from 'sonner'
import { sendTestEmail } from '../api'
import type { TestEmailRequest } from '../types'

export function useTestEmail() {
  return useMutation({
    mutationFn: (request: TestEmailRequest) => sendTestEmail(request),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || i18next.t('Test email sent successfully'))
      } else {
        toast.error(data.message || i18next.t('Failed to send test email'))
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || i18next.t('Failed to send test email'))
    },
  })
}
