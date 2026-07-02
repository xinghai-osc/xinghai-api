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
  AdminApiKey,
  ApiResponse,
  GetAdminApiKeysParams,
  GetAdminApiKeysResponse,
  SearchAdminApiKeysParams,
} from './types'

// Get paginated admin API keys list (optionally filtered by user_id)
export async function getAdminApiKeys(
  params: GetAdminApiKeysParams = {}
): Promise<GetAdminApiKeysResponse> {
  const { p = 1, size = 10, user_id } = params
  const queryParams = new URLSearchParams()
  queryParams.set('p', String(p))
  queryParams.set('size', String(size))
  if (user_id != null) queryParams.set('user_id', String(user_id))
  const res = await api.get(`/api/admin/token/?${queryParams.toString()}`)
  return res.data
}

// Search admin API keys by keyword or token (with pagination)
export async function searchAdminApiKeys(
  params: SearchAdminApiKeysParams
): Promise<GetAdminApiKeysResponse> {
  const { keyword = '', token = '', p, size, user_id } = params
  const queryParams = new URLSearchParams()
  if (keyword) queryParams.set('keyword', keyword)
  if (token) queryParams.set('token', token)
  if (p != null) queryParams.set('p', String(p))
  if (size != null) queryParams.set('size', String(size))
  if (user_id != null) queryParams.set('user_id', String(user_id))
  const res = await api.get(
    `/api/admin/token/search?${queryParams.toString()}`
  )
  return res.data
}

// Get single API key by ID (admin)
export async function getAdminApiKey(
  id: number
): Promise<ApiResponse<AdminApiKey>> {
  const res = await api.get(`/api/admin/token/${id}`)
  return res.data
}

// Fetch the real (unmasked) key for a token by ID (admin)
export async function fetchAdminTokenKey(
  id: number
): Promise<{ success: boolean; message?: string; data?: { key: string } }> {
  const res = await api.post(`/api/admin/token/${id}/key`)
  return res.data
}

// Batch fetch real (unmasked) keys for multiple tokens (admin)
export async function fetchAdminTokenKeysBatch(ids: number[]): Promise<{
  success: boolean
  message?: string
  data?: { keys: Record<number, string> }
}> {
  const res = await api.post('/api/admin/token/batch/keys', { ids })
  return res.data
}

// Update a token (admin, cross-user)
export async function updateAdminToken(
  token: Partial<AdminApiKey> & { id: number }
): Promise<ApiResponse<AdminApiKey>> {
  const res = await api.put('/api/admin/token/', token)
  return res.data
}

// Delete a single token (admin, cross-user)
export async function deleteAdminToken(
  id: number
): Promise<ApiResponse> {
  const res = await api.delete(`/api/admin/token/${id}`)
  return res.data
}

// Batch delete tokens (admin, cross-user)
export async function deleteAdminTokenBatch(
  ids: number[]
): Promise<ApiResponse<number>> {
  const res = await api.post('/api/admin/token/batch/delete', { ids })
  return res.data
}

// Batch update group for tokens (admin, cross-user)
export async function updateAdminTokenGroupBatch(
  ids: number[],
  group: string
): Promise<ApiResponse<number>> {
  const res = await api.post('/api/admin/token/batch/group', { ids, group })
  return res.data
}
