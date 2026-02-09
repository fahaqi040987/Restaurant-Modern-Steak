import { useState, useEffect } from 'react'
import { Player } from '@lottiefiles/react-lottie-player'
import { cn } from '@/lib/utils'

interface LottieLoaderProps {
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
 * Lottie animation page loader using Food Prepared animation from LottieFiles.
 * Shows animated food preparation with loading dots on initial page load.
 *
 * @example
 * ```tsx
 * // In a page component
 * const [isLoading, setIsLoading] = useState(true)
 *
 * return (
 *   <>
 *     <LottieLoader show={isLoading} onComplete={() => setIsLoading(false)} />
 *     <main className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity'}>
 *       Page content
 *     </main>
 *   </>
 * )
 * ```
 */
export function LottieLoader({
  duration = 2500,
  onComplete,
  show = true,
  className,
}: LottieLoaderProps) {
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
      {/* Lottie Animation */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Lottie Player */}
        <Player
          autoplay
          loop
          src="https://lottie.host/6633f587-e14a-4876-a738-b67b035b05a7/8HM8Fm4vFn.lottie"
          style={{ height: '300px', width: '300px' }}
          className="mb-8"
        />

        {/* Restaurant Name */}
        <h1
          className={cn(
            'font-accent mb-6 text-center',
            'text-3xl md:text-5xl lg:text-6xl',
            'text-[var(--public-accent)] drop-shadow-lg',
            'loader-text-animation'
          )}
          style={{ 
            fontFamily: 'var(--font-accent, Pacifico, cursive)',
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)'
          }}
        >
          Steak Kenangan
        </h1>

        {/* Tagline */}
        <p className="text-white/90 text-lg md:text-xl mb-6 text-center max-w-2xl px-4">
          Premium steaks crafted with passion
        </p>

        {/* Loading Dots */}
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-[var(--public-accent)] rounded-full loader-dot" aria-hidden="true" />
          <span className="w-3 h-3 bg-[var(--public-accent)] rounded-full loader-dot" aria-hidden="true" style={{ animationDelay: '0.2s' }} />
          <span className="w-3 h-3 bg-[var(--public-accent)] rounded-full loader-dot" aria-hidden="true" style={{ animationDelay: '0.4s' }} />
        </div>

        {/* Loading Text */}
        <p className="mt-6 text-white/80 text-sm md:text-base">
          Preparing your experience...
        </p>
      </div>

      {/* CSS Animation Keyframes for Loading Dots */}
      <style>{`
        @keyframes loaderDot {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .loader-dot {
          animation: loaderDot 1.4s infinite ease-in-out both;
        }
        @keyframes loaderText {
          0%, 100% {
            opacity: 1;
            transform: translateY(0);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-2px);
          }
        }
        .loader-text-animation {
          animation: loaderText 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default LottieLoader
