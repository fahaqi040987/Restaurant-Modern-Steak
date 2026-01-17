/**
 * T080: OrderStatus Component
 * Component for tracking order status with real-time updates
 */
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, CheckCircle, Loader2, ChefHat, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus as OrderStatusType } from '@/types'

interface OrderStatusProps {
  /** Order ID to track */
  orderId: string
  /** Callback when order is ready */
  onOrderReady?: (order: Order) => void
  /** Custom class name */
  className?: string
  /** Enable auto-refresh (polling) */
  autoRefresh?: boolean
  /** Refresh interval in milliseconds */
  refreshInterval?: number
}

const statusSteps: Array<{
  status: OrderStatusType
  label: string
  icon: typeof Clock
  description: string
  color: string
}> = [
  {
    status: 'pending',
    label: 'Pesanan Diterima',
    icon: Clock,
    description: 'Pesanan Anda sedang diproses',
    color: 'text-yellow-500',
  },
  {
    status: 'preparing',
    label: 'Sedang Dimasak',
    icon: ChefHat,
    description: 'Chef sedang menyiapkan pesanan Anda',
    color: 'text-blue-500',
  },
  {
    status: 'ready',
    label: 'Siap Disajikan',
    icon: CheckCircle,
    description: 'Pesanan siap! Silakan ambil di counter',
    color: 'text-green-500',
  },
]

/**
 * Order status tracking component with visual progress indicator.
 * Supports auto-refresh via polling to get real-time updates.
 *
 * @example
 * ```tsx
 * <OrderStatus
 *   orderId="order-123"
 *   autoRefresh={true}
 *   onOrderReady={(order) => console.log('Order ready:', order)}
 * />
 * ```
 */
export function OrderStatus({
  orderId,
  onOrderReady,
  className,
  autoRefresh = true,
  refreshInterval = 5000,
}: OrderStatusProps) {
  const [previousStatus, setPreviousStatus] = useState<OrderStatusType | null>(null)

  // Fetch order status
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order-status', orderId],
    queryFn: async () => {
      // In a real implementation, this would fetch the specific order
      // For now, we'll use a placeholder endpoint
      const response = await fetch(`/api/v1/customer/orders/${orderId}`)
      if (!response.ok) throw new Error('Failed to fetch order status')
      return response.json() as Promise<Order>
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    enabled: !!orderId,
  })

  // Detect status changes and trigger callback
  useEffect(() => {
    if (order && order.status !== previousStatus) {
      setPreviousStatus(order.status)
      if (order.status === 'ready' && onOrderReady) {
        onOrderReady(order)
      }
    }
  }, [order, previousStatus, onOrderReady])

  const getCurrentStepIndex = (status: OrderStatusType): number => {
    return statusSteps.findIndex((step) => step.status === status)
  }

  const currentStepIndex = order ? getCurrentStepIndex(order.status) : -1

  if (isLoading) {
    return (
      <Card className={cn('p-8 text-center', className)} data-testid="order-status-loading">
        <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[var(--public-accent)]" />
        <p className="text-[var(--public-text-secondary)]">Memuat status pesanan...</p>
      </Card>
    )
  }

  if (error || !order) {
    return (
      <Card
        className={cn('p-8 text-center border-red-500', className)}
        data-testid="order-status-error"
      >
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-red-500 mb-2">Gagal Memuat Status</h3>
        <p className="text-[var(--public-text-secondary)] mb-4">
          Tidak dapat memuat status pesanan. Silakan coba lagi.
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Coba Lagi
        </Button>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)} data-testid="order-status">
      {/* Order info */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--public-text-primary)]">
              Pesanan #{order.order_number || order.id.substring(0, 8)}
            </h3>
            <p className="text-sm text-[var(--public-text-secondary)]">
              Meja: {order.table?.table_number || 'Takeaway'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--public-text-secondary)]">Total</p>
            <p className="text-xl font-bold text-[var(--public-accent)]">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(order.total_amount || 0)}
            </p>
          </div>
        </div>

        {/* Order items */}
        <div className="border-t border-[var(--public-border)] pt-4">
          <h4 className="font-medium text-[var(--public-text-primary)] mb-2">Item Pesanan:</h4>
          <ul className="space-y-1">
            {order.items?.map((item, index) => (
              <li
                key={index}
                className="flex justify-between text-sm text-[var(--public-text-secondary)]"
              >
                <span>
                  {item.quantity}x {item.product?.name || 'Item'}
                </span>
                <span>
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(item.total_price)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Status progress */}
      <Card className="p-6">
        <h4 className="font-semibold text-[var(--public-text-primary)] mb-6">Status Pesanan</h4>

        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[var(--public-border)]" />
          <div
            className="absolute left-8 top-0 w-0.5 bg-[var(--public-accent)] transition-all duration-500"
            style={{
              height: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
            }}
          />

          {/* Status steps */}
          <div className="space-y-8">
            {statusSteps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = index <= currentStepIndex
              const isCurrent = index === currentStepIndex

              return (
                <div key={step.status} className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center',
                      'w-16 h-16 rounded-full border-4 transition-all duration-300',
                      isCompleted
                        ? 'bg-[var(--public-accent)] border-[var(--public-accent)] text-white'
                        : 'bg-[var(--public-bg-primary)] border-[var(--public-border)] text-[var(--public-text-muted)]',
                      isCurrent && 'ring-4 ring-[var(--public-accent)]/20 animate-pulse'
                    )}
                  >
                    <Icon className="h-8 w-8" aria-hidden="true" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <h5
                      className={cn(
                        'font-semibold mb-1 transition-colors',
                        isCompleted
                          ? 'text-[var(--public-accent)]'
                          : 'text-[var(--public-text-muted)]'
                      )}
                    >
                      {step.label}
                    </h5>
                    <p
                      className={cn(
                        'text-sm transition-colors',
                        isCurrent
                          ? 'text-[var(--public-text-primary)] font-medium'
                          : 'text-[var(--public-text-secondary)]'
                      )}
                    >
                      {step.description}
                    </p>
                  </div>

                  {/* Current indicator */}
                  {isCurrent && (
                    <div className="pt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--public-accent)] text-white">
                        Saat Ini
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Ready notification */}
      {order.status === 'ready' && (
        <Card
          className="p-6 bg-green-50 border-green-500"
          role="status"
          aria-live="assertive"
          data-testid="order-ready-notification"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" aria-hidden="true" />
            <div>
              <h4 className="font-semibold text-green-700 mb-1">Pesanan Anda Siap!</h4>
              <p className="text-sm text-green-600">
                Silakan ambil pesanan Anda di counter. Terima kasih telah menunggu!
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Refresh button */}
      {!autoRefresh && (
        <Button onClick={() => refetch()} variant="outline" className="w-full">
          <Loader2 className="mr-2 h-4 w-4" />
          Perbarui Status
        </Button>
      )}
    </div>
  )
}

export default OrderStatus
