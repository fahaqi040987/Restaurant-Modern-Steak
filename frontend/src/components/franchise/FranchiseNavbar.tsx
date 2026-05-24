import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Menu, X, ArrowLeft, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { apiClient } from '@/api/client'

const franchiseNavItems = [
  { to: '/site/franchise/atmosphere', labelKey: 'franchise.nav.gerai' },
  { to: '/site/franchise/menu', labelKey: 'franchise.nav.menu' },
  { to: '/site/franchise/investment', labelKey: 'franchise.nav.plan' },
] as const

const languages = [
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'id-ID', label: 'Indonesia', flag: '🇮🇩' },
]

export function FranchiseNavbar() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { data: restaurantInfo } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 5,
  })

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]
  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    localStorage.setItem('i18nextLng', langCode)
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-[var(--public-primary)]/95 backdrop-blur-md border-b border-[var(--public-border)]"
      role="banner"
    >
      <nav
        className="public-container flex items-center justify-between h-16"
        aria-label="Franchise navigation"
      >
        {/* Logo + Back Link */}
        <Link
          to="/site"
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)]"
          aria-label="Back to Steak Kenangan website"
        >
          {restaurantInfo?.logo_url ? (
            <img
              src={restaurantInfo.logo_url || '/assets/restoran/images/LogoSteakKenangan.png'}
              alt={restaurantInfo.name || 'Steak Kenangan'}
              width={80}
              height={80}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span
              className="font-accent text-lg text-[var(--public-accent)]"
              style={{ fontFamily: 'var(--font-accent, Pacifico, cursive)' }}
            >
              Steak Kenangan
            </span>
          )}
        </Link>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-8">
          {franchiseNavItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'text-sm font-medium tracking-wide uppercase transition-colors duration-300',
                  isActive
                    ? 'text-[var(--public-accent)]'
                    : 'text-[var(--public-text-secondary)] hover:text-[var(--public-accent)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)]'
                )}
              >
                {t(item.labelKey)}
              </Link>
            )
          })}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-[var(--public-text-secondary)]"
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
                <span>{currentLang.flag}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={cn(
                    'cursor-pointer',
                    i18n.language === lang.code && 'bg-[var(--public-accent)]/10'
                  )}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Back to Website */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2 text-[var(--public-text-secondary)] hover:text-[var(--public-accent)]"
          >
            <Link to="/site">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">{t('franchise.nav.backToWebsite')}</span>
            </Link>
          </Button>

          {/* CTA Button */}
          <Button
            asChild
            size="sm"
            className="bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)] text-white font-semibold"
          >
            <Link to="/site/franchise/apply">
              {t('franchise.nav.register')}
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile CTA */}
          <Button
            asChild
            size="sm"
            className="bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)] text-white font-semibold text-xs"
          >
            <Link to="/site/franchise/apply">
              {t('franchise.nav.register')}
            </Link>
          </Button>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--public-text-secondary)]"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-[280px] bg-[var(--public-primary)] border-[var(--public-border)] text-[var(--public-text-primary)]"
            >
              <SheetHeader>
                <SheetTitle className="text-left">
                  <span
                    className="font-accent text-lg text-[var(--public-accent)]"
                    style={{ fontFamily: 'var(--font-accent, Pacifico, cursive)' }}
                  >
                    Steak Kenangan
                  </span>
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile franchise navigation">
                {franchiseNavItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileMenu}
                    className={cn(
                      'text-lg py-3 px-4 rounded-md transition-colors',
                      'hover:bg-[var(--public-bg-hover)] hover:text-[var(--public-accent)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)]',
                      location.pathname === item.to && 'text-[var(--public-accent)]'
                    )}
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}

                <div className="mt-6 pt-6 border-t border-[var(--public-border)]">
                  {/* Language Switcher */}
                  <div className="flex items-center gap-2 px-4 py-2">
                    <Globe className="h-4 w-4 text-[var(--public-text-secondary)]" />
                    <span className="text-sm text-[var(--public-text-secondary)]">Language:</span>
                  </div>
                  <div className="flex gap-2 px-4">
                    {languages.map((lang) => (
                      <Button
                        key={lang.code}
                        variant={i18n.language === lang.code ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => changeLanguage(lang.code)}
                        className={cn(
                          i18n.language === lang.code
                            ? 'bg-[var(--public-accent)] text-white'
                            : 'border-[var(--public-border)] text-[var(--public-text-secondary)]'
                        )}
                      >
                        <span className="mr-1">{lang.flag}</span>
                        {lang.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[var(--public-border)]">
                  <Link
                    to="/site"
                    onClick={closeMobileMenu}
                    className={cn(
                      'flex items-center gap-3 py-3 px-4 rounded-md',
                      'text-[var(--public-text-secondary)] hover:text-[var(--public-accent)]',
                      'hover:bg-[var(--public-bg-hover)] transition-colors'
                    )}
                  >
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                    <span>{t('franchise.nav.backToWebsite')}</span>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}

export default FranchiseNavbar
