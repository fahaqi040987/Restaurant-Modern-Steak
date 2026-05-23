import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import type { PublicBioLinksResponse } from '@/types'
import { Instagram, Twitter, MessageCircle, ExternalLink, ChefHat } from 'lucide-react'

export const Route = createFileRoute('/links')({
  component: BioLinkPage,
})

function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads') || url.startsWith('/images')) {
    const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8080/api/v1'
    const baseUrl = apiUrl.replace('/api/v1', '')
    return `${baseUrl}${url}`
  }
  return url
}

function BioLinkPage() {
  const [clickedId, setClickedId] = useState<string | null>(null)

  const { data: bioData, isLoading } = useQuery({
    queryKey: ['publicBioLinks'],
    queryFn: async () => {
      const res = await apiClient.getPublicBioLinks()
      return res.data as PublicBioLinksResponse | undefined
    },
    staleTime: 60_000,
  })

  const { data: restaurantInfo } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 5 * 60_000,
  })

  const profile = bioData?.profile
  const links = bioData?.links || []
  const themeColor = profile?.theme_color || '#e5612f'

  useEffect(() => {
    if (profile?.noindex) {
      const meta = document.createElement('meta')
      meta.name = 'robots'
      meta.content = 'noindex, nofollow'
      document.head.appendChild(meta)
      return () => {
        document.head.removeChild(meta)
      }
    }
  }, [profile?.noindex])

  useEffect(() => {
    document.title = profile?.account_name
      ? `${profile.account_name} | Links`
      : 'Steak Kenangan | Links'
  }, [profile?.account_name])

  const handleClick = async (link: { id: string; url: string }) => {
    if (clickedId === link.id) return
    setClickedId(link.id)
    try {
      await apiClient.trackBioLinkClick(link.id)
    } catch {
      // Tracking failure should not block navigation
    }
    window.open(link.url, '_blank', 'noopener,noreferrer')
    setTimeout(() => setClickedId(null), 1000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white"
      style={{ '--bio-theme': themeColor } as React.CSSProperties}
    >
      <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center min-h-screen">
        {/* Profile */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-24 h-24 rounded-full border-4 mb-4 overflow-hidden flex items-center justify-center"
            style={{ borderColor: themeColor }}
          >
            {profile?.avatar_url ? (
              <img
                src={getImageUrl(profile.avatar_url) || undefined}
                alt={profile.account_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ChefHat className="w-12 h-12 text-white/60" />
            )}
          </div>
          <h1 className="text-xl font-bold text-center">{profile?.account_name || 'Steak Kenangan'}</h1>
          {profile?.bio_text && (
            <p className="text-sm text-white/70 text-center mt-1 max-w-xs">{profile.bio_text}</p>
          )}
        </div>

        {/* Link Buttons */}
        <div className="w-full space-y-3 flex-1">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => handleClick(link)}
              disabled={clickedId === link.id}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-xl font-medium text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, ${themeColor}dd, ${themeColor}99)`,
                border: `1px solid ${themeColor}40`,
              }}
            >
              <span className="truncate">{link.title}</span>
              <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-60" />
            </button>
          ))}

          {links.length === 0 && (
            <p className="text-center text-white/40 text-sm py-8">No links available yet</p>
          )}
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-5 mt-10 pb-8">
          {restaurantInfo?.instagram_url && (
            <a
              href={restaurantInfo.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-6 h-6" />
            </a>
          )}
          {restaurantInfo?.whatsapp && (
            <a
              href={`https://wa.me/${restaurantInfo.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-6 h-6" />
            </a>
          )}
          {restaurantInfo?.twitter_url && (
            <a
              href={restaurantInfo.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-6 h-6" />
            </a>
          )}
          {restaurantInfo?.facebook_url && (
            <a
              href={restaurantInfo.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <ExternalLink className="w-6 h-6" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
