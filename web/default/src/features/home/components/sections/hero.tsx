import { useEffect, useRef, useState } from 'react'
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
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

function FloatingOrb({
  size = 300,
  hue = 260,
  delay = 0,
  duration = 20,
  x = '10%',
  y = '20%',
}: {
  size?: number
  hue?: number
  delay?: number
  duration?: number
  x?: string
  y?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.style.setProperty('--delay', `${delay}s`)
    el.style.setProperty('--duration', `${duration}s`)
  }, [delay, duration])

  return (
    <div
      ref={ref}
      className='pointer-events-none absolute rounded-full blur-[120px] animate-float'
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: `radial-gradient(circle, oklch(0.6 0.18 ${hue} / 40%) 0%, transparent 70%)`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  )
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
    }> = []
    const particleCount = 60

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    })

    resize()
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle())
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `oklch(0.7 0.15 270 / ${p.opacity})`
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [mounted])

  if (!mounted) return null

  return (
    <canvas
      ref={canvasRef}
      className='absolute inset-0 -z-5 w-full h-full opacity-30 dark:opacity-20 pointer-events-none'
      style={{ maskImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, black 20%, transparent 80%)' }}
    />
  )
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()

  return (
    <section className='relative z-10 flex flex-col items-center overflow-hidden px-6 pt-28 pb-16 md:pt-36 md:pb-24'>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          25% { transform: translateY(-20px) translateX(10px) scale(1.02); }
          50% { transform: translateY(-10px) translateX(-5px) scale(0.98); }
          75% { transform: translateY(-25px) translateX(15px) scale(1.01); }
        }
        .animate-float {
          animation: float var(--duration, 20s) ease-in-out infinite;
          animation-delay: var(--delay, 0s);
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
          background-size: 200% auto;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 3s ease-in-out infinite;
        }
      `}</style>

      <FloatingOrb size={400} hue={260} delay={0} duration={18} x='5%' y='10%' />
      <FloatingOrb size={350} hue={280} delay={3} duration={22} x='60%' y='5%' />
      <FloatingOrb size={300} hue={240} delay={6} duration={16} x='30%' y='60%' />
      <FloatingOrb size={250} hue={290} delay={2} duration={20} x='75%' y='50%' />

      <ParticleField />

      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 opacity-40 dark:opacity-[0.12]'
        style={{
          background: [
            'radial-gradient(ellipse 70% 60% at 20% 15%, oklch(0.65 0.2 270 / 60%) 0%, transparent 60%)',
            'radial-gradient(ellipse 60% 50% at 80% 20%, oklch(0.6 0.15 290 / 50%) 0%, transparent 60%)',
            'radial-gradient(ellipse 50% 40% at 50% 75%, oklch(0.55 0.12 250 / 35%) 0%, transparent 60%)',
          ].join(', '),
        }}
      />

      <div
        aria-hidden
        className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_40%,black_15%,transparent_100%)] bg-[size:4rem_4rem] opacity-[0.08] dark:opacity-[0.05]'
      />

      <div className='relative flex max-w-3xl flex-col items-center text-center'>
        <div className='animate-pulse-ring mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 backdrop-blur-sm'>
          <span className='flex h-2 w-2'>
            <span className='absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75' />
            <span className='relative inline-flex h-2 w-2 rounded-full bg-green-500' />
          </span>
          <span className='text-xs font-medium text-primary/90'>
            {t('Now supporting 50+ upstream providers')}
          </span>
        </div>

        <h1 className='text-[clamp(2.2rem,6vw,3.8rem)] leading-[1.12] font-bold tracking-tight'>
          <span className='block'>{t('One Gateway to')}</span>
          <span className='bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent mt-2 block animate-shimmer'>
            {t('Every AI Model You Need')}
          </span>
        </h1>
        <p
          className='landing-animate-fade-up text-muted-foreground/80 mt-5 max-w-lg text-base leading-relaxed opacity-0 md:text-lg'
          style={{ animationDelay: '80ms' }}
        >
          {t('Power AI applications, manage digital assets, connect the Future')}
        </p>

        <div className='mt-10 flex flex-col gap-4 sm:flex-row sm:items-center'>
          {props.isAuthenticated ? (
            <Button
              size='lg'
              className='group rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300'
              render={<Link to='/dashboard' />}
            >
              <span>{t('Go to Dashboard')}</span>
              <ArrowRight className='ml-2 size-4 transition-transform duration-200 group-hover:translate-x-1' />
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      <div className='mt-16 w-full max-w-2xl'>
        <div className='relative'>
          <div className='absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-60' />
          <HeroTerminalDemo />
        </div>
      </div>
    </section>
  )
}