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
import { DownloadIcon, LinkIcon, MessageSquarePlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { PlaygroundChat } from './components/chat/playground-chat'
import { PlaygroundInput } from './components/input/playground-input'
import {
  decodeMessagesFromShare,
  encodeMessagesForShare,
  formatMessagesAsMarkdown,
} from './lib/message-utils'
import {
  useChatHandler,
  usePlaygroundConversation,
  usePlaygroundOptions,
  usePlaygroundState,
} from './hooks'

export function Playground() {
  const { t } = useTranslation()
  const {
    config,
    parameterEnabled,
    sessions,
    activeSessionId,
    messages,
    isLoadingMessages,
    models,
    groups,
    updateMessages,
    setModels,
    setGroups,
    updateConfig,
    updateParameterEnabled,
    clearMessages,
    createNewSession,
    switchSession,
    deleteSession,
  } = usePlaygroundState()

  const { sendChat, stopGeneration, isGenerating } = useChatHandler({
    config,
    parameterEnabled,
    onMessageUpdate: updateMessages,
  })

  const {
    editingMessageKey,
    handleSendMessage,
    handleRegenerateMessage,
    handleEditMessage,
    handleEditOpenChange,
    applyEdit,
    handleDeleteMessage,
  } = usePlaygroundConversation({
    messages,
    updateMessages,
    sendChat,
  })

  const handleClearMessages = () => {
    handleEditOpenChange(false)
    clearMessages()
  }

  const { isLoadingModels } = usePlaygroundOptions({
    currentGroup: config.group,
    currentModel: config.model,
    setGroups,
    setModels,
    updateConfig,
  })

  useEffect(() => {
    const sharedMessages = new URLSearchParams(window.location.search).get(
      'share'
    )
    if (!sharedMessages) return

    try {
      const decodedMessages = decodeMessagesFromShare(sharedMessages)
      if (decodedMessages.length === 0) return

      createNewSession(decodedMessages)
      window.history.replaceState({}, '', window.location.pathname)
      toast.success(t('Shared conversation loaded'))
    } catch {
      toast.error(t('Failed to load shared conversation'))
    }
  }, [createNewSession, t])

  const handleExportMarkdown = () => {
    const markdown = formatMessagesAsMarkdown(messages)
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `playground-conversation-${Date.now()}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleShareConversation = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('share', encodeMessagesForShare(messages))
    await navigator.clipboard.writeText(url.toString())
    toast.success(t('Share link copied'))
  }

  const hasMessages = messages.length > 0

  return (
    <div className='relative flex size-full min-h-0 overflow-hidden'>
      <aside className='bg-muted/20 hidden w-64 shrink-0 flex-col border-r p-3 md:flex'>
        <div className='mb-3 flex items-center justify-between gap-2'>
          <h2 className='text-sm font-medium'>{t('Conversations')}</h2>
          <Button
            aria-label={t('New Conversation')}
            disabled={isGenerating}
            onClick={() => createNewSession()}
            size='icon-sm'
            variant='outline'
          >
            <MessageSquarePlusIcon />
          </Button>
        </div>
        <div className='min-h-0 flex-1 space-y-1 overflow-y-auto'>
          {sessions.map((session) => (
            <div
              className='group flex items-center gap-1 rounded-lg hover:bg-muted'
              key={session.id}
            >
              <button
                className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm ${
                  session.id === activeSessionId
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground'
                }`}
                disabled={isGenerating}
                onClick={() => switchSession(session.id)}
                type='button'
              >
                {session.title === 'New conversation'
                  ? t('New conversation')
                  : session.title}
              </button>
              <Button
                aria-label={t('Delete Conversation')}
                className='opacity-0 group-hover:opacity-100'
                disabled={isGenerating}
                onClick={() => deleteSession(session.id)}
                size='icon-xs'
                variant='ghost'
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>
      </aside>

      <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
        <div className='mx-auto flex w-full max-w-4xl justify-end gap-2 px-4 py-2'>
          <Button
            className='md:hidden'
            disabled={isGenerating}
            onClick={() => createNewSession()}
            size='sm'
            variant='outline'
          >
            <MessageSquarePlusIcon />
            {t('New Conversation')}
          </Button>
          <Button
            disabled={!hasMessages}
            onClick={handleExportMarkdown}
            size='sm'
            variant='outline'
          >
            <DownloadIcon />
            {t('Export Markdown')}
          </Button>
          <Button
            disabled={!hasMessages}
            onClick={handleShareConversation}
            size='sm'
            variant='outline'
          >
            <LinkIcon />
            {t('Share Link')}
          </Button>
        </div>

        <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
          <PlaygroundChat
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            onRegenerateMessage={handleRegenerateMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onSelectPrompt={handleSendMessage}
            isGenerating={isGenerating}
            editingKey={editingMessageKey}
            onCancelEdit={handleEditOpenChange}
            onSaveEdit={(newContent) => applyEdit(newContent, false)}
            onSaveEditAndSubmit={(newContent) => applyEdit(newContent, true)}
          />
        </div>

        <div className='mx-auto w-full max-w-4xl'>
          <PlaygroundInput
            config={config}
            disabled={isGenerating}
            groups={groups}
            groupValue={config.group}
            isGenerating={isGenerating}
            isModelLoading={isLoadingModels}
            modelValue={config.model}
            models={models}
            onGroupChange={(value) => updateConfig('group', value)}
            onConfigChange={updateConfig}
            onClearMessages={handleClearMessages}
            onModelChange={(value) => updateConfig('model', value)}
            onParameterEnabledChange={updateParameterEnabled}
            onStop={stopGeneration}
            onSubmit={handleSendMessage}
            parameterEnabled={parameterEnabled}
            hasMessages={hasMessages}
          />
        </div>
      </div>
    </div>
  )
}
