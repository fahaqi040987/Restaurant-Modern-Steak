import { createFileRoute } from '@tanstack/react-router'
import IngredientsManagement from '@/components/admin/IngredientsManagement'

export const Route = createFileRoute('/admin/ingredients')({
  component: IngredientsManagement,
})
