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
import type { StatusBadgeProps } from '@/components/status-badge'

// Reuse the same status configuration as regular API keys
export const API_KEY_STATUS = {
  ENABLED: 1,
  DISABLED: 2,
  EXPIRED: 3,
  EXHAUSTED: 4,
} as const

export const API_KEY_STATUSES: Record<
  number,
  Pick<StatusBadgeProps, 'variant'> & {
    label: string
    value: number
  }
> = {
  [API_KEY_STATUS.ENABLED]: {
    label: 'Enabled',
    variant: 'success',
    value: API_KEY_STATUS.ENABLED,
  },
  [API_KEY_STATUS.DISABLED]: {
    label: 'Disabled',
    variant: 'neutral',
    value: API_KEY_STATUS.DISABLED,
  },
  [API_KEY_STATUS.EXPIRED]: {
    label: 'Expired',
    variant: 'warning',
    value: API_KEY_STATUS.EXPIRED,
  },
  [API_KEY_STATUS.EXHAUSTED]: {
    label: 'Exhausted',
    variant: 'destructive',
    value: API_KEY_STATUS.EXHAUSTED,
  },
} as const

export const API_KEY_STATUS_OPTIONS = Object.values(API_KEY_STATUSES).map(
  (config) => ({
    label: config.label,
    value: String(config.value),
  })
)

export const ERROR_MESSAGES = {
  UNEXPECTED: 'An unexpected error occurred',
  LOAD_FAILED: 'Failed to load API keys',
  SEARCH_FAILED: 'Failed to search API keys',
} as const
