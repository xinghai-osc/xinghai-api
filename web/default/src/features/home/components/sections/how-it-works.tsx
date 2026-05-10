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
import { useEffect, useRef } from 'react'
import { Settings, Zap, BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnimateInView } from '@/components/animate-in-view'

export function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    {
      num: '1',
      title: t('Connect Providers'),
      desc: t(
        'Add your upstream API keys and configure model routing in minutes'
      ),
      icon: <Settings className='size-7' strokeWidth={1.5} />,
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      num: '2',
      title: t('Route Requests'),
      desc: t(
        'Send requests through a single unified endpoint — we handle the rest'
      ),
      icon: <Zap className='size-7' strokeWidth={1.5} />,
      gradient: 'from-violet-500/20 to-purple-500/20',
      iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      num: '3',
      title: t('Track & Optimize'),
      desc: t('Monitor costs, usage patterns, and performance in real time'),
      icon: <BarChart3 className='size-7' strokeWidth={1.5} />,
      gradient: 'from-emerald-500/20 to-green-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ]

  return (
    <section className='border-border/40 relative z-10 border-y bg-gradient-to-b from-transparent via-muted/20 to-transparent px-6 py-24 md:py-32'>
      <div className='mx-auto max-w-5xl'>
        <AnimateInView className='mb-16 text-center md:mb-20'>
          <p className='text-muted-foreground mb-3 text-xs font-medium tracking-widest uppercase'>
            {t('How It Works')}
          </p>
          <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
            {t('Up and running in minutes')}
          </h2>
          <div className='mx-auto mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500' />
        </AnimateInView>

        <div className='relative'>
          <div
            aria-hidden
            className='absolute top-16 left-1/2 hidden h-px w-[calc(100%-16rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent md:block'
          />

          <div className='grid gap-8 md:grid-cols-3 md:gap-12'>
            {steps.map((step, i) => (
              <AnimateInView
                key={step.num}
                delay={i * 150}
                animation='fade-up'
                className='group relative flex flex-col items-center text-center'
              >
                <div className='relative mb-6'>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.gradient} blur-xl opacity-60 transition-opacity duration-500 group-hover:opacity-100`} />
                  <div className={`relative flex size-20 items-center justify-center rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md ${step.iconBg.replace('/10', '/15')}`}>
                    <div className={step.iconBg}>
                      {step.icon}
                    </div>
                  </div>
                  <div className='bg-foreground text-background absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full text-sm font-bold shadow-lg'>
                    {step.num}
                  </div>
                </div>

                <h3 className='mb-2 text-lg font-semibold'>{step.title}</h3>
                <p className='text-muted-foreground max-w-[260px] text-sm leading-relaxed'>
                  {step.desc}
                </p>

                {i < steps.length - 1 && (
                  <div
                    aria-hidden
                    className='absolute top-10 hidden -right-4 md:flex'
                  >
                    <svg
                      className='size-8 text-muted-foreground/40 transition-colors duration-300 group-hover:text-muted-foreground/60'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3'
                      />
                    </svg>
                  </div>
                )}
              </AnimateInView>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}