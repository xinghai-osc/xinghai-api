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
import { useEffect, useState } from 'react'
import {
  Download,
  ImageIcon,
  Link2,
  MessageSquare,
  MessageSquarePlus,
  Mic2,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlaygroundChat } from './components/chat/playground-chat'
import { PlaygroundImageGenerator } from './components/playground-image-generator'
import { PlaygroundInput } from './components/input/playground-input'
import { PlaygroundSpeechGenerator } from './components/playground-speech-generator'
import {
  useChatHandler,
  usePlaygroundConversation,
  usePlaygroundOptions,
  usePlaygroundState,
} from './hooks'
import {
  decodeMessagesFromShare,
  encodeMessagesForShare,
  formatMessagesAsMarkdown,
} from './lib/message-utils'

type PlaygroundProps = {
  initialTab?: string
}

export function Playground(props: PlaygroundProps = {}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(props.initialTab ?? 'chat')
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

  // Share decoding
  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get('share')
    if (!shared) return

    try {
      const sharedMessages = decodeMessagesFromShare(shared)
      if (sharedMessages.length > 0) {
        createNewSession(sharedMessages)
        toast.success(t('Shared conversation loaded'))
      }
    } catch {
      toast.error(t('Failed to load shared conversation'))
    }
  }, [t, createNewSession])

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
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className='size-full gap-0 overflow-hidden'
    >
      <div className='flex shrink-0 justify-center border-b bg-background/95 px-4 py-2'>
        <TabsList className='grid w-full max-w-md grid-cols-3'>
          <TabsTrigger value='chat'>
            <MessageSquare />
            {t('Chat')}
          </TabsTrigger>
          <TabsTrigger value='image'>
            <ImageIcon />
            {t('Image')}
          </TabsTrigger>
          <TabsTrigger value='speech'>
            <Mic2 />
            {t('Speech')}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value='chat' className='min-h-0 overflow-hidden'>
        <div className='relative flex size-full overflow-hidden'>
          <aside className='hidden w-64 shrink-0 border-r bg-muted/20 p-3 md:flex md:flex-col'>
            <div className='mb-3 flex items-center justify-between gap-2'>
              <h2 className='text-sm font-medium'>{t('Conversations')}</h2>
              <Button
                size='icon-sm'
                variant='outline'
                onClick={() => createNewSession()}
                disabled={isGenerating}
                aria-label={t('New Conversation')}
              >
                <MessageSquarePlus />
              </Button>
            </div>
            <div className='min-h-0 flex-1 space-y-1 overflow-y-auto'>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className='group flex items-center gap-1 rounded-lg hover:bg-muted'
                >
                  <button
                    type='button'
                    className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm ${
                      session.id === activeSessionId
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground'
                    }`}
                    onClick={() => switchSession(session.id)}
                    disabled={isGenerating}
                  >
                    {session.title === 'New conversation'
                      ? t('New conversation')
                      : session.title}
                  </button>
                  <Button
                    size='icon-xs'
                    variant='ghost'
                    onClick={() => deleteSession(session.id)}
                    disabled={isGenerating}
                    aria-label={t('Delete Conversation')}
                    className='opacity-0 group-hover:opacity-100 max-md:opacity-100'
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          </aside>

          <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
            <div className='mx-auto flex w-full max-w-4xl justify-end gap-2 px-4 py-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => createNewSession()}
                disabled={isGenerating}
                className='md:hidden'
              >
                <MessageSquarePlus />
                {t('New Conversation')}
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={handleExportMarkdown}
                disabled={!hasMessages}
              >
                <Download />
                {t('Export Markdown')}
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={handleShareConversation}
                disabled={!hasMessages}
              >
                <Link2 />
                {t('Share Link')}
              </Button>
              <Button
                size='sm'
                variant='destructive'
                onClick={handleClearMessages}
                disabled={!hasMessages || isGenerating}
              >
                <Trash2 />
                {t('Clear Conversation')}
              </Button>
            </div>

            <div className='flex flex-1 flex-col overflow-hidden'>
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
                disabled={isGenerating}
                groups={groups}
                groupValue={config.group}
                isGenerating={isGenerating}
                isModelLoading={isLoadingModels}
                modelValue={config.model}
                models={models}
                onGroupChange={(value) => updateConfig('group', value)}
                onModelChange={(value) => updateConfig('model', value)}
                onStop={stopGeneration}
                onSubmit={handleSendMessage}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value='image' className='min-h-0 overflow-hidden'>
        <PlaygroundImageGenerator
          groups={groups}
          groupValue={config.group}
          isModelLoading={isLoadingModels}
          modelValue={config.model}
          models={models}
          onGroupChange={(value) => updateConfig('group', value)}
          onModelChange={(value) => updateConfig('model', value)}
          onStop={stopGeneration}
          onSubmit={handleSendMessage}
          hasMessages={messages.length > 0}
        />
      </TabsContent>

      <TabsContent value='speech' className='min-h-0 overflow-hidden'>
        <PlaygroundSpeechGenerator
          groups={groups}
          groupValue={config.group}
          isModelLoading={isLoadingModels}
          modelValue={config.model}
          models={models}
          onGroupChange={(value) => updateConfig('group', value)}
          onModelChange={(value) => updateConfig('model', value)}
        />
      </TabsContent>
    </Tabs>
  )
}
