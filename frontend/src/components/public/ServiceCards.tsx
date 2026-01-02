import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Clock,
  MapPin,
  Phone,
  ChefHat,
  CalendarDays,
  Beef,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

interface ServiceCard {
  icon: React.ElementType
  titleKey: string
  descriptionKey: string
  link?: string
}

interface ServiceCardsProps {
  /** Custom class name */
  className?: string
  /** Custom cards array */
  cards?: ServiceCard[]
}

const defaultCards: ServiceCard[] = [
  {
    icon: ChefHat,
    titleKey: 'public.masterChefs',
    descriptionKey: 'public.masterChefsDesc',
    link: '/site/about',
  },
  {
    icon: Beef,
    titleKey: 'public.premiumIngredients',
    descriptionKey: 'public.premiumIngredientsDesc',
    link: '/site/menu',
  },
  {
    icon: CalendarDays,
    titleKey: 'public.easyReservations',
    descriptionKey: 'public.easyReservationsDesc',
    link: '/site/reservation',
  },
  {
    icon: Users,
    titleKey: 'public.privateEvents',
    descriptionKey: 'public.privateEventsDesc',
    link: '/site/contact',
  }
]

/**
 * Service cards section with hover animations.
 * Displays restaurant features and services in a grid layout.
 *
 * @example
 * ```tsx
 * <ServiceCards />
 * // or with custom cards
 * <ServiceCards cards={customCards} />
 * ```
 */
export function ServiceCards({ className, cards = defaultCards }: ServiceCardsProps) {
  const { t } = useTranslation()

  return (
    <section
      className={cn(
        'py-16 md:py-24 bg-[var(--public-primary)]',
        className
      )}
      aria-labelledby="services-heading"
    >
      <div className="public-container">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2
            id="services-heading"
            className="text-3xl md:text-4xl font-bold text-[var(--public-text-primary)] mb-4"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            {t('public.whyChooseUs')}
          </h2>
          <p className="text-[var(--public-text-secondary)] max-w-2xl mx-auto">
            {t('public.discoverWhat')}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {cards.map((card, index) => (
            <ServiceCardItem key={card.titleKey} card={card} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface ServiceCardItemProps {
  card: ServiceCard
  index: number
}

function ServiceCardItem({ card, index }: ServiceCardItemProps) {
  const { t } = useTranslation()
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  const Icon = card.icon

  const cardContent = (
    <div
      ref={ref}
      className={cn(
        'service-card group relative p-6 md:p-8 rounded-lg',
        'bg-[var(--public-bg-secondary)] border border-[var(--public-border)]',
        'transition-all duration-500 ease-out',
        'hover:border-[var(--public-accent)] hover:shadow-xl',
        'hover:-translate-y-2',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      )}
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      {/* Icon Container - Hidden, only visible on hover overlay */}
      <div className="hidden">
        <Icon aria-hidden="true" />
      </div>

      {/* Title */}
      <h3
        className={cn(
          'text-xl font-bold text-[var(--public-text-primary)] mb-3',
          'group-hover:opacity-0',
          'transition-all duration-300'
        )}
        style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
      >
        {t(card.titleKey)}
      </h3>

      {/* Description */}
      <p className="text-[var(--public-text-secondary)] text-sm leading-relaxed group-hover:opacity-0 transition-opacity duration-300">
        {t(card.descriptionKey)}
      </p>

      {/* Hover Overlay with Example Text */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg',
          'bg-[var(--public-accent)]/95',
          'flex flex-col items-center justify-center p-6',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-300',
          'text-white text-center'
        )}
      >
        <Icon className="h-12 w-12 mb-4" aria-hidden="true" />
        <h4 className="text-xl font-bold mb-2">{t(card.titleKey)}</h4>
        {/* <p className="text-sm mb-4">{t(card.descriptionKey)}</p> */}
        {card.link && (
          <span className="text-xs font-semibold uppercase tracking-wider border-b-2 border-white pb-1">
            {t('public.learnMore')} →
          </span>
        )}
      </div>

      {/* Hover accent line */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-1 bg-[var(--public-accent)]',
          'w-0 group-hover:w-full',
          'transition-all duration-300 rounded-b-lg'
        )}
        aria-hidden="true"
      />
    </div>
  )

  if (card.link) {
    return (
      <Link
        to={card.link}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)] rounded-lg"
      >
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

/**
 * Alternative layout: Info cards for restaurant details
 */
interface InfoCard {
  icon: React.ElementType
  title: string
  value: string
  subtitle?: string
}

interface InfoCardsProps {
  /** Custom class name */
  className?: string
  /** Restaurant info to display */
  info?: {
    phone?: string
    address?: string
    hours?: string
  }
}

const defaultInfoCards: InfoCard[] = [
  {
    icon: Clock,
    title: 'Opening Hours',
    value: 'Senin - Sabtu: 11:00 WIB - 22:00 WIB',
    subtitle: 'Minggu: Tutup',
  },
  {
    icon: Phone,
    title: 'Reservations',
    value: '+62 812-3456-7890',
    subtitle: 'Hubungi kami kapan saja',
  },
  {
    icon: MapPin,
    title: 'Location',
    value: 'Jl. Sudirman No. 123',
    subtitle: 'Jakarta Selatan',
  },
]

export function InfoCards({ className, info }: InfoCardsProps) {
  const cards: InfoCard[] = info
    ? [
        {
          icon: Clock,
          title: 'Opening Hours',
          value: info.hours || 'Senin - Sabtu: 09:00 WIB - 22:00 WIB',
          subtitle: 'Sunday: Closed',
        },
        {
          icon: Phone,
          title: 'Reservations',
          value: info.phone || '+62 21 123 456',
          subtitle: 'Call us anytime',
        },
        {
          icon: MapPin,
          title: 'Location',
          value: info.address || 'Jl. Sudirman No. 123',
          subtitle: 'Jakarta Selatan',
        },
      ]
    : defaultInfoCards

  return (
    <section
      className={cn('py-12 md:py-16 bg-[var(--public-bg-secondary)]', className)}
    >
      <div className="public-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <InfoCardItem key={card.title} card={card} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

function InfoCardItem({ card, index }: { card: InfoCard; index: number }) {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  const Icon = card.icon

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-4 p-6 rounded-lg',
        'bg-[var(--public-primary)] border border-[var(--public-border)]',
        'transition-all duration-500 ease-out',
        'hover:border-[var(--public-accent)]',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0',
          'bg-[var(--public-accent)]'
        )}
      >
        <Icon className="h-6 w-6 text-white" aria-hidden="true" />
      </div>
      <div>
        <h3
          className="text-sm text-[var(--public-text-secondary)] uppercase tracking-wider mb-1"
          style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
        >
          {card.title}
        </h3>
        <p className="text-lg font-semibold text-[var(--public-text-primary)]">
          {card.value}
        </p>
        {card.subtitle && (
          <p className="text-sm text-[var(--public-text-secondary)]">
            {card.subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

export default ServiceCards
