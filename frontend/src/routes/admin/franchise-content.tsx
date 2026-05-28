import { createFileRoute } from '@tanstack/react-router'
import { FranchiseContentEditor } from '@/components/admin/franchise-content/FranchiseContentEditor'

export const Route = createFileRoute('/admin/franchise-content')({
  component: FranchiseContentEditor,
})
