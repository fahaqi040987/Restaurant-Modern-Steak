import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface LoaderProps {
  /** Duration in milliseconds before loader hides (default: 2500ms) */
  duration?: number
  /** Called when loader animation completes */
  onComplete?: () => void
  /** Whether to show the loader */
  show?: boolean
  /** Custom className for the loader container */
  className?: string
}

/**
 * Animated page loader inspired by Restoran-master design.
 * Shows animated utensils (fork/knife) with loading dots on initial page load.
 *
 * @example
 * ```tsx
 * // In a page component
 * const [isLoading, setIsLoading] = useState(true)
 *
 * return (
 *   <>
 *     <Loader show={isLoading} onComplete={() => setIsLoading(false)} />
 *     <main className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity'}>
 *       Page content
 *     </main>
 *   </>
 * )
 * ```
 */
export function Loader({
  duration = 2500,
  onComplete,
  show = true,
  className,
}: LoaderProps) {
  const [isVisible, setIsVisible] = useState(show)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (!show) {
      setIsVisible(false)
      return
    }

    setIsVisible(true)
    setIsFading(false)

    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, duration - 500) // Start fade 500ms before completion

    const completeTimer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, duration)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [show, duration, onComplete])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center',
        'bg-[var(--public-primary)] transition-opacity duration-500',
        isFading ? 'opacity-0' : 'opacity-100',
        className
      )}
      role="alert"
      aria-busy="true"
      aria-label="Loading page content"
    >
      {/* Animated Utensils */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Fork */}
        <svg
          className="w-12 h-12 text-[var(--public-accent)] loader-utensils-animation"
          style={{ animationDelay: '0s', transformOrigin: 'center bottom' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Fork prongs */}
          <path d="M6 2v6c0 1.5 0.5 3 2 3V22" />
          <path d="M4 2v4" />
          <path d="M8 2v4" />
          <path d="M10 2v4" />
        </svg>

        {/* Knife */}
        <svg
          className="w-12 h-12 text-[var(--public-accent)] loader-utensils-animation ml-4"
          style={{ animationDelay: '0.2s', transformOrigin: 'center bottom' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Knife blade */}
          <path d="M18 2C18 2 22 6 22 10C22 14 18 15 18 15V22" />
          <path d="M18 15H17" />
        </svg>
      </div>

      {/* Restaurant Name */}
      <h1
        className="font-accent text-3xl md:text-4xl text-[var(--public-accent)] mb-6"
        style={{ fontFamily: 'var(--font-accent, Pacifico, cursive)' }}
      >
        Steak Kenangan
      </h1>

      {/* Loading Dots */}
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 bg-[var(--public-accent)] rounded-full loader-dot"
          aria-hidden="true"
        />
        <span
          className="w-2 h-2 bg-[var(--public-accent)] rounded-full loader-dot"
          aria-hidden="true"
        />
        <span
          className="w-2 h-2 bg-[var(--public-accent)] rounded-full loader-dot"
          aria-hidden="true"
        />
      </div>

      {/* Loading Text */}
      <p className="mt-4 text-sm text-[var(--public-text-secondary)]">
        Preparing your experience...
      </p>
    </div>
  )
}

export default Loader
