import { useState, useEffect } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu, X, User, Phone, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  to: string
  children: React.ReactNode
  onClick?: () => void
  className?: string
  isScrolled?: boolean
}

function NavLink({ to, children, onClick, className, isScrolled }: NavLinkProps) {
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
        !isActive && isScrolled && 'text-[var(--public-text-primary)]',
        !isActive && !isScrolled && 'text-white',
        className
      )}
    >
      {children}
    </Link>
  )
}

const navLinks = [
  { to: '/site', label: 'Home' },
  { to: '/site/menu', label: 'Menu' },
  { to: '/site/about', label: 'About' },
  { to: '/site/reservation', label: 'Reservation' },
  { to: '/site/contact', label: 'Contact' },
]

/**
 * Fixed header component with scroll behavior (Restoran-master style).
 * - Transparent on top, solid background on scroll
 * - Mobile hamburger menu with slide-out drawer
 * - Staff login link in navigation
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll behavior for header background
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial scroll position

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header
      className={cn(
        'header-fixed',
        'transition-all duration-300',
        isScrolled
          ? 'bg-[var(--public-primary)] shadow-lg py-2'
          : 'bg-transparent py-4'
      )}
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
          <span
            className={cn(
              'font-accent text-2xl md:text-3xl transition-colors duration-300',
              isScrolled ? 'text-[var(--public-accent)]' : 'text-white'
            )}
            style={{ fontFamily: 'var(--font-accent, Pacifico, cursive)' }}
          >
            Steak Kenangan
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} isScrolled={isScrolled}>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Staff Login Button */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              'gap-2 transition-colors duration-300',
              isScrolled
                ? 'text-[var(--public-text-secondary)] hover:text-[var(--public-accent)]'
                : 'text-white/80 hover:text-white'
            )}
          >
            <Link to="/login">
              <User className="h-4 w-4" aria-hidden="true" />
              <span>Staff Login</span>
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
              <span>Book a Table</span>
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
                'lg:hidden transition-colors duration-300',
                isScrolled
                  ? 'text-[var(--public-text-primary)] hover:text-[var(--public-accent)]'
                  : 'text-white hover:text-white/80'
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
              <SheetTitle
                className="text-left font-accent text-2xl text-[var(--public-accent)]"
                style={{ fontFamily: 'var(--font-accent, Pacifico, cursive)' }}
              >
                Steak Kenangan
              </SheetTitle>
            </SheetHeader>

            <nav
              className="mt-8 flex flex-col gap-1"
              aria-label="Mobile navigation"
            >
              {navLinks.map((link) => (
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
                  {link.label}
                </Link>
              ))}

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
                  <span>Staff Login</span>
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
                    <span>Book a Table</span>
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
