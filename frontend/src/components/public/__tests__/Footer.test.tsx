/**
 * Unit tests for Footer component
 * Tests: Open/closed status badge, operating hours display, responsive design
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { ReactNode } from 'react'

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'public.home': 'Home',
    'public.ourMenu': 'Our Menu',
    'public.aboutUs': 'About Us',
    'public.reservations': 'Reservations',
    'public.contact': 'Contact',
    'public.openingHours': 'Opening Hours',
    'public.openNow': 'Open Now',
    'public.closedNow': 'Closed Now',
    'public.quickLinks': 'Quick Links',
    'public.contactUs': 'Contact Us',
    'public.staffPortal': 'Staff Portal',
    'public.privacyPolicy': 'Privacy Policy',
    'public.termsOfService': 'Terms of Service',
    'public.allRightsReserved': 'All rights reserved.',
    'public.reserveYourTable': 'Reserve Your Table',
    'public.experiencePremiumDining': 'Experience premium dining at Steak Kenangan',
    'public.bookNow': 'Book Now',
    'public.hoursNotAvailable': 'Hours not available',
    'public.monday': 'Monday',
    'public.tuesday': 'Tuesday',
    'public.wednesday': 'Wednesday',
    'public.thursday': 'Thursday',
    'public.friday': 'Friday',
    'public.saturday': 'Saturday',
    'public.sunday': 'Sunday',
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
}))

import { Footer } from '../Footer'

const mockRestaurantInfoOpen = {
  id: '123',
  name: 'Steak Kenangan',
  tagline: 'Premium Steakhouse Experience',
  description: 'Premium dining experience',
  address: 'Jl. Sudirman No. 123',
  city: 'Jakarta',
  postal_code: '12345',
  country: 'Indonesia',
  phone: '+62 812 3456 7890',
  email: 'info@steakkenangan.com',
  whatsapp: '+62 812 3456 7890',
  map_latitude: -6.2088,
  map_longitude: 106.8456,
  google_maps_url: 'https://maps.google.com',
  instagram_url: 'https://instagram.com/steakkenangan',
  facebook_url: 'https://facebook.com/steakkenangan',
  twitter_url: 'https://twitter.com/steakkenangan',
  logo_url: 'https://example.com/logo.png',
  hero_image_url: 'https://example.com/hero.png',
  timezone: 'Asia/Jakarta',
  is_open_now: true,
  operating_hours: [
    {
      id: '1',
      restaurant_info_id: '123',
      day_of_week: 1,
      open_time: '10:00:00',
      close_time: '22:00:00',
      is_closed: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      restaurant_info_id: '123',
      day_of_week: 2,
      open_time: '10:00:00',
      close_time: '22:00:00',
      is_closed: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockRestaurantInfoClosed = {
  ...mockRestaurantInfoOpen,
  is_open_now: false,
}

describe('Footer Component', () => {
  describe('Open/Closed Status Badge', () => {
    it('renders "Open Now" badge when restaurant is open', () => {
      render(<Footer restaurantInfo={mockRestaurantInfoOpen} />)

      const openBadge = screen.getByText('Open Now')
      expect(openBadge).toBeInTheDocument()
    })

    it('renders "Closed Now" badge when restaurant is closed', () => {
      render(<Footer restaurantInfo={mockRestaurantInfoClosed} />)

      const closedBadge = screen.getByText('Closed Now')
      expect(closedBadge).toBeInTheDocument()
    })

    it('applies green styling for open status', () => {
      render(<Footer restaurantInfo={mockRestaurantInfoOpen} />)

      const openBadge = screen.getByText('Open Now').closest('span')
      expect(openBadge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('applies red styling for closed status', () => {
      render(<Footer restaurantInfo={mockRestaurantInfoClosed} />)

      const closedBadge = screen.getByText('Closed Now').closest('span')
      expect(closedBadge).toHaveClass('bg-red-100', 'text-red-800')
    })

    it('shows pulsing dot for open status', () => {
      const { container } = render(<Footer restaurantInfo={mockRestaurantInfoOpen} />)

      const pulsingDot = container.querySelector('.animate-pulse')
      expect(pulsingDot).toBeInTheDocument()
      expect(pulsingDot).toHaveClass('bg-green-500')
    })

    it('shows static dot for closed status', () => {
      const { container } = render(<Footer restaurantInfo={mockRestaurantInfoClosed} />)

      const staticDot = container.querySelector('.bg-red-500.rounded-full')
      expect(staticDot).toBeInTheDocument()
      expect(staticDot).not.toHaveClass('animate-pulse')
    })

    it('does not render badge when restaurantInfo is null', () => {
      render(<Footer restaurantInfo={null} />)

      const openBadge = screen.queryByText('Open Now')
      const closedBadge = screen.queryByText('Closed Now')

      expect(openBadge).not.toBeInTheDocument()
      expect(closedBadge).not.toBeInTheDocument()
    })

    it('does not render badge when restaurantInfo is undefined', () => {
      render(<Footer restaurantInfo={undefined} />)

      const openBadge = screen.queryByText('Open Now')
      const closedBadge = screen.queryByText('Closed Now')

      expect(openBadge).not.toBeInTheDocument()
      expect(closedBadge).not.toBeInTheDocument()
    })
  })

  describe('Operating Hours Display', () => {
    it('renders operating hours from restaurantInfo', () => {
      render(<Footer restaurantInfo={mockRestaurantInfoOpen} />)

      // Check if operating hours section exists
      const operatingHoursSection = screen.getByText('Opening Hours')
      expect(operatingHoursSection).toBeInTheDocument()

      // Check if specific times are displayed
      expect(screen.getByText(/10:00 AM - 10:00 PM WIB/i)).toBeInTheDocument()
    })

    it('shows hours not available message when no hours provided', () => {
      const infoWithoutHours = {
        ...mockRestaurantInfoOpen,
        operating_hours: [],
      }

      render(<Footer restaurantInfo={infoWithoutHours} />)

      expect(screen.getByText('Hours not available')).toBeInTheDocument()
    })
  })

  describe('General Footer Structure', () => {
    it('renders footer element with correct role', () => {
      const { container } = render(<Footer restaurantInfo={mockRestaurantInfoOpen} />)

      const footer = container.querySelector('footer[role="contentinfo"]')
      expect(footer).toBeInTheDocument()
    })

    it('renders quick links section', () => {
      render(<Footer restaurantInfo={mockRestaurantInfoOpen} />)

      expect(screen.getByText('Quick Links')).toBeInTheDocument()
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Our Menu')).toBeInTheDocument()
      expect(screen.getByText('About Us')).toBeInTheDocument()
    })

    it('renders contact information section', () => {
      render(<Footer restaurantInfo={mockRestaurantInfoOpen} />)

      expect(screen.getByText('Contact Us')).toBeInTheDocument()
      expect(screen.getByText('+62 812 3456 7890')).toBeInTheDocument()
      expect(screen.getByText('info@steakkenangan.com')).toBeInTheDocument()
    })

    it('renders staff portal link', () => {
      render(<Footer restaurantInfo={mockRestaurantInfoOpen} />)

      expect(screen.getByText('Staff Portal')).toBeInTheDocument()
    })

    it('renders copyright notice', () => {
      render(<Footer restaurantInfo={mockRestaurantInfoOpen} />)

      const currentYear = new Date().getFullYear()
      expect(screen.getByText(new RegExp(`© ${currentYear} Steak Kenangan`))).toBeInTheDocument()
    })

    it('renders privacy policy and terms links', () => {
      render(<Footer restaurantInfo={mockRestaurantInfoOpen} />)

      expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
      expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('applies custom className prop', () => {
      const { container } = render(
        <Footer restaurantInfo={mockRestaurantInfoOpen} className="custom-class" />
      )

      const footer = container.querySelector('footer')
      expect(footer).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels on social media links', () => {
      const { container } = render(
        <Footer
          restaurantInfo={{
            ...mockRestaurantInfoOpen,
            instagram_url: 'https://instagram.com/test',
            facebook_url: 'https://facebook.com/test',
          }}
        />
      )

      const instagramLink = container.querySelector('a[href="https://instagram.com/test"]')
      const facebookLink = container.querySelector('a[href="https://facebook.com/test"]')

      expect(instagramLink).toHaveAttribute('aria-label', 'Follow us on Instagram')
      expect(facebookLink).toHaveAttribute('aria-label', 'Follow us on Facebook')
    })
  })
})
