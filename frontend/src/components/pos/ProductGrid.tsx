import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CardSkeleton } from '@/components/ui/loading-skeletons'
import { Plus, Clock, Loader2, Package } from 'lucide-react'
import { formatCurrency, getPreparationTimeDisplay } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductGridProps {
  products: Product[]
  onProductSelect: (product: Product) => void
  isLoading: boolean
}

export function ProductGrid({ products, onProductSelect, isLoading }: ProductGridProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="p-6">
        <CardSkeleton count={10} />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('pos.noProductsFound')}</h3>
          <p className="text-gray-500">
            {t('pos.noProductsFoundDesc')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <Card 
            key={product.id} 
            className={`overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
              !product.is_available ? 'opacity-50' : ''
            }`}
          >
            <CardContent className="p-4">
              {/* Product Image Placeholder */}
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center relative">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-4xl font-bold text-gray-400">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Category Color Badge */}
                {product.category && (
                  <div 
                    className="absolute top-2 left-2 w-3 h-3 rounded-full"
                    style={{ backgroundColor: product.category.color || '#6B7280' }}
                  />
                )}

                {/* Unavailable Overlay */}
                {!product.is_available && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{t('pos.outOfStock')}</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                <div>
                  <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Price and Prep Time */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                  {product.preparation_time > 0 && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getPreparationTimeDisplay(product.preparation_time)}
                    </Badge>
                  )}
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={() => onProductSelect(product)}
                  disabled={!product.is_available}
                  className="w-full text-sm"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('pos.addToCart')}
                </Button>
              </div>

              {/* Product Meta Info */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {product.sku && (
                    <span>{t('pos.sku')}: {product.sku}</span>
                  )}
                  {product.category && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        borderColor: product.category.color || '#6B7280',
                        color: product.category.color || '#6B7280'
                      }}
                    >
                      {product.category.name}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

