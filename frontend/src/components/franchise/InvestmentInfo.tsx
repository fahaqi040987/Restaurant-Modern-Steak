import { useTranslation } from 'react-i18next'
import { TrendingUp, Shield, Award, Truck, Megaphone, Headphones } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

const benefitIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  brand: Shield,
  training: Award,
  supply: Truck,
  marketing: Megaphone,
  tech: TrendingUp,
  support: Headphones,
}

export function InvestmentInfo() {
  const { t } = useTranslation()
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })

  return (
    <section className="py-20 md:py-32 bg-[var(--public-primary)]">
      <div className="public-container">
        {/* Section Header */}
        <div
          ref={titleRef}
          className={cn(
            'text-center mb-16 transition-[opacity,transform] duration-700',
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <span
            className="text-[var(--public-accent)] text-sm uppercase tracking-[0.2em] font-semibold"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            Opportunity
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--public-text-primary)] mt-3 mb-4"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            {t('franchise.investment.title')}
          </h2>
          <p className="text-[var(--public-text-secondary)] max-w-xl mx-auto">
            {t('franchise.investment.subtitle')}
          </p>
        </div>

        {/* Investment Cards */}
        <InvestmentCards />

        {/* Benefits Grid */}
        <BenefitsGrid />
      </div>
    </section>
  )
}

function InvestmentCards() {
  const { t } = useTranslation()

  const tiers = [
    { key: 'starter', color: 'border-[var(--public-border)]' },
    { key: 'premium', color: 'border-[var(--public-accent)]' },
    { key: 'signature', color: 'border-[var(--public-border)]' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
      {tiers.map((tier) => (
        <div
          key={tier.key}
          className={cn(
            'rounded-lg p-6 bg-[var(--public-bg-elevated)] border',
            tier.color,
            'text-center'
          )}
        >
          <span
            className={cn(
              'text-sm uppercase tracking-wider font-semibold',
              tier.key === 'premium' ? 'text-[var(--public-accent)]' : 'text-[var(--public-text-muted)]'
            )}
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            {t(`franchise.menu.${tier.key}.name`)}
          </span>
          <p className="text-2xl md:text-3xl font-bold text-[var(--public-text-primary)] mt-2">
            {t(`franchise.investment.initialCapital.${tier.key}`)}
          </p>
          <span className="text-xs text-[var(--public-text-muted)] mt-1 block">
            {t('franchise.investment.initialCapital.label')}
          </span>
        </div>
      ))}
    </div>
  )
}

function BenefitsGrid() {
  const { t } = useTranslation()
  const benefitKeys = Object.keys(benefitIcons)

  return (
    <div>
      <h3
        className="text-2xl md:text-3xl font-bold text-[var(--public-text-primary)] text-center mb-10"
        style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
      >
        {t('franchise.investment.benefits.title')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefitKeys.map((key, index) => {
          const Icon = benefitIcons[key]
          return (
            <BenefitCard key={key} icon={Icon} label={t(`franchise.investment.benefits.items.${key}`)} index={index} />
          )
        })}
      </div>
    </div>
  )
}

function BenefitCard({ icon: Icon, label, index }: { icon: React.ComponentType<{ className?: string }>; label: string; index: number }) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-start gap-4 p-5 rounded-lg',
        'bg-[var(--public-bg-elevated)] border border-[var(--public-border)]',
        'transition-[opacity,transform] duration-500 ease-out',
        'hover:border-[var(--public-accent)] hover:shadow-md',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="w-10 h-10 rounded-full bg-[var(--public-accent)]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-[var(--public-accent)]" aria-hidden="true" />
      </div>
      <span className="text-[var(--public-text-secondary)] text-sm leading-relaxed pt-2">
        {label}
      </span>
    </div>
  )
}

export default InvestmentInfo
