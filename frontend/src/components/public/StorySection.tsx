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
  'Steak Kenangan berawal dari sebuah dapur sederhana di Belitung, tempat di mana rasa, kebersamaan, dan kenangan pertama kali disatukan. Kami ingin menghadirkan steak rumahan yang bukan hanya lezat dan terjangkau, tetapi juga mampu menemani momen-momen kecil bersama keluarga dan orang terdekat.',
  'Dari sana, langkah kami perlahan meluas hingga ke Pulau Jawa. Kehadiran Steak Kenangan di Depok menjadi titik di mana cerita kami mulai dikenal lebih banyak orang—mahasiswa, keluarga, hingga mereka yang mencari tempat makan nyaman dengan rasa yang konsisten. Perjalanan itu berlanjut ke Cibitung, Bekasi, mempertemukan kami dengan pelanggan baru dan semakin menguatkan ikatan yang telah terbangun.',
  'Cerita kami kemudian sampai ke Yogyakarta, sebuah kota penuh budaya dan kenangan, tempat Steak Kenangan membawa cita rasa rumahan ke tengah hiruk pikuk destinasi wisata. Dalam perjalanan ini, kami juga belajar bahwa bertumbuh berarti berani menata ulang langkah, memilih lokasi yang lebih tepat, dan kembali hadir lebih dekat dengan pelanggan yang telah setia.',
  'Hari ini, Steak Kenangan bukan sekadar tentang steak di atas piring, tetapi tentang cerita di setiap meja, tawa yang dibagi, dan kenangan yang terus hidup di setiap kunjungan. Karena bagi kami, makanan terbaik adalah yang selalu mengingatkan kita untuk pulang.'
]

const defaultMilestones: TimelineMilestone[] = [
  {
    year: '2021',
    title: 'Lahirnya Pertama Kali di Belitung',
    description: 'Steak Kenangan resmi berdiri di Belitung pada tahun 2021. Cabang pertama ini menjadi fondasi berkembangnya brand dengan konsep steak rumahan yang lezat, affordable, dan ramah keluarga.',
  },
  {
    year: '2022',
    title: 'Ekspansi ke Pulau Jawa (Depok – Kukusan)',
    description: 'Tahun 2022, Steak Kenangan melakukan ekspansi pertama ke Jawa dengan membuka cabang di Depok, Kukusan. Kehadiran cabang ini memperkuat brand dan mulai dikenal di kalangan mahasiswa serta keluarga diluar Belitung.',
  },
  {
    year: '2023',
    title: 'Buka Cabang di Cibitung, Bekasi',
    description: 'Pada tahun 2023, Steak Kenangan terus berkembang dan membuka cabang di Cibitung, Bekasi. Cabang ini menjadi pusat pertumbuhan pelanggan di area Bekasi dan sekitarnya.',
  },
  {
    year: '2024',
    title: 'Buka Cabang di Jogjakarta',
    description: 'Pada akhir Tahun 2024 tepatnya pada Desember 2024 Steak Kenangan kembali melakukan ekspansi lebih jauh lagi yakni membuka cabang di Kota Destinasi Pariwisata Nasional Jogjakarta.',
  },
  {
    year: '2025',
    title: 'Reopening & Pengembangan Baru',
    description: 'Cabang Depok Tanah Baru resmi dibuka kembali sebagai bentuk ekspansi dan komitmen menghadirkan pengalaman kuliner yang lebih dekat dengan pelanggan. Sementara itu, cabang Kukusan Depok ditutup pada tahun 2024 karena strategi penyesuaian lokasi dan pengembangan usaha.',
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
