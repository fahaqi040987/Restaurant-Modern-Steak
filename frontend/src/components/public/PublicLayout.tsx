import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PublicHeader } from './PublicHeader'
import { PublicFooter } from './PublicFooter'
import '@/styles/public-theme.css'

interface PublicLayoutProps {
  children: React.ReactNode
}

/**
 * Layout wrapper for public website pages
 * Provides consistent header, footer, and theme styling
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  // Fetch restaurant info for footer
  const { data: restaurantInfo } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 30, // 30 minutes - restaurant info rarely changes
    retry: 1,
  })

  return (
    <div className="public-theme min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1" role="main">
        {children}
      </main>
      <PublicFooter restaurantInfo={restaurantInfo} />
    </div>
  )
}

export default PublicLayout
