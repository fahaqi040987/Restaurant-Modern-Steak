import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo, useCallback } from 'react'
import { Search, Utensils, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PublicLayout } from '@/components/public/PublicLayout'
import { apiClient } from '@/api/client'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/site/menu')({
  component: PublicMenuPage,
})

// Custom hook for debouncing (if not exists, we'll implement inline)
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useMemo(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

function PublicMenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounceValue(searchQuery, 300)

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['publicCategories'],
    queryFn: () => apiClient.getPublicCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })

  // Fetch menu items with filters
  const { data: menuItems, isLoading: isLoadingMenu } = useQuery({
    queryKey: ['publicMenu', selectedCategory, debouncedSearch],
    queryFn: () =>
      apiClient.getPublicMenu(
        selectedCategory || undefined,
        debouncedSearch || undefined
      ),
    staleTime: 1000 * 60 * 15, // 15 minutes
  })

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const clearFilters = () => {
    setSelectedCategory(null)
    setSearchQuery('')
  }

  const hasActiveFilters = selectedCategory || searchQuery

  return (
    <PublicLayout>
      {/* Page Header */}
      <section className="py-12 md:py-16 bg-[var(--public-bg-secondary)]">
        <div className="public-container text-center">
          <h1
            className="text-4xl md:text-5xl font-bold text-[var(--public-text-primary)] mb-4"
            style={{ fontFamily: 'var(--public-font-heading)' }}
          >
            Our <span className="text-[var(--public-secondary)]">Menu</span>
          </h1>
          <p className="text-[var(--public-text-secondary)] max-w-2xl mx-auto">
            Explore our selection of premium cuts, signature dishes, and culinary creations
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-6 border-b border-[var(--public-border)] sticky top-16 z-40 bg-[var(--public-bg-primary)]/95 backdrop-blur">
        <div className="public-container">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--public-text-muted)]" />
            <Input
              type="search"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[var(--public-bg-elevated)] border-[var(--public-border)] text-[var(--public-text-primary)] placeholder:text-[var(--public-text-muted)] focus:border-[var(--public-secondary)] focus:ring-[var(--public-secondary)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--public-text-muted)] hover:text-[var(--public-text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'flex-shrink-0',
                selectedCategory === null
                  ? 'bg-[var(--public-secondary)] text-[var(--public-text-on-gold)] hover:bg-[var(--public-secondary-light)]'
                  : 'border-[var(--public-border)] text-[var(--public-text-secondary)] hover:bg-[var(--public-bg-hover)] hover:text-[var(--public-text-primary)]'
              )}
            >
              All Items
            </Button>
            {isLoadingCategories ? (
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-24 bg-[var(--public-bg-hover)] rounded animate-pulse flex-shrink-0"
                />
              ))
            ) : (
              categories?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'flex-shrink-0',
                    selectedCategory === category.id
                      ? 'bg-[var(--public-secondary)] text-[var(--public-text-on-gold)] hover:bg-[var(--public-secondary-light)]'
                      : 'border-[var(--public-border)] text-[var(--public-text-secondary)] hover:bg-[var(--public-bg-hover)] hover:text-[var(--public-text-primary)]'
                  )}
                  style={
                    category.color && selectedCategory !== category.id
                      ? { borderColor: category.color, color: category.color }
                      : {}
                  }
                >
                  {category.name}
                </Button>
              ))
            )}
          </div>

          {/* Active Filters indicator */}
          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-[var(--public-text-muted)]">
                Showing filtered results
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-[var(--public-secondary)] hover:text-[var(--public-secondary-light)] p-0 h-auto"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Menu Grid */}
      <section className="py-8 md:py-12">
        <div className="public-container">
          {isLoadingMenu ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="public-card animate-pulse">
                  <div className="aspect-[4/3] bg-[var(--public-bg-hover)]" />
                  <CardContent className="p-4">
                    <div className="h-5 bg-[var(--public-bg-hover)] rounded mb-2" />
                    <div className="h-4 bg-[var(--public-bg-hover)] rounded w-2/3 mb-2" />
                    <div className="h-4 bg-[var(--public-bg-hover)] rounded w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : menuItems && menuItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <Card
                  key={item.id}
                  className="public-card group overflow-hidden transition-all duration-300 hover:border-[var(--public-secondary)]"
                >
                  <div className="aspect-[4/3] bg-[var(--public-bg-hover)] relative overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="h-16 w-16 text-[var(--public-text-muted)]" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="text-xs px-2 py-1 bg-[var(--public-primary)]/90 text-[var(--public-secondary)] rounded-full">
                        {item.category_name}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3
                      className="font-semibold text-lg text-[var(--public-text-primary)] mb-2"
                      style={{ fontFamily: 'var(--public-font-heading)' }}
                    >
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-[var(--public-text-secondary)] mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xl text-[var(--public-secondary)] font-bold">
                      {formatPrice(item.price)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Utensils className="h-16 w-16 text-[var(--public-text-muted)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[var(--public-text-primary)] mb-2">
                No items found
              </h3>
              <p className="text-[var(--public-text-secondary)] mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your search or filter criteria'
                  : 'Our menu is being updated. Please check back soon!'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-[var(--public-secondary)] text-[var(--public-secondary)] hover:bg-[var(--public-secondary)] hover:text-[var(--public-text-on-gold)]"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  )
}
