import { useTranslation } from 'react-i18next'
import { Target, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

export function VisionMission() {
  const { t } = useTranslation()
  const { ref: ref, isVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })

  const visionPoints = [
    { num: '01', text: t('franchise.visionMission.vision1') },
    { num: '02', text: t('franchise.visionMission.vision2') },
    { num: '03', text: t('franchise.visionMission.vision3') },
  ]

  return (
    <section className="py-20 md:py-32 bg-[var(--public-bg-secondary)]">
      <div
        ref={ref}
        className={cn(
          'public-container transition-[opacity,transform] duration-700',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Mission */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--public-accent)]/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-[var(--public-accent)]" aria-hidden="true" />
              </div>
              <span
                className="text-[var(--public-accent)] text-sm uppercase tracking-[0.2em] font-semibold"
                style={{ fontFamily: 'var(--font-heading, Playfair Display, serif)' }}
              >
                {t('franchise.visionMission.missionLabel')}
              </span>
            </div>
            <p
              className="text-xl md:text-2xl font-semibold text-[var(--public-text-primary)] leading-relaxed"
              style={{ fontFamily: 'var(--font-heading, Playfair Display, serif)' }}
            >
              "{t('franchise.visionMission.missionText')}"
            </p>
          </div>

          {/* Vision */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--public-accent)]/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-[var(--public-accent)]" aria-hidden="true" />
              </div>
              <span
                className="text-[var(--public-accent)] text-sm uppercase tracking-[0.2em] font-semibold"
                style={{ fontFamily: 'var(--font-heading, Playfair Display, serif)' }}
              >
                {t('franchise.visionMission.visionLabel')}
              </span>
            </div>
            <ul className="space-y-6">
              {visionPoints.map((point, index) => (
                <li key={index} className="flex gap-4">
                  <span
                    className="text-[var(--public-accent)] text-2xl font-bold flex-shrink-0 mt-0.5"
                    style={{ fontFamily: 'var(--font-heading, Playfair Display, serif)' }}
                  >
                    {point.num}
                  </span>
                  <p className="text-[var(--public-text-secondary)] leading-relaxed">
                    {point.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default VisionMission
