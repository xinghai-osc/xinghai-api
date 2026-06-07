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
    <section className='relative z-10 px-6 py-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='border-border/60 bg-background/65 grid overflow-hidden rounded-[2rem] border shadow-sm backdrop-blur-xl md:grid-cols-4'>
          {stats.map((s, index) => (
            <div
              key={s.label}
              className='group relative p-6 text-left transition-colors hover:bg-muted/35 md:p-8'
            >
              {index > 0 && (
                <div className='absolute top-8 bottom-8 left-0 hidden w-px bg-gradient-to-b from-transparent via-border to-transparent md:block' />
              )}
              <div className='mb-4 text-4xl font-black tracking-tight md:text-5xl'>
                <Counter end={s.end} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <div className='text-sm font-semibold'>{s.label}</div>
              <div className='text-muted-foreground mt-1 text-xs'>
                {s.description}
              </div>
              <div className='absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-blue-500 via-violet-500 to-transparent transition-transform duration-300 group-hover:scale-x-100' />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
