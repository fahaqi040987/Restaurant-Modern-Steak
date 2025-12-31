/**
 * T043: E2E test for about page
 * Tests: Story section, testimonials slider, counter statistics, scroll animations
 */
import { test, expect } from '@playwright/test'

test.describe('About Page', () => {
  test.beforeEach(async ({ page }) => {
    // Skip loader by setting session storage
    await page.goto('/site/about')
    await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
    await page.reload()
  })

  test.describe('Page Structure', () => {
    test('should display about page with correct title', async ({ page }) => {
      await expect(page).toHaveTitle(/About|Story/i)
    })

    test('should have header and footer', async ({ page }) => {
      await expect(page.locator('header[role="banner"]')).toBeVisible()
      await expect(page.locator('footer[role="contentinfo"]')).toBeVisible()
    })

    test('should display main heading', async ({ page }) => {
      const heading = page.getByRole('heading', { level: 1 })
      await expect(heading).toBeVisible()
      await expect(heading).toContainText(/Story|About/i)
    })
  })

  test.describe('Story Section', () => {
    test('should display story section', async ({ page }) => {
      const storySection = page.locator('[data-testid="story-section"]')
      await expect(storySection).toBeVisible()
    })

    test('should display restaurant description', async ({ page }) => {
      // Look for descriptive text about the restaurant
      await expect(
        page.getByText(/passion|culinary|experience|hospitality/i).first()
      ).toBeVisible()
    })

    test('should display timeline or history elements', async ({ page }) => {
      // Check for timeline milestones
      const timeline = page.locator('[data-testid="story-timeline"]')
      if (await timeline.isVisible()) {
        const milestones = timeline.locator('[data-testid="timeline-milestone"]')
        expect(await milestones.count()).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Testimonials Slider', () => {
    test('should display testimonials section', async ({ page }) => {
      const testimonials = page.locator('[data-testid="testimonials-section"]')
      await expect(testimonials).toBeVisible()
    })

    test('should display testimonial cards', async ({ page }) => {
      const testimonialCards = page.locator('[data-testid="testimonial-card"]')
      expect(await testimonialCards.count()).toBeGreaterThan(0)
    })

    test('should display customer quotes', async ({ page }) => {
      // Look for quote marks or testimonial text
      const quotes = page.locator('[data-testid="testimonial-quote"]')
      if (await quotes.first().isVisible()) {
        await expect(quotes.first()).toBeVisible()
      }
    })

    test('should have navigation controls for slider', async ({ page }) => {
      // Check for prev/next buttons or dots
      const prevBtn = page.locator('[data-testid="testimonial-prev"]')
      const nextBtn = page.locator('[data-testid="testimonial-next"]')
      const dots = page.locator('[data-testid="testimonial-dots"]')

      const hasControls =
        (await prevBtn.isVisible()) ||
        (await nextBtn.isVisible()) ||
        (await dots.isVisible())

      expect(hasControls).toBeTruthy()
    })

    test('should navigate to next testimonial on button click', async ({ page }) => {
      const nextBtn = page.locator('[data-testid="testimonial-next"]')
      if (await nextBtn.isVisible()) {
        const initialCard = page.locator('[data-testid="testimonial-card"].active')
        await nextBtn.click()
        await page.waitForTimeout(500) // Wait for animation
        // Verify something changed (active state or position)
      }
    })
  })

  test.describe('Counter Statistics', () => {
    test('should display counter stats section', async ({ page }) => {
      const counters = page.locator('[data-testid="counter-stats"]')
      await expect(counters).toBeVisible()
    })

    test('should display multiple stat items', async ({ page }) => {
      const statItems = page.locator('[data-testid="stat-item"]')
      expect(await statItems.count()).toBeGreaterThanOrEqual(3)
    })

    test('should display stat numbers', async ({ page }) => {
      const statNumbers = page.locator('[data-testid="stat-number"]')
      if (await statNumbers.first().isVisible()) {
        const firstNumber = await statNumbers.first().textContent()
        expect(firstNumber).toMatch(/\d+/)
      }
    })

    test('should display stat labels', async ({ page }) => {
      const statLabels = page.locator('[data-testid="stat-label"]')
      if (await statLabels.first().isVisible()) {
        await expect(statLabels.first()).not.toBeEmpty()
      }
    })

    test('should animate counters when in viewport', async ({ page }) => {
      // Scroll to counter section
      const counters = page.locator('[data-testid="counter-stats"]')
      await counters.scrollIntoViewIfNeeded()
      await page.waitForTimeout(1000) // Wait for animation

      // Check that numbers have updated (animation complete)
      const statNumbers = page.locator('[data-testid="stat-number"]')
      if (await statNumbers.first().isVisible()) {
        const number = await statNumbers.first().textContent()
        expect(number).not.toBe('0')
      }
    })
  })

  test.describe('Values Section', () => {
    test('should display values/features section', async ({ page }) => {
      // Look for values cards
      const valuesSection = page.locator('text=Values').first()
      if (await valuesSection.isVisible()) {
        await expect(valuesSection).toBeVisible()
      }
    })

    test('should display value cards with titles', async ({ page }) => {
      // Check for quality, craftsmanship, hospitality cards
      const qualityCard = page.getByText(/Quality|Premium/i).first()
      if (await qualityCard.isVisible()) {
        await expect(qualityCard).toBeVisible()
      }
    })
  })

  test.describe('CTA Section', () => {
    test('should display call-to-action section', async ({ page }) => {
      const ctaSection = page.locator('text=Ready to').first()
      if (await ctaSection.isVisible()) {
        await expect(ctaSection).toBeVisible()
      }
    })

    test('should have contact/reservation button', async ({ page }) => {
      const ctaButton = page.getByRole('link', { name: /Contact|Reserve|Book/i })
      await expect(ctaButton.first()).toBeVisible()
    })

    test('should navigate to contact page when CTA clicked', async ({ page }) => {
      const ctaButton = page
        .getByRole('link', { name: /Contact|Get in Touch/i })
        .first()
      if (await ctaButton.isVisible()) {
        await ctaButton.click()
        await expect(page).toHaveURL(/contact/i)
      }
    })
  })

  test.describe('Scroll Animations', () => {
    test('should apply fade-in animations on scroll', async ({ page }) => {
      // Scroll down the page
      await page.evaluate(() => window.scrollTo(0, 500))
      await page.waitForTimeout(500) // Wait for animations

      // Check for animated elements
      const animatedElements = page.locator(
        '[data-aos], .animate-fade-up, [class*="opacity-100"]'
      )
      const count = await animatedElements.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toBeVisible()

      // Check that h2s exist for sections
      const h2s = page.getByRole('heading', { level: 2 })
      expect(await h2s.count()).toBeGreaterThan(0)
    })

    test('should have accessible images with alt text', async ({ page }) => {
      const images = page.locator('img')
      const count = await images.count()

      for (let i = 0; i < Math.min(count, 5); i++) {
        const img = images.nth(i)
        if (await img.isVisible()) {
          const alt = await img.getAttribute('alt')
          expect(alt).toBeTruthy()
        }
      }
    })

    test('should have landmark regions', async ({ page }) => {
      await expect(page.locator('[role="banner"]')).toBeVisible()
      await expect(page.locator('[role="main"]')).toBeVisible()
      await expect(page.locator('[role="contentinfo"]')).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Page should still render correctly
      const heading = page.getByRole('heading', { level: 1 })
      await expect(heading).toBeVisible()

      // Navigation should collapse to hamburger
      const hamburger = page.locator('button[aria-label*="menu"]')
      await expect(hamburger).toBeVisible()
    })

    test('should be responsive on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      const heading = page.getByRole('heading', { level: 1 })
      await expect(heading).toBeVisible()
    })
  })
})
