/**
 * T027, T073: Menu page route with new Restoran-master design
 * Features: Category slider, menu item cards, search, responsive grid, i18n
 */
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PublicLayout } from '@/components/public/PublicLayout'
import { MenuSlider } from '@/components/public/MenuSlider'
import { MenuItemCard } from '@/components/public/MenuItemCard'
import { apiClient } from '@/api/client'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/site/menu')({
  component: PublicMenuPage,
})

// Custom hook for debouncing
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

function PublicMenuPage() {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Use debounced search value
  const debouncedSearch = useDebounceValue(searchQuery, 300)

  // Animation refs
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation()
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 })

  // Fetch categories
  const {
    data: categories,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ['publicCategories'],
    queryFn: () => apiClient.getPublicCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })

  // Fetch menu items with filters
  const {
    data: menuItems,
    isLoading: isLoadingMenu,
    error: menuError,
  } = useQuery({
    queryKey: ['publicMenu', selectedCategory, debouncedSearch],
    queryFn: () =>
      apiClient.getPublicMenu(
        selectedCategory || undefined,
        debouncedSearch || undefined
      ),
    staleTime: 1000 * 60 * 15, // 15 minutes
  })

  const clearFilters = () => {
    setSelectedCategory(null)
    setSearchQuery('')
  }

  const hasActiveFilters = selectedCategory || searchQuery

  return (
    <PublicLayout>
      {/* Page Header */}
      <section className="pt-28 md:pt-36 pb-12 md:pb-16 bg-[var(--public-bg-secondary)]">
        <div
          ref={headerRef}
          className={cn(
            'public-container text-center transition-all duration-700',
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--public-text-primary)] mb-4"
            style={{ fontFamily: 'var(--public-font-heading)' }}
          >
            {t('public.ourMenu').split(' ').map((word, i, arr) => (
              <span key={i}>
                {i === arr.length - 1 ? (
                  <span className="text-[var(--public-accent)]">{word}</span>
                ) : (
                  word + ' '
                )}
              </span>
            ))}
          </h1>
          <p className="text-[var(--public-text-secondary)] max-w-2xl mx-auto text-lg">
            {t('public.exploreOurMenu')}
          </p>
        </div>
      </section>

      {/* Filters Section - Sticky */}
      <section className="py-6 border-b border-[var(--public-border)] sticky top-16 z-40 bg-[var(--public-bg-primary)]/95 backdrop-blur-md">
        <div className="public-container">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--public-text-muted)]" />
            <Input
              type="search"
              placeholder={t('public.searchMenuItems')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[var(--public-bg-elevated)] border-[var(--public-border)] text-[var(--public-text-primary)] placeholder:text-[var(--public-text-muted)] focus:border-[var(--public-accent)] focus:ring-[var(--public-accent)] rounded-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--public-text-muted)] hover:text-[var(--public-text-primary)] transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Slider */}
          <MenuSlider
            data-testid="menu-slider"
            categories={categories || []}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            isLoading={isLoadingCategories}
          />

          {/* Active Filters indicator */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-[var(--public-text-muted)]">
                {t('public.showingFilteredResults')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-[var(--public-accent)] hover:text-[var(--public-accent)]/80 p-0 h-auto"
              >
                {t('public.clearAll')}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Menu Grid */}
      <section className="py-8 md:py-12 lg:py-16 bg-[var(--public-bg-primary)]">
        <div
          ref={gridRef}
          className={cn(
            'public-container transition-all duration-700',
            gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {menuError ? (
            // Error State
            <div className="text-center py-16">
              <Utensils className="h-16 w-16 text-red-500/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[var(--public-text-primary)] mb-2">
                {t('public.failedToLoadMenu')}
              </h3>
              <p className="text-[var(--public-text-secondary)] mb-4">
                {t('public.pleaseTryAgainLater')}
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="border-[var(--public-accent)] text-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:text-white"
              >
                {t('public.retry')}
              </Button>
            </div>
          ) : isLoadingMenu ? (
            // Loading State - Skeleton Grid
            <div
              data-testid="menu-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="public-card animate-pulse overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-[var(--public-bg-hover)]" />
                  <div className="p-5">
                    <div className="h-6 bg-[var(--public-bg-hover)] rounded mb-2" />
                    <div className="h-4 bg-[var(--public-bg-hover)] rounded w-2/3 mb-2" />
                    <div className="h-4 bg-[var(--public-bg-hover)] rounded w-1/2 mb-3" />
                    <div className="h-6 bg-[var(--public-bg-hover)] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : menuItems && menuItems.length > 0 ? (
            // Menu Items Grid
            <div
              data-testid="menu-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {menuItems.map((item, index) => (
                <div
                  key={item.id}
                  className="transition-all duration-500"
                  style={{
                    transitionDelay: `${index * 50}ms`,
                  }}
                >
                  <MenuItemCard item={item} />
                </div>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="text-center py-16">
              <Utensils className="h-16 w-16 text-[var(--public-text-muted)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[var(--public-text-primary)] mb-2">
                {t('public.noItemsFound')}
              </h3>
              <p className="text-[var(--public-text-secondary)] mb-4">
                {hasActiveFilters
                  ? t('public.tryAdjustingFilters')
                  : t('public.menuBeingUpdated')}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-[var(--public-accent)] text-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:text-white"
                >
                  {t('public.clearFilters')}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      {!menuError && menuItems && menuItems.length > 0 && (
        <section className="py-12 md:py-16 bg-[var(--public-bg-secondary)]">
          <div className="public-container text-center">
            <h2
              className="text-2xl md:text-3xl font-bold text-[var(--public-text-primary)] mb-4"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              {t('public.readyToExperienceMenu')}
            </h2>
            <p className="text-[var(--public-text-secondary)] mb-6 max-w-xl mx-auto">
              {t('public.reserveYourTable')}
            </p>
            <Button
              asChild
              size="lg"
              className="bg-[var(--public-accent)] hover:bg-[var(--public-accent)]/90 text-white rounded-full px-8"
            >
              <a href="/site/reservation">{t('public.bookATable')}</a>
            </Button>
          </div>
        </section>
      )}
    </PublicLayout>
  )
}
