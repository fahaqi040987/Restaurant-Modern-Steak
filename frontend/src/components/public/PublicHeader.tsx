import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu, X, User } from 'lucide-react'
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
}

function NavLink({ to, children, onClick, className }: NavLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'text-sm font-medium transition-colors duration-200',
        'hover:text-[var(--public-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--public-primary)]',
        isActive
          ? 'text-[var(--public-secondary)]'
          : 'text-[var(--public-text-primary)]',
        className
      )}
    >
      {children}
    </Link>
  )
}

const navLinks = [
  { to: '/public', label: 'Home' },
  { to: '/public/menu', label: 'Menu' },
  { to: '/public/about', label: 'About' },
  { to: '/public/contact', label: 'Contact' },
]

export function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header
      className="sticky top-0 z-[var(--public-z-sticky)] w-full border-b border-[var(--public-border)] bg-[var(--public-primary)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--public-primary)]/80"
      role="banner"
    >
      <nav
        className="public-container flex h-16 items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--public-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--public-primary)]"
          aria-label="Steak Kenangan - Home"
        >
          <span
            className="font-serif text-xl font-semibold tracking-wide text-[var(--public-text-primary)]"
            style={{ fontFamily: 'var(--public-font-heading)' }}
          >
            Steak<span className="text-[var(--public-secondary)]">Kenangan</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop Staff Login Button */}
        <div className="hidden md:flex">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2 text-[var(--public-text-secondary)] hover:text-[var(--public-secondary)] hover:bg-transparent"
          >
            <a href="/login">
              <User className="h-4 w-4" aria-hidden="true" />
              <span>Staff Login</span>
            </a>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-[var(--public-text-primary)] hover:text-[var(--public-secondary)] hover:bg-[var(--public-bg-hover)]"
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
            side="right"
            className="w-[300px] bg-[var(--public-primary)] border-[var(--public-border)] text-[var(--public-text-primary)]"
            id="mobile-menu"
          >
            <SheetHeader>
              <SheetTitle
                className="text-left font-serif text-lg text-[var(--public-text-primary)]"
                style={{ fontFamily: 'var(--public-font-heading)' }}
              >
                Steak<span className="text-[var(--public-secondary)]">Kenangan</span>
              </SheetTitle>
            </SheetHeader>

            <nav
              className="mt-8 flex flex-col gap-6"
              aria-label="Mobile navigation"
            >
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  className="text-lg py-2"
                >
                  {link.label}
                </NavLink>
              ))}

              {/* Mobile Staff Login */}
              <div className="mt-4 pt-4 border-t border-[var(--public-border)]">
                <a
                  href="/login"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 text-[var(--public-text-secondary)] hover:text-[var(--public-secondary)] transition-colors"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span>Staff Login</span>
                </a>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}

export default PublicHeader
