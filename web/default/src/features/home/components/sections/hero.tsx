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
import { CherryStudio } from '@lobehub/icons'
import { ArrowRight, BookOpen, CheckCircle2, Network } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStatus } from '@/hooks/use-status'
import { Button } from '@/components/ui/button'
import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

const MoreIcon = () => (
  <svg
    className='text-muted-foreground/60 group-hover:text-foreground size-6 shrink-0 transition-colors'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <circle cx='6' cy='12' r='2' fill='currentColor' />
    <circle cx='12' cy='12' r='2' fill='currentColor' />
    <circle cx='18' cy='12' r='2' fill='currentColor' />
  </svg>
)

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const docsUrl =
    (status?.docs_link as string | undefined) || 'https://docs.newapi.pro'

  const renderDocsButton = () => {
    const isExternal = docsUrl.startsWith('http')
    if (isExternal) {
      return (
        <Button
          variant='outline'
          className='group border-border/60 bg-background/55 hover:bg-background/80 h-11 rounded-full px-5 text-sm font-medium shadow-sm backdrop-blur-xl'
          render={
            <a href={docsUrl} target='_blank' rel='noopener noreferrer' />
          }
        >
          <BookOpen className='size-4 transition-transform duration-200 group-hover:-rotate-6' />
          <span>{t('Docs')}</span>
        </Button>
      )
    }
    return (
      <Button
        variant='outline'
        className='group border-border/60 bg-background/55 hover:bg-background/80 h-11 rounded-full px-5 text-sm font-medium shadow-sm backdrop-blur-xl'
        render={<Link to={docsUrl} />}
      >
        <BookOpen className='size-4 transition-transform duration-200 group-hover:-rotate-6' />
        <span>{t('Docs')}</span>
      </Button>
    )
  }

  const primaryAction = props.isAuthenticated ? (
    <Button
      className='group h-11 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90'
      render={<Link to='/dashboard' />}
    >
      {t('Go to Dashboard')}
      <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-1' />
    </Button>
  ) : (
    <Button
      className='group h-11 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90'
      render={<Link to='/sign-up' />}
    >
      {t('Get Started')}
      <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-1' />
    </Button>
  )

  return (
    <section className='relative z-10 overflow-hidden px-6 pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-36 lg:pb-28'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.24),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(168,85,247,0.2),transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.65),transparent_52%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(168,85,247,0.16),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.75),transparent_56%)]'
      />
      <div
        aria-hidden
        className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_20%,black_15%,transparent_80%)] bg-[size:3.5rem_3.5rem] opacity-[0.08]'
      />

      <div className='mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(520px,0.92fr)] lg:gap-14'>
        <div className='flex flex-col items-start'>
          <div
            className='landing-animate-fade-up border-border/70 bg-background/70 mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium opacity-0 shadow-sm backdrop-blur-xl'
            style={{ animationDelay: '0ms' }}
          >
            <span className='relative flex size-2'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60' />
              <span className='relative inline-flex size-2 rounded-full bg-blue-500' />
            </span>
            <span>{t('AI Application Infrastructure Foundation')}</span>
          </div>

          <h1
            className='landing-animate-fade-up max-w-4xl text-[clamp(2.7rem,6vw,5.6rem)] leading-[0.95] font-black tracking-[-0.055em] opacity-0'
            style={{ animationDelay: '60ms' }}
          >
            {t('Unified API Gateway for')}
            <span className='block bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 bg-clip-text pt-2 text-transparent'>
              {t('Vast Range of AI Models')}
            </span>
          </h1>

          <p
            className='landing-animate-fade-up text-muted-foreground mt-7 max-w-2xl text-lg leading-8 opacity-0 md:text-xl'
            style={{ animationDelay: '120ms' }}
          >
            {t(
              'Access a vast selection of models via a standard, unified API protocol. Power AI applications, manage digital assets, and connect the Future.'
            )}
          </p>

          <div
            className='landing-animate-fade-up mt-9 flex flex-wrap items-center gap-3 opacity-0'
            style={{ animationDelay: '180ms' }}
          >
            {primaryAction}
            {!props.isAuthenticated && (
              <Button
                variant='outline'
                className='border-border/60 bg-background/55 hover:bg-background/80 h-11 rounded-full px-5 text-sm font-medium shadow-sm backdrop-blur-xl'
                render={<Link to='/pricing' />}
              >
                {t('View Pricing')}
              </Button>
            )}
            {renderDocsButton()}
          </div>

          <div
            className='landing-animate-fade-up mt-10 grid w-full max-w-2xl gap-3 opacity-0 sm:grid-cols-3'
            style={{ animationDelay: '240ms' }}
          >
            {[
              t('Drop-in replacement for OpenAI, Anthropic, and Gemini APIs'),
              t('Smart load balancing with automatic failover and rate limiting'),
              t('Real-time cost tracking with budget alerts and team quotas'),
            ].map((item) => (
              <div
                key={item}
                className='border-border/60 bg-background/55 flex items-start gap-2 rounded-2xl border p-3 text-xs leading-relaxed shadow-sm backdrop-blur-xl'
              >
                <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div
            className='landing-animate-fade-up mt-8 w-full max-w-2xl opacity-0'
            style={{ animationDelay: '300ms' }}
          >
            <div className='mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase'>
              <Network className='size-3.5' />
              {t('Supported Applications')}
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <a
                href='https://cherry-ai.com'
                target='_blank'
                rel='noopener noreferrer'
                className='group border-border/60 bg-background/60 hover:bg-background/90 flex items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-medium shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5'
              >
                <CherryStudio.Color size={22} className='shrink-0' />
                <span>Cherry Studio</span>
              </a>
              <a
                href='https://ccswitch.io'
                target='_blank'
                rel='noopener noreferrer'
                className='group border-border/60 bg-background/60 hover:bg-background/90 flex items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-medium shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5'
              >
                <span className='flex size-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-[10px] font-bold text-blue-600 dark:text-blue-400'>
                  CC
                </span>
                <span>CC Switch</span>
              </a>
              <div className='group border-border/60 bg-background/60 text-muted-foreground flex cursor-default items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium shadow-sm backdrop-blur-xl transition-colors hover:text-foreground'>
                <MoreIcon />
                <span>{t('More Apps')}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className='landing-animate-fade-up relative opacity-0'
          style={{ animationDelay: '360ms' }}
        >
          <div className='absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-fuchsia-500/15 blur-3xl' />
          <div className='border-border/60 bg-background/35 rounded-[2rem] border p-3 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:shadow-black/40'>
            <HeroTerminalDemo />
          </div>
        </div>
      </div>
    </section>
  )
}
