import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/components/admin/ProfilePage'

export const Route = createFileRoute('/admin/profile')({
  component: ProfilePage,
})
