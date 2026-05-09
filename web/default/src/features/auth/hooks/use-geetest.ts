import { useState, useCallback } from 'react'
import type { GeetestResult } from '@/components/geetest'

interface UseGeetestOptions {
  captchaId: string
  version?: number
  challenge?: string
}

export function useGeetest(options: UseGeetestOptions) {
  const [geetestResult, setGeetestResult] = useState<GeetestResult | null>(null)
  const [geetestToken, setGeetestToken] = useState('')

  const onVerify = useCallback((result: GeetestResult) => {
    setGeetestResult(result)
    setGeetestToken(JSON.stringify({
      captcha_id: result.captcha_id,
      lot_number: result.lot_number,
      pass_token: result.pass_token,
      gen_time: result.gen_time,
      captcha_output: result.captcha_output,
    }))
  }, [])

  const isGeetestEnabled = !!options.captchaId

  const validateGeetest = useCallback((): boolean => {
    if (isGeetestEnabled && !geetestToken) {
      return false
    }
    return true
  }, [isGeetestEnabled, geetestToken])

  return {
    isGeetestEnabled,
    geetestToken,
    geetestResult,
    setGeetestResult,
    onVerify,
    validateGeetest,
  }
}