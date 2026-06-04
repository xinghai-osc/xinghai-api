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
import { ImageIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ImageGenerationSession } from '../types'

interface ImageHistoryPanelProps {
  sessions: ImageGenerationSession[]
  currentSessionId: string | null
  onSwitchSession: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
  className?: string
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function ImageHistoryPanel({
  sessions,
  currentSessionId,
  onSwitchSession,
  onNewSession,
  onDeleteSession,
  className,
}: ImageHistoryPanelProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex h-full flex-col border-r bg-background', className)}>
      <div className='flex items-center justify-between border-b p-3'>
        <h2 className='text-sm font-semibold'>{t('History')}</h2>
        <Button size='icon' variant='ghost' onClick={onNewSession} type='button'>
          <PlusIcon className='size-4' />
        </Button>
      </div>
      <ScrollArea className='flex-1'>
        <div className='grid gap-1 p-2'>
          {sessions.length === 0 ? (
            <div className='text-muted-foreground p-4 text-center text-xs'>
              {t('No generation history yet')}
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  session.id === currentSessionId
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
                onClick={() => onSwitchSession(session.id)}
                role='button'
                tabIndex={0}
              >
                <ImageIcon className='size-4 flex-shrink-0 opacity-60' />
                <div className='min-w-0 flex-1'>
                  <div className='truncate font-medium'>
                    {session.title || t('Untitled session')}
                  </div>
                  <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                    <span>{session.turns.length} {t('turns')}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(session.updatedAt)}</span>
                  </div>
                </div>
                <Button
                  className='opacity-0 group-hover:opacity-100'
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(session.id)
                  }}
                  size='icon'
                  variant='ghost'
                  type='button'
                >
                  <Trash2Icon className='size-3' />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
