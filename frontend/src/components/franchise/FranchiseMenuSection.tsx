import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useFranchiseContent, type PackagesData, type FranchisePackage } from '@/hooks/useFranchiseContent'

export function FranchiseMenuSection() {
  const { t } = useTranslation()
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })
  const { data, isLoading, locale, getText } = useFranchiseContent()

  const pkgData = data?.packages as PackagesData | undefined

  if (isLoading) {
    return (
      <section className="py-20 md:py-32 bg-[var(--public-bg-secondary)]">
        <div className="public-container flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--public-accent)]" />
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 md:py-32 bg-[var(--public-bg-secondary)]">
      <div className="public-container">
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
            Partnership
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--public-text-primary)] mt-3 mb-4"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            {t('franchise.menu.title')}
          </h2>
          <p className="text-[var(--public-text-secondary)] max-w-xl mx-auto">
            {t('franchise.menu.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {pkgData?.packages
            ? pkgData.packages
                .filter((p) => p.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((pkg, index) => (
                  <DynamicPackageCard key={pkg.slug} pkg={pkg} index={index} locale={locale} getText={getText} />
                ))
            : ['starter', 'premium', 'signature'].map((key, index) => (
                <FallbackPackageCard key={key} packageKey={key} index={index} isFeatured={key === 'premium'} />
              ))
          }
        </div>
      </div>
    </section>
  )
}

function DynamicPackageCard({
  pkg,
  index,
  locale,
  getText,
}: {
  pkg: FranchisePackage;
  index: number;
  locale: 'id' | 'en';
  getText: (field: { id: string; en: string }, locale: 'id' | 'en') => string;
}) {
  const { t } = useTranslation()
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })
  const highlights = getText(pkg.highlights, locale).split(', ')

  return (
    <div
      ref={ref}
      className={cn(
        'relative rounded-lg overflow-hidden',
        'border transition-[opacity,transform] duration-500 ease-out',
        pkg.isFeatured
          ? 'border-[var(--public-accent)] bg-[var(--public-accent)]/5 scale-[1.02]'
          : 'border-[var(--public-border)] bg-[var(--public-bg-elevated)]',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        'hover:border-[var(--public-accent)] hover:shadow-xl'
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {pkg.isFeatured && (
        <div className="absolute top-4 right-4">
          <span className="text-xs px-3 py-1 rounded-full bg-[var(--public-accent)] text-white font-semibold uppercase tracking-wider">
            Popular
          </span>
        </div>
      )}

      <div className="p-6 md:p-8">
        <h3
          className={cn(
            'text-2xl font-bold mb-3',
            pkg.isFeatured ? 'text-[var(--public-accent)]' : 'text-[var(--public-text-primary)]'
          )}
          style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
        >
          {getText(pkg.name, locale)}
        </h3>
        <p className="text-[var(--public-text-secondary)] mb-6 leading-relaxed">
          {getText(pkg.description, locale)}
        </p>
        <ul className="space-y-3 mb-8">
          {highlights.map((highlight, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check className={cn(
                'h-5 w-5 flex-shrink-0 mt-0.5',
                pkg.isFeatured ? 'text-[var(--public-accent)]' : 'text-[var(--public-text-muted)]'
              )} aria-hidden="true" />
              <span className="text-sm text-[var(--public-text-secondary)]">
                {highlight.trim()}
              </span>
            </li>
          ))}
        </ul>
        <Button
          asChild
          className={cn(
            'w-full font-semibold',
            pkg.isFeatured
              ? 'bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)] text-white'
              : 'border-2 border-[var(--public-accent)] text-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:text-white bg-transparent'
          )}
        >
          <Link to="/site/franchise/apply">
            {t('franchise.nav.register')}
          </Link>
        </Button>
      </div>
    </div>
  )
}

function FallbackPackageCard({ packageKey, index, isFeatured }: { packageKey: string; index: number; isFeatured: boolean }) {
  const { t } = useTranslation()
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })
  const highlights = t(`franchise.menu.${packageKey}.highlights`).split(', ')

  return (
    <div
      ref={ref}
      className={cn(
        'relative rounded-lg overflow-hidden',
        'border transition-[opacity,transform] duration-500 ease-out',
        isFeatured
          ? 'border-[var(--public-accent)] bg-[var(--public-accent)]/5 scale-[1.02]'
          : 'border-[var(--public-border)] bg-[var(--public-bg-elevated)]',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        'hover:border-[var(--public-accent)] hover:shadow-xl'
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {isFeatured && (
        <div className="absolute top-4 right-4">
          <span className="text-xs px-3 py-1 rounded-full bg-[var(--public-accent)] text-white font-semibold uppercase tracking-wider">
            Popular
          </span>
        </div>
      )}
      <div className="p-6 md:p-8">
        <h3
          className={cn(
            'text-2xl font-bold mb-3',
            isFeatured ? 'text-[var(--public-accent)]' : 'text-[var(--public-text-primary)]'
          )}
          style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
        >
          {t(`franchise.menu.${packageKey}.name`)}
        </h3>
        <p className="text-[var(--public-text-secondary)] mb-6 leading-relaxed">
          {t(`franchise.menu.${packageKey}.description`)}
        </p>
        <ul className="space-y-3 mb-8">
          {highlights.map((highlight, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check className={cn(
                'h-5 w-5 flex-shrink-0 mt-0.5',
                isFeatured ? 'text-[var(--public-accent)]' : 'text-[var(--public-text-muted)]'
              )} aria-hidden="true" />
              <span className="text-sm text-[var(--public-text-secondary)]">
                {highlight.trim()}
              </span>
            </li>
          ))}
        </ul>
        <Button
          asChild
          className={cn(
            'w-full font-semibold',
            isFeatured
              ? 'bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)] text-white'
              : 'border-2 border-[var(--public-accent)] text-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:text-white bg-transparent'
          )}
        >
          <Link to="/site/franchise/apply">
            {t('franchise.nav.register')}
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default FranchiseMenuSection
