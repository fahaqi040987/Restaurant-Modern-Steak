import { createFileRoute } from '@tanstack/react-router'
import { RecipesPage } from '@/components/admin/RecipesPage'

export const Route = createFileRoute('/admin/recipes')({
  component: RecipesPage,
})
