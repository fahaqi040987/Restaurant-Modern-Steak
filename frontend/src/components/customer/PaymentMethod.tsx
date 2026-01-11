/**
 * T079: PaymentMethod Component
 * Component for selecting payment method in QR-based ordering flow
 */
import { useState } from 'react'
import { CreditCard, Smartphone, Wallet, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Payment method type for customer ordering
export type PaymentMethodType = 'cash' | 'qris' | 'card'

interface PaymentMethodProps {
  /** Callback when payment method is selected */
  onSelect: (method: PaymentMethodType) => void
  /** Currently selected payment method */
  selectedMethod?: PaymentMethodType
  /** Custom class name */
  className?: string
  /** Disable selection */
  disabled?: boolean
}

const paymentOptions: Array<{
  method: PaymentMethodType
  label: string
  icon: typeof CreditCard
  description: string
}> = [
  {
    method: 'cash',
    label: 'Tunai',
    icon: Wallet,
    description: 'Bayar di kasir',
  },
  {
    method: 'qris',
    label: 'QRIS',
    icon: Smartphone,
    description: 'Scan QR code',
  },
  {
    method: 'card',
    label: 'Kartu Debit/Kredit',
    icon: CreditCard,
    description: 'Bayar dengan kartu',
  },
]

/**
 * Payment method selection component for customer ordering.
 * Displays available payment options with icons and descriptions.
 *
 * @example
 * ```tsx
 * <PaymentMethod
 *   onSelect={(method) => console.log('Selected:', method)}
 *   selectedMethod="qris"
 * />
 * ```
 */
export function PaymentMethod({
  onSelect,
  selectedMethod,
  className,
  disabled = false,
}: PaymentMethodProps) {
  const [hoveredMethod, setHoveredMethod] = useState<PaymentMethodType | null>(null)

  return (
    <div className={cn('space-y-4', className)} data-testid="payment-method">
      <h3 className="text-lg font-semibold text-[var(--public-text-primary)]">
        Pilih Metode Pembayaran
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {paymentOptions.map((option) => {
          const Icon = option.icon
          const isSelected = selectedMethod === option.method
          const isHovered = hoveredMethod === option.method

          return (
            <Card
              key={option.method}
              className={cn(
                'relative p-6 cursor-pointer transition-all duration-300',
                'border-2 hover:shadow-lg',
                isSelected
                  ? 'border-[var(--public-accent)] bg-[var(--public-accent)]/10'
                  : 'border-[var(--public-border)] hover:border-[var(--public-accent)]/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !disabled && onSelect(option.method)}
              onMouseEnter={() => !disabled && setHoveredMethod(option.method)}
              onMouseLeave={() => setHoveredMethod(null)}
              data-testid={`payment-option-${option.method}`}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-pressed={isSelected}
              aria-disabled={disabled}
              onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onSelect(option.method)
                }
              }}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-6 w-6 text-[var(--public-accent)]" aria-hidden="true" />
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'mb-4 flex justify-center transition-transform duration-300',
                  (isHovered || isSelected) && 'scale-110'
                )}
              >
                <div
                  className={cn(
                    'p-4 rounded-full',
                    isSelected
                      ? 'bg-[var(--public-accent)] text-white'
                      : 'bg-[var(--public-bg-elevated)] text-[var(--public-accent)]'
                  )}
                >
                  <Icon className="h-8 w-8" aria-hidden="true" />
                </div>
              </div>

              {/* Label and description */}
              <div className="text-center">
                <h4
                  className={cn(
                    'font-semibold mb-1 transition-colors',
                    isSelected
                      ? 'text-[var(--public-accent)]'
                      : 'text-[var(--public-text-primary)]'
                  )}
                >
                  {option.label}
                </h4>
                <p className="text-sm text-[var(--public-text-secondary)]">
                  {option.description}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Selection summary */}
      {selectedMethod && (
        <div
          className="p-4 bg-[var(--public-bg-elevated)] rounded-lg border border-[var(--public-border)]"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-[var(--public-text-secondary)]">
            Metode pembayaran dipilih:{' '}
            <span className="font-semibold text-[var(--public-accent)]">
              {paymentOptions.find((opt) => opt.method === selectedMethod)?.label}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

export default PaymentMethod
