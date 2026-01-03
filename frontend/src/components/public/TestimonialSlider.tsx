import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

export interface Testimonial {
  id: string
  name: string
  role?: string
  quote: string
  rating?: number
  image?: string
}

interface TestimonialSliderProps {
  /** Array of testimonials to display */
  testimonials?: Testimonial[]
  /** Section title */
  title?: string
  /** Section subtitle */
  subtitle?: string
  /** Enable autoplay */
  autoplay?: boolean
  /** Autoplay delay in ms */
  autoplayDelay?: number
  /** Custom className */
  className?: string
}

const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Budi Santoso',
    role: 'Food Blogger',
    quote:
      'Steak Kenangan memiliki cita rasa yang luar biasa. Dagingnya empuk, bumbunya pas, dan pelayanannya sangat ramah. Tempat wajib untuk pecinta steak!',
    rating: 5,
  },
  {
    id: '2',
    name: 'Sarah Chen',
    role: 'Business Executive',
    quote:
      'Perfect place for business dinners. The ambiance is sophisticated, the service is impeccable, and the steaks are consistently excellent.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Rizky Pratama',
    role: 'Regular Customer',
    quote:
      'Sudah jadi langganan sejak 2 tahun lalu. Kualitasnya tidak pernah mengecewakan. Saya selalu merekomendasikan kepada teman dan keluarga.',
    rating: 5,
  },
  {
    id: '4',
    name: 'Amanda Williams',
    role: 'Travel Writer',
    quote:
      'One of the best steakhouses in Jakarta. The Wagyu is exceptional, and the wine selection pairs beautifully with every dish.',
    rating: 4,
  },
  {
    id: '5',
    name: 'Dewi Anggraini',
    role: 'Chef',
    quote:
      'Sebagai sesama chef, saya mengapresiasi dedikasi dan keahlian yang ditunjukkan di setiap hidangan. Truly world-class quality!',
    rating: 5,
  },
]

/**
 * Testimonial slider component with center-mode Embla Carousel.
 * Displays customer testimonials with navigation controls and autoplay.
 *
 * @example
 * ```tsx
 * <TestimonialSlider
 *   testimonials={customTestimonials}
 *   title="What Our Guests Say"
 *   autoplay={true}
 * />
 * ```
 */
export function TestimonialSlider({
  testimonials = defaultTestimonials,
  title,
  subtitle,
  autoplay = true,
  autoplayDelay = 5000,
  className,
}: TestimonialSliderProps) {
  const { t } = useTranslation()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const displayTitle = title || t('public.whatOurGuestsSay')
  const displaySubtitle = subtitle || t('public.realExperiences')

  const autoplayPlugin = autoplay
    ? Autoplay({ delay: autoplayDelay, stopOnInteraction: true })
    : undefined

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'center',
      skipSnaps: false,
    },
    autoplayPlugin ? [autoplayPlugin] : []
  )

  const { ref: sectionRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  if (!testimonials.length) {
    return (
      <section
        data-testid="testimonials-section"
        className={cn('py-16 md:py-24 bg-[var(--public-bg-secondary)]', className)}
      >
        <div className="public-container text-center">
          <p className="text-[var(--public-text-secondary)]">
            {t('public.noTestimonials')}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      data-testid="testimonials-section"
      className={cn(
        'py-16 md:py-24 bg-[var(--public-bg-secondary)] overflow-hidden',
        className
      )}
    >
      <div className="public-container">
        {/* Section Header */}
        <div
          className={cn(
            'text-center mb-12 transition-all duration-700',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <span
            className="text-[var(--public-accent)] text-sm uppercase tracking-widest font-semibold"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            {t('public.testimonials')}
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-[var(--public-text-primary)] mt-2 mb-4"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            {displayTitle.split(' ').map((word, i) => (
              <span key={i}>
                {i === displayTitle.split(' ').length - 1 ? (
                  <span className="text-[var(--public-accent)]">{word}</span>
                ) : (
                  word + ' '
                )}
              </span>
            ))}
          </h2>
          <p className="text-[var(--public-text-secondary)] max-w-2xl mx-auto">
            {displaySubtitle}
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Previous Button */}
          <Button
            data-testid="testimonial-prev"
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 z-10',
              'hidden md:flex -ml-4 lg:-ml-12',
              'bg-[var(--public-primary)] border-[var(--public-border)]',
              'hover:bg-[var(--public-accent)] hover:border-[var(--public-accent)]',
              'hover:text-white transition-all duration-300'
            )}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Embla Carousel */}
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="flex-[0_0_100%] min-w-0 md:flex-[0_0_80%] lg:flex-[0_0_60%] px-4"
                >
                  <TestimonialCard
                    testimonial={testimonial}
                    isActive={index === selectedIndex}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <Button
            data-testid="testimonial-next"
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 z-10',
              'hidden md:flex -mr-4 lg:-mr-12',
              'bg-[var(--public-primary)] border-[var(--public-border)]',
              'hover:bg-[var(--public-accent)] hover:border-[var(--public-accent)]',
              'hover:text-white transition-all duration-300'
            )}
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Navigation Buttons */}
        <div className="flex justify-center gap-4 mt-6 md:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="bg-[var(--public-primary)] border-[var(--public-border)]"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="bg-[var(--public-primary)] border-[var(--public-border)]"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Dots Navigation */}
        <div
          data-testid="testimonial-dots"
          className="flex justify-center gap-2 mt-8"
          role="tablist"
          aria-label="Testimonial navigation"
        >
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                'w-3 h-3 rounded-full transition-all duration-300',
                index === selectedIndex
                  ? 'bg-[var(--public-accent)] w-8'
                  : 'bg-[var(--public-border)] hover:bg-[var(--public-text-muted)]'
              )}
              role="tab"
              aria-selected={index === selectedIndex}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface TestimonialCardProps {
  testimonial: Testimonial
  isActive: boolean
}

function TestimonialCard({ testimonial, isActive }: TestimonialCardProps) {
  return (
    <div
      data-testid="testimonial-card"
      className={cn(
        'relative p-8 md:p-10 rounded-2xl transition-all duration-500',
        'bg-[var(--public-primary)] border border-[var(--public-border)]',
        isActive
          ? 'scale-100 opacity-100 shadow-xl border-[var(--public-accent)]'
          : 'scale-95 opacity-60'
      )}
    >
      {/* Quote Icon */}
      <Quote
        className="absolute top-6 left-6 h-8 w-8 text-[var(--public-accent)]/30"
        aria-hidden="true"
      />

      {/* Quote Text */}
      <blockquote
        data-testid="testimonial-quote"
        className="relative z-10 text-lg md:text-xl text-[var(--public-text-primary)] italic mb-6 pt-6"
        style={{ fontFamily: 'var(--font-body, Heebo, sans-serif)' }}
      >
        "{testimonial.quote}"
      </blockquote>

      {/* Rating */}
      {testimonial.rating && (
        <div data-testid="testimonial-rating" className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-5 w-5',
                i < testimonial.rating!
                  ? 'fill-[var(--public-accent)] text-[var(--public-accent)]'
                  : 'text-[var(--public-border)]'
              )}
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Author Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        {testimonial.image ? (
          <img
            src={testimonial.image}
            alt={`${testimonial.name}`}
            className="w-14 h-14 rounded-full object-cover border-2 border-[var(--public-accent)]"
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center',
              'bg-[var(--public-accent)] text-white text-xl font-bold'
            )}
            aria-hidden="true"
          >
            {testimonial.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
        )}

        {/* Name and Role */}
        <div>
          <p
            className="font-semibold text-[var(--public-text-primary)]"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            {testimonial.name}
          </p>
          {testimonial.role && (
            <p className="text-sm text-[var(--public-text-secondary)]">
              {testimonial.role}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestimonialSlider
