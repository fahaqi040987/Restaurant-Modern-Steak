import { useTranslation } from 'react-i18next'
import { TrendingUp, Shield, Award, Truck, Megaphone, Headphones, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useFranchiseContent, type InvestmentData } from '@/hooks/useFranchiseContent'

const benefitIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  award: Award,
  truck: Truck,
  megaphone: Megaphone,
  'trending-up': TrendingUp,
  headphones: Headphones,
}

export function InvestmentInfo() {
  const { t } = useTranslation()
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })
  const { data, isLoading, locale, getText } = useFranchiseContent()

  const inv = data?.investment as InvestmentData | undefined

  const title = inv ? getText(inv.title, locale) : t('franchise.investment.title')
  const subtitle = inv ? getText(inv.subtitle, locale) : t('franchise.investment.subtitle')

  return (
    <section className="py-20 md:py-32 bg-[var(--public-primary)]">
      <div className="public-container">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--public-accent)]" />
          </div>
        ) : (
        <>
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
            {title}
          </h2>
          <p className="text-[var(--public-text-secondary)] max-w-xl mx-auto">
            {subtitle}
          </p>
        </div>

        <RoiSection inv={inv} locale={locale} getText={getText} />
        <BenefitsGrid inv={inv} locale={locale} getText={getText} />
        </>
        )}
      </div>
    </section>
  )
}

function RoiSection({
  inv,
  locale,
  getText,
}: {
  inv?: InvestmentData;
  locale: 'id' | 'en';
  getText: (field: { id: string; en: string }, locale: 'id' | 'en') => string;
}) {
  const roiValue = inv
    ? getText(inv.roiEstimate, locale)
    : locale === 'id' ? '18-24 Bulan' : '18-24 Months'

  return (
    <div className="text-center mb-16">
      <div className="inline-block rounded-xl bg-[var(--public-accent)]/10 border border-[var(--public-accent)]/20 px-10 py-8">
        <span
          className="text-sm uppercase tracking-[0.2em] text-[var(--public-accent)] font-semibold"
          style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
        >
          {locale === 'id' ? 'Estimasi Periode Balik Modal' : 'Estimated Payback Period'}
        </span>
        <p
          className="text-4xl md:text-5xl font-bold text-[var(--public-accent)] mt-3"
          style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
        >
          {roiValue}
        </p>
        <span className="text-sm text-[var(--public-text-muted)] mt-2 block">
          {locale === 'id' ? 'Perkiraan pengembalian dari investasi awal Anda' : 'Estimated return on your initial investment'}
        </span>
      </div>
    </div>
  )
}

function BenefitsGrid({
  inv,
  locale,
  getText,
}: {
  inv?: InvestmentData;
  locale: 'id' | 'en';
  getText: (field: { id: string; en: string }, locale: 'id' | 'en') => string;
}) {
  const { t } = useTranslation()

  const benefitItems = inv?.benefits
    ? inv.benefits
    : Object.keys(benefitIcons).map((key) => ({
        id: '',
        en: '',
        icon: key,
        _fallbackText: t(`franchise.investment.benefits.items.${key}`),
      }))

  return (
    <div>
      <h3
        className="text-2xl md:text-3xl font-bold text-[var(--public-text-primary)] text-center mb-10"
        style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
      >
        {t('franchise.investment.benefits.title')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefitItems.map((item, index) => {
          const Icon = benefitIcons[item.icon] || Shield
          const text = inv
            ? getText({ id: item.id, en: item.en }, locale)
            : (item as unknown as { _fallbackText: string })._fallbackText
          return (
            <BenefitCard key={item.icon + '-' + index} icon={Icon} label={text} index={index} />
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
