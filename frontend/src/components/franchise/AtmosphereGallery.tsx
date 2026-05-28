import { useTranslation } from 'react-i18next'
import { Camera, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useFranchiseContent, type AtmosphereItem, type AtmosphereData } from '@/hooks/useFranchiseContent'

function buildImageUrl(url: string): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads')) {
    const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8080/api/v1'
    const baseUrl = apiUrl.replace('/api/v1', '')
    return `${baseUrl}${url}`
  }
  return url
}

export function AtmosphereGallery() {
  const { t } = useTranslation()
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })
  const { data, isLoading, locale, getText } = useFranchiseContent()

  const atmData = data?.atmosphere as AtmosphereData | undefined
  const galleryItems: AtmosphereItem[] = atmData?.items?.length
    ? [...atmData.items].sort((a, b) => a.sortOrder - b.sortOrder)
    : []

  return (
    <section className="py-20 md:py-32 bg-[var(--public-primary)]">
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

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--public-accent)]" />
          </div>
        ) : galleryItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {galleryItems.map((item, index) => (
              <GalleryCard key={item.id} item={item} locale={locale} getText={getText} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center text-[var(--public-text-muted)] py-12">
            <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{locale === 'id' ? 'Belum ada foto galeri' : 'No gallery photos yet'}</p>
          </div>
        )}
      </div>
    </section>
  )
}

function GalleryCard({
  item,
  locale,
  getText,
  index,
}: {
  item: AtmosphereItem;
  locale: 'id' | 'en';
  getText: (field: { id: string; en: string }, locale: 'id' | 'en') => string;
  index: number;
}) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })
  const imageUrl = buildImageUrl(item.image)
  const label = getText(item.caption, locale)

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
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Camera className="h-10 w-10 text-[var(--public-text-muted)]" aria-hidden="true" />
          <span className="text-sm text-[var(--public-text-muted)] uppercase tracking-wider">
            [{label}]
          </span>
        </div>
      )}

      <div
        className={cn(
          'absolute inset-0 bg-[var(--public-accent)]/10',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        )}
      />

      {label && imageUrl && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <span className="text-white text-sm font-medium">{label}</span>
        </div>
      )}
    </div>
  )
}

export default AtmosphereGallery
