/**
 * T042: Contact route page
 * Public contact page with ContactForm and ContactInfo components
 */
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicLayout } from '@/components/public/PublicLayout'
import { ContactForm } from '@/components/public/ContactForm'
import { ContactInfo } from '@/components/public/ContactInfo'
import { apiClient } from '@/api/client'

export const Route = createFileRoute('/site/contact')({
  component: PublicContactPage,
})

function PublicContactPage() {
  const { data: restaurantInfo, isLoading, error } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 30,
  })

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-12 md:py-16 bg-[var(--public-bg-secondary)]">
        <div className="public-container text-center">
          <span
            className="text-[var(--public-accent)] text-sm uppercase tracking-widest font-semibold"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            Get in Touch
          </span>
          <h1
            className="text-4xl md:text-5xl font-bold text-[var(--public-text-primary)] mt-2 mb-4"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            Contact <span className="text-[var(--public-accent)]">Us</span>
          </h1>
          <p className="text-[var(--public-text-secondary)] max-w-2xl mx-auto">
            We'd love to hear from you. Get in touch for reservations, inquiries, or feedback.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="public-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Contact Info */}
            <ContactInfo
              restaurantInfo={restaurantInfo}
              isLoading={isLoading}
              error={error as Error | null}
              showMap={true}
              showHours={true}
            />

            {/* Right Column - Contact Form */}
            <div>
              <Card className="public-card">
                <CardHeader>
                  <CardTitle className="text-[var(--public-text-primary)]">
                    Send Us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ContactForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 md:py-16 bg-[var(--public-bg-secondary)]">
        <div className="public-container text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-[var(--public-text-primary)] mb-4"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            Prefer to Call?
          </h2>
          <p className="text-[var(--public-text-secondary)] mb-6 max-w-xl mx-auto">
            Our team is ready to assist you with reservations and inquiries.
            Call us directly for immediate assistance.
          </p>
          {restaurantInfo?.phone && (
            <a
              href={`tel:${restaurantInfo.phone}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--public-accent)] text-white rounded-lg font-semibold hover:bg-[var(--public-accent-dark)] transition-colors"
            >
              {restaurantInfo.phone}
            </a>
          )}
        </div>
      </section>
    </PublicLayout>
  )
}
