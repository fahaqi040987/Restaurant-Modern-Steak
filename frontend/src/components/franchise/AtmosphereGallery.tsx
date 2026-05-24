import { useTranslation } from 'react-i18next'
import { Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

const galleryItems = [
  { key: 'outletDay' },
  { key: 'indoor' },
  { key: 'outletNight' },
  { key: 'outdoor' },
] as const

export function AtmosphereGallery() {
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
            Steak Kenangan
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--public-text-primary)] mt-3 mb-4"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            {t('franchise.atmosphere.title')}
          </h2>
          <p className="text-[var(--public-text-secondary)] max-w-xl mx-auto">
            {t('franchise.atmosphere.subtitle')}
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {galleryItems.map((item, index) => (
            <GalleryCard
              key={item.key}
              label={t(`franchise.atmosphere.${item.key}`)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function GalleryCard({ label, index }: { label: string; index: number }) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })

  return (
    <div
      ref={ref}
      className={cn(
        'relative rounded-lg overflow-hidden group',
        'bg-[var(--public-bg-hover)] border border-[var(--public-border)]',
        'aspect-[4/3]',
        'transition-[opacity,transform] duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Placeholder content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <Camera className="h-10 w-10 text-[var(--public-text-muted)]" aria-hidden="true" />
        <span className="text-sm text-[var(--public-text-muted)] uppercase tracking-wider">
          [{label}]
        </span>
      </div>

      {/* Hover overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-[var(--public-accent)]/10',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        )}
      />
    </div>
  )
}

export default AtmosphereGallery
