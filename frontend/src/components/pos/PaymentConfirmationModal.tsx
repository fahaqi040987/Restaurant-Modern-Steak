import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ButtonLoadingSpinner } from '@/components/ui/loading-spinner'
import {
  CheckCircle,
  X,
  Receipt,
  Printer,
  CreditCard,
  Banknote,
  Wallet,
  Smartphone,
  Loader2
} from 'lucide-react'
import { PaymentMethodSelection, type PaymentMethod, type PaymentData } from './PaymentMethodSelection'
import { formatCurrency } from '@/lib/utils'
import apiClient from '@/api/client'
import { receiptPrinter } from '@/services/receiptPrinter'
import { toastHelpers } from '@/lib/toast-helpers'
import type {
  CartItem,
  DiningTable,
  CreateOrderRequest,
  CreateOrderItem,
  ProcessPaymentRequest
} from '@/types'

interface PaymentConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  selectedTable: DiningTable | null
  orderType: 'dine_in' | 'takeout' | 'delivery'
  customerName: string
  orderNotes?: string
  onSuccess: () => void
}

export function PaymentConfirmationModal({
  isOpen,
  onClose,
  items,
  subtotal,
  taxAmount,
  totalAmount,
  selectedTable,
  orderType,
  customerName,
  orderNotes,
  onSuccess
}: PaymentConfirmationModalProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState<'payment' | 'processing' | 'success'>('payment')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [orderId, setOrderId] = useState<string>('')
  const [receiptData, setReceiptData] = useState<any>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [autoPrintTriggered, setAutoPrintTriggered] = useState(false)
  const queryClient = useQueryClient()

  // Fetch system settings for auto-print configuration
  const { data: settingsData } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await apiClient.getSettings()
      return response.success ? response.data : {}
    },
  })

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CreateOrderRequest) => {
      const response = await apiClient.createOrder(orderData)
      return response
    },
    onError: (error) => {
      console.error('Order creation failed:', error);
    }
  })

  const processPaymentMutation = useMutation({
    mutationFn: async ({ orderId, payment }: { orderId: string, payment: ProcessPaymentRequest }) => {
      const response = await apiClient.processPayment(orderId, payment)
      return response
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      console.error('Payment processing failed:', error);
    }
  })

  const handlePaymentMethodSelect = async (method: PaymentMethod, data: PaymentData) => {
    setPaymentData(data)
    setCurrentStep('processing')

    try {
      // Step 1: Create the order
      const orderItems: CreateOrderItem[] = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        special_instructions: undefined
      }))

      const orderData: CreateOrderRequest = {
        table_id: selectedTable?.id,
        customer_name: orderType !== 'dine_in' ? customerName.trim() : undefined,
        order_type: orderType,
        items: orderItems,
        notes: orderNotes?.trim() || undefined
      }

      console.log('Creating order...', orderData)
      const orderResponse = await createOrderMutation.mutateAsync(orderData)

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Failed to create order')
      }

      const createdOrderId = orderResponse.data.id
      setOrderId(createdOrderId)

      // Step 2: Process the payment
      const paymentRequest: ProcessPaymentRequest = {
        payment_method: data.method,
        amount: data.amount,
        reference_number: data.reference_number
      }

      console.log('Processing payment...', paymentRequest)
      const paymentResponse = await processPaymentMutation.mutateAsync({
        orderId: createdOrderId,
        payment: paymentRequest
      })

      if (!paymentResponse.success) {
        throw new Error('Payment processing failed')
      }

      // Step 3: Prepare receipt data
      setReceiptData({
        order: orderResponse.data,
        payment: paymentResponse.data,
        paymentData: data,
        items,
        subtotal,
        taxAmount,
        totalAmount,
        selectedTable,
        orderType,
        customerName
      })

      // Step 4: Success!
      setCurrentStep('success')

      // Refresh related queries
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })

    } catch (error: any) {
      console.error('Payment process failed:', error)
      alert(error.message || 'Failed to process payment')
      setCurrentStep('payment')
    }
  }

  const handlePrintReceipt = async () => {
    if (!receiptData || isPrinting) return

    setIsPrinting(true)
    try {
      // Update printer settings from system settings
      receiptPrinter.updateSettings({
        restaurant_name: settingsData?.restaurant_name || 'Steak Kenangan',
        receipt_header: settingsData?.receipt_header,
        receipt_footer: settingsData?.receipt_footer,
        paper_size: settingsData?.paper_size || '80mm',
        currency: settingsData?.currency || 'IDR',
        tax_rate: parseFloat(settingsData?.tax_rate) || 11,
        print_copies: parseInt(settingsData?.print_copies) || 1,
      })

      // Prepare receipt data for printer
      const printData = {
        order_number: orderId.slice(-8).toUpperCase(),
        order_date: new Date().toISOString(),
        order_type: orderType,
        table_number: selectedTable?.table_number,
        customer_name: customerName || undefined,
        items: items.map(item => ({
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.product.price * item.quantity,
        })),
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_method: paymentData?.method,
        payment_amount: paymentData?.cash_tendered || totalAmount,
        change_amount: paymentData?.change_amount || 0,
        cashier_name: 'Staff',
      }

      // Print with configured number of copies
      const copies = parseInt(settingsData?.print_copies) || 1
      await receiptPrinter.printMultipleCopies(printData, copies)
      toastHelpers.success('Struk berhasil dicetak!')
    } catch (error) {
      console.error('Print receipt error:', error)
      toastHelpers.error('Gagal mencetak struk. Coba lagi.')
    } finally {
      setIsPrinting(false)
    }
  }

  // Auto-print after successful payment if enabled
  useEffect(() => {
    if (
      currentStep === 'success' &&
      receiptData &&
      settingsData?.auto_print_customer_copy === 'true' &&
      !autoPrintTriggered
    ) {
      setAutoPrintTriggered(true)
      // Small delay to ensure UI is rendered
      setTimeout(() => {
        handlePrintReceipt()
      }, 500)
    }
  }, [currentStep, receiptData, settingsData, autoPrintTriggered])

  const handleComplete = () => {
    onSuccess()
    onClose()
  }

  if (!isOpen) return null

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash': return Banknote
      case 'credit_card': return CreditCard
      case 'debit_card': return Wallet
      case 'digital_wallet': return Smartphone
      default: return CreditCard
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg">
        {currentStep === 'payment' && (
          <PaymentMethodSelection
            totalAmount={totalAmount}
            onMethodSelect={handlePaymentMethodSelect}
            onCancel={onClose}
          />
        )}

        {currentStep === 'processing' && (
          <Card className="bg-white">
            <CardContent className="p-8 text-center">
              <ButtonLoadingSpinner />
              <h3 className="text-lg font-semibold mb-2 mt-4">{t('pos.processingPayment')}</h3>
              <p className="text-gray-600">
                {createOrderMutation.isPending && t('pos.creatingOrder')}
                {processPaymentMutation.isPending && t('pos.processingPaymentStatus')}
              </p>
              <p className="text-sm text-gray-500 mt-2">{t('pos.pleaseWait')}</p>
            </CardContent>
          </Card>
        )}

        {currentStep === 'success' && receiptData && (
          <Card className="bg-white">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-900">{t('pos.paymentSuccessful')}</CardTitle>
              <p className="text-gray-600">{t('pos.orderNumber', { number: orderId.slice(-8).toUpperCase() })}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Payment Summary */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getPaymentIcon(paymentData!.method)
                      return <Icon className="w-4 h-4 text-gray-600" />
                    })()}
                    <span className="font-medium capitalize">
                      {paymentData!.method.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="font-bold">{formatCurrency(totalAmount)}</span>
                </div>

                {paymentData!.method === 'cash' && paymentData!.cash_tendered && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>{t('pos.cashTenderedLabel')}</span>
                      <span>{formatCurrency(paymentData!.cash_tendered!)}</span>
                    </div>
                    {paymentData!.change_amount! > 0 && (
                      <div className="flex justify-between font-medium text-green-700">
                        <span>{t('pos.changeDue')}</span>
                        <span>{formatCurrency(paymentData!.change_amount!)}</span>
                      </div>
                    )}
                  </div>
                )}

                {paymentData!.reference_number && (
                  <div className="text-sm text-gray-600 mt-2">
                    <span>{t('pos.reference')} </span>
                    <span className="font-mono">{paymentData!.reference_number}</span>
                  </div>
                )}
              </div>

              {/* Order Details */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{t('pos.items')}</span>
                  <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{t('pos.subtotalLabel')}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{t('pos.taxLabel')}</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{t('pos.totalLabel')}</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Table/Customer Info */}
              <div className="flex gap-2">
                <Badge className="capitalize">
                  {orderType.replace('_', ' ')}
                </Badge>
                {selectedTable && (
                  <Badge variant="outline">
                    {t('pos.tableNumber', { number: selectedTable.table_number })}
                  </Badge>
                )}
                {customerName && (
                  <Badge variant="outline">
                    {customerName}
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrintReceipt}
                  className="flex-1"
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4 mr-2" />
                  )}
                  {isPrinting ? t('pos.printing') : t('pos.printReceipt')}
                </Button>
                <Button
                  onClick={handleComplete}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('pos.complete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
