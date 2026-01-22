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
import { cn, getTimezoneAbbreviation } from '@/lib/utils'
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

  const formatOperatingHours = (hours: OperatingHours[]): JSX.Element => {
    if (!hours || hours.length === 0) {
      return <span className="text-[var(--public-text-muted)]">{t('public.hoursNotAvailable')}</span>
    }

    // Day names array must match database convention: 0=Sunday, 1=Monday, ..., 6=Saturday
    const dayNames = [
      t('public.sunday'),    // index 0 (day_of_week 0)
      t('public.monday'),    // index 1 (day_of_week 1)
      t('public.tuesday'),   // index 2 (day_of_week 2)
      t('public.wednesday'), // index 3 (day_of_week 3)
      t('public.thursday'),  // index 4 (day_of_week 4)
      t('public.friday'),    // index 5 (day_of_week 5)
      t('public.saturday')   // index 6 (day_of_week 6)
    ]

    const formatTime = (time: string): string => {
      let timeStr = String(time).trim()

      // Handle ISO datetime format like "0000-01-01T02:00:00Z" or "2024-01-01T11:00:00"
      if (timeStr.includes('T')) {
        const match = timeStr.match(/T(\d{2}):(\d{2})/)
        if (match) {
          const [, hour, min] = match
          const hourNum = parseInt(hour, 10)
          const ampm = hourNum >= 12 ? 'PM' : 'AM'
          const hour12 = hourNum % 12 || 12
          return `${hour12}:${min} ${ampm}`
        }
      }

      // Handle HH:MM:SS or HH:MM format
      const parts = timeStr.split(':')
      if (parts.length < 2) return timeStr
      const hour = parseInt(parts[0], 10)
      const min = parts[1] || '00'
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      return `${hour12}:${min} ${ampm}`
    }

    // Validate time range - only reject midnight-to-midnight (00:00-00:00)
    const isValidTimeRange = (openTime: string, closeTime: string): boolean => {
      // Extract time portion from ISO datetime format if present
      const extractHour = (timeStr: string): number => {
        if (timeStr.includes('T')) {
          const match = timeStr.match(/T(\d{2}):/)
          return match ? parseInt(match[1], 10) : 0
        }
        return parseInt(timeStr.split(':')[0], 10)
      }

      const open = extractHour(openTime)
      const close = extractHour(closeTime)
      
      // Reject only midnight-to-midnight (00:00-00:00) for open days
      if (open === 0 && close === 0) {
        return false // Invalid: midnight to midnight
      }
      
      // Valid if open < close and both are within 0-24 range
      // Allow: 01:00-23:00, 08:00-18:00, 12:00-23:59, etc.
      return open < close && open >= 0 && close <= 24
    }

    const timezoneAbbrev = getTimezoneAbbreviation(restaurantInfo?.timezone)

    const groupedHours: Array<{ days: string[], time: string }> = []
    let currentGroup: string[] = []
    let currentHours: OperatingHours | null = null

    hours.forEach((hour, index) => {
      const nextHour = hours[index + 1]

      if (hour.is_closed) {
        if (currentGroup.length > 0) {
          groupedHours.push({ days: currentGroup, time: `${formatTime(currentHours!.open_time)} - ${formatTime(currentHours!.close_time)} ${timezoneAbbrev}` })
          currentGroup = []
          currentHours = null
        }
      } else if (!currentHours ||
        hour.open_time !== currentHours.open_time ||
        hour.close_time !== currentHours.close_time) {
        // Skip invalid time ranges
        if (!isValidTimeRange(hour.open_time, hour.close_time)) {
          return // Skip this entry
        }

        if (currentGroup.length > 0) {
          groupedHours.push({
            days: currentGroup,
            time: `${formatTime(hour.open_time)} - ${formatTime(hour.close_time)} ${timezoneAbbrev}`
          })
        }
        currentGroup = [dayNames[hour.day_of_week]]
        currentHours = hour
      } else {
        currentGroup.push(dayNames[hour.day_of_week])
      }

      if (!nextHour || nextHour.is_closed || nextHour.open_time !== hour.open_time || nextHour.close_time !== hour.close_time) {
        if (currentGroup.length > 0 && currentHours) {
          // Skip invalid time ranges
          if (isValidTimeRange(currentHours.open_time, currentHours.close_time)) {
            groupedHours.push({
              days: currentGroup,
              time: `${formatTime(currentHours.open_time)} - ${formatTime(currentHours.close_time)} ${timezoneAbbrev}`
            })
          }
          currentGroup = []
          currentHours = null
        }
      }
    })

    // Show message if no valid hours found
    if (groupedHours.length === 0) {
      return <span className="text-[var(--public-text-muted)]">{t('public.hoursNotAvailable')}</span>
    }

    return (
      <ul className="space-y-2">
        {groupedHours.map((group, idx) => (
          <li
            key={idx}
            className="flex items-center gap-3 text-sm text-[var(--public-text-secondary)]"
          >
            <Clock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <div>
              <span className="font-medium">
                {group.days.length > 1 ? `${group.days[0]} - ${group.days[group.days.length - 1]}` : group.days[0]}
              </span>
              <span className="ml-2">
                {group.time}
              </span>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  const quickLinks = [
    { to: '/site', labelKey: 'public.home' },
    { to: '/site/menu', labelKey: 'public.ourMenu' },
    { to: '/site/about', labelKey: 'public.aboutUs' },
    { to: '/site/reservation', labelKey: 'public.reservations' },
    { to: '/site/contact', labelKey: 'public.contact' },
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

            {/* Open/Closed Status Badge */}
            {restaurantInfo && (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
                    restaurantInfo.is_open_now
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  )}
                >
                  {restaurantInfo.is_open_now ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                      {t('public.openNow')}
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                      {t('public.closedNow')}
                    </>
                  )}
                </span>
              </div>
            )}

            {formatOperatingHours(restaurantInfo?.operating_hours || [])}

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
                to="/site/privacy"
                className="hover:text-[var(--public-accent)] transition-colors"
              >
                {t('public.privacyPolicy')}
              </Link>
              <Link
                to="/site/terms"
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
