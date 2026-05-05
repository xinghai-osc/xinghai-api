import {
  Zap,
  Shield,
  Globe,
  Code,
  Gauge,
  DollarSign,
  Users,
  HeartHandshake,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnimateInView } from '@/components/animate-in-view'

interface FeaturesProps {
  className?: string
}

export function Features(_props: FeaturesProps) {
  const { t } = useTranslation()

  const features = [
    {
      num: '01',
      icon: <Zap className='size-4' />,
      title: t('Lightning Fast'),
      desc: t(
        'Optimized network architecture ensures millisecond response times'
      ),
    },
    {
      num: '02',
      icon: <Shield className='size-4' />,
      title: t('Secure & Reliable'),
      desc: t(
        'Enterprise-grade security with comprehensive permission management'
      ),
    },
    {
      num: '03',
      icon: <Globe className='size-4' />,
      title: t('Global Coverage'),
      desc: t('Multi-region deployment for stable global access'),
    },
    {
      num: '04',
      icon: <Code className='size-4' />,
      title: t('Developer Friendly'),
      desc: t('Compatible API routes for common AI application workflows'),
    },
    {
      num: '05',
      icon: <Gauge className='size-4' />,
      title: t('High Performance'),
      desc: t('Support for high concurrency with automatic load balancing'),
    },
    {
      num: '06',
      icon: <DollarSign className='size-4' />,
      title: t('Transparent Billing'),
      desc: t('Pay-as-you-go with real-time usage monitoring'),
    },
    {
      num: '07',
      icon: <Users className='size-4' />,
      title: t('Team Collaboration'),
      desc: t('Multi-user management with flexible permission allocation'),
    },
    {
      num: '08',
      icon: <HeartHandshake className='size-4' />,
      title: t('Open Source'),
      desc: t('Community driven, self-hosted, and extensible'),
    },
  ]

  return (
    <section className='relative z-10 px-6 py-24 md:py-32'>
      <div className='mx-auto max-w-2xl'>
        {/* Section header */}
        <AnimateInView>
          <p className='text-muted-foreground mb-3 text-xs font-medium tracking-[0.2em] uppercase'>
            {t('Core Features')}
          </p>
          <h2 className='text-2xl leading-tight font-semibold tracking-tight md:text-3xl'>
            {t('Built for developers,')}
            <br />
            {t('designed for scale')}
          </h2>
        </AnimateInView>

        {/* Gradient divider */}
        <div className='my-8 h-px w-12 bg-gradient-to-r from-blue-500 to-violet-500' />

        {/* Editorial list */}
        <div className='divide-border/50 divide-y'>
          {features.map((f, i) => (
            <AnimateInView
              key={f.num}
              delay={i * 50}
              className='group flex items-start gap-5 py-6 md:py-7'
            >
              {/* Number */}
              <span className='text-muted-foreground/50 shrink-0 pt-0.5 font-mono text-xs tabular-nums'>
                {f.num}
              </span>

              {/* Content */}
              <div className='min-w-0 flex-1'>
                <div className='mb-2 flex items-center gap-2.5'>
                  <span className='text-muted-foreground/60'>{f.icon}</span>
                  <h3 className='text-sm font-semibold' style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                    {f.title}
                  </h3>
                </div>
                <p className='text-muted-foreground/70 text-sm leading-relaxed'>
                  {f.desc}
                </p>
              </div>
            </AnimateInView>
          ))}
        </div>

        {/* Bottom divider */}
        <div className='mt-8 h-px w-8 bg-primary/40' />
      </div>
    </section>
  )
}
