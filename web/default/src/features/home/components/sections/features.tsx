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

const featureKeys = ['Zap', 'Shield', 'Globe', 'Code', 'Gauge', 'DollarSign', 'Users', 'HeartHandshake'] as const

export function Features(_props: FeaturesProps) {
  const { t } = useTranslation()

  const features = [
    {
      key: 'lightning',
      iconKey: 'Zap',
      title: t('Lightning Fast'),
      desc: t(
        'Sub-100ms latency with optimized routing and intelligent caching'
      ),
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-500',
      borderColor: 'hover:border-amber-500/40',
    },
    {
      key: 'secure',
      iconKey: 'Shield',
      title: t('Secure & Reliable'),
      desc: t(
        'Enterprise-grade security with role-based access and audit logging'
      ),
      gradient: 'from-emerald-500/20 to-green-500/20',
      iconColor: 'text-emerald-500',
      borderColor: 'hover:border-emerald-500/40',
    },
    {
      key: 'global',
      iconKey: 'Globe',
      title: t('Global Coverage'),
      desc: t('Multi-region failover for 99.9% uptime worldwide'),
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-500',
      borderColor: 'hover:border-blue-500/40',
    },
    {
      key: 'developer',
      iconKey: 'Code',
      title: t('Developer Friendly'),
      desc: t('Drop-in replacement for OpenAI, Anthropic, and Gemini APIs'),
      gradient: 'from-violet-500/20 to-purple-500/20',
      iconColor: 'text-violet-500',
      borderColor: 'hover:border-violet-500/40',
    },
    {
      key: 'performance',
      iconKey: 'Gauge',
      title: t('High Performance'),
      desc: t('Smart load balancing with automatic failover and rate limiting'),
      gradient: 'from-red-500/20 to-pink-500/20',
      iconColor: 'text-red-500',
      borderColor: 'hover:border-red-500/40',
    },
    {
      key: 'billing',
      iconKey: 'DollarSign',
      title: t('Transparent Billing'),
      desc: t('Real-time cost tracking with budget alerts and team quotas'),
      gradient: 'from-green-500/20 to-teal-500/20',
      iconColor: 'text-green-500',
      borderColor: 'hover:border-green-500/40',
    },
    {
      key: 'team',
      iconKey: 'Users',
      title: t('Team Collaboration'),
      desc: t('Granular permissions and shared workspaces for your team'),
      gradient: 'from-indigo-500/20 to-blue-500/20',
      iconColor: 'text-indigo-500',
      borderColor: 'hover:border-indigo-500/40',
    },
    {
      key: 'opensource',
      iconKey: 'HeartHandshake',
      title: t('Open Source'),
      desc: t('Self-hosted, extensible, backed by an active community'),
      gradient: 'from-rose-500/20 to-pink-500/20',
      iconColor: 'text-rose-500',
      borderColor: 'hover:border-rose-500/40',
    },
  ]

  return (
    <section className='relative z-10 px-6 py-24 md:py-32'>
      <div className='mx-auto max-w-5xl'>
        <AnimateInView className='mb-16 text-center md:mb-20'>
          <p className='text-muted-foreground mb-3 text-xs font-medium tracking-[0.2em] uppercase'>
            {t('Core Features')}
          </p>
          <h2 className='text-3xl leading-tight font-bold tracking-tight md:text-4xl'>
            {t('Everything you need to ship AI products faster')}
          </h2>
          <div className='mx-auto mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500' />
        </AnimateInView>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {features.map((f, i) => (
            <AnimateInView
              key={f.key}
              delay={i * 60}
              animation='fade-up'
              className='group relative rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/80 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5'
            >
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

              <div className='relative'>
                <div className={`mb-4 inline-flex rounded-lg ${f.iconColor} bg-current/10 p-2.5`}>
                  {featureIcons[f.iconKey as keyof typeof featureIcons]}
                </div>

                <h3 className='mb-2 text-sm font-semibold'>{f.title}</h3>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  {f.desc}
                </p>
              </div>

              <div className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent ${f.borderColor.replace('hover:', '')} via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}