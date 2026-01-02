import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { Users, Utensils, Award, Calendar } from 'lucide-react'

interface StatItem {
  icon?: React.ElementType
  value: number
  suffix?: string
  label?: string
  labelKey?: string
}

interface CounterStatsProps {
  /** Stats to display */
  stats?: StatItem[]
  /** Section title */
  title?: string
  /** Animation duration in ms */
  animationDuration?: number
  /** Custom className */
  className?: string
}

const defaultStats: StatItem[] = [
  {
    icon: Users,
    value: 50000,
    suffix: '+',
    labelKey: 'public.happyCustomers',
  },
  {
    icon: Utensils,
    value: 100,
    suffix: '+',
    labelKey: 'public.menuItems',
  },
  {
    icon: Award,
    value: 15,
    suffix: '',
    labelKey: 'public.awardsWon',
  },
  {
    icon: Calendar,
    value: 9,
    suffix: '',
    labelKey: 'public.yearsOfExcellence',
  },
]

/**
 * Animated counter statistics component.
 * Numbers animate from 0 to target value when scrolled into view.
 *
 * @example
 * ```tsx
 * <CounterStats
 *   stats={customStats}
 *   animationDuration={2000}
 * />
 * ```
 */
export function CounterStats({
  stats = defaultStats,
  title,
  animationDuration = 2000,
  className,
}: CounterStatsProps) {
  const { ref: sectionRef, isVisible } = useScrollAnimation({
    threshold: 0.3,
    triggerOnce: true,
  })

  return (
    <section
      ref={sectionRef}
      data-testid="counter-stats"
      className={cn(
        'py-16 md:py-20 bg-[var(--public-accent)]',
        className
      )}
    >
      <div className="public-container">
        {title && (
          <h2
            className="text-2xl md:text-3xl font-bold text-white text-center mb-12"
            style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
          >
            {title}
          </h2>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <StatItemComponent
              key={stat.label}
              stat={stat}
              index={index}
              isVisible={isVisible}
              animationDuration={animationDuration}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface StatItemComponentProps {
  stat: StatItem
  index: number
  isVisible: boolean
  animationDuration: number
}

function StatItemComponent({
  stat,
  index,
  isVisible,
  animationDuration,
}: StatItemComponentProps) {
  const { t } = useTranslation()
  const [count, setCount] = useState(0)
  const countRef = useRef<number>(0)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isVisible) {
      setCount(0)
      countRef.current = 0
      return
    }

    const startTime = Date.now()
    const endValue = stat.value

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.floor(easeOut * endValue)

      if (currentValue !== countRef.current) {
        countRef.current = currentValue
        setCount(currentValue)
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setCount(endValue)
      }
    }

    // Add delay based on index for staggered animation
    const delay = index * 200
    const timeoutId = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isVisible, stat.value, animationDuration, index])

  const Icon = stat.icon

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return new Intl.NumberFormat('id-ID').format(num)
    }
    return num.toString()
  }

  return (
    <div
      data-testid="stat-item"
      className={cn(
        'text-center transition-all duration-500',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Icon */}
      {Icon && (
        <div
          className={cn(
            'w-16 h-16 mx-auto mb-4 rounded-full',
            'bg-white/20 flex items-center justify-center',
            'transition-transform duration-300 hover:scale-110'
          )}
        >
          <Icon className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
      )}

      {/* Counter Number */}
      <div
        data-testid="stat-number"
        className="text-4xl md:text-5xl font-bold text-white mb-2"
        style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
      >
        {formatNumber(count)}
        {stat.suffix && <span className="text-white/80">{stat.suffix}</span>}
      </div>

      {/* Label */}
      <p
        data-testid="stat-label"
        className="text-white/80 text-sm md:text-base"
        style={{ fontFamily: 'var(--font-body, Heebo, sans-serif)' }}
      >
        {stat.labelKey ? t(stat.labelKey) : stat.label}
      </p>
    </div>
  )
}

/**
 * Alternative layout: Horizontal stats bar
 */
interface HorizontalStatsProps {
  stats?: StatItem[]
  className?: string
}

export function HorizontalStats({
  stats = defaultStats.slice(0, 3),
  className,
}: HorizontalStatsProps) {
  const { t } = useTranslation()
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.3,
    triggerOnce: true,
  })

  return (
    <div
      ref={ref}
      data-testid="horizontal-stats"
      className={cn(
        'py-8 bg-[var(--public-bg-secondary)] border-y border-[var(--public-border)]',
        className
      )}
    >
      <div className="public-container">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                'text-center transition-all duration-500',
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div
                className="text-3xl md:text-4xl font-bold text-[var(--public-accent)] mb-1"
                style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
              >
                {stat.value.toLocaleString('id-ID')}
                {stat.suffix}
              </div>
              <p className="text-sm text-[var(--public-text-secondary)]">
                {stat.labelKey ? t(stat.labelKey) : stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CounterStats
