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
import type { ImageGenerationConfig } from './types'

// API endpoints
export const API_ENDPOINTS = {
  IMAGE_GENERATIONS: '/pg/images/generations',
  IMAGE_EDITS: '/pg/images/edits',
  USER_MODELS: '/api/user/models',
  USER_GROUPS: '/api/user/self/groups',
} as const

export const DEFAULT_GROUP = 'default' as const

export const FALLBACK_MODEL = 'gpt-image-2'

export const DEFAULT_CONFIG: ImageGenerationConfig = {
  model: FALLBACK_MODEL,
  group: DEFAULT_GROUP,
  size: '1024x1024',
  quality: 'auto',
  background: 'auto',
  outputFormat: 'png',
  n: 1,
}

export const SIZE_OPTIONS = ['auto', '1024x1024', '1536x1024', '1024x1536']
export const QUALITY_OPTIONS = ['auto', 'low', 'medium', 'high']
export const BACKGROUND_OPTIONS = ['auto', 'transparent', 'opaque']
export const OUTPUT_FORMAT_OPTIONS = ['png', 'jpeg', 'webp']

// Storage keys
export const STORAGE_KEYS = {
  CONFIG: 'image_generation_config',
  SESSIONS: 'image_generation_sessions',
  CURRENT_SESSION: 'image_generation_current_session',
} as const

// Max sessions to keep in history
export const MAX_SESSIONS = 50
