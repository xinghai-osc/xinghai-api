import { useState, useCallback } from 'react'
import i18next from 'i18next'
import { toast } from 'sonner'
import { useStatus } from '@/hooks/use-status'
import type { GeetestResult } from '@/components/geetest'

export type CaptchaType = 'turnstile' | 'geetest' | null

export interface UseCaptchaResult {
  captchaType: CaptchaType
  isCaptchaEnabled: boolean
  captchaToken: string
  setCaptchaToken: (token: string) => void
  validateCaptcha: () => boolean
  onVerifyGeetest: (result: GeetestResult) => void
  turnstileSiteKey: string
  geetestCaptchaId: string
}

export function useCaptcha(): UseCaptchaResult {
  const { status } = useStatus()
  const [captchaToken, setCaptchaToken] = useState('')

  const geetestCaptchaId = (status?.geetest_captcha_id || status?.data?.geetest_captcha_id || '') as string
  const turnstileSiteKey = (status?.turnstile_site_key || status?.data?.turnstile_site_key || '') as string

  const isGeetestEnabled = !!(
    (status?.geetest_enabled || status?.data?.geetest_enabled) &&
    geetestCaptchaId
  )

  const isTurnstileEnabled = !!(
    (status?.turnstile_check || status?.data?.turnstile_check) &&
    turnstileSiteKey
  )

  const captchaType: CaptchaType = isGeetestEnabled
    ? 'geetest'
    : isTurnstileEnabled
      ? 'turnstile'
      : null

  const isCaptchaEnabled = isGeetestEnabled || isTurnstileEnabled

  const onVerifyGeetest = useCallback((result: GeetestResult) => {
    setCaptchaToken(
      JSON.stringify({
        captcha_id: result.captcha_id,
        lot_number: result.lot_number,
        pass_token: result.pass_token,
        gen_time: result.gen_time,
        captcha_output: result.captcha_output,
      })
    )
  }, [])

  const validateCaptcha = useCallback((): boolean => {
    if (isCaptchaEnabled && !captchaToken) {
      toast.info(i18next.t('Please complete the captcha verification'))
      return false
    }
    return true
  }, [isCaptchaEnabled, captchaToken])

  return {
    captchaType,
    isCaptchaEnabled,
    captchaToken,
    setCaptchaToken,
    validateCaptcha,
    onVerifyGeetest,
    turnstileSiteKey,
    geetestCaptchaId,
  }
}
