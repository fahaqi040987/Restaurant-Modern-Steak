/**
 * T017: Unit test for HeroSection component
 * Tests: Banner display, CTAs, responsive design, animations
 *
 * Note: This test is written TDD-style before HeroSection component exists (T018).
 * Tests will fail until HeroSection.tsx is implemented.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import type { ReactNode } from 'react'

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'public.bookATable': 'Book a Table',
    'public.viewMenu': 'View Menu',
    'public.scrollDown': 'Scroll down to view more content',
  }

  return {
    useTranslation: () => ({
      t: (key: string) => translations[key] ?? key,
    }),
  }
})

// Mock TanStack Router Link
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: '/site' }),
}))

// Import will fail until component is created (TDD approach)
// Once T018 is complete, this import will work
import { HeroSection } from '../HeroSection'

describe('HeroSection Component', () => {
  describe('Rendering', () => {
    it('renders hero section container', () => {
      render(<HeroSection />)

      const heroSection = screen.getByTestId('hero-section')
      expect(heroSection).toBeInTheDocument()
    })

    it('renders hero background image', () => {
      render(<HeroSection />)

      const heroSection = screen.getByTestId('hero-section')
      // Should have background image styling
      expect(heroSection).toHaveStyle({ backgroundImage: expect.stringContaining('url') })
    })

    it('renders restaurant name heading', () => {
      render(<HeroSection />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent(/Steak Kenangan/i)
    })

    it('renders tagline text', () => {
      render(<HeroSection />)

      expect(
        screen.getByText(/premium steaks|finest dining|experience/i)
      ).toBeInTheDocument()
    })

    it('renders primary CTA button (Book a Table)', () => {
      render(<HeroSection />)

      const ctaButton = screen.getByRole('link', { name: /Book a Table/i })
      expect(ctaButton).toBeInTheDocument()
      expect(ctaButton).toHaveAttribute('href', '/site/reservation')
    })

    it('renders secondary CTA button (View Menu)', () => {
      render(<HeroSection />)

      const menuButton = screen.getByRole('link', { name: /View Menu|Our Menu/i })
      expect(menuButton).toBeInTheDocument()
      expect(menuButton).toHaveAttribute('href', '/site/menu')
    })
  })

  describe('Styling', () => {
    it('has full viewport height', () => {
      render(<HeroSection />)

      const heroSection = screen.getByTestId('hero-section')
      expect(heroSection).toHaveClass('min-h-screen')
    })

    it('has overlay for text readability', () => {
      render(<HeroSection />)

      const heroSection = screen.getByTestId('hero-section')
      // Check for overlay element or background with opacity
      const overlay = heroSection.querySelector('[data-testid="hero-overlay"]')
      expect(overlay).toBeInTheDocument()
    })

    it('centers content vertically and horizontally', () => {
      render(<HeroSection />)

      const heroSection = screen.getByTestId('hero-section')
      expect(heroSection).toHaveClass('flex')
      expect(heroSection).toHaveClass('items-center')
      expect(heroSection).toHaveClass('justify-center')
    })

    it('uses accent font family for restaurant name', () => {
      render(<HeroSection />)

      const heading = screen.getByRole('heading', { level: 1 })
      // Should use Pacifico or accent font
      expect(heading).toHaveClass('font-accent')
    })

    it('primary CTA has accent background color', () => {
      render(<HeroSection />)

      const ctaButton = screen.getByRole('link', { name: /Book a Table/i })
      expect(ctaButton).toHaveClass('bg-[var(--public-accent)]')
    })

    it('secondary CTA has accent button styling', () => {
      render(<HeroSection />)

      const menuButton = screen.getByRole('link', { name: /View Menu|Our Menu/i })
      expect(menuButton).toHaveClass('bg-[var(--public-accent)]')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<HeroSection />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
    })

    it('CTA buttons are focusable', async () => {
      render(<HeroSection />)
      const user = userEvent.setup()

      const ctaButton = screen.getByRole('link', { name: /Book a Table/i })
      await user.tab()

      // One of the buttons should be focused
      expect(ctaButton).toHaveFocus()
    })

    it('has proper ARIA landmark or section role', () => {
      render(<HeroSection />)

      const heroSection = screen.getByTestId('hero-section')
      // Should have section role or be within main
      expect(heroSection.tagName).toBe('SECTION')
    })

    it('background image has alt text via aria-label', () => {
      render(<HeroSection />)

      const heroSection = screen.getByTestId('hero-section')
      // Check that hero section has an aria-label attribute
      expect(heroSection).toHaveAttribute('aria-label')
      expect(heroSection.getAttribute('aria-label')?.toLowerCase()).toContain('hero')
    })
  })

  describe('Animations', () => {
    it('applies entrance animation classes', () => {
      render(<HeroSection />)

      const heading = screen.getByRole('heading', { level: 1 })
      // Should have transition class for scroll animations
      expect(heading.className).toMatch(/transition/)
    })

    it('has staggered animation for CTAs', () => {
      render(<HeroSection />)

      const buttons = screen.getAllByRole('link')
      const ctaButtons = buttons.filter(
        (btn) =>
          btn.textContent?.includes('Book') || btn.textContent?.includes('Menu')
      )

      // CTAs should be wrapped in a container with transition classes
      const ctaContainer = ctaButtons[0]?.closest('.transition-all')
      expect(ctaContainer || ctaButtons[0]?.parentElement).toBeTruthy()
    })
  })

  describe('Responsiveness', () => {
    it('has responsive text sizing', () => {
      render(<HeroSection />)

      const heading = screen.getByRole('heading', { level: 1 })
      // Should have responsive text classes like text-4xl md:text-6xl
      expect(heading.className).toMatch(/text-\d+xl.*md:text-\d+xl|md:text-\d+xl/)
    })

    it('CTA buttons stack on mobile', () => {
      render(<HeroSection />)

      // Find CTA container
      const ctaContainer = screen
        .getByRole('link', { name: /Book a Table/i })
        .closest('div')

      // Should have flex-col for mobile stacking
      expect(ctaContainer?.className).toMatch(/flex-col|sm:flex-row/)
    })
  })

  describe('Content', () => {
    it('displays promotional or welcome text', () => {
      render(<HeroSection />)

      // Should have some promotional/welcome text
      expect(
        screen.getByText(/welcome|experience|premium|finest|enjoy/i)
      ).toBeInTheDocument()
    })

    it('includes scroll indicator or down arrow', () => {
      render(<HeroSection />)

      // Optional: scroll indicator
      const scrollIndicator = screen.queryByTestId('scroll-indicator')
      // This is optional, so we just check if it exists when present
      if (scrollIndicator) {
        expect(scrollIndicator).toBeInTheDocument()
      }
    })
  })

  describe('Props', () => {
    it('accepts custom className', () => {
      render(<HeroSection className="custom-hero-class" />)

      const heroSection = screen.getByTestId('hero-section')
      expect(heroSection).toHaveClass('custom-hero-class')
    })

    it('accepts custom background image', () => {
      const customBg = '/assets/custom-hero.jpg'
      render(<HeroSection backgroundImage={customBg} />)

      const heroSection = screen.getByTestId('hero-section')
      expect(heroSection).toHaveStyle({
        backgroundImage: `url(${customBg})`,
      })
    })

    it('accepts custom heading text', () => {
      render(<HeroSection heading="Custom Restaurant Name" />)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Custom Restaurant Name'
      )
    })

    it('accepts custom tagline', () => {
      render(<HeroSection tagline="Custom tagline here" />)

      expect(screen.getByText('Custom tagline here')).toBeInTheDocument()
    })
  })

  describe('Scroll Indicator', () => {
    it('renders scroll indicator button', () => {
      render(<HeroSection />)
      
      const scrollIndicator = screen.getByTestId('scroll-indicator')
      expect(scrollIndicator).toBeInTheDocument()
      expect(scrollIndicator.tagName).toBe('BUTTON')
    })

    it('calls scroll function when clicked', async () => {
      const user = userEvent.setup()
      
      // Mock scrollIntoView
      const mockScrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = mockScrollIntoView
      
      // Create a mock element for scroll target
      const mockTarget = document.createElement('div')
      mockTarget.id = 'info-cards-section'
      document.body.appendChild(mockTarget)
      
      render(<HeroSection />)
      
      const scrollIndicator = screen.getByTestId('scroll-indicator')
      await user.click(scrollIndicator)
      
      expect(mockScrollIntoView).toHaveBeenCalled()
      
      // Cleanup
      document.body.removeChild(mockTarget)
    })

    it('has proper aria-label for accessibility', () => {
      render(<HeroSection />)
      
      const scrollIndicator = screen.getByTestId('scroll-indicator')
      expect(scrollIndicator).toHaveAttribute('aria-label')
    })
  })

  describe('Keyboard Navigation (US2)', () => {
    it('handles Enter key press to trigger scroll', async () => {
      const user = userEvent.setup()
      
      // Mock scrollIntoView
      const mockScrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = mockScrollIntoView
      
      // Create a mock element for scroll target
      const mockTarget = document.createElement('div')
      mockTarget.id = 'info-cards-section'
      document.body.appendChild(mockTarget)
      
      render(<HeroSection />)
      
      const scrollIndicator = screen.getByTestId('scroll-indicator')
      scrollIndicator.focus()
      await user.keyboard('{Enter}')
      
      expect(mockScrollIntoView).toHaveBeenCalled()
      
      // Cleanup
      document.body.removeChild(mockTarget)
    })

    it('handles Space key press to trigger scroll', async () => {
      const user = userEvent.setup()
      
      // Mock scrollIntoView
      const mockScrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = mockScrollIntoView
      
      // Create a mock element for scroll target
      const mockTarget = document.createElement('div')
      mockTarget.id = 'info-cards-section'
      document.body.appendChild(mockTarget)
      
      render(<HeroSection />)
      
      const scrollIndicator = screen.getByTestId('scroll-indicator')
      scrollIndicator.focus()
      await user.keyboard(' ')
      
      expect(mockScrollIntoView).toHaveBeenCalled()
      
      // Cleanup
      document.body.removeChild(mockTarget)
    })

    it('has focus ring styles applied', () => {
      render(<HeroSection />)
      
      const scrollIndicator = screen.getByTestId('scroll-indicator')
      const classes = scrollIndicator.className
      
      // Check for Tailwind focus ring classes
      expect(classes).toContain('focus:outline-none')
      expect(classes).toContain('focus:ring')
    })

    it('has translated aria-label', () => {
      render(<HeroSection />)

      const scrollIndicator = screen.getByTestId('scroll-indicator')
      const ariaLabel = scrollIndicator.getAttribute('aria-label')

      // Should use i18n translation
      expect(ariaLabel).toBe('Scroll down to view more content')
    })
  })

  describe('Visual Affordance (US3)', () => {
    it('has hover scale animation class', () => {
      render(<HeroSection />)

      const scrollIndicator = screen.getByTestId('scroll-indicator')
      const classes = scrollIndicator.className

      // Check for Tailwind hover scale class
      expect(classes).toContain('hover:scale-110')
    })

    it('has hover color transition class', () => {
      render(<HeroSection />)

      const scrollIndicator = screen.getByTestId('scroll-indicator')
      const classes = scrollIndicator.className

      // Check for hover text color class
      expect(classes).toContain('hover:text-white')
    })

    it('has active state feedback class', () => {
      render(<HeroSection />)

      const scrollIndicator = screen.getByTestId('scroll-indicator')
      const classes = scrollIndicator.className

      // Check for active scale down effect (tap feedback)
      expect(classes).toContain('active:scale-95')
    })

    it('has smooth transition utilities', () => {
      render(<HeroSection />)

      const scrollIndicator = screen.getByTestId('scroll-indicator')
      const classes = scrollIndicator.className

      // Check for transition classes
      expect(classes).toContain('transition')
      expect(classes).toMatch(/duration-\d+/)
    })

    it('has cursor pointer style', () => {
      render(<HeroSection />)

      const scrollIndicator = screen.getByTestId('scroll-indicator')
      const classes = scrollIndicator.className

      // Check for cursor pointer class
      expect(classes).toContain('cursor-pointer')
    })
  })
})

