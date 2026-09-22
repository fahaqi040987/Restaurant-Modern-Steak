import { createFileRoute } from '@tanstack/react-router'
import PaymentMethodsSettings from '@/components/admin/PaymentMethodsSettings'

export const Route = createFileRoute('/admin/payment-methods')({
  component: PaymentMethodsSettings,
})
