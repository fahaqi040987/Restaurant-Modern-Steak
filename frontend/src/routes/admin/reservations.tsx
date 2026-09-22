import { createFileRoute } from '@tanstack/react-router'
import ReservationsManagement from '@/components/admin/ReservationsManagement'

export const Route = createFileRoute('/admin/reservations')({
  component: ReservationsManagement,
})
