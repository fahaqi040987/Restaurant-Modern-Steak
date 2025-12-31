/**
 * T038: E2E test for contact form submission
 * Tests: Page display, form validation, submission, success message, error handling
 *
 * Note: Playwright must be installed and configured to run these tests.
 * Run: npx playwright install && npx playwright test
 */
import { test, expect } from '@playwright/test'

test.describe('Contact Page', () => {
  test.describe('Page Load', () => {
    test.beforeEach(async ({ page }) => {
      // Skip loader for faster tests
      await page.goto('/site/contact')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should display contact page', async ({ page }) => {
      await expect(page).toHaveURL(/\/site\/contact/)
    })

    test('should display page heading', async ({ page }) => {
      const heading = page.locator('h1')
      await expect(heading).toBeVisible()
      await expect(heading).toContainText(/Contact/i)
    })

    test('should display contact form', async ({ page }) => {
      const form = page.locator('form[data-testid="contact-form"]')
      await expect(form).toBeVisible()
    })

    test('should have all required form fields', async ({ page }) => {
      // Name
      await expect(page.locator('input[name="name"]')).toBeVisible()

      // Email
      await expect(page.locator('input[name="email"]')).toBeVisible()

      // Phone (optional)
      await expect(page.locator('input[name="phone"]')).toBeVisible()

      // Subject
      await expect(page.locator('[data-testid="subject-trigger"]')).toBeVisible()

      // Message
      await expect(page.locator('textarea[name="message"]')).toBeVisible()
    })

    test('should have submit button', async ({ page }) => {
      const submitBtn = page.locator('button[type="submit"]')
      await expect(submitBtn).toBeVisible()
      await expect(submitBtn).toContainText(/Send|Submit/i)
    })

    test('should display contact info section', async ({ page }) => {
      // Should show location card
      await expect(page.locator('text=Our Location')).toBeVisible()

      // Should show contact details card
      await expect(page.locator('text=Contact Details')).toBeVisible()

      // Should show operating hours card
      await expect(page.locator('text=Operating Hours')).toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site/contact')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should show validation error for empty name', async ({ page }) => {
      // Submit empty form
      await page.click('button[type="submit"]')

      // Should show error for name
      await expect(page.locator('text=Name is required')).toBeVisible()
    })

    test('should show validation error for invalid email', async ({ page }) => {
      await page.fill('input[name="name"]', 'John Doe')
      await page.fill('input[name="email"]', 'invalid-email')

      // Select a subject
      await page.click('[data-testid="subject-trigger"]')
      await page.click('text=General Inquiry')

      await page.fill('textarea[name="message"]', 'This is a test message with enough characters.')

      await page.click('button[type="submit"]')

      // Should show email validation error
      await expect(page.locator('text=Invalid email')).toBeVisible()
    })

    test('should show validation error for empty subject', async ({ page }) => {
      await page.fill('input[name="name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')
      await page.fill('textarea[name="message"]', 'This is a test message with enough characters.')

      await page.click('button[type="submit"]')

      // Should show subject validation error
      await expect(page.locator('text=Please select a subject')).toBeVisible()
    })

    test('should show validation error for short message', async ({ page }) => {
      await page.fill('input[name="name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')

      // Select a subject
      await page.click('[data-testid="subject-trigger"]')
      await page.click('text=General Inquiry')

      await page.fill('textarea[name="message"]', 'Short') // Too short

      await page.click('button[type="submit"]')

      // Should show message validation error
      await expect(page.locator('text=Message must be at least 10 characters')).toBeVisible()
    })
  })

  test.describe('Form Submission', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site/contact')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should submit form successfully with valid data', async ({ page }) => {
      // Mock the API endpoint
      await page.route('**/api/v1/public/contact', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Contact form submitted successfully',
            data: { id: 'test-id' },
          }),
        })
      })

      // Fill form with valid data
      await page.fill('input[name="name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')
      await page.fill('input[name="phone"]', '+62812345678')

      // Select a subject
      await page.click('[data-testid="subject-trigger"]')
      await page.click('text=General Inquiry')

      await page.fill('textarea[name="message"]', 'This is a test message for the restaurant contact form.')

      await page.click('button[type="submit"]')

      // Should show success message
      await expect(page.locator('text=Thank You')).toBeVisible({ timeout: 5000 })
    })

    test('should show loading state during submission', async ({ page }) => {
      // Mock slow API
      await page.route('**/api/v1/public/contact', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} }),
        })
      })

      // Fill form
      await page.fill('input[name="name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')

      // Select a subject
      await page.click('[data-testid="subject-trigger"]')
      await page.click('text=General Inquiry')

      await page.fill('textarea[name="message"]', 'This is a test message for the restaurant.')

      await page.click('button[type="submit"]')

      // Button should show loading state
      const submitBtn = page.locator('button[type="submit"]')
      await expect(submitBtn).toBeDisabled()
    })

    test('should show error message on API failure', async ({ page }) => {
      // Mock API error
      await page.route('**/api/v1/public/contact', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Server error occurred',
          }),
        })
      })

      // Fill form
      await page.fill('input[name="name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')

      // Select a subject
      await page.click('[data-testid="subject-trigger"]')
      await page.click('text=General Inquiry')

      await page.fill('textarea[name="message"]', 'This is a test message for the restaurant.')

      await page.click('button[type="submit"]')

      // Should show error toast
      await expect(page.locator('text=Failed to send')).toBeVisible({ timeout: 5000 })
    })

    test('should allow sending another message after success', async ({ page }) => {
      // Mock successful API
      await page.route('**/api/v1/public/contact', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} }),
        })
      })

      // Fill and submit form
      await page.fill('input[name="name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')

      // Select a subject
      await page.click('[data-testid="subject-trigger"]')
      await page.click('text=General Inquiry')

      await page.fill('textarea[name="message"]', 'This is a test message for the restaurant.')

      await page.click('button[type="submit"]')

      // Wait for success
      await expect(page.locator('text=Thank You')).toBeVisible({ timeout: 5000 })

      // Click "Send Another Message" button
      await page.click('text=Send Another Message')

      // Form should be visible again
      await expect(page.locator('form[data-testid="contact-form"]')).toBeVisible()
    })
  })

  test.describe('Contact Info Display', () => {
    test.beforeEach(async ({ page }) => {
      // Mock restaurant info
      await page.route('**/api/v1/public/restaurant-info', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              name: 'Steak Kenangan',
              phone: '+62 21 1234 5678',
              email: 'info@steakkenangan.com',
              address: 'Jl. Sudirman No. 123',
              city: 'Jakarta',
              postal_code: '12345',
              operating_hours: [
                { id: 1, day_of_week: 0, open_time: '11:00', close_time: '22:00', is_closed: false },
                { id: 2, day_of_week: 1, open_time: '11:00', close_time: '22:00', is_closed: false },
                { id: 3, day_of_week: 2, open_time: '11:00', close_time: '22:00', is_closed: false },
                { id: 4, day_of_week: 3, open_time: '11:00', close_time: '22:00', is_closed: false },
                { id: 5, day_of_week: 4, open_time: '11:00', close_time: '22:00', is_closed: false },
                { id: 6, day_of_week: 5, open_time: '11:00', close_time: '23:00', is_closed: false },
                { id: 7, day_of_week: 6, open_time: '11:00', close_time: '23:00', is_closed: false },
              ],
            },
          }),
        })
      })

      await page.goto('/site/contact')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should display restaurant address', async ({ page }) => {
      await expect(page.locator('text=Jl. Sudirman No. 123')).toBeVisible()
      await expect(page.locator('text=Jakarta')).toBeVisible()
    })

    test('should display restaurant phone', async ({ page }) => {
      await expect(page.locator('text=+62 21 1234 5678')).toBeVisible()
    })

    test('should display restaurant email', async ({ page }) => {
      await expect(page.locator('text=info@steakkenangan.com')).toBeVisible()
    })

    test('should display operating hours', async ({ page }) => {
      // Should show days of the week
      await expect(page.locator('text=Monday')).toBeVisible()
      await expect(page.locator('text=Tuesday')).toBeVisible()
    })

    test('should have copy address button', async ({ page }) => {
      const copyBtn = page.locator('text=Copy Address')
      await expect(copyBtn).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site/contact')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should have proper form labels', async ({ page }) => {
      // Each input should have an associated label
      const inputs = ['name', 'email', 'phone', 'message']

      for (const name of inputs) {
        const label = page.locator(`label[for="${name}"]`)
        await expect(label).toBeVisible()
      }
    })

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through form fields
      await page.keyboard.press('Tab')

      // First input should be focused
      await expect(page.locator('input[name="name"]')).toBeFocused()

      // Continue tabbing
      await page.keyboard.press('Tab')
      await expect(page.locator('input[name="email"]')).toBeFocused()
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test.beforeEach(async ({ page }) => {
      await page.goto('/site/contact')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should display form in single column on mobile', async ({ page }) => {
      const form = page.locator('form[data-testid="contact-form"]')
      await expect(form).toBeVisible()

      // Form should be full width
      const box = await form.boundingBox()
      expect(box?.width).toBeLessThanOrEqual(375)
    })

    test('should stack contact info and form on mobile', async ({ page }) => {
      // Both sections should be visible
      await expect(page.locator('text=Our Location')).toBeVisible()
      await expect(page.locator('form[data-testid="contact-form"]')).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site/contact')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should be accessible from navigation', async ({ page }) => {
      // Go to homepage first
      await page.goto('/site')

      // Click contact link
      await page.click('nav >> text=Contact')

      await expect(page).toHaveURL(/\/site\/contact/)
    })
  })
})
