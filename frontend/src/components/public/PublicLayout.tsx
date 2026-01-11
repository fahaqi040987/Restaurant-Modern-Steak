import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { Header } from './Header'
import { Footer } from './Footer'
import { Loader } from './Loader'
import '@/styles/public-theme.css'

interface PublicLayoutProps {
  children: React.ReactNode
  /** Show loader on initial mount (default: true for home page) */
  showLoader?: boolean
  /** Loader duration in ms (default: 2500) */
  loaderDuration?: number
}

/**
 * Layout wrapper for public website pages (Restoran-master style).
 *
 * Provides:
 * - Animated page loader on initial visit
 * - Fixed header with scroll behavior
 * - Footer with reservation box
 * - Consistent theme styling
 *
 * @example
 * ```tsx
 * // In a route component
 * export default function HomePage() {
 *   return (
 *     <PublicLayout showLoader={true}>
 *       <HeroSection />
 *       <MenuSection />
 *     </PublicLayout>
 *   )
 * }
 * ```
 */
export function PublicLayout({
  children,
  showLoader = false,
  loaderDuration = 2500,
}: PublicLayoutProps) {
  const [isLoading, setIsLoading] = useState(showLoader)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // Only show loader on first visit (session-based)
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisitedPublicSite')
    if (hasVisited) {
      setIsLoading(false)
      setHasLoadedOnce(true)
    } else if (showLoader) {
      setIsLoading(true)
    }
  }, [showLoader])

  const handleLoaderComplete = () => {
    setIsLoading(false)
    setHasLoadedOnce(true)
    sessionStorage.setItem('hasVisitedPublicSite', 'true')
  }

  // Fetch restaurant info for footer
  const { data: restaurantInfo } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 5, // 5 minutes for faster updates after admin changes
    refetchOnMount: true,
    retry: 1,
  })

  return (
    <div className="public-theme min-h-screen flex flex-col">
      {/* Page Loader */}
      {showLoader && (
        <Loader
          show={isLoading}
          duration={loaderDuration}
          onComplete={handleLoaderComplete}
        />
      )}

      {/* Header - Fixed position */}
      <Header />

      {/* Main Content */}
      <main
        className={`flex-1 pt-24 transition-opacity duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        role="main"
      >
        {children}
      </main>

      {/* Footer with reservation box */}
      <Footer restaurantInfo={restaurantInfo} />
    </div>
  )
}

export default PublicLayout
