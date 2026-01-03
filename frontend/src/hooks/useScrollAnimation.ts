import { useRef, useState, useEffect, type RefObject } from 'react'

export interface ScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export interface ScrollAnimationResult<T extends HTMLElement = HTMLDivElement> {
  ref: RefObject<T>
  isVisible: boolean
}

/**
 * Custom hook for AOS-like scroll animations using Intersection Observer.
 * Provides a ref to attach to the element and a boolean indicating visibility.
 *
 * @param options - Configuration options
 * @param options.threshold - Percentage of element visible before triggering (0-1, default: 0.1)
 * @param options.rootMargin - Margin around the root (default: '0px')
 * @param options.triggerOnce - If true, animation triggers only once (default: true)
 *
 * @example
 * ```tsx
 * function AnimatedSection() {
 *   const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 })
 *   return (
 *     <div
 *       ref={ref}
 *       className={cn(
 *         'transition-all duration-700 ease-out',
 *         isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
 *       )}
 *     >
 *       Content
 *     </div>
 *   )
 * }
 * ```
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: ScrollAnimationOptions = {}
): ScrollAnimationResult<T> {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // If already triggered and triggerOnce is true, don't observe again
    if (triggerOnce && hasTriggered) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            setHasTriggered(true)
            observer.disconnect()
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce, hasTriggered])

  return { ref, isVisible }
}

/**
 * Predefined animation class combinations for common AOS effects.
 * Use with cn() utility from @/lib/utils
 */
export const scrollAnimationClasses = {
  // Fade animations
  'fade-up': {
    base: 'transition-all duration-700 ease-out',
    hidden: 'opacity-0 translate-y-8',
    visible: 'opacity-100 translate-y-0',
  },
  'fade-down': {
    base: 'transition-all duration-700 ease-out',
    hidden: 'opacity-0 -translate-y-8',
    visible: 'opacity-100 translate-y-0',
  },
  'fade-left': {
    base: 'transition-all duration-700 ease-out',
    hidden: 'opacity-0 translate-x-8',
    visible: 'opacity-100 translate-x-0',
  },
  'fade-right': {
    base: 'transition-all duration-700 ease-out',
    hidden: 'opacity-0 -translate-x-8',
    visible: 'opacity-100 translate-x-0',
  },
  // Zoom animations
  'zoom-in': {
    base: 'transition-all duration-700 ease-out',
    hidden: 'opacity-0 scale-95',
    visible: 'opacity-100 scale-100',
  },
  'zoom-out': {
    base: 'transition-all duration-700 ease-out',
    hidden: 'opacity-0 scale-105',
    visible: 'opacity-100 scale-100',
  },
  // Simple fade
  fade: {
    base: 'transition-opacity duration-700 ease-out',
    hidden: 'opacity-0',
    visible: 'opacity-100',
  },
} as const

export type ScrollAnimationType = keyof typeof scrollAnimationClasses

/**
 * Helper function to get animation classes based on visibility state
 */
export function getScrollAnimationClasses(
  type: ScrollAnimationType,
  isVisible: boolean
): string {
  const animation = scrollAnimationClasses[type]
  return `${animation.base} ${isVisible ? animation.visible : animation.hidden}`
}

export default useScrollAnimation
