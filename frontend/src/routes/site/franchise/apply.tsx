import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { ApplicationForm } from '@/components/franchise/ApplicationForm'

export const Route = createFileRoute('/site/franchise/apply')({
  component: FranchiseApplyPage,
})

function FranchiseApplyPage() {
  const { t } = useTranslation()

  return (
    <FranchiseLayout>
      <section className="py-20 md:py-32 bg-[var(--public-bg-secondary)]">
        <div className="public-container">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <span
                className="text-[var(--public-accent)] text-sm uppercase tracking-[0.2em] font-semibold"
                style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
              >
                Join Us
              </span>
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--public-text-primary)] mt-3 mb-4"
                style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
              >
                {t('franchise.apply.title')}
              </h1>
              <p className="text-[var(--public-text-secondary)]">
                {t('franchise.apply.subtitle')}
              </p>
            </div>

            {/* Form */}
            <div className="rounded-lg border border-[var(--public-border)] bg-[var(--public-bg-elevated)] p-6 md:p-8">
              <ApplicationForm />
            </div>
          </div>
        </div>
      </section>
    </FranchiseLayout>
  )
}
