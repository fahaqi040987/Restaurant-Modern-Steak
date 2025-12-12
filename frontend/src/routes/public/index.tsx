import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { MapPin, Phone, Clock, ChevronRight, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PublicLayout } from '@/components/public/PublicLayout'
import { OpenStatusBadge } from '@/components/public/OpenStatusBadge'
import { apiClient } from '@/api/client'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/public/')({
  component: PublicLandingPage,
})

function PublicLandingPage() {
  // Fetch restaurant info
  const { data: restaurantInfo, isLoading: isLoadingInfo } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 30, // 30 minutes
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
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: restaurantInfo?.hero_image_url
              ? `url(${restaurantInfo.hero_image_url})`
              : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Status Badge */}
          {!isLoadingInfo && restaurantInfo && (
            <div className="flex justify-center mb-6">
              <OpenStatusBadge
                isOpenNow={restaurantInfo.is_open_now}
                operatingHours={restaurantInfo.operating_hours}
              />
            </div>
          )}

          {/* Restaurant Name */}
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 text-[var(--public-text-primary)]"
            style={{ fontFamily: 'var(--public-font-heading)' }}
          >
            {isLoadingInfo ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <>
                {restaurantInfo?.name || 'Modern'}
                <span className="text-[var(--public-secondary)]">Steak</span>
              </>
            )}
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-[var(--public-text-secondary)] mb-8 max-w-2xl mx-auto">
            {restaurantInfo?.tagline || 'Premium steaks crafted with passion'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-[var(--public-secondary)] text-[var(--public-text-on-gold)] hover:bg-[var(--public-secondary-light)] font-semibold px-8"
            >
              <Link to="/public/menu">
                <Utensils className="mr-2 h-5 w-5" />
                View Menu
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-[var(--public-secondary)] text-[var(--public-secondary)] hover:bg-[var(--public-secondary)] hover:text-[var(--public-text-on-gold)]"
            >
              <Link to="/public/contact">
                <Phone className="mr-2 h-5 w-5" />
                Contact Us
              </Link>
            </Button>
            {restaurantInfo?.google_maps_url && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[var(--public-border)] text-[var(--public-text-secondary)] hover:bg-[var(--public-bg-hover)] hover:text-[var(--public-text-primary)]"
              >
                <a
                  href={restaurantInfo.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  Get Directions
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="h-8 w-8 rotate-90 text-[var(--public-secondary)]" />
        </div>
      </section>

      {/* Featured Dishes Section */}
      <section className="py-16 md:py-24 bg-[var(--public-bg-secondary)]">
        <div className="public-container">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold text-[var(--public-text-primary)] mb-4"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              Featured <span className="text-[var(--public-secondary)]">Dishes</span>
            </h2>
            <p className="text-[var(--public-text-secondary)] max-w-2xl mx-auto">
              Discover our chef's selection of premium cuts and signature creations
            </p>
          </div>

          {isLoadingMenu ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="public-card animate-pulse">
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
              {menuItems.map((item) => (
                <Card
                  key={item.id}
                  className="public-card group overflow-hidden transition-all duration-300 hover:border-[var(--public-secondary)]"
                >
                  <div className="aspect-[4/3] bg-[var(--public-bg-hover)] relative overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="h-12 w-12 text-[var(--public-text-muted)]" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="text-xs px-2 py-1 bg-[var(--public-primary)]/80 text-[var(--public-secondary)] rounded">
                        {item.category_name}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-[var(--public-text-primary)] mb-1 line-clamp-1">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-[var(--public-text-secondary)] mb-2 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="text-[var(--public-secondary)] font-semibold">
                      {formatPrice(item.price)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--public-text-secondary)]">
              No featured dishes available
            </p>
          )}

          <div className="text-center mt-10">
            <Button
              asChild
              variant="outline"
              className="border-[var(--public-secondary)] text-[var(--public-secondary)] hover:bg-[var(--public-secondary)] hover:text-[var(--public-text-on-gold)]"
            >
              <Link to="/public/menu">
                View Full Menu
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Teaser Section */}
      <section className="py-16 md:py-24">
        <div className="public-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="text-3xl md:text-4xl font-bold text-[var(--public-text-primary)] mb-6"
                style={{ fontFamily: 'var(--public-font-heading)' }}
              >
                Our <span className="text-[var(--public-secondary)]">Story</span>
              </h2>
              <p className="text-[var(--public-text-secondary)] mb-6 leading-relaxed">
                {restaurantInfo?.description ||
                  'At Modern Steak, we believe in the perfect combination of premium ingredients, masterful cooking techniques, and warm hospitality. Every dish tells a story of our passion for exceptional cuisine.'}
              </p>
              <Button
                asChild
                variant="outline"
                className="border-[var(--public-secondary)] text-[var(--public-secondary)] hover:bg-[var(--public-secondary)] hover:text-[var(--public-text-on-gold)]"
              >
                <Link to="/public/about">
                  Learn More About Us
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="public-card p-6">
                <Clock className="h-8 w-8 text-[var(--public-secondary)] mb-4" />
                <h3
                  className="font-semibold text-[var(--public-text-primary)] mb-2"
                  style={{ fontFamily: 'var(--public-font-heading)' }}
                >
                  Opening Hours
                </h3>
                <p className="text-sm text-[var(--public-text-secondary)]">
                  Mon - Sat: 11AM - 10PM
                  <br />
                  Sunday: Closed
                </p>
              </Card>

              <Card className="public-card p-6">
                <MapPin className="h-8 w-8 text-[var(--public-secondary)] mb-4" />
                <h3
                  className="font-semibold text-[var(--public-text-primary)] mb-2"
                  style={{ fontFamily: 'var(--public-font-heading)' }}
                >
                  Location
                </h3>
                <p className="text-sm text-[var(--public-text-secondary)]">
                  {restaurantInfo?.address || 'Visit us at our location'}
                  {restaurantInfo?.city && <>, {restaurantInfo.city}</>}
                </p>
              </Card>

              <Card className="public-card p-6 sm:col-span-2">
                <Phone className="h-8 w-8 text-[var(--public-secondary)] mb-4" />
                <h3
                  className="font-semibold text-[var(--public-text-primary)] mb-2"
                  style={{ fontFamily: 'var(--public-font-heading)' }}
                >
                  Reservations
                </h3>
                <p className="text-sm text-[var(--public-text-secondary)] mb-3">
                  Call us to book your table for a memorable dining experience
                </p>
                {restaurantInfo?.phone && (
                  <a
                    href={`tel:${restaurantInfo.phone}`}
                    className="text-[var(--public-secondary)] font-semibold hover:text-[var(--public-secondary-light)] transition-colors"
                  >
                    {restaurantInfo.phone}
                  </a>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
