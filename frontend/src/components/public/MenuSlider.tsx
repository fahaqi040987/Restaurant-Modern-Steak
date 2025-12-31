/**
 * T025: MenuSlider component with Embla Carousel
 * Interactive category slider for menu browsing with smooth navigation
 */
import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PublicCategory } from '@/types'

interface MenuSliderProps {
  categories: PublicCategory[]
  selectedCategory: string | null
  onCategoryChange: (categoryId: string | null) => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function MenuSlider({
  categories,
  selectedCategory,
  onCategoryChange,
  isLoading = false,
  disabled = false,
  className,
}: MenuSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    slidesToScroll: 1,
  })

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return

    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    // Check scroll on resize
    const handleResize = () => {
      emblaApi.reInit()
      onSelect()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
      window.removeEventListener('resize', handleResize)
    }
  }, [emblaApi, onSelect])

  // Scroll to selected category when it changes
  useEffect(() => {
    if (!emblaApi || !selectedCategory) return

    const categoryIndex = categories.findIndex((c) => c.id === selectedCategory)
    if (categoryIndex !== -1) {
      // +1 because "All Items" is at index 0
      emblaApi.scrollTo(categoryIndex + 1)
    }
  }, [emblaApi, selectedCategory, categories])

  if (isLoading) {
    return (
      <div
        data-testid="menu-slider"
        aria-label="Menu categories"
        className={cn('relative', className)}
      >
        <div className="flex gap-2 overflow-hidden">
          {/* All Items skeleton */}
          <div
            data-testid="category-skeleton"
            className="h-10 w-24 bg-[var(--public-bg-hover)] rounded-full animate-pulse flex-shrink-0"
          />
          {/* Category skeletons */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              data-testid="category-skeleton"
              className="h-10 w-28 bg-[var(--public-bg-hover)] rounded-full animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      data-testid="menu-slider"
      aria-label="Menu categories"
      role="group"
      className={cn('relative', className)}
    >
      {/* Navigation buttons for desktop */}
      {canScrollPrev && (
        <Button
          data-testid="slider-prev"
          variant="ghost"
          size="icon"
          onClick={scrollPrev}
          disabled={disabled}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-[var(--public-bg-primary)]/90 shadow-md border border-[var(--public-border)] hover:bg-[var(--public-bg-hover)] hidden md:flex"
          aria-label="Scroll to previous categories"
        >
          <ChevronLeft className="h-4 w-4 text-[var(--public-text-primary)]" />
        </Button>
      )}

      {canScrollNext && (
        <Button
          data-testid="slider-next"
          variant="ghost"
          size="icon"
          onClick={scrollNext}
          disabled={disabled}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-[var(--public-bg-primary)]/90 shadow-md border border-[var(--public-border)] hover:bg-[var(--public-bg-hover)] hidden md:flex"
          aria-label="Scroll to next categories"
        >
          <ChevronRight className="h-4 w-4 text-[var(--public-text-primary)]" />
        </Button>
      )}

      {/* Carousel container */}
      <div
        ref={emblaRef}
        className={cn(
          'overflow-hidden',
          canScrollPrev && 'md:ml-10',
          canScrollNext && 'md:mr-10'
        )}
      >
        <div className="flex gap-2">
          {/* All Items button */}
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(null)}
            disabled={disabled}
            aria-pressed={selectedCategory === null}
            className={cn(
              'flex-shrink-0 rounded-full px-5 transition-all duration-200',
              selectedCategory === null
                ? 'bg-[var(--public-accent)] text-white hover:bg-[var(--public-accent)]/90 border-transparent'
                : 'border-[var(--public-border)] text-[var(--public-text-secondary)] hover:bg-[var(--public-bg-hover)] hover:text-[var(--public-text-primary)]'
            )}
          >
            <Utensils className="h-4 w-4 mr-2" />
            All Items
          </Button>

          {/* Category buttons */}
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id

            return (
              <Button
                key={category.id}
                data-testid={`category-button-${category.id}`}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(category.id)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={cn(
                  'flex-shrink-0 rounded-full px-5 transition-all duration-200',
                  isSelected
                    ? 'bg-[var(--public-accent)] text-white hover:bg-[var(--public-accent)]/90 border-transparent'
                    : 'border-[var(--public-border)] text-[var(--public-text-secondary)] hover:bg-[var(--public-bg-hover)] hover:text-[var(--public-text-primary)]'
                )}
                style={
                  !isSelected && category.color
                    ? {
                        borderColor: category.color,
                        color: category.color,
                      }
                    : undefined
                }
              >
                {category.name}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Fade indicators for scroll hint */}
      {canScrollPrev && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--public-bg-primary)] to-transparent pointer-events-none md:hidden" />
      )}
      {canScrollNext && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--public-bg-primary)] to-transparent pointer-events-none md:hidden" />
      )}
    </div>
  )
}

// Re-export for backward compatibility
export default MenuSlider
