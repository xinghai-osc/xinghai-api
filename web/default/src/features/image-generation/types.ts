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
export interface ImageContextItem {
  id: string
  name: string
  source: string
}

export interface ImageMessageItem {
  id: string
  name: string
  source: string
  revisedPrompt?: string
}

export interface ImageConversationTurn {
  id: string
  prompt: string
  images: ImageMessageItem[]
  contextCount: number
  model: string
  group: string
  size: string
  quality: string
  createdAt: number
}

export interface ImageGenerationSession {
  id: string
  title: string
  model: string
  group: string
  turns: ImageConversationTurn[]
  contextImages: ImageContextItem[]
  createdAt: number
  updatedAt: number
}

export interface ImageGenerationConfig {
  model: string
  group: string
  size: string
  quality: string
  background: string
  outputFormat: string
  n: number
}

export interface ModelOption {
  label: string
  value: string
}

export interface GroupOption {
  label: string
  value: string
  ratio: number
  desc?: string
}

// API types (reused from playground)
export interface ImageGenerationRequest {
  model: string
  group?: string
  prompt: string
  n?: number
  size?: string
  quality?: string
  background?: string
  output_format?: string
  response_format?: string
  image?: string
  images?: string[]
}

export interface ImageData {
  url?: string
  b64_json?: string
  revised_prompt?: string
}

export interface ImageGenerationResponse {
  created?: number
  data?: ImageData[]
}
