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
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { useSystemConfig } from '@/hooks/use-system-config'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='relative grid h-svh max-w-none lg:grid-cols-2'>
      <div className='relative hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:overflow-hidden'>
        <div
          aria-hidden
          className='absolute inset-0 -z-10 opacity-30 dark:opacity-20'
          style={{
            background: [
              'radial-gradient(ellipse 60% 50% at 30% 30%, oklch(0.7 0.15 250 / 80%) 0%, transparent 70%)',
              'radial-gradient(ellipse 50% 40% at 70% 60%, oklch(0.65 0.12 280 / 60%) 0%, transparent 70%)',
              'radial-gradient(ellipse 40% 35% at 50% 80%, oklch(0.7 0.1 200 / 40%) 0%, transparent 70%)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden
          className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_20%,transparent_100%)] bg-[size:3rem_3rem] opacity-[0.06] dark:opacity-[0.04]'
        />
        <div className='relative z-10 max-w-md px-12 text-center'>
          <div className='mb-8 flex justify-center'>
            <div className='relative'>
              <div className='flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm'>
                {loading ? (
                  <Skeleton className='size-12 rounded-xl' />
                ) : (
                  <img
                    src={logo}
                    alt={systemName}
                    className='size-12 rounded-xl object-cover'
                  />
                )}
              </div>
              <div className='absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-blue-500/20 via-violet-500/10 to-purple-500/20 blur-2xl' />
            </div>
          </div>
          <h2 className='text-2xl font-bold tracking-tight'>
            {loading ? systemName : systemName}
          </h2>
          <p className='text-muted-foreground/80 mt-3 text-sm leading-relaxed'>
            {t(
              'Your unified gateway for managing AI models, keys, and usage across all providers.'
            )}
          </p>
        </div>
      </div>
      <Link
        to='/'
        className='absolute top-4 left-4 z-10 flex items-center gap-2 transition-opacity hover:opacity-80 sm:top-8 sm:left-8'
      >
        <div className='relative h-8 w-8'>
          {loading ? (
            <Skeleton className='absolute inset-0 rounded-full' />
          ) : (
            <img
              src={logo}
              alt={t('Logo')}
              className='h-8 w-8 rounded-full object-cover'
            />
          )}
        </div>
        {loading ? (
          <Skeleton className='h-6 w-24' />
        ) : (
          <h1 className='text-xl font-medium'>{systemName}</h1>
        )}
      </Link>
      <div className='container flex items-center pt-16 sm:pt-0'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-2 px-4 py-8 sm:w-[420px] sm:p-8'>
          {children}
        </div>
      </div>
    </div>
  )
}
