import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden bg-[var(--public-primary)]">
      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[var(--public-primary)]"
        aria-hidden="true"
      />
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, var(--public-accent) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative public-container text-center px-4">
        {/* Accent label */}
        <span
          className={cn(
            'inline-block text-[var(--public-accent)] text-sm uppercase tracking-[0.2em] font-semibold mb-6',
            'animate-[fadeInUp_0.6s_ease-out]'
          )}
          style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
        >
          Steak Kenangan Franchise
        </span>

        {/* Main headline */}
        <h1
          className={cn(
            'text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6',
            'animate-[fadeInUp_0.6s_ease-out_0.2s_both]'
          )}
          style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
        >
          {t('franchise.hero.title')}{' '}
          <span className="text-[var(--public-accent)]">
            {t('franchise.hero.titleHighlight')}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className={cn(
            'text-lg md:text-xl max-w-2xl mx-auto mb-10',
            'animate-[fadeInUp_0.6s_ease-out_0.4s_both]'
          )}
        >
          <span className="text-[var(--public-text-secondary)]">
            {t('franchise.hero.subtitle')}
          </span>
        </p>

        {/* CTA */}
        <div className={cn('animate-[fadeInUp_0.6s_ease-out_0.6s_both]')}>
          <Button
            asChild
            size="lg"
            className={cn(
              'bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)]',
              'text-white font-semibold px-8 py-6 text-lg',
              'shadow-lg hover:shadow-xl transition-[background-color,box-shadow] duration-300'
            )}
          >
            <Link to="/site/franchise/menu">
              {t('franchise.hero.cta')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-8 w-8 text-[var(--public-text-secondary)]" aria-hidden="true" />
      </div>
    </section>
  )
}

export default HeroSection
