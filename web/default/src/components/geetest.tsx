import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

declare global {
  interface Window {
    initGeetest4?: (config: Record<string, unknown>, callback: (captcha: Geetest4Captcha) => void) => void
    initGeetest?: (config: Record<string, unknown>, callback: (captcha: Geetest3Captcha) => void) => void
  }
}

interface Geetest4Captcha {
  appendTo: (element: HTMLElement) => void
  onSuccess: (callback: () => void) => void
  onError?: (callback: () => void) => void
  getValidate: () => Record<string, unknown>
  destroy?: () => void
}

interface Geetest3Captcha {
  appendTo?: (element: HTMLElement) => void
  onSuccess?: (callback: () => void) => void
  getValidate?: () => Record<string, unknown>
}

interface GeetestProps {
  captchaId: string
  onVerify: (result: GeetestResult) => void
  onError?: () => void
  product?: 'bind' | 'popup' | 'float' | 'custom'
  version?: number
  challenge?: string
  className?: string
}

export interface GeetestResult {
  captcha_id: string
  lot_number: string
  pass_token: string
  gen_time: string
  captcha_output?: string
}

export function Geetest({
  captchaId,
  onVerify,
  onError,
  product = 'float',
  version = 4,
  challenge = '',
  className,
}: GeetestProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement | null>(null)
  const captchaRef = useRef<Geetest4Captcha | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!ref.current || !captchaId) return

    const handleError = () => {
      setError(true)
      onError?.()
    }

    const loadGeetestV4 = () => {
      if (!window.initGeetest4 || !ref.current) return

      window.initGeetest4(
        {
          captchaId,
          product,
          riskType: 'slide',
        },
        (captcha) => {
          captchaRef.current = captcha
          captcha.appendTo(ref.current as HTMLElement)
          captcha.onSuccess(() => {
            const result = captcha.getValidate()
            if (result?.lot_number && result?.pass_token && result?.gen_time) {
              onVerify({
                captcha_id: captchaId,
                lot_number: result.lot_number as string,
                pass_token: result.pass_token as string,
                gen_time: result.gen_time as string,
                captcha_output: result.captcha_output as string,
              })
            }
          })
          captcha.onError?.(handleError)
        }
      )
    }

    const loadGeetestV3 = () => {
      if (!window.initGeetest || !ref.current) return

      window.initGeetest(
        {
          gt: captchaId,
          challenge,
          product: 'embed',
          offline: '0',
          new_captcha: true,
          https: true,
        },
        (captcha) => {
          captcha.appendTo?.(ref.current as HTMLElement)
          captcha.onSuccess?.(() => {
            const result = captcha.getValidate?.()
            if (result?.geetest_challenge && result?.geetest_seccode) {
              onVerify({
                captcha_id: captchaId,
                lot_number: result.geetest_challenge as string,
                pass_token: result.geetest_validate as string,
                gen_time: result.geetest_seccode as string,
              })
            }
          })
        }
      )
    }

    const render = () => {
      try {
        if (version === 4) {
          loadGeetestV4()
        } else {
          loadGeetestV3()
        }
      } catch {
        handleError()
      }
    }

    const isSdkReady = version === 4 ? window.initGeetest4 : window.initGeetest
    if (isSdkReady) {
      render()
      return () => captchaRef.current?.destroy?.()
    }

    const scriptId = version === 4 ? 'geetest-v4-sdk' : 'geetest-v3-sdk'
    const existingScript = document.querySelector<HTMLScriptElement>(`#${scriptId}`)
    if (existingScript) {
      existingScript.addEventListener('load', render, { once: true })
      existingScript.addEventListener('error', handleError, { once: true })
      return () => {
        existingScript.removeEventListener('load', render)
        existingScript.removeEventListener('error', handleError)
        captchaRef.current?.destroy?.()
      }
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = version === 4 ? 'https://static.geetest.com/v4/gt4.js' : 'https://static.geetest.com/v2/gt.js'
    script.async = true
    script.defer = true
    script.addEventListener('load', render, { once: true })
    script.addEventListener('error', handleError, { once: true })
    document.head.appendChild(script)

    return () => {
      script.removeEventListener('load', render)
      script.removeEventListener('error', handleError)
      captchaRef.current?.destroy?.()
    }
  }, [captchaId, onVerify, onError, product, version, challenge])

  if (error) {
    return (
      <div className={className}>
        <p className='text-destructive text-sm'>{t('Failed to load captcha')}</p>
      </div>
    )
  }

  return <div ref={ref} className={className} />
}
