import { Link } from '@tanstack/react-router'
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Clock,
} from 'lucide-react'
import type { RestaurantInfo, OperatingHours } from '@/types'

interface PublicFooterProps {
  restaurantInfo?: RestaurantInfo | null
}

/**
 * Public website footer component
 * Displays contact info, operating hours, social links, and navigation
 */
export function PublicFooter({ restaurantInfo }: PublicFooterProps) {
  const formatOperatingHours = (hours: OperatingHours[]): string => {
    if (!hours || hours.length === 0) return 'Hours not available'

    // Find typical weekday hours (Monday)
    const mondayHours = hours.find((h) => h.day_of_week === 1)
    if (!mondayHours || mondayHours.is_closed) return 'Varies by day'

    const formatTime = (time: string): string => {
      const [hourStr] = time.split(':')
      const hour = parseInt(hourStr, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      return `${hour12}${ampm}`
    }

    return `${formatTime(mondayHours.open_time)} - ${formatTime(mondayHours.close_time)}`
  }

  const quickLinks = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Menu' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <footer
      className="bg-[var(--public-primary-dark)] border-t border-[var(--public-border)]"
      role="contentinfo"
    >
      <div className="public-container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-secondary)]"
            >
              <h3
                className="font-serif text-xl font-semibold tracking-wide text-[var(--public-text-primary)]"
                style={{ fontFamily: 'var(--public-font-heading)' }}
              >
                Modern<span className="text-[var(--public-secondary)]">Steak</span>
              </h3>
            </Link>
            <p className="text-sm text-[var(--public-text-secondary)] leading-relaxed">
              {restaurantInfo?.tagline || 'Premium steaks crafted with passion'}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4
              className="text-sm font-semibold uppercase tracking-wider text-[var(--public-secondary)]"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              Quick Links
            </h4>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-[var(--public-text-secondary)] hover:text-[var(--public-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-secondary)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4
              className="text-sm font-semibold uppercase tracking-wider text-[var(--public-secondary)]"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              Contact Us
            </h4>
            <ul className="space-y-3">
              {restaurantInfo?.phone && (
                <li>
                  <a
                    href={`tel:${restaurantInfo.phone}`}
                    className="flex items-center gap-2 text-sm text-[var(--public-text-secondary)] hover:text-[var(--public-secondary)] transition-colors"
                    aria-label={`Call us at ${restaurantInfo.phone}`}
                  >
                    <Phone className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>{restaurantInfo.phone}</span>
                  </a>
                </li>
              )}
              {restaurantInfo?.email && (
                <li>
                  <a
                    href={`mailto:${restaurantInfo.email}`}
                    className="flex items-center gap-2 text-sm text-[var(--public-text-secondary)] hover:text-[var(--public-secondary)] transition-colors"
                    aria-label={`Email us at ${restaurantInfo.email}`}
                  >
                    <Mail className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>{restaurantInfo.email}</span>
                  </a>
                </li>
              )}
              {restaurantInfo?.address && (
                <li className="flex items-start gap-2 text-sm text-[var(--public-text-secondary)]">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    {restaurantInfo.address}
                    {restaurantInfo.city && `, ${restaurantInfo.city}`}
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Hours & Social */}
          <div className="space-y-4">
            <h4
              className="text-sm font-semibold uppercase tracking-wider text-[var(--public-secondary)]"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              Hours
            </h4>
            <div className="flex items-center gap-2 text-sm text-[var(--public-text-secondary)]">
              <Clock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>
                {restaurantInfo?.operating_hours
                  ? formatOperatingHours(restaurantInfo.operating_hours)
                  : 'See full hours on Contact page'}
              </span>
            </div>

            {/* Social Media Links */}
            <div className="pt-4">
              <h4
                className="text-sm font-semibold uppercase tracking-wider text-[var(--public-secondary)] mb-3"
                style={{ fontFamily: 'var(--public-font-heading)' }}
              >
                Follow Us
              </h4>
              <div className="flex items-center gap-4">
                {restaurantInfo?.instagram_url && (
                  <a
                    href={restaurantInfo.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--public-text-secondary)] hover:text-[var(--public-secondary)] transition-colors"
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
                    className="text-[var(--public-text-secondary)] hover:text-[var(--public-secondary)] transition-colors"
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
                    className="text-[var(--public-text-secondary)] hover:text-[var(--public-secondary)] transition-colors"
                    aria-label="Follow us on Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--public-border)]">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-[var(--public-text-muted)]">
              © {new Date().getFullYear()} Modern Steak. All rights reserved.
            </p>
            <a
              href="/staff"
              className="text-xs text-[var(--public-text-muted)] hover:text-[var(--public-text-secondary)] transition-colors"
            >
              Staff Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
