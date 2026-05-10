import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Copy, Check, Link2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { getUserModels } from '@/lib/api'
import {
  CONNECTION_FORMATS,
  formatConnectionInfo,
  type ConnectionFormat,
} from '../../lib/connection-formats'
import { useApiKeys } from '../api-keys-provider'

function getServerAddress(): string {
  try {
    const raw = localStorage.getItem('status')
    if (raw) {
      const status = JSON.parse(raw)
      if (status.server_address) return status.server_address as string
    }
  } catch {
    /* empty */
  }
  return typeof window !== 'undefined' ? window.location.origin : ''
}

interface CopyConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CopyConnectionDialog({
  open,
  onOpenChange,
}: CopyConnectionDialogProps) {
  const { t } = useTranslation()
  const { currentRow, resolveRealKey } = useApiKeys()
  const [format, setFormat] = useState<ConnectionFormat>('generic')
  const [connectionText, setConnectionText] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const generateConnectionText = useCallback(
    async (selectedFormat: ConnectionFormat) => {
      if (!currentRow) return
      setIsLoading(true)
      try {
        const realKey = await resolveRealKey(currentRow.id)
        if (!realKey) {
          toast.error(t('Failed to resolve API key'))
          setConnectionText('')
          return
        }
        let models: string[] = []
        if (currentRow.model_limits_enabled && currentRow.model_limits) {
          models = currentRow.model_limits.split(',').filter(Boolean)
        } else {
          const res = await getUserModels()
          models = res.data || []
        }
        const text = formatConnectionInfo({
          key: realKey,
          serverAddress: getServerAddress(),
          format: selectedFormat,
          models,
        })
        setConnectionText(text)
      } catch {
        toast.error(t('Failed to generate connection info'))
        setConnectionText('')
      } finally {
        setIsLoading(false)
      }
    },
    [currentRow, resolveRealKey, t]
  )

  const handleFormatChange = useCallback(
    (value: ConnectionFormat) => {
      setFormat(value)
      setIsCopied(false)
      generateConnectionText(value)
    },
    [generateConnectionText]
  )

  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange(open)
      if (!open) {
        setFormat('generic')
        setConnectionText('')
        setIsCopied(false)
      } else if (currentRow) {
        // Auto-generate on open with default format
        generateConnectionText('generic')
      }
    },
    [onOpenChange, currentRow, generateConnectionText]
  )

  const handleCopy = useCallback(async () => {
    if (!connectionText) return
    const ok = await copyToClipboard(connectionText)
    if (ok) {
      setIsCopied(true)
      toast.success(t('Copied to clipboard'))
      setTimeout(() => setIsCopied(false), 2000)
    } else {
      toast.error(t('Failed to copy to clipboard'))
    }
  }, [connectionText, t])

  if (!currentRow) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-4" />
            {t('Copy Connection Info')}
          </DialogTitle>
          <DialogDescription>
            {t('Select a format and copy the connection info for')}{' '}
            <strong>{currentRow.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="format-select">{t('Connection Format')}</Label>
            <Select
              value={format}
              onValueChange={(v) => handleFormatChange(v as ConnectionFormat)}
            >
              <SelectTrigger id="format-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONNECTION_FORMATS.map((fmt) => (
                  <SelectItem key={fmt.value} value={fmt.value}>
                    <div className="flex flex-col items-start">
                      <span>{t(fmt.labelKey)}</span>
                      <span className="text-muted-foreground text-xs">
                        {t(fmt.descriptionKey)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="connection-text">{t('Connection Info')}</Label>
            <Textarea
              id="connection-text"
              value={connectionText}
              readOnly
              placeholder={
                isLoading ? t('Loading...') : t('Select a format to generate')
              }
              className="min-h-[120px] font-mono text-xs break-all whitespace-pre-wrap"
            />
          </div>

          <Button
            onClick={handleCopy}
            disabled={!connectionText || isLoading}
            className="w-full gap-2"
          >
            {isCopied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {isCopied ? t('Copied!') : t('Copy to Clipboard')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
