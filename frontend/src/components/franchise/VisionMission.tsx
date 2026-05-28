import { useTranslation } from 'react-i18next'
import { Target, Eye, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useFranchiseContent, type VisionMissionData } from '@/hooks/useFranchiseContent'

export function VisionMission() {
  const { t } = useTranslation()
  const { ref: ref, isVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true })
  const { data, isLoading, locale, getText } = useFranchiseContent()

  const vm = data?.vision_mission as VisionMissionData | undefined

  const visionText = vm ? getText(vm.vision, locale) : t('franchise.visionMission.visionText')
  const missionPoints = vm
    ? vm.missions.map((m, i) => ({ num: String(i + 1).padStart(2, '0'), text: getText(m, locale) }))
    : [
        { num: '01', text: t('franchise.visionMission.mission1') },
        { num: '02', text: t('franchise.visionMission.mission2') },
        { num: '03', text: t('franchise.visionMission.mission3') },
      ]

  return (
    <section className="py-20 md:py-32 bg-[var(--public-bg-secondary)]">
      <div
        ref={ref}
        className={cn(
          'public-container',
          !isLoading && 'transition-[opacity,transform] duration-700',
          !isLoading && (isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')
        )}
      >
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--public-accent)]" />
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Vision */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--public-accent)]/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-[var(--public-accent)]" aria-hidden="true" />
              </div>
              <span
                className="text-[var(--public-accent)] text-sm uppercase tracking-[0.2em] font-semibold"
                style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
              >
                {t('franchise.visionMission.visionLabel')}
              </span>
            </div>
            <p
              className="text-xl md:text-2xl font-semibold text-[var(--public-text-primary)] leading-relaxed"
              style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
            >
              &ldquo;{visionText}&rdquo;
            </p>
          </div>

          {/* Mission */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--public-accent)]/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-[var(--public-accent)]" aria-hidden="true" />
              </div>
              <span
                className="text-[var(--public-accent)] text-sm uppercase tracking-[0.2em] font-semibold"
                style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
              >
                {t('franchise.visionMission.missionLabel')}
              </span>
            </div>
            <ul className="space-y-6">
              {missionPoints.map((point, index) => (
                <li key={index} className="flex gap-4">
                  <span
                    className="text-[var(--public-accent)] text-2xl font-bold flex-shrink-0 mt-0.5"
                    style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
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
        )}
      </div>
    </section>
  )
}

export default VisionMission
