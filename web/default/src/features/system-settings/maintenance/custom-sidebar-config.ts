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
import {
  Activity,
  Box,
  BookOpen,
  Calendar,
  CreditCard,
  ExternalLink,
  FileText,
  FlaskConical,
  Globe,
  HelpCircle,
  Key,
  LayoutDashboard,
  Link,
  ListTodo,
  MessageSquare,
  Radio,
  Settings,
  Shield,
  Star,
  Ticket,
  Wrench,
  User,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { CustomSidebarConfig } from './custom-sidebar-types'

export const ICON_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] =
  [
    { value: 'Activity', label: 'Activity', Icon: Activity },
    { value: 'BookOpen', label: 'BookOpen', Icon: BookOpen },
    { value: 'Box', label: 'Box', Icon: Box },
    { value: 'Calendar', label: 'Calendar', Icon: Calendar },
    { value: 'CreditCard', label: 'CreditCard', Icon: CreditCard },
    { value: 'ExternalLink', label: 'ExternalLink', Icon: ExternalLink },
    { value: 'FileText', label: 'FileText', Icon: FileText },
    { value: 'FlaskConical', label: 'FlaskConical', Icon: FlaskConical },
    { value: 'Globe', label: 'Globe', Icon: Globe },
    { value: 'HelpCircle', label: 'HelpCircle', Icon: HelpCircle },
    { value: 'Key', label: 'Key', Icon: Key },
    { value: 'LayoutDashboard', label: 'LayoutDashboard', Icon: LayoutDashboard },
    { value: 'Link', label: 'Link', Icon: Link },
    { value: 'ListTodo', label: 'ListTodo', Icon: ListTodo },
    { value: 'MessageSquare', label: 'MessageSquare', Icon: MessageSquare },
    { value: 'Radio', label: 'Radio', Icon: Radio },
    { value: 'Settings', label: 'Settings', Icon: Settings },
    { value: 'Shield', label: 'Shield', Icon: Shield },
    { value: 'Star', label: 'Star', Icon: Star },
    { value: 'Ticket', label: 'Ticket', Icon: Ticket },
    { value: 'Wrench', label: 'Wrench', Icon: Wrench },
    { value: 'User', label: 'User', Icon: User },
    { value: 'Users', label: 'Users', Icon: Users },
    { value: 'Wallet', label: 'Wallet', Icon: Wallet },
    { value: 'Zap', label: 'Zap', Icon: Zap },
  ]

const iconMap = new Map<string, LucideIcon>(
  ICON_OPTIONS.map(({ value, Icon }) => [value, Icon])
)

export function resolveIcon(name: string): LucideIcon {
  return iconMap.get(name) ?? Link
}

export const GROUP_OPTIONS = [
  { value: 'chat', label: 'Chat' },
  { value: 'general', label: 'General' },
  { value: 'personal', label: 'Personal' },
  { value: 'admin', label: 'Admin' },
] as const

export function parseCustomSidebarItems(
  value: string | null | undefined
): CustomSidebarConfig {
  if (!value || value.trim() === '') return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.icon === 'string' &&
        typeof item.group === 'string'
    )
  } catch {
    return []
  }
}

export function serializeCustomSidebarItems(
  config: CustomSidebarConfig
): string {
  return JSON.stringify(config)
}
