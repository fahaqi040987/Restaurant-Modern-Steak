/**
 * T026: MenuItemCard component
 * Displays individual menu item with image, name, description, price in IDR format
 * Opens a detail dialog when clicked (card, image, or "View Details" button)
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Utensils } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { PublicMenuItem } from '@/types'

interface MenuItemCardProps {
  item: PublicMenuItem
  className?: string
}

/**
 * Format price in Indonesian Rupiah (IDR)
 */
function formatPrice(price: number): string {
  const formatted = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
    return `Rp.${formatted},-`;
}

/**
 * Build the full image URL from a relative path
 * Handles /uploads and /images paths by prefixing with backend URL
 */
function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  // If it's already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // If it's a relative URL starting with /uploads or /images, prepend the API base
  if (url.startsWith('/uploads') || url.startsWith('/images')) {
    const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8080/api/v1'
    // Remove /api/v1 from the API URL to get the base URL
    const baseUrl = apiUrl.replace('/api/v1', '')
    return `${baseUrl}${url}`
  }
  return url
}

export function MenuItemCard({ item, className }: MenuItemCardProps) {
  const { t } = useTranslation()
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const detailImageUrl = getImageUrl(item.image_url)

  return (
    <>
      <Card
        data-testid="menu-item-card"
        className={cn(
          'public-card group overflow-hidden cursor-pointer transition-[border-color,box-shadow] duration-300 hover:border-[var(--public-accent)] hover:shadow-lg',
          className
        )}
        onClick={() => setIsDetailsOpen(true)}
      >
        {/* Image container */}
        <div className="aspect-[4/3] bg-[var(--public-bg-hover)] relative overflow-hidden">
          {item.image_url ? (
            <img
              src={getImageUrl(item.image_url) || ''}
              alt={item.name}
              width={400}
              height={300}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                // Hide broken image and show placeholder
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const placeholder = target.nextElementSibling as HTMLElement
                if (placeholder) {
                  placeholder.style.display = 'flex'
                }
              }}
            />
          ) : null}

          {/* Placeholder - shown when no image or image fails to load */}
          <div
            data-testid="menu-item-placeholder"
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-[var(--public-bg-hover)]',
              item.image_url ? 'hidden' : 'flex'
            )}
          >
            <Utensils className="h-16 w-16 text-[var(--public-text-muted)]" aria-hidden="true" />
          </div>

          {/* Category badge */}
          <div className="absolute top-3 right-3">
            <span
              data-testid="menu-item-category"
              className="text-xs px-3 py-1 bg-[var(--public-primary)]/90 backdrop-blur-sm text-[var(--public-accent)] rounded-full font-medium shadow-sm"
            >
              {item.category_name}
            </span>
          </div>

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
        </div>

        {/* Content */}
        <CardContent className="p-5">
          <h3
            data-testid="menu-item-name"
            className="font-semibold text-lg text-[var(--public-text-primary)] mb-2 line-clamp-1"
            style={{ fontFamily: 'var(--public-font-heading)' }}
          >
            {item.name}
          </h3>

          {item.description && (
            <p className="text-sm text-[var(--public-text-secondary)] mb-3 line-clamp-2 min-h-[2.5rem]">
              {item.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto">
            <p
              data-testid="menu-item-price"
              className="text-xl text-[var(--public-accent)] font-bold"
            >
              {formatPrice(item.price)}
            </p>

            {/* View details trigger - opens the detail dialog */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="menu-item-details-button"
              onClick={(e) => {
                e.stopPropagation()
                setIsDetailsOpen(true)
              }}
              className="border-[var(--public-accent)] text-[var(--public-accent)] hover:bg-[var(--public-accent)] hover:text-white"
            >
              {t('public.viewDetails')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Item detail dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent
          data-testid="menu-item-detail-dialog"
          className="max-w-md bg-[var(--public-bg-elevated)] border-[var(--public-border)]"
        >
          <DialogHeader>
            <DialogTitle
              data-testid="menu-item-detail-name"
              className="text-2xl text-[var(--public-text-primary)] text-left"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              {item.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('public.viewDetails')} - {item.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {detailImageUrl && (
              <img
                src={detailImageUrl}
                alt={item.name}
                width={600}
                height={400}
                className="w-full aspect-[4/3] object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs px-3 py-1 bg-[var(--public-accent)]/10 text-[var(--public-accent)] rounded-full font-medium">
                {item.category_name}
              </span>
              <p
                data-testid="menu-item-detail-price"
                className="text-2xl text-[var(--public-accent)] font-bold"
              >
                {formatPrice(item.price)}
              </p>
            </div>

            <p className="text-sm text-[var(--public-text-secondary)] leading-relaxed">
              {item.description || t('public.menuBeingUpdated')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Re-export for backward compatibility
export default MenuItemCard
