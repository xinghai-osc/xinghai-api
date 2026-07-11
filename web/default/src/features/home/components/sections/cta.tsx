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
import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/design-system/button'

interface CTAProps {
  className?: string
  isAuthenticated?: boolean
}

export function CTA(props: CTAProps) {
  const { t } = useTranslation()

  if (props.isAuthenticated) {
    return null
  }

  return (
    <section className='relative z-10 overflow-hidden px-6 py-24 md:py-32'>
      <div className='mx-auto max-w-7xl'>
        <AnimateInView
          className='border-border/60 bg-background/70 relative overflow-hidden rounded-[2.5rem] border px-6 py-16 text-center shadow-xl shadow-slate-950/5 backdrop-blur-xl md:px-12 md:py-20 dark:shadow-black/20'
          animation='fade-up'
        >
          <div
            aria-hidden
            className='absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_20%,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_78%_26%,rgba(168,85,247,0.18),transparent_34%)]'
          />
          <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-primary'>
            <Sparkles className='size-3.5' />
            <span className='text-xs font-semibold'>
              {t('Free to start, scales with your needs')}
            </span>
          </div>

          <h2 className='mx-auto max-w-4xl text-4xl leading-tight font-black tracking-[-0.045em] md:text-6xl'>
            {t('Ready to simplify')}{' '}
            <span className='bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent'>
              {t('your AI integration?')}
            </span>
          </h2>

          <p className='text-muted-foreground mx-auto mt-6 max-w-2xl text-base leading-8 md:text-lg'>
            {t(
              'Deploy your own gateway and start routing requests through your configured upstream services.'
            )}
          </p>

          <div className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Button
              size='lg'
              className='group rounded-full bg-slate-950 px-7 text-white shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90'
              render={<Link to='/sign-up' />}
            >
              <span>{t('Get Started Free')}</span>
              <ArrowRight className='ml-2 size-4 transition-transform duration-200 group-hover:translate-x-1' />
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='border-border/60 bg-background/60 rounded-full px-7 shadow-sm backdrop-blur-xl hover:bg-background/90'
              render={<Link to='/pricing' />}
            >
              {t('View Pricing')}
            </Button>
          </div>

          <p className='text-muted-foreground mt-6 text-xs'>
            {t('No credit card required')} · {t('Deploy in minutes')}
          </p>
        </AnimateInView>
      </div>
    </section>
  )
}
