/**
 * T036: Reservation route page
 * Public reservation page with ReservationForm component
 */
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Phone, MapPin, Clock, Calendar, Users, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicLayout } from '@/components/public/PublicLayout'
import { ReservationForm } from '@/components/public/ReservationForm'
import { apiClient } from '@/api/client'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/site/reservation')({
  component: ReservationPage,
})

function ReservationPage() {
  const { t } = useTranslation()
  const { data: restaurantInfo, isLoading } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 5, // 5 minutes for faster updates
    refetchOnMount: true,
  })

  const DAY_NAMES = [
    t('reservation.sunday'),
    t('reservation.monday'),
    t('reservation.tuesday'),
    t('reservation.wednesday'),
    t('reservation.thursday'),
    t('reservation.friday'),
    t('reservation.saturday'),
  ]

  const FAQ_ITEMS = [
    {
      question: t('reservation.faqBookingAdvance'),
      answer: t('reservation.faqBookingAdvanceAnswer'),
    },
    {
      question: t('reservation.faqModifyReservation'),
      answer: t('reservation.faqModifyReservationAnswer'),
    },
    {
      question: t('reservation.faqCancellationPolicy'),
      answer: t('reservation.faqCancellationPolicyAnswer'),
    },
    {
      question: t('reservation.faqDietaryRestrictions'),
      answer: t('reservation.faqDietaryRestrictionsAnswer'),
    },
  ]

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

  const today = new Date().getDay()

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="pt-28 md:pt-36 pb-12 md:pb-16 bg-[var(--public-bg-secondary)]">
        <div className="public-container text-center">
          <span
            className="text-[var(--public-accent)] text-sm uppercase tracking-widest font-semibold"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            {t('reservation.reservations')}
          </span>
          <h1
            className="text-4xl md:text-5xl font-bold text-[var(--public-text-primary)] mt-2 mb-4"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            {t('reservation.bookYourTable').split(' ').slice(0, -1).join(' ')}{' '}
            <span className="text-[var(--public-accent)]">
              {t('reservation.bookYourTable').split(' ').slice(-1)[0]}
            </span>
          </h1>
          <p className="text-[var(--public-text-secondary)] max-w-2xl mx-auto">
            {t('reservation.pageDescription')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="public-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Reservation Form */}
            <div className="lg:col-span-2">
              <Card className="public-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--public-text-primary)]">
                    <Calendar className="h-5 w-5 text-[var(--public-accent)]" />
                    {t('reservation.makeAReservation')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReservationForm
                    onSuccess={(response) => {
                      console.log('Reservation created:', response.id)
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Info Cards */}
            <div className="space-y-6">
              {/* Party Size Info */}
              <Card className="public-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-[var(--public-text-primary)] text-lg">
                    <Users className="h-5 w-5 text-[var(--public-accent)]" />
                    {t('reservation.partySize')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[var(--public-text-secondary)] text-sm">
                    {t('reservation.partySizeDescription')}
                  </p>
                </CardContent>
              </Card>

              {/* Contact Card */}
              <Card className="public-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-[var(--public-text-primary)] text-lg">
                    <Phone className="h-5 w-5 text-[var(--public-accent)]" />
                    {t('reservation.needHelp')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoading ? (
                    <p className="text-[var(--public-text-secondary)] text-sm">{t('common.loading')}</p>
                  ) : (
                    <>
                      {restaurantInfo?.phone && (
                        <a
                          href={`tel:${restaurantInfo.phone}`}
                          className="flex items-center gap-2 text-[var(--public-text-secondary)] hover:text-[var(--public-accent)] transition-colors text-sm"
                        >
                          <Phone className="h-4 w-4" />
                          {restaurantInfo.phone}
                        </a>
                      )}
                      {restaurantInfo?.address && (
                        <div className="flex items-start gap-2 text-[var(--public-text-secondary)] text-sm">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>
                            {restaurantInfo.address}
                            {restaurantInfo.city && `, ${restaurantInfo.city}`}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Operating Hours Card */}
              <Card className="public-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-[var(--public-text-primary)] text-lg">
                    <Clock className="h-5 w-5 text-[var(--public-accent)]" />
                    {t('reservation.operatingHours')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-[var(--public-text-secondary)] text-sm">{t('common.loading')}</p>
                  ) : restaurantInfo?.operating_hours && restaurantInfo.operating_hours.length > 0 ? (
                    <div className="space-y-1">
                      {restaurantInfo.operating_hours
                        .sort((a, b) => a.day_of_week - b.day_of_week)
                        .map((hours) => (
                          <div
                            key={hours.id}
                            className={cn(
                              'flex justify-between py-1.5 px-2 rounded text-sm',
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
                              {DAY_NAMES[hours.day_of_week].slice(0, 3)}
                              {hours.day_of_week === today && (
                                <span className="ml-1 text-xs">({t('reservation.today')})</span>
                              )}
                            </span>
                            <span className="text-[var(--public-text-secondary)]">
                              {hours.is_closed
                                ? t('reservation.closed')
                                : `${formatTime(hours.open_time)} - ${formatTime(hours.close_time)}`}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-[var(--public-text-secondary)] text-sm">{t('reservation.hoursNotAvailable')}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-16 bg-[var(--public-bg-secondary)]">
        <div className="public-container">
          <div className="text-center mb-10">
            <h2
              className="text-2xl md:text-3xl font-bold text-[var(--public-text-primary)]"
              style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
            >
              {t('reservation.frequentlyAskedQuestions').split(' ').slice(0, -1).join(' ')}{' '}
              <span className="text-[var(--public-accent)]">
                {t('reservation.frequentlyAskedQuestions').split(' ').slice(-1)[0]}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {FAQ_ITEMS.map((item, index) => (
              <Card key={index} className="public-card">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <HelpCircle className="h-5 w-5 text-[var(--public-accent)] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-[var(--public-text-primary)] mb-2">
                        {item.question}
                      </h3>
                      <p className="text-[var(--public-text-secondary)] text-sm">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 md:py-16">
        <div className="public-container text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-[var(--public-text-primary)] mb-4"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            {t('reservation.preferToCall')}
          </h2>
          <p className="text-[var(--public-text-secondary)] mb-6 max-w-xl mx-auto">
            {t('reservation.teamReadyToAssist')}
          </p>
          {restaurantInfo?.phone && (
            <a
              href={`tel:${restaurantInfo.phone}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--public-accent)] text-white rounded-lg font-semibold hover:bg-[var(--public-accent-dark)] transition-colors"
            >
              <Phone className="h-5 w-5" />
              {restaurantInfo.phone}
            </a>
          )}
        </div>
      </section>
    </PublicLayout>
  )
}
