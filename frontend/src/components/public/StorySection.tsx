import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

interface TimelineMilestone {
  year: string
  title: string
  description: string
}

interface StorySectionProps {
  /** Section title */
  title?: string
  /** Main story text paragraphs */
  story?: string[]
  /** Timeline milestones */
  milestones?: TimelineMilestone[]
  /** Background image for story section */
  backgroundImage?: string
  /** Custom className */
  className?: string
}

const defaultStory = [
  'Steak Kenangan bermula dari sebuah mimpi sederhana: menghadirkan pengalaman makan steak premium yang tidak hanya memuaskan lidah, tetapi juga menghangatkan hati. Di tahun 2015, kami membuka pintu pertama kami di Jakarta dengan keyakinan bahwa setiap hidangan adalah sebuah karya seni.',
  'Sejak awal, kami berkomitmen untuk menggunakan bahan-bahan berkualitas terbaik. Daging sapi kami dipilih dengan cermat dari peternakan terpercaya, dimatangkan dengan sempurna, dan diolah oleh chef berpengalaman yang memiliki passion yang sama dengan kami.',
  'Hari ini, Steak Kenangan telah menjadi destinasi favorit bagi pecinta steak di Jakarta. Namun filosofi kami tetap sama: memberikan pengalaman kuliner yang tak terlupakan dengan kehangatan hospitality Indonesia.',
]

const defaultMilestones: TimelineMilestone[] = [
  {
    year: '2015',
    title: 'The Beginning',
    description: 'Steak Kenangan membuka gerai pertama di Bangka Belitung',
  },
  {
    year: '2017',
    title: 'Growing Together',
    description: 'Memperluas menu dengan variasi steak premium dan wine collection',
  },
  {
    year: '2019',
    title: 'Recognition',
    description: 'Meraih penghargaan Best Steakhouse dari Indonesian Culinary Awards',
  },
  {
    year: '2022',
    title: 'Innovation',
    description: 'Memperkenalkan konsep dining experience baru dengan private dining room',
  },
  {
    year: '2024',
    title: 'The Journey Continues',
    description: 'Terus berkomitmen untuk menghadirkan pengalaman kuliner terbaik',
  },
]

/**
 * Story section component with timeline for the About page.
 * Displays restaurant history and key milestones.
 *
 * @example
 * ```tsx
 * <StorySection
 *   title="Our Story"
 *   story={customStoryParagraphs}
 *   milestones={customMilestones}
 * />
 * ```
 */
export function StorySection({
  title,
  story = defaultStory,
  milestones = defaultMilestones,
  backgroundImage,
  className,
}: StorySectionProps) {
  const { t } = useTranslation()
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  const displayTitle = title || t('public.ourStory')

  return (
    <section
      ref={sectionRef}
      data-testid="story-section"
      className={cn('py-16 md:py-24 bg-[var(--public-primary)]', className)}
    >
      <div className="public-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Story Content */}
          <div
            className={cn(
              'transition-all duration-700',
              sectionVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            )}
          >
            <span
              className="text-[var(--public-accent)] text-sm uppercase tracking-widest font-semibold"
              style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
            >
              {t('public.aboutUs')}
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold text-[var(--public-text-primary)] mt-2 mb-6"
              style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
            >
              {displayTitle.split(' ').map((word, i) => (
                <span key={i}>
                  {i === displayTitle.split(' ').length - 1 ? (
                    <span className="text-[var(--public-accent)]">{word}</span>
                  ) : (
                    word + ' '
                  )}
                </span>
              ))}
            </h2>

            {/* Story paragraphs */}
            <div className="space-y-4">
              {story.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-[var(--public-text-secondary)] leading-relaxed"
                  style={{ fontFamily: 'var(--font-body, Heebo, sans-serif)' }}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Optional image */}
            {backgroundImage && (
              <div className="mt-8 rounded-lg overflow-hidden">
                <img
                  src={backgroundImage}
                  alt="Our restaurant"
                  className="w-full h-64 object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Timeline */}
          <div
            data-testid="story-timeline"
            className={cn(
              'relative transition-all duration-700 delay-200',
              sectionVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            )}
          >
            {/* Timeline line */}
            <div
              className="absolute left-4 md:left-6 top-0 bottom-0 w-0.5 bg-[var(--public-border)]"
              aria-hidden="true"
            />

            {/* Milestones */}
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <TimelineMilestoneItem
                  key={milestone.year}
                  milestone={milestone}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface TimelineMilestoneItemProps {
  milestone: TimelineMilestone
  index: number
}

function TimelineMilestoneItem({ milestone, index }: TimelineMilestoneItemProps) {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.2,
    triggerOnce: true,
  })

  return (
    <div
      ref={ref}
      data-testid="timeline-milestone"
      className={cn(
        'relative pl-12 md:pl-16 transition-all duration-500',
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Year dot */}
      <div
        className={cn(
          'absolute left-0 md:left-2 top-0 w-8 h-8 md:w-10 md:h-10 rounded-full',
          'flex items-center justify-center',
          'bg-[var(--public-accent)] text-white text-xs md:text-sm font-bold',
          'shadow-lg ring-4 ring-[var(--public-primary)]'
        )}
      >
        {milestone.year.slice(-2)}
      </div>

      {/* Content card */}
      <div
        className={cn(
          'p-4 md:p-6 rounded-lg',
          'bg-[var(--public-bg-secondary)] border border-[var(--public-border)]',
          'hover:border-[var(--public-accent)] transition-colors duration-300'
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[var(--public-accent)] font-bold text-sm">
            {milestone.year}
          </span>
        </div>
        <h3
          className="text-lg font-semibold text-[var(--public-text-primary)] mb-2"
          style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
        >
          {milestone.title}
        </h3>
        <p className="text-sm text-[var(--public-text-secondary)]">
          {milestone.description}
        </p>
      </div>
    </div>
  )
}

export default StorySection
