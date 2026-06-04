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
  ImageIcon,
  Trash2Icon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Button } from '@/components/ui/button'
import type { ImageConversationTurn } from '../types'

interface ImageConversationProps {
  turns: ImageConversationTurn[]
  isGenerating: boolean
  onRemoveImage: (id: string) => void
}

export function ImageConversation({
  turns,
  isGenerating,
  onRemoveImage,
}: ImageConversationProps) {
  const { t } = useTranslation()

  return (
    <Conversation className='min-h-0 flex-1 rounded-xl border bg-background'>
      <ConversationContent className='grid gap-5 p-4 md:p-6'>
        {turns.length === 0 ? (
          <ConversationEmptyState
            icon={<ImageIcon className='size-10' />}
            title={t('Start generating images')}
            description={t(
              'Send a prompt to generate an image. Each result is automatically added to the next turn context.'
            )}
          />
        ) : (
          turns.map((turn) => (
            <div key={turn.id} className='grid gap-3'>
              <Message from='user'>
                <MessageContent
                  className='max-w-[85%] px-4 py-3'
                  variant='contained'
                >
                  <p className='whitespace-pre-wrap'>{turn.prompt}</p>
                  {turn.contextCount > 0 && (
                    <p className='text-xs opacity-80'>
                      {t('Used {{count}} context images', {
                        count: turn.contextCount,
                      })}
                    </p>
                  )}
                </MessageContent>
              </Message>
              <Message from='assistant'>
                <MessageContent
                  className='max-w-[92%] bg-secondary p-3'
                  variant='contained'
                >
                  <div className='grid gap-3 sm:grid-cols-2'>
                    {turn.images.map((image) => (
                      <div
                        key={image.id}
                        className='group/image relative overflow-hidden rounded-lg border bg-background'
                      >
                        <img
                          alt={image.revisedPrompt || image.name}
                          className='aspect-square w-full object-contain'
                          src={image.source}
                        />
                        <Button
                          className='absolute top-2 right-2 size-8 rounded-full opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover/image:opacity-100'
                          disabled={isGenerating}
                          onClick={() => onRemoveImage(image.id)}
                          size='icon'
                          type='button'
                          variant='secondary'
                        >
                          <Trash2Icon className='size-4' />
                        </Button>
                        {image.revisedPrompt && (
                          <div className='text-muted-foreground border-t p-3 text-xs'>
                            {image.revisedPrompt}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </MessageContent>
              </Message>
            </div>
          ))
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}
