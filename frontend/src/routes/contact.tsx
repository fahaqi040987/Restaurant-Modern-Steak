import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/contact')({
  component: () => <Navigate to="/site/contact" />,
})
