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
      role="alert"
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
            className="w-full h-full object-cover opacity-40"
            poster="/assets/restoran/images/loader-poster.jpg"
            onError={() => {
              console.warn('Video failed to load, falling back to CSS animation')
              // Optionally trigger fallback to CSS mode
            }}
          >
            <source src="/assets/restoran/videos/steak-loader.mp4" type="video/mp4" />
            <source src="/assets/restoran/videos/steak-loader.webm" type="video/webm" />
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
        {/* Animated Utensils - Hidden in video mode */}
        {!useVideo && (
          <div className="relative flex items-center justify-center mb-8">
            {/* Enhanced Fork with flame effect */}
            <div className="relative">
              {/* Flame under fork */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <div className="flame-effect">
                  <div className="flame flame-main"></div>
                  <div className="flame flame-secondary"></div>
                </div>
              </div>
              
              <svg
                className="w-16 h-16 text-[var(--public-accent)] loader-utensils-animation"
                style={{ animationDelay: '0s', transformOrigin: 'center bottom' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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
            </div>

            {/* Enhanced Knife with flame effect */}
            <div className="relative ml-6">
              {/* Flame under knife */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <div className="flame-effect" style={{ animationDelay: '0.3s' }}>
                  <div className="flame flame-main"></div>
                  <div className="flame flame-secondary"></div>
                </div>
              </div>
              
              <svg
                className="w-16 h-16 text-[var(--public-accent)] loader-utensils-animation"
                style={{ animationDelay: '0.2s', transformOrigin: 'center bottom' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {/* Knife blade */}
                <path d="M18 2C18 2 22 6 22 10C22 14 18 15 18 15V22" />
                <path d="M18 15H17" />
              </svg>
            </div>

            {/* Sizzling steak icon in center */}
            <div className="relative mx-4">
              <div className="steak-icon-loader">
                <svg
                  className="w-20 h-20 text-orange-500 loader-steak-animation"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  {/* Steak shape */}
                  <ellipse cx="12" cy="12" rx="10" ry="6" />
                  {/* Sizzle lines */}
                  <path d="M6 8 Q8 6 10 8" stroke="#FF6B35" strokeWidth="1.5" fill="none" opacity="0.8"/>
                  <path d="M14 8 Q16 6 18 8" stroke="#FF6B35" strokeWidth="1.5" fill="none" opacity="0.8"/>
                  <path d="M8 16 Q10 18 12 16" stroke="#FF6B35" strokeWidth="1.5" fill="none" opacity="0.8"/>
                </svg>
                {/* Steam/sizzle effect */}
                <div className="steam-effect">
                  <div className="steam steam-1"></div>
                  <div className="steam steam-2"></div>
                  <div className="steam steam-3"></div>
                </div>
              </div>
            </div>
          </div>
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
