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
// ============================================================================
// Admin Real-name Verification Types
// ============================================================================

export const REAL_NAME_STATUS = {
  PENDING: 0,
  PASSED: 1,
  FAILED: 2,
} as const

export type RealNameStatusValue =
  (typeof REAL_NAME_STATUS)[keyof typeof REAL_NAME_STATUS]

export interface AdminRealNameRecord {
  id: number
  user_id: number
  real_name: string
  id_card_last_four: string
  provider: string
  status: number
  result_code: string
  description: string
  request_id: string
  verified_at: number
  created_at: number
  updated_at: number
  username: string
  display_name: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface ListAdminRealNameParams {
  keyword?: string
  status?: number
  p?: number
  size?: number
}

export interface ListAdminRealNameResponse {
  success: boolean
  message?: string
  data?: {
    items: AdminRealNameRecord[]
    total: number
    page: number
    page_size: number
  }
}

/**
 * Update payload for admin to modify a user's real-name record.
 * All fields are optional; omitted fields are preserved.
 */
export interface AdminUpdateRealNameRequest {
  real_name?: string
  id_card?: string
  status?: number
  description?: string
  provider?: string
}
