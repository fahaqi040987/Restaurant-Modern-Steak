import { cn } from '@/lib/utils'
import type { OperatingHours } from '@/types'

interface OpenStatusBadgeProps {
  isOpenNow: boolean
  operatingHours?: OperatingHours[]
  className?: string
  showNextOpen?: boolean
}

/**
 * Displays the current open/closed status of the restaurant
 * Optionally shows the next opening time when closed
 */
export function OpenStatusBadge({
  isOpenNow,
  operatingHours,
  className,
  showNextOpen = true,
}: OpenStatusBadgeProps) {
  const getNextOpenTime = (): string | null => {
    if (!operatingHours || operatingHours.length === 0) return null

    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 6 = Saturday
    const currentTime = now.toTimeString().slice(0, 8) // HH:MM:SS

    // Sort hours by day_of_week
    const sortedHours = [...operatingHours].sort(
      (a, b) => a.day_of_week - b.day_of_week
    )

    // Find the next open day
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7
      const dayHours = sortedHours.find((h) => h.day_of_week === checkDay)

      if (dayHours && !dayHours.is_closed) {
        // If it's today, check if we haven't passed opening time yet
        if (i === 0) {
          if (currentTime < dayHours.open_time) {
            return formatOpenTime(dayHours.open_time, 'Today')
          }
        } else {
          const dayName = getDayName(checkDay)
          return formatOpenTime(dayHours.open_time, dayName)
        }
      }
    }

    return null
  }

  const formatOpenTime = (time: string, day: string): string => {
    // Convert HH:MM:SS to readable format
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    const timeStr = minutes === '00' ? `${hour12} ${ampm}` : `${hour12}:${minutes} ${ampm}`
    return `${day} at ${timeStr}`
  }

  const getDayName = (dayIndex: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayIndex]
  }

  const nextOpen = !isOpenNow && showNextOpen ? getNextOpenTime() : null

  return (
    <div className={cn('inline-flex flex-col items-start gap-1', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
          isOpenNow
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        )}
        role="status"
        aria-live="polite"
      >
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            isOpenNow ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          )}
          aria-hidden="true"
        />
        {isOpenNow ? 'Open Now' : 'Closed'}
      </span>

      {nextOpen && (
        <span className="text-xs text-[var(--public-text-secondary)] pl-1">
          Opens {nextOpen}
        </span>
      )}
    </div>
  )
}

export default OpenStatusBadge
