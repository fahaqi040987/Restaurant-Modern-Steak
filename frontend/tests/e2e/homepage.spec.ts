/**
 * T015: E2E test for homepage load and navigation
 * Tests: Loader animation, hero section display, navigation links, scroll animations
 *
 * Note: Playwright must be installed and configured to run these tests.
 * Run: npx playwright install && npx playwright test
 */
import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.describe('Page Load', () => {
    test('should display loader animation on first visit', async ({ page }) => {
      // Clear session storage to simulate first visit
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.clear())
      await page.reload()

      // Loader should be visible initially
      const loader = page.locator('[role="alert"][aria-busy="true"]')
      await expect(loader).toBeVisible()

      // Loader should contain restaurant name
      await expect(page.getByText('Steak Kenangan')).toBeVisible()

      // Loader should contain loading dots
      await expect(page.locator('.loader-dot')).toHaveCount(3)

      // Wait for loader to fade out (duration ~2500ms)
      await expect(loader).toBeHidden({ timeout: 5000 })
    })

    test('should not show loader on subsequent visits', async ({ page }) => {
      // First visit
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))

      // Reload page
      await page.reload()

      // Loader should not be visible
      const loader = page.locator('[role="alert"][aria-busy="true"]')
      await expect(loader).toBeHidden()
    })

    test('should display hero section after loader', async ({ page }) => {
      await page.goto('/site')

      // Wait for loader to complete
      await page.waitForSelector('[role="alert"][aria-busy="true"]', {
        state: 'hidden',
        timeout: 5000,
      })

      // Hero section should be visible
      const heroSection = page.locator('[data-testid="hero-section"]')
      await expect(heroSection).toBeVisible()
    })
  })

  test.describe('Header Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Skip loader for navigation tests
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
      await page.reload()
    })

    test('should display fixed header', async ({ page }) => {
      const header = page.locator('header[role="banner"]')
      await expect(header).toBeVisible()
      await expect(header).toHaveClass(/header-fixed/)
    })

    test('should show restaurant name/logo in header', async ({ page }) => {
      const logo = page.locator('header a[aria-label*="Home"]')
      await expect(logo).toBeVisible()
      await expect(logo).toContainText('Steak Kenangan')
    })

    test('should have navigation links', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Main navigation"]')
      await expect(nav).toBeVisible()

      // Check all main navigation links (English or Indonesian)
      const links = [
        { en: 'Home', id: 'Beranda' },
        { en: 'Menu', id: 'Menu' },
        { en: 'About', id: 'Tentang' },
        { en: 'Reservation', id: 'Reservasi' },
        { en: 'Contact', id: 'Kontak' }
      ]
      for (const link of links) {
        const linkElement = nav.getByRole('link', { name: new RegExp(`${link.en}|${link.id}`, 'i') })
        await expect(linkElement).toBeVisible()
      }
    })

    test('should navigate to menu page', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Main navigation"]')
      await nav.getByRole('link', { name: 'Menu' }).first().click()
      await expect(page).toHaveURL(/\/site\/menu/)
    })

    test('should navigate to about page', async ({ page }) => {
      // Support English and Indonesian
      const nav = page.locator('nav[aria-label="Main navigation"]')
      await nav.getByRole('link', { name: /About|Tentang/i }).first().click()
      await expect(page).toHaveURL(/\/site\/about/)
    })

    test('should navigate to reservation page', async ({ page }) => {
      // Support English and Indonesian
      const nav = page.locator('nav[aria-label="Main navigation"]')
      await nav.getByRole('link', { name: /Reservation|Reservasi/i }).first().click()
      await expect(page).toHaveURL(/\/site\/reservation/)
    })

    test('should navigate to contact page', async ({ page }) => {
      // Support English and Indonesian
      const nav = page.locator('nav[aria-label="Main navigation"]')
      await nav.getByRole('link', { name: /Contact|Kontak/i }).first().click()
      await expect(page).toHaveURL(/\/site\/contact/)
    })

    test('should have Staff Login link', async ({ page }) => {
      // Support English and Indonesian
      const staffLoginLink = page.getByRole('link', { name: /Staff Login|Login Staf/i })
      await expect(staffLoginLink).toBeVisible()
    })

    test('should navigate to login page via Staff Login link', async ({ page }) => {
      // Support English and Indonesian - use role-based selector
      const staffLoginLink = page.getByRole('link', { name: /Staff Login|Login Staf/i }).first()
      await staffLoginLink.click()
      await expect(page).toHaveURL(/\/login/)
    })

    test('should have Book a Table CTA button', async ({ page }) => {
      // Support English and Indonesian
      const ctaButton = page.getByRole('link', { name: /Book a Table|Pesan Meja/i })
      await expect(ctaButton).toBeVisible()
    })

    test('should change header style on scroll', async ({ page }) => {
      const header = page.locator('header[role="banner"]')

      // Initially transparent
      await expect(header).toHaveClass(/bg-transparent/)

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 100))
      await page.waitForTimeout(300) // Wait for scroll handler

      // Header should have solid background
      await expect(header).not.toHaveClass(/bg-transparent/)
    })
  })

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test.beforeEach(async ({ page }) => {
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
      await page.reload()
    })

    test('should show hamburger menu on mobile', async ({ page }) => {
      const hamburger = page.locator('button[aria-label*="menu"]')
      await expect(hamburger).toBeVisible()
    })

    test('should hide desktop navigation on mobile', async ({ page }) => {
      // Desktop nav should be hidden
      const desktopNav = page.locator('.hidden.lg\\:flex')
      await expect(desktopNav).toBeHidden()
    })

    test('should open mobile menu when clicking hamburger', async ({ page }) => {
      await page.getByRole('button', { name: /menu/i }).first().click()

      // Mobile menu should be visible
      const mobileMenu = page.locator('#mobile-menu')
      await expect(mobileMenu).toBeVisible()
    })

    test('should close mobile menu when clicking nav link', async ({ page }) => {
      await page.getByRole('button', { name: /menu/i }).first().click()

      // Click a navigation link
      const mobileMenu = page.locator('#mobile-menu')
      await mobileMenu.getByRole('link', { name: 'Menu' }).first().click()

      // Should navigate
      await expect(page).toHaveURL(/\/site\/menu/)
    })
  })

  test.describe('Footer', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
      await page.reload()
    })

    test('should display footer', async ({ page }) => {
      const footer = page.locator('footer[role="contentinfo"]')
      await expect(footer).toBeVisible()
    })

    test('should display reservation CTA box', async ({ page }) => {
      // Support English and Indonesian - enhanced with more variations
      const reservationBox = page.locator('text=Reserve Your Table|Reservasi Meja Anda|Pesan Meja Anda')
      await expect(reservationBox).toBeVisible()
    })

    test('should have Book Now button in footer', async ({ page }) => {
      // Support English and Indonesian
      const bookNowBtn = page.locator('footer >> text=Book Now|Pesan Sekarang')
      await expect(bookNowBtn).toBeVisible()
    })

    test('should display quick links section', async ({ page }) => {
      // Support English and Indonesian
      const quickLinks = page.locator('text=Quick Links|Tautan Cepat')
      await expect(quickLinks).toBeVisible()
    })

    test('should display contact info section', async ({ page }) => {
      // Support English and Indonesian
      const contactInfo = page.locator('text=Contact Us|Hubungi Kami')
      await expect(contactInfo).toBeVisible()
    })

    test('should display opening hours section', async ({ page }) => {
      // Support English and Indonesian
      const hours = page.locator('text=Opening Hours|Jam Buka')
      await expect(hours).toBeVisible()
    })

    test('should have Staff Portal link in footer', async ({ page }) => {
      // Support English and Indonesian
      const staffPortal = page.locator('footer >> text=Staff Portal|Portal Staf')
      await expect(staffPortal).toBeVisible()
    })
  })

  test.describe('Scroll Animations', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
      await page.reload()
    })

    test('should apply scroll animations to elements', async ({ page }) => {
      // Scroll to trigger animations
      await page.evaluate(() => window.scrollTo(0, 500))
      await page.waitForTimeout(500) // Wait for animation

      // Check for animated elements (elements with scroll animation classes)
      const animatedElements = page.locator('[data-aos], .animate-fade-up')
      const count = await animatedElements.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
      await page.reload()
    })

    test('should have proper landmark roles', async ({ page }) => {
      // Banner (header)
      await expect(page.locator('[role="banner"]')).toBeVisible()

      // Main content
      await expect(page.locator('[role="main"]')).toBeVisible()

      // Footer
      await expect(page.locator('[role="contentinfo"]')).toBeVisible()
    })

    test('should have proper navigation labels', async ({ page }) => {
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible()
    })

    test('loader should have accessibility attributes', async ({ page }) => {
      await page.evaluate(() => sessionStorage.clear())
      await page.reload()

      const loader = page.locator('[role="alert"]')
      await expect(loader).toHaveAttribute('aria-busy', 'true')
      await expect(loader).toHaveAttribute('aria-label', 'Loading page content')
    })
  })
})
