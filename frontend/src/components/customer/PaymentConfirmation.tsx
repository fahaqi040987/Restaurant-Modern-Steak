/**
 * T080: PaymentConfirmation Component
 * Displays payment confirmation status for QR-based customer ordering
 */
import { CheckCircle, XCircle, Clock, Receipt, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PaymentConfirmation as PaymentConfirmationType } from '@/types'

interface PaymentConfirmationProps {
  /** Payment confirmation data */
  payment: PaymentConfirmationType
  /** Order number for display */
  orderNumber?: string
  /** Table number for display */
  tableNumber?: string
  /** Callback to proceed to order tracking */
  onProceedToTracking?: () => void
  /** Callback to retry payment */
  onRetryPayment?: () => void
  /** Custom class name */
  className?: string
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    title: 'Pembayaran Berhasil!',
    description: 'Pesanan Anda sedang diproses oleh dapur kami.',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
  },
  pending: {
    icon: Clock,
    title: 'Menunggu Konfirmasi',
    description: 'Pembayaran Anda sedang diverifikasi. Harap tunggu sebentar.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-500',
  },
  failed: {
    icon: XCircle,
    title: 'Pembayaran Gagal',
    description: 'Terjadi kesalahan dalam proses pembayaran. Silakan coba lagi.',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
  },
}

/**
 * Payment confirmation component displaying payment status.
 * Shows success/pending/failed states with appropriate visual feedback.
 *
 * @example
 * ```tsx
 * <PaymentConfirmation
 *   payment={paymentData}
 *   orderNumber="ORD-2024-001"
 *   tableNumber="5"
 *   onProceedToTracking={() => navigate('/order-status')}
 * />
 * ```
 */
export function PaymentConfirmation({
  payment,
  orderNumber,
  tableNumber,
  onProceedToTracking,
  onRetryPayment,
  className,
}: PaymentConfirmationProps) {
  const config = statusConfig[payment.status]
  const Icon = config.icon

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Tunai',
      credit_card: 'Kartu Kredit',
      debit_card: 'Kartu Debit',
      digital_wallet: 'Dompet Digital',
      qris: 'QRIS',
    }
    return methods[method] || method
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={cn('space-y-6', className)} data-testid="payment-confirmation">
      {/* Status Card */}
      <Card className={cn('border-2', config.borderColor, config.bgColor)}>
        <CardContent className="pt-8 pb-6 text-center">
          <div
            className={cn(
              'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center',
              payment.status === 'completed' && 'bg-green-100',
              payment.status === 'pending' && 'bg-yellow-100',
              payment.status === 'failed' && 'bg-red-100'
            )}
          >
            <Icon className={cn('w-10 h-10', config.color)} aria-hidden="true" />
          </div>
          <h2 className={cn('text-2xl font-bold mb-2', config.color)}>{config.title}</h2>
          <p className="text-[var(--public-text-secondary)]">{config.description}</p>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card className="bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--public-text-primary)]">
            <Receipt className="w-5 h-5" aria-hidden="true" />
            Detail Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Info */}
          {orderNumber && (
            <div className="flex justify-between items-center py-2 border-b border-[var(--public-border)]">
              <span className="text-[var(--public-text-secondary)]">Nomor Pesanan</span>
              <span className="font-semibold text-[var(--public-text-primary)]">{orderNumber}</span>
            </div>
          )}

          {tableNumber && (
            <div className="flex justify-between items-center py-2 border-b border-[var(--public-border)]">
              <span className="text-[var(--public-text-secondary)]">Nomor Meja</span>
              <span className="font-semibold text-[var(--public-text-primary)]">{tableNumber}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-2 border-b border-[var(--public-border)]">
            <span className="text-[var(--public-text-secondary)]">Metode Pembayaran</span>
            <span className="font-semibold text-[var(--public-text-primary)]">
              {formatPaymentMethod(payment.payment_method)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-[var(--public-border)]">
            <span className="text-[var(--public-text-secondary)]">Waktu Transaksi</span>
            <span className="text-sm text-[var(--public-text-primary)]">
              {formatDate(payment.created_at)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-[var(--public-border)]">
            <span className="text-[var(--public-text-secondary)]">ID Transaksi</span>
            <span className="text-xs font-mono text-[var(--public-text-muted)]">
              {payment.payment_id.substring(0, 12)}...
            </span>
          </div>

          {/* Total Amount */}
          <div className="flex justify-between items-center pt-4">
            <span className="text-lg font-semibold text-[var(--public-text-primary)]">
              Total Dibayar
            </span>
            <span className="text-2xl font-bold text-[var(--public-secondary)]">
              {formatCurrency(payment.amount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        {payment.status === 'completed' && onProceedToTracking && (
          <Button
            onClick={onProceedToTracking}
            className="w-full h-12 bg-[var(--public-secondary)] text-[var(--public-text-on-gold)] font-semibold"
          >
            Lacak Pesanan
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        )}

        {payment.status === 'failed' && onRetryPayment && (
          <Button
            onClick={onRetryPayment}
            className="w-full h-12 bg-[var(--public-secondary)] text-[var(--public-text-on-gold)] font-semibold"
          >
            Coba Lagi
          </Button>
        )}

        {payment.status === 'pending' && (
          <p className="text-center text-sm text-[var(--public-text-muted)]">
            Halaman akan diperbarui secara otomatis setelah pembayaran dikonfirmasi.
          </p>
        )}
      </div>

      {/* Instructions for completed payment */}
      {payment.status === 'completed' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <h4 className="font-semibold text-blue-700 mb-2">Langkah Selanjutnya:</h4>
            <ol className="list-decimal list-inside text-sm text-blue-600 space-y-1">
              <li>Pesanan Anda sedang diproses oleh dapur</li>
              <li>Tunggu di meja Anda</li>
              <li>Pesanan akan diantar ke meja Anda saat siap</li>
              <li>Jangan lupa isi survey kepuasan setelah makan!</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PaymentConfirmation
