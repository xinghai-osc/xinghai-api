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
import { useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface CounterProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  decimals?: number
}

function Counter(props: CounterProps) {
  const { end, suffix = '', prefix = '', duration = 1600, decimals = 0 } = props
  const ref = useRef<HTMLSpanElement>(null)
  const startedRef = useRef(false)

  const formatValue = useCallback(
    (v: number) =>
      decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString(),
    [decimals]
  )

  const animate = useCallback(() => {
    const el = ref.current
    if (!el) return
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = `${prefix}${formatValue(eased * end)}${suffix}`
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, prefix, suffix, formatValue])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      el.textContent = `${prefix}${formatValue(end)}${suffix}`
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true
          animate()
          observer.unobserve(el)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [animate, end, prefix, suffix, formatValue])

  return (
    <span ref={ref} className='tabular-nums'>
      {prefix}0{suffix}
    </span>
  )
}

interface StatsProps {
  className?: string
}

interface StatItem {
  end: number
  suffix: string
  label: string
  decimals?: number
  description?: string
}

export function Stats(_props: StatsProps) {
  const { t } = useTranslation()

  const stats: StatItem[] = [
    {
      end: 50,
      suffix: '+',
      label: t('upstream providers'),
      description: t('Global AI providers'),
    },
    {
      end: 500,
      suffix: '+',
      label: t('AI models supported'),
      description: t('Across all providers'),
    },
    {
      end: 50,
      suffix: '+',
      label: t('API-compatible endpoints'),
      description: t('OpenAI, Anthropic, Gemini compatible'),
    },
    {
      end: 10,
      suffix: 'K+',
      label: t('active deployments'),
      description: t('Worldwide'),
    },
  ]

  return (
    <div className='border-border/40 relative z-10 border-y bg-gradient-to-b from-muted/30 to-transparent'>
      <div className='mx-auto max-w-6xl px-6 py-16 md:py-20'>
        <div className='grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8'>
          {stats.map((s, index) => (
            <div
              key={s.label}
              className='group relative flex flex-col items-center text-center'
            >
              {index > 0 && (
                <div className='absolute left-0 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-border to-transparent md:block' style={{ marginLeft: '-2rem' }} />
              )}

              <div className='mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-primary/40 group-hover:shadow-md group-hover:shadow-primary/20'>
                <Counter end={s.end} suffix={s.suffix} decimals={s.decimals} />
              </div>

              <span className='text-sm font-semibold'>{s.label}</span>
              <span className='text-muted-foreground mt-0.5 text-xs'>
                {s.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}