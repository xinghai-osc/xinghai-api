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

const featureIcons = {
  Zap: <Zap className='size-5' />,
  Shield: <Shield className='size-5' />,
  Globe: <Globe className='size-5' />,
  Code: <Code className='size-5' />,
  Gauge: <Gauge className='size-5' />,
  DollarSign: <DollarSign className='size-5' />,
  Users: <Users className='size-5' />,
  HeartHandshake: <HeartHandshake className='size-5' />,
} as const

export function Features(_props: FeaturesProps) {
  const { t } = useTranslation()

  const features = [
    {
      key: 'developer',
      iconKey: 'Code',
      title: t('Developer Friendly'),
      desc: t('Drop-in replacement for OpenAI, Anthropic, and Gemini APIs'),
      highlight: true,
    },
    {
      key: 'performance',
      iconKey: 'Gauge',
      title: t('High Performance'),
      desc: t('Smart load balancing with automatic failover and rate limiting'),
    },
    {
      key: 'billing',
      iconKey: 'DollarSign',
      title: t('Transparent Billing'),
      desc: t('Real-time cost tracking with budget alerts and team quotas'),
    },
    {
      key: 'secure',
      iconKey: 'Shield',
      title: t('Secure & Reliable'),
      desc: t(
        'Enterprise-grade security with role-based access and audit logging'
      ),
    },
    {
      key: 'global',
      iconKey: 'Globe',
      title: t('Global Coverage'),
      desc: t('Multi-region failover for 99.9% uptime worldwide'),
    },
    {
      key: 'lightning',
      iconKey: 'Zap',
      title: t('Lightning Fast'),
      desc: t(
        'Sub-100ms latency with optimized routing and intelligent caching'
      ),
    },
    {
      key: 'team',
      iconKey: 'Users',
      title: t('Team Collaboration'),
      desc: t('Granular permissions and shared workspaces for your team'),
    },
    {
      key: 'opensource',
      iconKey: 'HeartHandshake',
      title: t('Open Source'),
      desc: t('Self-hosted, extensible, backed by an active community'),
    },
  ]

  return (
    <section className='relative z-10 overflow-hidden px-6 py-24 md:py-32'>
      <div
        aria-hidden
        className='absolute inset-x-0 top-1/3 -z-10 h-80 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-fuchsia-500/10 blur-3xl'
      />
      <div className='mx-auto max-w-7xl'>
        <AnimateInView className='mb-14 max-w-3xl md:mb-16'>
          <p className='text-muted-foreground mb-4 text-xs font-bold tracking-[0.24em] uppercase'>
            {t('Core Features')}
          </p>
          <h2 className='text-4xl leading-tight font-black tracking-[-0.04em] md:text-6xl'>
            {t('Everything you need to ship AI products faster')}
          </h2>
        </AnimateInView>

        <div className='grid gap-4 md:grid-cols-4'>
          {features.map((f, i) => (
            <AnimateInView
              key={f.key}
              delay={i * 50}
              animation='fade-up'
              className={`group border-border/60 bg-card/70 relative overflow-hidden rounded-[1.6rem] border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 ${
                f.highlight ? 'md:col-span-2 md:row-span-2 md:p-8' : ''
              }`}
            >
              <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
              <div className='relative'>
                <div className='mb-6 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-foreground shadow-sm ring-1 ring-primary/10'>
                  {featureIcons[f.iconKey as keyof typeof featureIcons]}
                </div>
                <h3 className={f.highlight ? 'mb-3 text-2xl font-semibold' : 'mb-2 text-base font-semibold'}>
                  {f.title}
                </h3>
                <p className={`text-muted-foreground leading-relaxed ${f.highlight ? 'text-base' : 'text-sm'}`}>
                  {f.desc}
                </p>
                {f.highlight && (
                  <div className='mt-8 grid grid-cols-2 gap-3 text-xs'>
                    <div className='rounded-2xl bg-muted/50 p-4'>
                      <div className='mb-1 text-2xl font-semibold'>1</div>
                      <div className='text-muted-foreground'>{t('Unified endpoint')}</div>
                    </div>
                    <div className='rounded-2xl bg-muted/50 p-4'>
                      <div className='mb-1 text-2xl font-semibold'>∞</div>
                      <div className='text-muted-foreground'>{t('Provider choices')}</div>
                    </div>
                  </div>
                )}
              </div>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
