import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Menu, X, User, Phone, Calendar, Globe } from 'lucide-react'
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

interface NavLinkProps {
  to: string
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

function NavLink({ to, children, onClick, className }: NavLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'text-sm font-medium transition-all duration-300',
        'hover:text-[var(--public-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)]',
        isActive && 'text-[var(--public-accent)]',
        !isActive && 'text-white',
        className
      )}
    >
      {children}
    </Link>
  )
}

const navLinkKeys = [
  { to: '/site', labelKey: 'public.home' },
  { to: '/site/menu', labelKey: 'public.menu' },
  { to: '/site/about', labelKey: 'public.aboutUs' },
  { to: '/site/reservation', labelKey: 'public.reservation' },
  { to: '/site/contact', labelKey: 'public.contact' },
]

const languages = [
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'id-ID', label: 'Indonesia', flag: '🇮🇩' },
]

/**
 * Fixed header component with scroll behavior (Restoran-master style).
 * - Fixed position at top of viewport (does NOT follow scroll)
 * - Mobile hamburger menu with slide-out drawer
 * - Staff login link in navigation
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export function Header() {
  const { t, i18n } = useTranslation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Fetch restaurant info for logo
  const { data: restaurantInfo } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Get current language
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

  // Handle language change
  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    localStorage.setItem('i18nextLng', langCode)
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header
      className="bg-transparent transition-all duration-300 w-full absolute top-0 left-0 right-0 z-50"
      role="banner"
    >
      <nav
        className="public-container flex items-center justify-between"
        aria-label="Main navigation"
      >
          {/* Logo */}
          <Link
            to="/site"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)]"
            aria-label="Steak Kenangan - Home"
          >
            {restaurantInfo?.logo_url ? (
              <img
                src={restaurantInfo?.logo_url || '/assets/restoran/images/LogoSteakKenangan.png'}
                alt={restaurantInfo.name || 'Steak Kenangan'}
                className="h-28 md:h-30 lg:h-32 w-auto object-contain transition-all duration-300"
              />
            ) : (
              <span
                className={cn(
                  'font-accent text-2xl md:text-3xl transition-colors duration-300',
                  'text-white'
                )}
                style={{ fontFamily: 'var(--font-accent, Pacifico, cursive)' }}
              >
                Steak Kenangan
              </span>
            )}
          </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinkKeys.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {t(link.labelKey)}
            </NavLink>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                data-testid="language-switcher"
                className="gap-2 transition-colors duration-300"
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

          {/* Staff Login Button */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2 transition-colors duration-300"
          >
            <Link to="/login">
              <User className="h-4 w-4" aria-hidden="true" />
              <span>{t('public.staffLogin')}</span>
            </Link>
          </Button>

          {/* Reservation CTA */}
          <Button
            asChild
            className={cn(
              'gap-2 transition-all duration-300',
              'bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)]',
              'text-white font-medium'
            )}
          >
            <Link to="/site/reservation">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>{t('public.bookATable')}</span>
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'lg:hidden transition-colors duration-300'
              )}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </SheetTrigger>

          {/* Mobile Menu Content */}
          <SheetContent
            side="left"
            className="w-[300px] bg-[var(--public-primary)] border-[var(--public-border)] text-[var(--public-text-primary)]"
            id="mobile-menu"
          >
            <SheetHeader>
              <SheetTitle className="text-left">
                <img
                  src={restaurantInfo?.logo_url || '/assets/restoran/images/LogoSteakKenangan.png'}
                  alt={restaurantInfo?.name || 'Steak Kenangan'}
                  className="h-20 w-auto object-contain"
                />
              </SheetTitle>
            </SheetHeader>

            <nav
              className="mt-8 flex flex-col gap-1"
              aria-label="Mobile navigation"
            >
              {navLinkKeys.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  className={cn(
                    'text-lg py-3 px-4 rounded-md transition-colors',
                    'hover:bg-[var(--public-bg-hover)] hover:text-[var(--public-accent)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-accent)]'
                  )}
                >
                  {t(link.labelKey)}
                </Link>
              ))}

              {/* Mobile Language Switcher */}
              <div className="mt-6 pt-6 border-t border-[var(--public-border)]">
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

              {/* Mobile Staff Login */}
              <div className="mt-6 pt-6 border-t border-[var(--public-border)]">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className={cn(
                    'flex items-center gap-3 py-3 px-4 rounded-md',
                    'text-[var(--public-text-secondary)] hover:text-[var(--public-accent)]',
                    'hover:bg-[var(--public-bg-hover)] transition-colors'
                  )}
                >
                  <User className="h-5 w-5" aria-hidden="true" />
                  <span>{t('public.staffLogin')}</span>
                </Link>
              </div>

              {/* Mobile Reservation CTA */}
              <div className="mt-4">
                <Button
                  asChild
                  className={cn(
                    'w-full gap-2',
                    'bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)]',
                    'text-white font-medium'
                  )}
                  onClick={closeMobileMenu}
                >
                  <Link to="/site/reservation">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    <span>{t('public.bookATable')}</span>
                  </Link>
                </Button>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-[var(--public-border)]">
                <a
                  href="tel:+6221123456"
                  className={cn(
                    'flex items-center gap-3 py-2 px-4',
                    'text-sm text-[var(--public-text-secondary)]',
                    'hover:text-[var(--public-accent)] transition-colors'
                  )}
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  <span>+62 21 123 456</span>
                </a>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}

export default Header
