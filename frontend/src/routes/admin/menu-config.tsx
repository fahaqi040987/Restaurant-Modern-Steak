import { createFileRoute } from '@tanstack/react-router'
import { MenuConfigPage } from '@/components/admin/MenuConfigPage'

export const Route = createFileRoute('/admin/menu-config')({
  component: MenuConfigPage,
})
