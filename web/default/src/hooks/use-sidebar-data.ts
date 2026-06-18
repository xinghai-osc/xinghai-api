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
import { useMemo } from 'react'
import {
  Activity,
  Box,
  CreditCard,
  Crown,
  FileText,
  FlaskConical,
  ImageIcon,
  Key,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Radio,
  Settings,
  Ticket,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type SidebarData, type NavItem, type NavGroup } from '@/components/layout/types'
import { useStatus } from '@/hooks/use-status'
import { parseCustomSidebarItems, resolveIcon } from '@/features/system-settings/maintenance/custom-sidebar-config'

function buildBuiltinNavGroups(t: (key: string) => string): NavGroup[] {
  return [
    {
      id: 'chat',
      title: t('Chat'),
      items: [
        {
          title: t('Playground'),
          url: '/playground',
          icon: FlaskConical,
        },
        {
          title: t('Image Generation'),
          url: '/image-generation',
          icon: ImageIcon,
        },
        {
          title: t('Chat'),
          icon: MessageSquare,
          type: 'chat-presets',
        },
      ],
    },
    {
      id: 'general',
      title: t('General'),
      items: [
        {
          title: t('Overview'),
          url: '/dashboard/overview',
          icon: Activity,
        },
        {
          title: t('Dashboard'),
          url: '/dashboard/models',
          icon: LayoutDashboard,
        },
        {
          title: t('API Keys'),
          url: '/keys',
          icon: Key,
        },
        {
          title: t('Usage Logs'),
          url: '/usage-logs/common',
          icon: FileText,
        },
        {
          title: t('Task Logs'),
          url: '/usage-logs/task',
          activeUrls: ['/usage-logs/drawing'],
          configUrls: ['/usage-logs/drawing', '/usage-logs/task'],
          icon: ListTodo,
        },
      ],
    },
    {
      id: 'personal',
      title: t('Personal'),
      items: [
        {
          title: t('Wallet'),
          url: '/wallet',
          icon: Wallet,
        },
        {
          title: t('Subscription'),
          url: '/subscriptions/purchase',
          icon: Crown,
        },
        {
          title: t('Profile'),
          url: '/profile',
          icon: User,
        },
      ],
    },
    {
      id: 'admin',
      title: t('Admin'),
      items: [
        {
          title: t('Channels'),
          url: '/channels',
          icon: Radio,
        },
        {
          title: t('Models'),
          url: '/models/metadata',
          icon: Box,
        },
        {
          title: t('Users'),
          url: '/users',
          icon: Users,
        },
        {
          title: t('Redemption Codes'),
          url: '/redemption-codes',
          icon: Ticket,
        },
        {
          title: t('Subscription Management'),
          url: '/subscriptions',
          icon: CreditCard,
        },
        {
          title: t('System Settings'),
          url: '/system-settings/site',
          activeUrls: ['/system-settings'],
          icon: Settings,
        },
      ],
    },
  ]
}

function mergeCustomItems(
  builtinGroups: NavGroup[],
  customItems: ReturnType<typeof parseCustomSidebarItems>
): NavGroup[] {
  if (!customItems || customItems.length === 0) return builtinGroups

  const groupMap = new Map<string, NavGroup>()
  for (const group of builtinGroups) {
    groupMap.set(group.id ?? group.title, group)
  }

  for (const custom of customItems) {
    const groupId = custom.group
    let targetGroup = groupMap.get(groupId)

    if (!targetGroup) {
      targetGroup = {
        id: groupId,
        title: groupId,
        items: [],
      }
      groupMap.set(groupId, targetGroup)
    }

    const navItem = buildCustomNavItem(custom)
    targetGroup.items = [...targetGroup.items, navItem]
  }

  const order = ['chat', 'general', 'personal', 'admin']
  const groups = Array.from(groupMap.values())
  groups.sort((a, b) => {
    const aIdx = order.indexOf(a.id ?? '')
    const bIdx = order.indexOf(b.id ?? '')
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    if (aIdx !== -1) return -1
    if (bIdx !== -1) return 1
    return (a.id ?? '').localeCompare(b.id ?? '')
  })

  return groups
}

function buildCustomNavItem(custom: ReturnType<typeof parseCustomSidebarItems>[number]): NavItem {
  const icon = resolveIcon(custom.icon)

  if (custom.items && custom.items.length > 0) {
    return {
      title: custom.title,
      icon,
      items: custom.items.map((sub) => ({
        title: sub.title,
        url: sub.url,
      })),
    }
  }

  return {
    title: custom.title,
    url: custom.url ?? '#',
    icon,
  }
}

export function useSidebarData(): SidebarData {
  const { t } = useTranslation()
  const { status } = useStatus()

  const customItems = useMemo(
    () =>
      parseCustomSidebarItems(
        status?.CustomSidebarItems as string | null | undefined
      ),
    [status?.CustomSidebarItems]
  )

  const builtinGroups = useMemo(() => buildBuiltinNavGroups(t), [t])

  const navGroups = useMemo(
    () => mergeCustomItems(builtinGroups, customItems),
    [builtinGroups, customItems]
  )

  return { navGroups }
}
