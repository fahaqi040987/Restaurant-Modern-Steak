import { createFileRoute } from '@tantml:react-router'
import ContactSubmissions from '@/components/admin/ContactSubmissions'

export const Route = createFileRoute('/admin/contacts')({
  component: ContactSubmissions,
})
