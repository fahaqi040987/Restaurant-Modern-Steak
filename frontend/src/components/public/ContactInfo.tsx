/**
 * T041: ContactInfo component
 * Displays restaurant contact information (phone, email, address)
 * T068: Added i18n support
 */
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin, Clock, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, getTimezoneAbbreviation } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { RestaurantInfo, OperatingHours } from '@/types'

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

interface ContactInfoProps {
  /** Restaurant information data */
  restaurantInfo?: RestaurantInfo | null
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: Error | null
  /** Custom class name */
  className?: string
  /** Whether to show the map embed */
  showMap?: boolean
  /** Whether to show operating hours */
  showHours?: boolean
}

/**
 * ContactInfo component displays restaurant contact details.
 * Shows address, phone, email, and optionally operating hours and map.
 *
 * @example
 * ```tsx
 * <ContactInfo
 *   restaurantInfo={data}
 *   isLoading={isLoading}
 *   showMap={true}
 *   showHours={true}
 * />
 * ```
 */
export function ContactInfo({
  restaurantInfo,
  isLoading = false,
  error,
  className,
  showMap = true,
  showHours = true,
}: ContactInfoProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const today = new Date().getDay()

  const formatTime = (time: string): string => {
    let hourStr: string
    let minuteStr: string

    if (time.includes('T')) {
      const timePart = time.split('T')[1]
      const [h, m] = timePart.split(':')
      hourStr = h
      minuteStr = m
    } else {
      const [h, m] = time.split(':')
      hourStr = h
      minuteStr = m || '00'
    }

    const hour = parseInt(hourStr, 10)
    const minute = minuteStr || '00'
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return minute === '00' ? `${hour12} ${ampm}` : `${hour12}:${minute} ${ampm}`
  }

  const copyAddress = async () => {
    if (restaurantInfo?.address) {
      const fullAddress = `${restaurantInfo.address}${restaurantInfo.city ? `, ${restaurantInfo.city}` : ''}${restaurantInfo.postal_code ? ` ${restaurantInfo.postal_code}` : ''}`
      await navigator.clipboard.writeText(fullAddress)
      toast({
        title: t('public.addressCopied'),
        description: t('public.addressCopiedDesc'),
      })
    }
  }

  if (error) {
    return (
      <Card className={cn('public-card border-red-500', className)}>
        <CardContent className="py-4">
          <p className="text-red-500">{t('errors.generic')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Address Card */}
      <Card className="public-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--public-text-primary)]">
            <MapPin className="h-5 w-5 text-[var(--public-accent)]" />
            {t('public.ourLocation')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <p className="text-[var(--public-text-secondary)]">
              {restaurantInfo?.address || t('public.addressNotAvailable')}
              {restaurantInfo?.city && <>, {restaurantInfo.city}</>}
              {restaurantInfo?.postal_code && <> {restaurantInfo.postal_code}</>}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyAddress}
              disabled={!restaurantInfo?.address}
              className="border-[var(--public-border)] text-[var(--public-text-secondary)] hover:bg-[var(--public-bg-hover)]"
            >
              <Copy className="h-4 w-4 mr-2" />
              {t('public.copyAddress')}
            </Button>
            {restaurantInfo?.google_maps_url && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-[var(--public-accent)] text-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:text-white"
              >
                <a
                  href={restaurantInfo.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('public.getDirections')}
                </a>
              </Button>
            )}
          </div>

          {/* Google Maps Embed */}
          {showMap && restaurantInfo?.map_latitude && restaurantInfo?.map_longitude && (
            <div className="mt-4 rounded-lg overflow-hidden border border-[var(--public-border)]">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${restaurantInfo.map_latitude},${restaurantInfo.map_longitude}&zoom=15`}
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Restaurant Location"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Details Card */}
      <Card className="public-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--public-text-primary)]">
            <Phone className="h-5 w-5 text-[var(--public-accent)]" />
            {t('public.contactDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : (
            <>
              {restaurantInfo?.phone ? (
                <a
                  href={`tel:${restaurantInfo.phone}`}
                  className="flex items-center gap-3 text-[var(--public-text-secondary)] hover:text-[var(--public-accent)] transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {restaurantInfo.phone}
                </a>
              ) : (
                <p className="text-[var(--public-text-muted)]">{t('public.phoneNotAvailable')}</p>
              )}
              {restaurantInfo?.email ? (
                <a
                  href={`mailto:${restaurantInfo.email}`}
                  className="flex items-center gap-3 text-[var(--public-text-secondary)] hover:text-[var(--public-accent)] transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {restaurantInfo.email}
                </a>
              ) : (
                <p className="text-[var(--public-text-muted)]">{t('public.emailNotAvailable')}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Operating Hours Card */}
      {showHours && (
        <Card className="public-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--public-text-primary)]">
              <Clock className="h-5 w-5 text-[var(--public-accent)]" />
              {t('public.operatingHours')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                ))}
              </div>
            ) : restaurantInfo?.operating_hours && restaurantInfo.operating_hours.length > 0 ? (
              <div className="space-y-2">
                {(() => {
                  const timezoneAbbrev = getTimezoneAbbreviation(restaurantInfo?.timezone)
                  return restaurantInfo.operating_hours
                    .sort((a: OperatingHours, b: OperatingHours) => a.day_of_week - b.day_of_week)
                    .map((hours: OperatingHours) => (
                      <div
                        key={hours.id}
                        className={cn(
                          'flex justify-between py-2 px-3 rounded',
                          hours.day_of_week === today
                            ? 'bg-[var(--public-accent)]/10 border border-[var(--public-accent)]/30'
                            : ''
                        )}
                      >
                        <span
                          className={cn(
                            'font-medium',
                            hours.day_of_week === today
                              ? 'text-[var(--public-accent)]'
                              : 'text-[var(--public-text-primary)]'
                          )}
                        >
                          {t(`public.${DAY_KEYS[hours.day_of_week]}`)}
                          {hours.day_of_week === today && (
                            <span className="ml-2 text-xs">{t('public.today')}</span>
                          )}
                        </span>
                        <span className="text-[var(--public-text-secondary)]">
                          {hours.is_closed
                            ? t('public.closed')
                            : `${formatTime(hours.open_time)} - ${formatTime(hours.close_time)} ${timezoneAbbrev}`}
                        </span>
                      </div>
                    ))
                })()}
              </div>
            ) : (
              <p className="text-[var(--public-text-muted)]">{t('public.operatingHoursNotAvailable')}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ContactInfo
