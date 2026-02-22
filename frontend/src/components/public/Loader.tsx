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
  /** Use video/GIF background instead of CSS animation */
  useVideo?: boolean
}

/**
 * Animated page loader inspired by Restoran-master design.
 * Shows animated utensils (fork/knife) with loading dots on initial page load.
 *
 * ARIA Attributes:
 * - role="status": Indicates a status message (non-interruptive)
 * - aria-live="polite": Announces changes politely without interrupting
 * - aria-busy="true": Indicates the region is being updated
 * - aria-label="Loading page content": Describes the loading state
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
  useVideo = false,
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
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden',
        'bg-gradient-to-br from-black via-gray-900 to-black transition-opacity duration-500',
        isFading ? 'opacity-0' : 'opacity-100',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading page content"
    >
      {/* Video/GIF Background */}
      {useVideo ? (
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            className="w-full h-full object-cover opacity-60"
            poster="/assets/restoran/loader/poster.jpg"
            onError={() => {
              console.warn('Video failed to load, falling back to CSS animation')
              // Optionally trigger fallback to CSS mode
            }}
          >
            <source src="/assets/restoran/loader/Food Carousel.webm" type="video/webm" />
            {/* Fallback to GIF if video not supported */}
            <img
              src="/assets/restoran/images/loader-fallback.gif"
              alt="Loading animation"
              className="w-full h-full object-cover"
            />
          </video>
          {/* Dark overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </div>
      ) : null}

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Pan and Egg Cooking Animation - Hidden in video mode */}
        {!useVideo && (
          <span className="loader-pan mb-8"></span>
        )}

        {/* Restaurant Name */}
        <h1
          className={cn(
            'font-accent mb-6 text-center',
            'text-3xl md:text-5xl lg:text-6xl',
            'text-[var(--public-accent)] drop-shadow-lg',
            'loader-text-animation',
            useVideo && 'text-white'
          )}
          style={{ 
            fontFamily: 'var(--font-accent, Pacifico, cursive)',
            textShadow: useVideo ? '2px 2px 8px rgba(0,0,0,0.8)' : 'none'
          }}
        >
          Steak Kenangan
        </h1>

        {/* Tagline in video mode */}
        {useVideo && (
          <p className="text-white/90 text-lg md:text-xl mb-6 text-center max-w-2xl px-4">
            Premium steaks crafted with passion
          </p>
        )}

        {/* Loading Dots */}
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-[var(--public-accent)] rounded-full loader-dot" aria-hidden="true" />
          <span className="w-3 h-3 bg-[var(--public-accent)] rounded-full loader-dot" aria-hidden="true" style={{ animationDelay: '0.2s' }} />
          <span className="w-3 h-3 bg-[var(--public-accent)] rounded-full loader-dot" aria-hidden="true" style={{ animationDelay: '0.4s' }} />
        </div>

        {/* Loading Text */}
        <p className={cn(
          'mt-6 text-sm md:text-base',
          useVideo ? 'text-white/80' : 'text-[var(--public-text-secondary)]'
        )}>
          Preparing your experience...
        </p>
      </div>
    </div>
  )
}

export default Loader
