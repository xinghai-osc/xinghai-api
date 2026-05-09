import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    initGeetest4?: (config: Record<string, unknown>, callback: (result: unknown) => void) => void
    initGeetest?: (config: Record<string, unknown>, callback: (result: unknown) => void) => void
    Geetest4?: {
      new (config: Record<string, unknown>): {
        appendTo: (element: HTMLElement) => void
        destroy: () => void
      }
    }
  }
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
  product = 'bind',
  version = 4,
  challenge = '',
  className,
}: GeetestProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!ref.current || !captchaId) return

    const loadGeetestV4 = () => {
      if (!window.initGeetest4 || !ref.current) return

      const config: Record<string, unknown> = {
        captchaId,
        product,
        riskType: 'block',
        language: 'eng',
      }

      window.initGeetest4(config, (captchaResult: unknown) => {
        const result = captchaResult as Record<string, unknown>
        if (result && result.captcha_id) {
          onVerify({
            captcha_id: result.captcha_id as string,
            lot_number: result.lot_number as string,
            pass_token: result.pass_token as string,
            gen_time: result.gen_time as string,
            captcha_output: result.captcha_output as string,
          })
        }
      })
    }

    const loadGeetestV3 = () => {
      if (!window.initGeetest || !ref.current) return

      const config: Record<string, unknown> = {
        gt: captchaId,
        challenge,
        product: 'embed',
        offline: '0',
        new_captcha: true,
        https: true,
      }

      window.initGeetest(config, (result: unknown) => {
        const res = result as Record<string, unknown>
        if (res && res.geetest_challenge && res.geetest_seccode) {
          onVerify({
            captcha_id: captchaId,
            lot_number: res.geetest_challenge as string,
            pass_token: res.geetest_validate as string,
            gen_time: res.geetest_seccode as string,
          })
        }
      })
    }

    const scriptId = 'geetest-sdk'

    const render = () => {
      try {
        if (version === 4) {
          loadGeetestV4()
        } else {
          loadGeetestV3()
        }
      } catch {
        setError(true)
        onError?.()
      }
    }

    if (window.initGeetest4 || window.initGeetest) {
      render()
      return
    }

    if (document.getElementById(scriptId)) {
      return
    }

    const s = document.createElement('script')
    s.id = scriptId
    if (version === 4) {
      s.src = 'https://static.geetest.com/v4/gt4.js'
    } else {
      s.src = 'https://static.geetest.com/v2/gt.js'
    }
    s.async = true
    s.defer = true
    s.onload = () => render()
    s.onerror = () => {
      setError(true)
      onError?.()
    }
    document.head.appendChild(s)
  }, [captchaId, onVerify, onError, product, version, challenge])

  if (error) {
    return (
      <div className={className}>
        <p style={{ color: 'red' }}>Failed to load captcha</p>
      </div>
    )
  }

  return <div ref={ref} className={className} />
}