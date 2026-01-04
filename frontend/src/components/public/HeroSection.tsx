import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { BookOpenCheck, Calendar, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

interface HeroSectionProps {
  /** Custom class name */
  className?: string
  /** Background image URL */
  backgroundImage?: string
  /** Main heading text */
  heading?: string
  /** Tagline/subheading text */
  tagline?: string
}

/**
 * Hero section component with full-screen banner and animated CTAs.
 * Inspired by Restoran-master design with modern animations.
 *
 * @example
 * ```tsx
 * <HeroSection
 *   heading="Steak Kenangan"
 *   tagline="Experience the finest premium steaks"
 * />
 * ```
 */
export function HeroSection({
  className,
  backgroundImage = '/assets/restoran/images/banner_landing_page.jpg',
  heading = 'Steak Kenangan',
  tagline = 'Experience the finest premium steaks crafted with passion and served with elegance',
}: HeroSectionProps) {
  const { t } = useTranslation()

  // Scroll handler for scroll indicator
  const handleScrollClick = () => {
    const targetSection = document.getElementById('info-cards-section')
    
    if (targetSection) {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      
      targetSection.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    } else {
      console.warn('Scroll target #info-cards-section not found')
    }
  }

  // Keyboard handler for accessibility (Enter and Space keys)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault() // Prevent default Space scrolling behavior
      handleScrollClick()
    }
  }

  const { ref: headingRef, isVisible: headingVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  const { ref: taglineRef, isVisible: taglineVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section
      data-testid="hero-section"
      className={cn(
        'relative min-h-screen flex items-center justify-center overflow-hidden',
        className
      )}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      aria-label="Hero section with restaurant banner"
    >
      {/* Dark overlay for text readability */}
      <div
        data-testid="hero-overlay"
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"
        aria-hidden="true"
      />

      {/* Content container */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Restaurant name */}
        <h1
          ref={headingRef}
          className={cn(
            'font-accent text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6',
            'transition-all duration-700 ease-out',
            headingVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          )}
          style={{
            fontFamily: 'var(--font-accent, Pacifico, cursive)',
            textShadow: '2px 2px 8px rgba(0, 0, 0, 0.5)',
          }}
        >
          {heading}
        </h1>

        {/* Tagline */}
        <p
          ref={taglineRef}
          className={cn(
            'text-lg sm:text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto',
            'transition-all duration-700 ease-out delay-200',
            taglineVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          )}
          style={{ fontFamily: 'var(--font-body, Heebo, sans-serif)' }}
        >
          {tagline}
        </p>

        {/* CTA Buttons */}
        <div
          ref={ctaRef}
          className={cn(
            'flex flex-col sm:flex-row gap-4 justify-center items-center',
            'transition-all duration-700 ease-out delay-400',
            ctaVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          )}
        >
          {/* Primary CTA - Book a Table */}
          <Button
            asChild
            size="lg"
            className={cn(
              'gap-2 px-8 py-6 text-lg font-semibold',
              'bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)]',
              'text-white shadow-lg hover:shadow-xl',
              'transition-all duration-300 hover:scale-105'
            )}
          >
            <Link to="/site/reservation">
              <Calendar className="h-5 w-5" aria-hidden="true" />
              <span>{t('public.bookATable')}</span>
            </Link>
          </Button>

          {/* Secondary CTA - View Menu */}
          <Button
            asChild
            size="lg"
            className={cn(
              'gap-2 px-8 py-6 text-lg font-semibold',
              'bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)]',
              'text-white shadow-lg hover:shadow-xl',
              'transition-all duration-300 hover:scale-105'
            )}
          >
            <Link to="/site/menu">
              <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
              <span>{t('public.viewMenu')}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={handleScrollClick}
        onKeyDown={handleKeyDown}
        data-testid="scroll-indicator"
        className={cn(
          'absolute bottom-8 left-1/2 -translate-x-1/2',
          'animate-bounce cursor-pointer',
          // T025: Hover scale animation
          'hover:scale-110',
          // T026: Hover color transition
          'text-white/80 hover:text-white',
          // T027: Active state feedback (tap feedback for touch)
          'active:scale-95',
          // T028: Smooth transition utilities
          'transition-all duration-200 ease-out',
          // Focus ring for keyboard navigation
          'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent',
          'bg-transparent border-none p-2 rounded-full'
        )}
        aria-label={t('public.scrollDown')}
        type="button"
      >
        <ChevronDown className="h-8 w-8" />
      </button>

      {/* Decorative corner accents */}
      <div
        className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-[var(--public-accent)]/50"
        aria-hidden="true"
      />
      <div
        className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-[var(--public-accent)]/50"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-[var(--public-accent)]/50"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-[var(--public-accent)]/50"
        aria-hidden="true"
      />
    </section>
  )
}

export default HeroSection
