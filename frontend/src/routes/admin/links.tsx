import { createFileRoute } from '@tanstack/react-router'
import { AdminBioLinksManagement } from '@/components/admin/AdminBioLinksManagement'

export const Route = createFileRoute('/admin/links')({
  component: AdminBioLinksManagement,
})
