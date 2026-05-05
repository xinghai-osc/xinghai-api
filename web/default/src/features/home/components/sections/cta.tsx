import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
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
      {/* Gradient mesh background */}
      <div
        aria-hidden
        className='absolute inset-0 -z-10 opacity-20 dark:opacity-[0.08]'
        style={{
          background: [
            'radial-gradient(ellipse 50% 50% at 30% 50%, oklch(0.7 0.15 250 / 70%) 0%, transparent 70%)',
            'radial-gradient(ellipse 40% 40% at 70% 40%, oklch(0.65 0.12 200 / 50%) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      <AnimateInView
        className='mx-auto max-w-xl text-center'
        animation='fade-up'
      >
        <h2 className='text-2xl leading-tight font-semibold tracking-tight md:text-3xl'>
          {t('Ready to simplify')}
          <br />
          <span className='bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600 bg-clip-text text-transparent'>
            {t('your AI integration?')}
          </span>
        </h2>
        <p className='text-muted-foreground/70 mx-auto mt-4 max-w-md text-sm leading-relaxed md:text-base'>
          {t(
            'Deploy your own gateway and start routing requests through your configured upstream services.'
          )}
        </p>

        {/* Gradient divider */}
        <div className='mx-auto my-8 h-px w-12 bg-gradient-to-r from-blue-500 to-violet-500' />

        {/* Single CTA */}
        <div>
          <Button className='group mx-auto rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-8 hover:from-blue-500 hover:to-violet-500' asChild>
            <Link to='/sign-up'>
              {t('Get Started')}
              <ArrowRight className='ml-1 size-3.5 transition-transform duration-200 group-hover:translate-x-0.5' />
            </Link>
          </Button>
        </div>
      </AnimateInView>
    </section>
  )
}
