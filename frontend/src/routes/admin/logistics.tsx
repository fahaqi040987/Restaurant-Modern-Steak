import { createFileRoute } from '@tanstack/react-router'
import LogisticsPage from '@/components/admin/LogisticsPage'

export const Route = createFileRoute('/admin/logistics')({
  component: LogisticsPage,
})
