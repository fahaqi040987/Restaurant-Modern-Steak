import { useQuery } from '@tanstack/react-query'
import { FranchiseNavbar } from './FranchiseNavbar'
import { Footer } from '@/components/public/Footer'
import { apiClient } from '@/api/client'
import '@/styles/public-theme.css'

interface FranchiseLayoutProps {
  children: React.ReactNode
}

export function FranchiseLayout({ children }: FranchiseLayoutProps) {
  const { data: restaurantInfo } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
    retry: 1,
  })

  return (
    <div className="public-theme min-h-screen flex flex-col">
      <FranchiseNavbar />

      <main
        id="main"
        className="flex-1 pt-16"
        role="main"
      >
        {children}
      </main>

      <Footer restaurantInfo={restaurantInfo} showReservation={false} />
    </div>
  )
}

export default FranchiseLayout
