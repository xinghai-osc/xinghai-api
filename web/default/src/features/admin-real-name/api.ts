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
import { api } from '@/lib/api'
import type {
  AdminRealNameRecord,
  AdminUpdateRealNameRequest,
  ApiResponse,
  ListAdminRealNameParams,
  ListAdminRealNameResponse,
} from './types'

// ============================================================================
// Admin Real-name Verification APIs
// ============================================================================

/**
 * Get paginated list of real-name records (admin)
 */
export async function listAdminRealNameRecords(
  params: ListAdminRealNameParams = {}
): Promise<ListAdminRealNameResponse> {
  const { keyword = '', status, p = 1, size = 20 } = params
  const queryParams = new URLSearchParams()
  queryParams.set('p', String(p))
  queryParams.set('size', String(size))
  if (keyword) queryParams.set('keyword', keyword)
  if (status != null) queryParams.set('status', String(status))
  const res = await api.get(
    `/api/user/real-name/list?${queryParams.toString()}`
  )
  return res.data
}

/**
 * Get a specific user's real-name record (admin)
 */
export async function getAdminRealNameRecord(
  userId: number
): Promise<ApiResponse<AdminRealNameRecord | null>> {
  const res = await api.get(`/api/user/${userId}/real-name`)
  return res.data
}

/**
 * Update a user's real-name record (admin)
 */
export async function updateAdminRealNameRecord(
  userId: number,
  payload: AdminUpdateRealNameRequest
): Promise<ApiResponse<AdminRealNameRecord>> {
  const res = await api.put(`/api/user/${userId}/real-name`, payload)
  return res.data
}

/**
 * Delete a user's real-name record (admin)
 */
export async function deleteAdminRealNameRecord(
  userId: number
): Promise<ApiResponse> {
  const res = await api.delete(`/api/user/${userId}/real-name`)
  return res.data
}
