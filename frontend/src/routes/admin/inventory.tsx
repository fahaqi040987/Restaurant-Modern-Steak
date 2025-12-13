import { createFileRoute } from '@tanstack/react-router'
import InventoryManagement from '@/components/admin/InventoryManagement'

export const Route = createFileRoute('/admin/inventory')({
  component: InventoryManagement,
})
