import { createFileRoute } from '@tanstack/react-router'
import { NotificationsPage } from '@/components/admin/NotificationsPage'

export const Route = createFileRoute('/admin/notifications')({
  component: NotificationsPage,
})
