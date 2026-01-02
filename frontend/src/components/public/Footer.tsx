import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Clock,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RestaurantInfo, OperatingHours } from '@/types'

interface FooterProps {
  restaurantInfo?: RestaurantInfo | null
  className?: string
}

/**
 * Footer component with Restoran-master styling.
 * Includes reservation box overlay, contact info, hours, and social links.
 *
 * @example
 * ```tsx
 * <Footer restaurantInfo={restaurantInfo} />
 * ```
 */
export function Footer({ restaurantInfo, className }: FooterProps) {
  const { t } = useTranslation()

  const formatOperatingHours = (hours: OperatingHours[]): string => {
    if (!hours || hours.length === 0) return t('public.hoursNotAvailable')

    // Find typical weekday hours (Monday)
    const mondayHours = hours.find((h) => h.day_of_week === 1)
    if (!mondayHours || mondayHours.is_closed) return t('public.variesByDay')

    const formatTime = (time: string): string => {
      // Handle HH:MM:SS or HH:MM format from database
      const parts = time.split(':')
      if (parts.length < 2) return time // Fallback for invalid format
      
      const hour = parseInt(parts[0], 10)
      const min = parts[1] || '00'
      
      // Validate hour range
      if (isNaN(hour) || hour < 0 || hour > 23) return time
      
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      return `${hour12}:${min} ${ampm}`
    }

    try {
      // T070: Added WIB (UTC+7) timezone label
      return `${formatTime(mondayHours.open_time)} - ${formatTime(mondayHours.close_time)} WIB`
    } catch (error) {
      console.error('Error formatting operating hours:', error)
      return 'Mon - Sat: 11AM - 10PM WIB' // Fallback to default with timezone
    }
  }

  const quickLinks = [
    { to: '/site', labelKey: 'public.home' },
    { to: '/site/menu', labelKey: 'public.ourMenu' },
    { to: '/site/about', labelKey: 'public.aboutUs' },
    { to: '/site/reservation', labelKey: 'public.reservations' },
    { to: '/site/contact', labelKey: 'public.contact' },
  ]

  const operatingDays = [
    { day: 'Monday - Friday', hours: '11:00 AM - 10:00 PM' },
    { day: 'Saturday', hours: '10:00 AM - 11:00 PM' },
    { day: 'Sunday', hours: '10:00 AM - 9:00 PM' },
  ]

  return (
    <footer
      className={cn(
        'relative bg-[var(--public-primary-dark)]',
        className
      )}
      role="contentinfo"
    >
      {/* Reservation Box Overlay */}
      <div className="relative -mt-20 mb-12 px-4">
        <div className="public-container">
          <div
            className={cn(
              'relative overflow-hidden rounded-lg',
              'bg-[var(--public-accent)] p-8 md:p-12',
              'flex flex-col md:flex-row items-center justify-between gap-6'
            )}
          >
            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
              aria-hidden="true"
            />

            {/* Content */}
            <div className="relative text-center md:text-left">
              <h3
                className="font-accent text-2xl md:text-3xl text-white mb-2"
                style={{ fontFamily: 'var(--font-accent, Pacifico, cursive)' }}
              >
                {t('public.reserveYourTable')}
              </h3>
              <p className="text-white/80 text-sm md:text-base">
                {t('public.experiencePremiumDining')}
              </p>
            </div>

            {/* CTA Button */}
            <Button
              asChild
              size="lg"
              className={cn(
                'relative gap-2 bg-white text-[var(--public-accent)]',
                'hover:bg-white/90 font-semibold',
                'shadow-lg hover:shadow-xl transition-all'
              )}
            >
              <Link to="/site/reservation">
                <Calendar className="h-5 w-5" aria-hidden="true" />
                <span>{t('public.bookNow')}</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="public-container py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link
              to="/site"
              className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)]"
            >
              <h3
                className="font-accent text-3xl text-[var(--public-accent)]"
                style={{ fontFamily: 'var(--font-accent, Pacifico, cursive)' }}
              >
                Steak Kenangan
              </h3>
            </Link>
            <p className="text-sm text-[var(--public-text-secondary)] leading-relaxed">
              {restaurantInfo?.tagline ||
                'Experience the finest premium steaks crafted with passion and served with elegance.'}
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-4 pt-4">
              {restaurantInfo?.instagram_url && (
                <a
                  href={restaurantInfo.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'bg-[var(--public-bg-hover)] text-[var(--public-text-secondary)]',
                    'hover:bg-[var(--public-accent)] hover:text-white transition-all'
                  )}
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {restaurantInfo?.facebook_url && (
                <a
                  href={restaurantInfo.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'bg-[var(--public-bg-hover)] text-[var(--public-text-secondary)]',
                    'hover:bg-[var(--public-accent)] hover:text-white transition-all'
                  )}
                  aria-label="Follow us on Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {restaurantInfo?.twitter_url && (
                <a
                  href={restaurantInfo.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'bg-[var(--public-bg-hover)] text-[var(--public-text-secondary)]',
                    'hover:bg-[var(--public-accent)] hover:text-white transition-all'
                  )}
                  aria-label="Follow us on Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {/* Default social icons if no restaurant info */}
              {!restaurantInfo && (
                <>
                  <a
                    href="#"
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      'bg-[var(--public-bg-hover)] text-[var(--public-text-secondary)]',
                      'hover:bg-[var(--public-accent)] hover:text-white transition-all'
                    )}
                    aria-label="Follow us on Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      'bg-[var(--public-bg-hover)] text-[var(--public-text-secondary)]',
                      'hover:bg-[var(--public-accent)] hover:text-white transition-all'
                    )}
                    aria-label="Follow us on Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      'bg-[var(--public-bg-hover)] text-[var(--public-text-secondary)]',
                      'hover:bg-[var(--public-accent)] hover:text-white transition-all'
                    )}
                    aria-label="Follow us on Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4
              className="text-sm font-semibold uppercase tracking-wider text-[var(--public-accent)]"
              style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
            >
              {t('public.quickLinks')}
            </h4>
            <nav aria-label="Footer navigation">
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className={cn(
                        'flex items-center gap-2 text-sm',
                        'text-[var(--public-text-secondary)] hover:text-[var(--public-accent)]',
                        'transition-colors group'
                      )}
                    >
                      <ChevronRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4
              className="text-sm font-semibold uppercase tracking-wider text-[var(--public-accent)]"
              style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
            >
              {t('public.contactUs')}
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href={`tel:${restaurantInfo?.phone || '+622112345678'}`}
                  className={cn(
                    'flex items-center gap-3 text-sm',
                    'text-[var(--public-text-secondary)] hover:text-[var(--public-accent)]',
                    'transition-colors'
                  )}
                >
                  <span className="w-8 h-8 rounded-full bg-[var(--public-bg-hover)] flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>{restaurantInfo?.phone || '+62 811 717 112'}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${restaurantInfo?.email || 'info@steakkenangan.com'}`}
                  className={cn(
                    'flex items-center gap-3 text-sm',
                    'text-[var(--public-text-secondary)] hover:text-[var(--public-accent)]',
                    'transition-colors'
                  )}
                >
                  <span className="w-8 h-8 rounded-full bg-[var(--public-bg-hover)] flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>{restaurantInfo?.email || 'info@steakkenangan.com'}</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-[var(--public-text-secondary)]">
                <span className="w-8 h-8 rounded-full bg-[var(--public-bg-hover)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  {restaurantInfo?.address || 'Jl. Sudirman No. 123'}
                  {restaurantInfo?.city && `, ${restaurantInfo.city}`}
                  {!restaurantInfo && ', Jakarta Selatan'}
                </span>
              </li>
            </ul>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h4
              className="text-sm font-semibold uppercase tracking-wider text-[var(--public-accent)]"
              style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
            >
              {t('public.openingHours')}
            </h4>
            <ul className="space-y-3">
              {restaurantInfo?.operating_hours ? (
                <li className="flex items-center gap-3 text-sm text-[var(--public-text-secondary)]">
                  <Clock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>{formatOperatingHours(restaurantInfo.operating_hours)}</span>
                </li>
              ) : (
                operatingDays.map((item) => (
                  <li
                    key={item.day}
                    className="flex justify-between text-sm text-[var(--public-text-secondary)]"
                  >
                    <span className="font-medium">{item.day}</span>
                    <span>{item.hours}</span>
                  </li>
                ))
              )}
            </ul>

            {/* Staff Portal Link */}
            <div className="pt-4 mt-4 border-t border-[var(--public-border)]">
              <Link
                to="/login"
                className={cn(
                  'inline-flex items-center gap-2 text-xs',
                  'text-[var(--public-text-muted)] hover:text-[var(--public-accent)]',
                  'transition-colors'
                )}
              >
                <span>{t('public.staffPortal')}</span>
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--public-border)]">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-[var(--public-text-muted)]">
              © {new Date().getFullYear()} Steak Kenangan. {t('public.allRightsReserved')}
            </p>
            <div className="flex items-center gap-6 text-xs text-[var(--public-text-muted)]">
              <Link
                to="/site"
                className="hover:text-[var(--public-accent)] transition-colors"
              >
                {t('public.privacyPolicy')}
              </Link>
              <Link
                to="/site"
                className="hover:text-[var(--public-accent)] transition-colors"
              >
                {t('public.termsOfService')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
