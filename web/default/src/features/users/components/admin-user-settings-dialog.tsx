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
import { Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getAdminUserSettings } from '@/features/profile/api'
import { NotificationTab } from '@/features/profile/components/tabs/notification-tab'
import type { UserProfile } from '@/features/profile/types'

type AdminUserSettingsDialogProps = {
  userId: number
  username: string
  role: number
}

export function AdminUserSettingsDialog(
  props: AdminUserSettingsDialogProps
) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!open) return
    void getAdminUserSettings(props.userId).then((response) => {
      if (response.success && response.data) {
        setProfile({
          id: props.userId,
          username: props.username,
          display_name: props.username,
          role: props.role,
          group: '',
          quota: 0,
          used_quota: 0,
          request_count: 0,
          status: 1,
          aff_count: 0,
          aff_quota: 0,
          aff_history_quota: 0,
          created_time: 0,
          setting: JSON.stringify(response.data),
          avatar_url: response.data.avatar_url,
        })
      }
    })
  }, [open, props.role, props.userId, props.username])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type='button' variant='outline' />}>
        <Settings className='mr-1 h-4 w-4' />
        {t('Settings & Preferences')}
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {t('Settings & Preferences')}: {props.username}
          </DialogTitle>
          <DialogDescription>
            {t("Administrators can modify this user's account preferences.")}
          </DialogDescription>
        </DialogHeader>
        {profile && (
          <NotificationTab
            profile={profile}
            userId={props.userId}
            onUpdate={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
