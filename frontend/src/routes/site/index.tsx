import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronRight, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PublicLayout } from '@/components/public/PublicLayout'
import { HeroSection } from '@/components/public/HeroSection'
import { ServiceCards, InfoCards } from '@/components/public/ServiceCards'
import { apiClient } from '@/api/client'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

export const Route = createFileRoute('/site/')({
  component: PublicLandingPage,
})

function PublicLandingPage() {
  // Fetch restaurant info
  const { data: restaurantInfo, isLoading: isLoadingInfo } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 5, // 5 minutes for faster updates
    refetchOnMount: true, // Always refetch on mount to get latest data
  })

  // Fetch featured menu items (limit to 4)
  const { data: menuItems, isLoading: isLoadingMenu } = useQuery({
    queryKey: ['publicMenu', 'featured'],
    queryFn: () => apiClient.getPublicMenu(),
    staleTime: 1000 * 60 * 15, // 15 minutes
    select: (data) => data.slice(0, 4), // Get first 4 items as featured
  })

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <PublicLayout showLoader={true} loaderDuration={2500}>
      {/* Hero Section - Restoran-master style */}
      <HeroSection
        heading={restaurantInfo?.name || 'Steak Kenangan'}
        tagline={
          restaurantInfo?.tagline ||
          'Experience the finest premium steaks crafted with passion and served with elegance'
        }
        backgroundImage={
          restaurantInfo?.hero_image_url || '/assets/restoran/images/hero.jpg'
        }
      />

      {/* Info Cards - Quick restaurant details */}
      <InfoCards
        info={{
          phone: restaurantInfo?.phone,
          address: restaurantInfo?.address,
          hours: restaurantInfo?.operating_hours
            ? (() => {
                const formatTime = (time: string): string => {
                  const [hourStr, minStr] = time.split(':')
                  const hour = parseInt(hourStr, 10)
                  const min = minStr || '00'
                  return `${hour}:${min}`
                }
                
                const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu']
                const today = new Date().getDay()
                const todayHours = restaurantInfo.operating_hours.find(h => h.day_of_week === today)
                
                if (todayHours?.is_closed) {
                  // If closed today, show next open day
                  const nextOpenDay = restaurantInfo.operating_hours.find((h, idx) => {
                    const dayOffset = (h.day_of_week - today + 7) % 7
                    return dayOffset > 0 && !h.is_closed
                  })
                  
                  if (nextOpenDay) {
                    return `Hari ini Tutup - Buka ${dayNames[nextOpenDay.day_of_week]}: ${formatTime(nextOpenDay.open_time)} - ${formatTime(nextOpenDay.close_time)} WIB`
                  }
                  return 'Hari ini Tutup'
                }
                
                if (todayHours) {
                  return `Hari ini: ${formatTime(todayHours.open_time)} - ${formatTime(todayHours.close_time)} WIB`
                }
                
                return undefined
              })()
            : undefined,
        }}
      />

      {/* Service Cards - Why Choose Us section */}
      <ServiceCards />

      {/* Featured Dishes Section */}
      <FeaturedDishesSection
        menuItems={menuItems}
        isLoading={isLoadingMenu}
        formatPrice={formatPrice}
      />

      {/* About Teaser Section */}
      <AboutTeaserSection description={restaurantInfo?.description} />
    </PublicLayout>
  )
}

interface FeaturedDishesSectionProps {
  menuItems?: Array<{
    id: string
    name: string
    description?: string | null
    price: number
    image_url?: string | null
    category_name?: string | null
  }>
  isLoading: boolean
  formatPrice: (price: number) => string
}

function FeaturedDishesSection({
  menuItems,
  isLoading,
  formatPrice,
}: FeaturedDishesSectionProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section className="py-16 md:py-24 bg-[var(--public-bg-secondary)]">
      <div className="public-container">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={cn(
            'text-center mb-12 transition-all duration-700',
            headerVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          )}
        >
          <span
            className="text-[var(--public-accent)] text-sm uppercase tracking-widest font-semibold"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            Our Menu
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-[var(--public-text-primary)] mt-2 mb-4"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            Featured <span className="text-[var(--public-accent)]">Dishes</span>
          </h2>
          <p className="text-[var(--public-text-secondary)] max-w-2xl mx-auto">
            Discover our chef's selection of premium cuts and signature creations
          </p>
        </div>

        {/* Menu Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="public-card animate-pulse overflow-hidden">
                <div className="aspect-[4/3] bg-[var(--public-bg-hover)]" />
                <CardContent className="p-4">
                  <div className="h-5 bg-[var(--public-bg-hover)] rounded mb-2" />
                  <div className="h-4 bg-[var(--public-bg-hover)] rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : menuItems && menuItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.map((item, index) => (
              <MenuItemCard
                key={item.id}
                item={item}
                index={index}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-[var(--public-text-secondary)]">
            No featured dishes available
          </p>
        )}

        {/* View Full Menu Button */}
        <div className="text-center mt-10">
          <Button
            asChild
            size="lg"
            className={cn(
              'gap-2 bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)]',
              'text-white font-semibold shadow-lg hover:shadow-xl',
              'transition-all duration-300'
            )}
          >
            <Link to="/site/menu">
              View Full Menu
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

interface MenuItemCardProps {
  item: {
    id: string
    name: string
    description?: string | null
    price: number
    image_url?: string | null
    category_name?: string | null
  }
  index: number
  formatPrice: (price: number) => string
}

function MenuItemCard({ item, index, formatPrice }: MenuItemCardProps) {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <Card
      ref={ref}
      className={cn(
        'public-card group overflow-hidden',
        'transition-all duration-500 ease-out',
        'hover:border-[var(--public-accent)] hover:shadow-xl hover:-translate-y-2',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-[var(--public-bg-hover)] relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Utensils className="h-12 w-12 text-[var(--public-text-muted)]" />
          </div>
        )}
        {/* Category badge */}
        {item.category_name && (
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                'text-xs px-3 py-1 rounded-full',
                'bg-[var(--public-accent)] text-white font-medium'
              )}
            >
              {item.category_name}
            </span>
          </div>
        )}
        {/* Hover overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black/40 flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
          )}
        >
          <Button
            asChild
            size="sm"
            className="bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)] text-white"
          >
            <Link to="/site/menu">View Details</Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-[var(--public-text-primary)] mb-1 line-clamp-1 group-hover:text-[var(--public-accent)] transition-colors">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-sm text-[var(--public-text-secondary)] mb-2 line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="text-[var(--public-accent)] font-bold text-lg">
          {formatPrice(item.price)}
        </p>
      </CardContent>
    </Card>
  )
}

interface AboutTeaserSectionProps {
  description?: string | null
}

function AboutTeaserSection({ description }: AboutTeaserSectionProps) {
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
            'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center',
            'transition-all duration-700',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {/* Text Content */}
          <div>
            <span
              className="text-[var(--public-accent)] text-sm uppercase tracking-widest font-semibold"
              style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
            >
              About Us
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold text-[var(--public-text-primary)] mt-2 mb-6"
              style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
            >
              Our <span className="text-[var(--public-accent)]">Story</span>
            </h2>
            <p className="text-[var(--public-text-secondary)] mb-6 leading-relaxed text-lg">
              {description ||
                'At Steak Kenangan, we believe in the perfect combination of premium ingredients, masterful cooking techniques, and warm hospitality. Every dish tells a story of our passion for exceptional cuisine.'}
            </p>
            <p className="text-[var(--public-text-secondary)] mb-8 leading-relaxed">
              Since our establishment, we have been dedicated to providing an
              unforgettable dining experience that celebrates the art of grilling
              and the joy of sharing a great meal with loved ones.
            </p>
            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn(
                'gap-2 border-2 border-[var(--public-accent)] text-[var(--public-accent)]',
                'hover:bg-[var(--public-accent)] hover:text-white',
                'font-semibold transition-all duration-300'
              )}
            >
              <Link to="/site/about">
                Learn More About Us
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="aspect-[4/5] rounded-lg overflow-hidden">
                <img
                  src="/assets/restoran/images/about-1.jpg"
                  alt="Our restaurant interior"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="aspect-square rounded-lg overflow-hidden">
                <img
                  src="/assets/restoran/images/about-2.jpg"
                  alt="Our signature dishes"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="aspect-square rounded-lg overflow-hidden">
                <img
                  src="/assets/restoran/images/about-3.jpg"
                  alt="Our chef at work"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="aspect-[4/5] rounded-lg overflow-hidden">
                <img
                  src="/assets/restoran/images/about-4.jpg"
                  alt="Premium ingredients"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
