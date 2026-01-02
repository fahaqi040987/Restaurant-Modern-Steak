import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Calendar, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PublicLayout } from '@/components/public/PublicLayout'
import { StorySection } from '@/components/public/StorySection'
import { TestimonialSlider } from '@/components/public/TestimonialSlider'
import { CounterStats } from '@/components/public/CounterStats'
import { apiClient } from '@/api/client'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

export const Route = createFileRoute('/site/about')({
  component: PublicAboutPage,
})

function PublicAboutPage() {
  const { data: restaurantInfo } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 5, // 5 minutes for faster updates
    refetchOnMount: true,
  })

  return (
    <PublicLayout>
      {/* Hero Banner */}
      <HeroBanner description={restaurantInfo?.description} />

      {/* Story Section with Timeline */}
      <StorySection />

      {/* Counter Statistics */}
      <CounterStats />

      {/* Values Section */}
      <ValuesSection />

      {/* Testimonials Slider */}
      <TestimonialSlider />

      {/* CTA Section */}
      <CTASection />
    </PublicLayout>
  )
}

interface HeroBannerProps {
  description?: string | null
}

function HeroBanner({ description }: HeroBannerProps) {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section
      className={cn(
        'relative min-h-[60vh] flex items-center justify-center overflow-hidden',
        'bg-cover bg-center bg-no-repeat'
      )}
      style={{
        backgroundImage: 'url(/assets/restoran/images/about-hero.jpg)',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

      {/* Content */}
      <div
        ref={ref}
        className={cn(
          'relative z-10 text-center px-4 max-w-4xl mx-auto',
          'transition-all duration-700',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        )}
      >
        <span
          className="text-[var(--public-accent)] text-sm uppercase tracking-widest font-semibold"
          style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
        >
          About Us
        </span>
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-4 mb-6"
          style={{ fontFamily: 'var(--font-accent, Pacifico, cursive)' }}
        >
          Our Story
        </h1>
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
          {description ||
            'Welcome to Steak Kenangan, where culinary excellence meets warm hospitality. Our journey began with a simple passion: to serve the finest steaks in an atmosphere that feels like home.'}
        </p>
      </div>

      {/* Decorative elements */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--public-primary)] to-transparent"
        aria-hidden="true"
      />
    </section>
  )
}

function ValuesSection() {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  const values = [
    {
      title: 'Quality First',
      description:
        'We source only the finest ingredients, from premium aged beef to fresh seasonal vegetables. Quality is non-negotiable in everything we serve.',
      icon: '🥩',
    },
    {
      title: 'Craftsmanship',
      description:
        'Every dish is prepared with meticulous attention to detail. Our chefs are artisans who take pride in their craft and continuously refine their skills.',
      icon: '👨‍🍳',
    },
    {
      title: 'Hospitality',
      description:
        'We believe dining should be an experience, not just a meal. Our team is dedicated to making every guest feel welcome and valued.',
      icon: '🤝',
    },
  ]

  return (
    <section
      ref={ref}
      className="py-16 md:py-24 bg-[var(--public-bg-secondary)]"
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
            What We Believe
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-[var(--public-text-primary)] mt-2 mb-4"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            Our <span className="text-[var(--public-accent)]">Values</span>
          </h2>
          <p className="text-[var(--public-text-secondary)] max-w-2xl mx-auto">
            The principles that guide everything we do
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, idx) => (
            <ValueCard
              key={value.title}
              value={value}
              index={idx}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface ValueCardProps {
  value: {
    title: string
    description: string
    icon: string
  }
  index: number
  isVisible: boolean
}

function ValueCard({ value, index, isVisible }: ValueCardProps) {
  return (
    <Card
      className={cn(
        'public-card p-6 text-center transition-all duration-500',
        'hover:border-[var(--public-accent)] hover:-translate-y-2',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <CardContent className="p-0">
        {/* Icon */}
        <div
          className={cn(
            'w-16 h-16 rounded-full mx-auto mb-4',
            'bg-[var(--public-accent)]/10 flex items-center justify-center',
            'text-3xl'
          )}
        >
          {value.icon}
        </div>

        {/* Title */}
        <h3
          className="text-xl font-semibold text-[var(--public-text-primary)] mb-3"
          style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
        >
          {value.title}
        </h3>

        {/* Description */}
        <p className="text-[var(--public-text-secondary)]">
          {value.description}
        </p>
      </CardContent>
    </Card>
  )
}

function CTASection() {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section className="py-16 md:py-24 bg-[var(--public-primary)]">
      <div className="public-container">
        <div
          ref={ref}
          className={cn(
            'max-w-3xl mx-auto text-center transition-all duration-700',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <span
            className="text-[var(--public-accent)] text-sm uppercase tracking-widest font-semibold"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            Visit Us
          </span>
          <h2
            className="text-2xl md:text-4xl font-bold text-[var(--public-text-primary)] mt-2 mb-4"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            Ready to Experience{' '}
            <span className="text-[var(--public-accent)]">Steak Kenangan</span>?
          </h2>
          <p className="text-[var(--public-text-secondary)] mb-8 text-lg">
            We'd love to welcome you to our table. Reserve your spot for an
            unforgettable dining experience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn(
                'gap-2 px-8 font-semibold',
                'border-2 border-[var(--public-accent)] text-[var(--public-accent)]',
                'hover:bg-[var(--public-accent)] hover:text-black',
                'transition-all duration-300'
              )}
            >
              <Link to="/site/reservation">
                <Calendar className="h-5 w-5" aria-hidden="true" />
                <span>Book a Table</span>
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn(
                'gap-2 px-8 font-semibold',
                'border-2 border-[var(--public-accent)] text-[var(--public-accent)]',
                'hover:bg-[var(--public-accent)] hover:text-black',
                'transition-all duration-300'
              )}
            >
              <Link to="/site/contact">
                <Phone className="h-5 w-5" aria-hidden="true" />
                <span>Get in Touch</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
