import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AnimateInView } from '@/components/animate-in-view'

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
      <div
        aria-hidden
        className='absolute inset-0 -z-10 opacity-50 dark:opacity-[0.15]'
        style={{
          background: [
            'radial-gradient(ellipse 60% 50% at 20% 50%, oklch(0.65 0.18 270 / 50%) 0%, transparent 60%)',
            'radial-gradient(ellipse 50% 50% at 80% 40%, oklch(0.6 0.15 290 / 45%) 0%, transparent 60%)',
            'radial-gradient(ellipse 40% 40% at 50% 80%, oklch(0.55 0.12 250 / 30%) 0%, transparent 60%)',
          ].join(', '),
        }}
      />

      <div
        aria-hidden
        className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_50%_60%_at_50%_50%,black_10%,transparent_100%)] bg-[size:3rem_3rem] opacity-[0.06] dark:opacity-[0.04]'
      />

      <AnimateInView
        className='relative mx-auto max-w-2xl text-center'
        animation='fade-up'
      >
        <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 backdrop-blur-sm'>
          <Sparkles className='size-3.5 text-primary' />
          <span className='text-xs font-medium text-primary/90'>
            {t('Free to start, scales with your needs')}
          </span>
        </div>

        <h2 className='text-3xl leading-tight font-bold tracking-tight md:text-4xl'>
          {t('Ready to simplify')}
          <br />
          <span className='bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent'>
            {t('your AI integration?')}
          </span>
        </h2>

        <p className='text-muted-foreground/80 mx-auto mt-5 max-w-lg text-base leading-relaxed'>
          {t(
            'Deploy your own gateway and start routing requests through your configured upstream services.'
          )}
        </p>

        <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row'>
          <Button
            size='lg'
            className='group rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 border-0'
            render={<Link to='/sign-up' />}
          >
            <span>{t('Get Started Free')}</span>
            <ArrowRight className='ml-2 size-4 transition-transform duration-200 group-hover:translate-x-1' />
          </Button>
          <Button
            size='lg'
            variant='outline'
            className='rounded-xl border-2 backdrop-blur-sm hover:bg-muted/60 transition-all duration-300'
            render={<Link to='/pricing' />}
          >
            {t('View Pricing')}
          </Button>
        </div>

        <p className='text-muted-foreground mt-6 text-xs'>
          {t('No credit card required')} · {t('Deploy in minutes')}
        </p>
      </AnimateInView>
    </section>
  )
}