import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PublicLayout } from '@/components/public/PublicLayout'
import { apiClient } from '@/api/client'

export const Route = createFileRoute('/site/about')({
  component: PublicAboutPage,
})

function PublicAboutPage() {
  const { data: restaurantInfo } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 30,
  })

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-[var(--public-bg-secondary)]">
        <div className="public-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1
              className="text-4xl md:text-5xl font-bold text-[var(--public-text-primary)] mb-6"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              Our <span className="text-[var(--public-secondary)]">Story</span>
            </h1>
            <p className="text-lg text-[var(--public-text-secondary)] leading-relaxed">
              {restaurantInfo?.description ||
                'Welcome to Steak Kenangan, where culinary excellence meets warm hospitality. Our journey began with a simple passion: to serve the finest steaks in an atmosphere that feels like home.'}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-20">
        <div className="public-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="text-3xl font-bold text-[var(--public-text-primary)] mb-6"
                style={{ fontFamily: 'var(--public-font-heading)' }}
              >
                Our <span className="text-[var(--public-secondary)]">Mission</span>
              </h2>
              <p className="text-[var(--public-text-secondary)] mb-4 leading-relaxed">
                At Steak Kenangan, we are committed to providing an exceptional dining experience that goes beyond just great food. We believe in sourcing the highest quality ingredients, supporting local suppliers, and creating dishes that celebrate the art of cooking.
              </p>
              <p className="text-[var(--public-text-secondary)] leading-relaxed">
                Every cut of meat is carefully selected, aged to perfection, and prepared by our skilled chefs who bring decades of combined experience to your plate. We take pride in every dish that leaves our kitchen.
              </p>
            </div>

            <Card className="public-card p-8">
              <Quote className="h-10 w-10 text-[var(--public-secondary)] mb-4" />
              <blockquote className="text-xl text-[var(--public-text-primary)] italic mb-4" style={{ fontFamily: 'var(--public-font-heading)' }}>
                "The secret of great steak lies not just in the cut, but in the care, the timing, and the passion we put into every preparation."
              </blockquote>
              <cite className="text-[var(--public-text-secondary)]">— Head Chef, Steak Kenangan</cite>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-20 bg-[var(--public-bg-secondary)]">
        <div className="public-container">
          <h2
            className="text-3xl font-bold text-[var(--public-text-primary)] text-center mb-12"
            style={{ fontFamily: 'var(--public-font-heading)' }}
          >
            Our <span className="text-[var(--public-secondary)]">Values</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Quality First',
                description:
                  'We source only the finest ingredients, from premium aged beef to fresh seasonal vegetables. Quality is non-negotiable in everything we serve.',
              },
              {
                title: 'Craftsmanship',
                description:
                  'Every dish is prepared with meticulous attention to detail. Our chefs are artisans who take pride in their craft and continuously refine their skills.',
              },
              {
                title: 'Hospitality',
                description:
                  'We believe dining should be an experience, not just a meal. Our team is dedicated to making every guest feel welcome and valued.',
              },
            ].map((value, idx) => (
              <Card key={idx} className="public-card p-6 text-center">
                <CardContent className="p-0">
                  <div className="w-12 h-12 rounded-full bg-[var(--public-secondary)]/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-[var(--public-secondary)]">
                      {idx + 1}
                    </span>
                  </div>
                  <h3
                    className="text-xl font-semibold text-[var(--public-text-primary)] mb-3"
                    style={{ fontFamily: 'var(--public-font-heading)' }}
                  >
                    {value.title}
                  </h3>
                  <p className="text-[var(--public-text-secondary)]">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-16 md:py-20">
        <div className="public-container">
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-3xl font-bold text-[var(--public-text-primary)] mb-6"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              The <span className="text-[var(--public-secondary)]">Experience</span>
            </h2>
            <p className="text-[var(--public-text-secondary)] mb-8 leading-relaxed">
              From the moment you step through our doors, you'll be greeted by the warm ambiance of rich wood, soft lighting, and the enticing aroma of perfectly grilled steaks. Whether you're celebrating a special occasion or enjoying a casual dinner, Steak Kenangan provides the perfect setting.
            </p>
            <p className="text-[var(--public-text-secondary)] mb-8 leading-relaxed">
              Our carefully curated wine selection complements our menu beautifully, and our knowledgeable staff is always ready to guide you to the perfect pairing.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[var(--public-bg-secondary)]">
        <div className="public-container text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-[var(--public-text-primary)] mb-4"
            style={{ fontFamily: 'var(--public-font-heading)' }}
          >
            Ready to Experience <span className="text-[var(--public-secondary)]">Steak Kenangan</span>?
          </h2>
          <p className="text-[var(--public-text-secondary)] mb-8">
            We'd love to welcome you to our table. Contact us to make a reservation or simply drop by.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-[var(--public-secondary)] text-[var(--public-text-on-gold)] hover:bg-[var(--public-secondary-light)]"
          >
            <a href="/site/contact">
              Get in Touch
              <ChevronRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>
    </PublicLayout>
  )
}
