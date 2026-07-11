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
import {
  REAL_NAME_STATUS,
  type RealNameStatusValue,
} from './types'

interface RealNameStatusConfig {
  label: string
  variant: StatusBadgeProps['variant']
  value: RealNameStatusValue
}

export const REAL_NAME_STATUSES: Record<number, RealNameStatusConfig> = {
  [REAL_NAME_STATUS.PENDING]: {
    label: 'Pending',
    variant: 'warning',
    value: REAL_NAME_STATUS.PENDING,
  },
  [REAL_NAME_STATUS.PASSED]: {
    label: 'Verified',
    variant: 'success',
    value: REAL_NAME_STATUS.PASSED,
  },
  [REAL_NAME_STATUS.FAILED]: {
    label: 'Failed',
    variant: 'destructive',
    value: REAL_NAME_STATUS.FAILED,
  },
} as const

export const REAL_NAME_STATUS_OPTIONS = Object.values(REAL_NAME_STATUSES).map(
  (config) => ({
    label: config.label,
    value: String(config.value),
  })
)

export const ERROR_MESSAGES = {
  UNEXPECTED: 'An unexpected error occurred',
  LOAD_FAILED: 'Failed to load real-name records',
  UPDATE_FAILED: 'Failed to update real-name record',
  DELETE_FAILED: 'Failed to delete real-name record',
} as const
