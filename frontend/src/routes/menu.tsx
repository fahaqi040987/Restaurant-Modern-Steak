import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/menu')({
  component: () => <Navigate to="/site/menu" />,
})
