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
import { useCallback, useEffect, useRef, useState } from 'react'
import { BadgeCheck, IdCard, ScanFace } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import {
  SecureVerificationDialog,
  useSecureVerification,
  type VerificationMethod,
} from '@/features/auth/secure-verification'
import {
  finishRealNameSession,
  getRealNameStatus,
  startRealNameSession,
} from '../api'
import type { RealNameStatusResponse } from '../types'

interface RealNameCardProps {
  enabled: boolean
}

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 5 * 60 * 1000

export function RealNameCard({ enabled }: RealNameCardProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<RealNameStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  const {
    open: verificationOpen,
    setOpen: setVerificationOpen,
    methods: verificationMethods,
    state: verificationState,
    startVerification,
    executeVerification,
    cancel: cancelVerification,
    setCode,
    switchMethod,
  } = useSecureVerification({
    onSuccess: async () => {
      toast.success(t('Real-name verification completed'))
      const latest = await getRealNameStatus()
      if (latest.success && latest.data) setStatus(latest.data)
    },
  })

  const pollingRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      window.clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  useEffect(() => {
    let mounted = true
    async function loadStatus() {
      try {
        setLoading(true)
        const response = await getRealNameStatus()
        if (mounted && response.success && response.data) {
          setStatus(response.data)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (enabled) {
      loadStatus()
    } else {
      setLoading(false)
    }
    return () => {
      mounted = false
    }
  }, [enabled])

  const refreshStatus = useCallback(async () => {
    const latest = await getRealNameStatus()
    if (latest.success && latest.data) setStatus(latest.data)
  }, [])

  const handleStart = useCallback(async () => {
    if (starting) return
    await startVerification(async () => {
      setStarting(true)
      try {
        const startResp = await startRealNameSession()
        if (!startResp.success || !startResp.data) {
          throw new Error(
            startResp.message || t('Failed to start verification')
          )
        }
        const { biz_token, verification_url } = startResp.data
        if (!biz_token || !verification_url) {
          throw new Error(t('Tencent Cloud FaceID returned incomplete data'))
        }

        // 打开 H5 刷脸窗口；width/height 让浏览器弹窗更稳定
        const popup = window.open(
          verification_url,
          'tencent_faceid',
          'width=420,height=720,menubar=no,toolbar=no,location=no,status=no'
        )

        // 等待用户完成刷脸：每 2s 轮询后端查询核身结果，
        // 任意一次返回 success 即视为通过。
        await new Promise<void>((resolve, reject) => {
          const startedAt = Date.now()
          const tick = async () => {
            if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
              stopPolling()
              reject(new Error(t('Verification timed out, please try again')))
              return
            }
            try {
              const finishResp = await finishRealNameSession(biz_token)
              if (finishResp.success) {
                stopPolling()
                await refreshStatus()
                resolve()
                return
              }
              // Status=0 / 尚未完成 等"未完成刷脸"提示，忽略继续轮询
              const message = finishResp.message || ''
              if (
                message.includes('尚未完成') ||
                message.includes('not complete') ||
                message.includes('not finished')
              ) {
                return
              }
              // 业务侧真正失败：例如用户实名信息不匹配
              stopPolling()
              reject(new Error(message || t('Real-name verification failed')))
            } catch (err) {
              // 网络抖动继续轮询，不打断用户
              if (err instanceof Error && /network|timeout/i.test(err.message)) {
                return
              }
              stopPolling()
              reject(err instanceof Error ? err : new Error(String(err)))
            }
          }
          pollingRef.current = window.setInterval(() => {
            void tick()
          }, POLL_INTERVAL_MS)
          timeoutRef.current = window.setTimeout(() => {
            stopPolling()
            reject(new Error(t('Verification timed out, please try again')))
          }, POLL_TIMEOUT_MS)
        })

        // 刷脸结束后尝试关闭弹窗（部分浏览器允许）
        if (popup && !popup.closed) {
          try {
            popup.close()
          } catch {
            // 某些第三方域名的弹窗不可关闭，忽略
          }
        }
      } finally {
        setStarting(false)
      }
    }, {
      title: t('Security verification'),
      description: t(
        'Confirm your identity before starting real-name verification.'
      ),
    })
  }, [refreshStatus, startVerification, starting, stopPolling, t])

  const handleDialogVerify = useCallback(
    async (method: VerificationMethod, code?: string) => {
      try {
        await executeVerification(method, code)
      } catch {
        // Errors are already surfaced by useSecureVerification via toast.
      }
    },
    [executeVerification]
  )

  if (!enabled) return null

  if (loading) {
    return (
      <Card className='gap-0 overflow-hidden py-0'>
        <CardHeader className='border-b p-3 !pb-3 sm:p-5 sm:!pb-5'>
          <Skeleton className='h-6 w-40' />
          <Skeleton className='mt-2 h-4 w-64' />
        </CardHeader>
        <CardContent className='space-y-3 p-3 sm:p-5'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </CardContent>
      </Card>
    )
  }

  const verified = status?.verified && status.record?.status === 1

  return (
    <>
      <TitledCard
        title={t('Real-name Verification')}
        description={t('Verify your identity through Tencent Cloud FaceID')}
        icon={<IdCard className='h-4 w-4' />}
      >
        {verified ? (
          <div className='flex items-center gap-3 rounded-lg border p-4'>
            <div className='bg-success/10 text-success rounded-md p-2'>
              <BadgeCheck className='h-5 w-5' />
            </div>
            <div className='min-w-0'>
              <p className='text-sm font-medium'>{t('Verified')}</p>
              <p className='text-muted-foreground text-xs'>
                {t('Name')}: {status.record?.real_name} · {t('ID card ending')}: {status.record?.id_card_last_four}
              </p>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='bg-muted/50 flex items-start gap-3 rounded-lg p-4'>
              <ScanFace className='text-primary mt-0.5 h-5 w-5 flex-shrink-0' />
              <div className='text-muted-foreground text-sm'>
                <p className='text-foreground font-medium'>
                  {t('Face verification required')}
                </p>
                <p>
                  {t(
                    'You will be redirected to Tencent Cloud FaceID to scan your ID card and complete a selfie check. The window will close automatically when finished.'
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={handleStart}
              disabled={starting || verificationState.loading}
            >
              {starting || verificationState.loading
                ? t('Opening...')
                : t('Start Real-name Verification')}
            </Button>
          </div>
        )}
      </TitledCard>

      <SecureVerificationDialog
        open={verificationOpen}
        onOpenChange={setVerificationOpen}
        methods={verificationMethods}
        state={verificationState}
        onVerify={handleDialogVerify}
        onCancel={cancelVerification}
        onCodeChange={setCode}
        onMethodChange={switchMethod}
      />
    </>
  )
}
