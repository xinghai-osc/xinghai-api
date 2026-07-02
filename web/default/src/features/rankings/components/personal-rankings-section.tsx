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
import { Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUserAvatarFallback, getUserAvatarStyle } from '@/lib/avatar'
import { formatShare, formatTokens } from '../lib/format'
import type { PersonalRanking } from '../types'

type PersonalRankingsSectionProps = {
  rows: PersonalRanking[]
}

export function PersonalRankingsSection(props: PersonalRankingsSectionProps) {
  const { t } = useTranslation()

  return (
    <section className='bg-card overflow-hidden rounded-lg border'>
      <header className='px-5 pt-4 pb-2'>
        <h2 className='text-foreground inline-flex items-center gap-2 text-base font-semibold'>
          <Trophy className='size-4 text-amber-500' />
          {t('Personal Usage Ranking')}
        </h2>
        <p className='text-muted-foreground/80 mt-1 text-sm'>
          {t('Users who opt in from profile settings are ranked by usage')}
        </p>
      </header>

      {props.rows.length === 0 ? (
        <div className='text-muted-foreground/80 px-5 py-8 text-center text-sm'>
          {t('No users have joined the personal usage ranking yet')}
        </div>
      ) : (
        <div className='px-5 pt-1 pb-4'>
          <ul>
            {props.rows.map((row) => {
              const avatarKey = row.display_name || row.username
              return (
                <li
                  key={row.user_id}
                  className='flex items-center gap-3 py-2.5'
                >
                  <span className='text-muted-foreground/80 w-6 shrink-0 text-right font-mono text-xs tabular-nums'>
                    {row.rank}.
                  </span>
                  <Avatar className='size-8 shrink-0 rounded-md'>
                    {row.avatar_url && (
                      <AvatarImage
                        src={row.avatar_url}
                        alt={avatarKey}
                        className='rounded-md object-cover'
                      />
                    )}
                    <AvatarFallback
                      className='rounded-md font-semibold text-white'
                      style={getUserAvatarStyle(avatarKey)}
                    >
                      {getUserAvatarFallback(avatarKey)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <div className='text-foreground truncate text-sm font-medium'>
                      {avatarKey}
                    </div>
                    <p className='text-muted-foreground/80 truncate text-xs'>
                      {t('{{count}} requests', {
                        count: row.request_count.toLocaleString(),
                      })}
                    </p>
                  </div>
                  <div className='shrink-0 text-right'>
                    <div className='text-foreground font-mono text-sm font-semibold tabular-nums'>
                      {formatTokens(row.total_quota)}
                    </div>
                    <div className='text-muted-foreground/80 text-[11px]'>
                      {formatShare(row.share)}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
