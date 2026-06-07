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
import { Settings, Zap, BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnimateInView } from '@/components/animate-in-view'

export function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    {
      num: '01',
      title: t('Connect Providers'),
      desc: t(
        'Add your upstream API keys and configure model routing in minutes'
      ),
      icon: <Settings className='size-6' strokeWidth={1.6} />,
    },
    {
      num: '02',
      title: t('Route Requests'),
      desc: t(
        'Send requests through a single unified endpoint — we handle the rest'
      ),
      icon: <Zap className='size-6' strokeWidth={1.6} />,
    },
    {
      num: '03',
      title: t('Track & Optimize'),
      desc: t('Monitor costs, usage patterns, and performance in real time'),
      icon: <BarChart3 className='size-6' strokeWidth={1.6} />,
    },
  ]

  return (
    <section className='relative z-10 px-6 py-24 md:py-32'>
      <div className='mx-auto max-w-7xl'>
        <div className='border-border/60 bg-slate-950 text-white dark:bg-white dark:text-slate-950 overflow-hidden rounded-[2.5rem] border p-6 shadow-2xl shadow-slate-950/15 md:p-10'>
          <AnimateInView className='mb-12 grid gap-6 md:grid-cols-[0.8fr_1fr] md:items-end'>
            <div>
              <p className='mb-4 text-xs font-bold tracking-[0.24em] text-white/50 uppercase dark:text-slate-950/50'>
                {t('How It Works')}
              </p>
              <h2 className='text-4xl leading-tight font-black tracking-[-0.04em] md:text-5xl'>
                {t('Up and running in minutes')}
              </h2>
            </div>
            <p className='max-w-xl text-sm leading-7 text-white/60 dark:text-slate-950/60 md:justify-self-end'>
              {t(
                'Deploy your own gateway and start routing requests through your configured upstream services.'
              )}
            </p>
          </AnimateInView>

          <div className='grid gap-4 md:grid-cols-3'>
            {steps.map((step, i) => (
              <AnimateInView
                key={step.num}
                delay={i * 120}
                animation='fade-up'
                className='group relative rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm transition-colors hover:bg-white/[0.1] dark:border-slate-950/10 dark:bg-slate-950/[0.05] dark:hover:bg-slate-950/[0.08]'
              >
                <div className='mb-10 flex items-center justify-between'>
                  <div className='flex size-12 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg dark:bg-slate-950 dark:text-white'>
                    {step.icon}
                  </div>
                  <span className='font-mono text-4xl font-black tracking-[-0.08em] text-white/15 dark:text-slate-950/15'>
                    {step.num}
                  </span>
                </div>
                <h3 className='mb-3 text-xl font-bold'>{step.title}</h3>
                <p className='text-sm leading-7 text-white/60 dark:text-slate-950/60'>
                  {step.desc}
                </p>
              </AnimateInView>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
