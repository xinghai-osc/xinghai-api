import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Button } from '@/components/ui/button'
import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()

  return (
    <section className='relative z-10 flex flex-col items-center overflow-hidden px-6 pt-28 pb-16 md:pt-36 md:pb-24'>
      {/* Tech gradient background */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 opacity-25 dark:opacity-[0.15]'
        style={{
          background: [
            'radial-gradient(ellipse 60% 50% at 20% 20%, oklch(0.7 0.15 260 / 80%) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 40% at 80% 15%, oklch(0.65 0.12 280 / 60%) 0%, transparent 70%)',
            'radial-gradient(ellipse 40% 35% at 50% 80%, oklch(0.6 0.1 240 / 40%) 0%, transparent 70%)',
          ].join(', '),
        }}
      />
      {/* Grid pattern */}
      <div
        aria-hidden
        className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black_20%,transparent_100%)] bg-[size:4rem_4rem] opacity-[0.06] dark:opacity-[0.04]'
      />

      <div className='flex max-w-3xl flex-col items-center text-center'>
        {/* Tech badge */}
        <div className='mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary'>
          <span className='bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent font-semibold'>
            {t('Open Source')}
          </span>
          <span className='text-muted-foreground'>·</span>
          <span className='text-primary/80'>{t('Enterprise-Ready')}</span>
        </div>

        <h1 className='text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.15] font-bold tracking-tight'>
          {t('One Gateway to')}
          <br />
          <span className='bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600 bg-clip-text text-transparent'>
            {t('Every AI Model You Need')}
          </span>
        </h1>
        <p className='text-muted-foreground/80 mt-5 max-w-lg text-base leading-relaxed md:text-lg'>
          {t(
            'A unified API gateway that connects 50+ AI providers. Manage models, keys, quotas, and routing policies — all in one place.'
          )}
        </p>
        <div className='mt-8 flex items-center gap-3'>
          {props.isAuthenticated ? (
            <Button className='group rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500' asChild>
              <Link to='/dashboard'>
                {t('Go to Dashboard')}
                <ArrowRight className='ml-1 size-3.5 transition-transform duration-200 group-hover:translate-x-0.5' />
              </Link>
            </Button>
          ) : (
            <>
              <Button className='group rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500' asChild>
                <Link to='/sign-up'>
                  {t('Get Started')}
                  <ArrowRight className='ml-1 size-3.5 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Link>
              </Button>
              <Button
                variant='outline'
                className='border-border/50 hover:border-border hover:bg-muted/50 rounded-lg'
                asChild
              >
                <Link to='/pricing'>{t('View Pricing')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className='mt-12 w-full max-w-2xl'>
        <HeroTerminalDemo />
      </div>
    </section>
  )
}
