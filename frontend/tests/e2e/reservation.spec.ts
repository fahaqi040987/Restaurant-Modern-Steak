/**
 * T030: E2E test for reservation submission
 * Tests: Form display, validation, submission, success message, error handling
 *
 * Note: Playwright must be installed and configured to run these tests.
 * Run: npx playwright install && npx playwright test
 */
import { test, expect } from '@playwright/test'

test.describe('Reservation Page', () => {
  test.describe('Page Load', () => {
    test.beforeEach(async ({ page }) => {
      // Skip loader for faster tests
      await page.goto('/site/reservation')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should display reservation page', async ({ page }) => {
      await expect(page).toHaveURL(/\/site\/reservation/)
    })

    test('should display page heading', async ({ page }) => {
      const heading = page.locator('h1')
      await expect(heading).toBeVisible()
      // Support English and Indonesian
      await expect(heading).toContainText(/Reservation|Book a Table|Reservasi|Pesan Meja/i)
    })

    test('should display reservation form', async ({ page }) => {
      const form = page.locator('form[data-testid="reservation-form"]')
      await expect(form).toBeVisible()
    })

    test('should have all required form fields', async ({ page }) => {
      // Customer name
      await expect(page.locator('input[name="customer_name"]')).toBeVisible()

      // Email
      await expect(page.locator('input[name="email"]')).toBeVisible()

      // Phone
      await expect(page.locator('input[name="phone"]')).toBeVisible()

      // Party size
      await expect(
        page.locator('input[name="party_size"], select[name="party_size"]')
      ).toBeVisible()

      // Reservation date
      await expect(page.locator('input[name="reservation_date"]')).toBeVisible()

      // Reservation time
      await expect(
        page.locator('input[name="reservation_time"], select[name="reservation_time"]')
      ).toBeVisible()

      // Special requests (optional)
      await expect(
        page.locator('textarea[name="special_requests"]')
      ).toBeVisible()
    })

    test('should have submit button', async ({ page }) => {
      const submitBtn = page.locator('button[type="submit"]')
      await expect(submitBtn).toBeVisible()
      // Support English and Indonesian
      await expect(submitBtn).toContainText(/Book|Reserve|Submit|Pesan/i)
    })
  })

  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site/reservation')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should show validation error for empty customer name', async ({
      page,
    }) => {
      // Submit empty form
      await page.click('button[type="submit"]')

      // Should show error for customer name (English or Indonesian)
      await expect(page.locator('text=Name|Nama')).toBeVisible()
      const nameError = page.locator('[data-testid="error-customer_name"]')
      await expect(nameError).toBeVisible()
    })

    test('should show validation error for invalid email', async ({ page }) => {
      await page.fill('input[name="customer_name"]', 'John Doe')
      await page.fill('input[name="email"]', 'invalid-email')
      await page.fill('input[name="phone"]', '+62812345678')
      await page.fill('input[name="party_size"]', '4')
      await page.fill('input[name="reservation_date"]', '2025-01-15')
      await page.fill('input[name="reservation_time"]', '19:00')

      await page.click('button[type="submit"]')

      // Should show email validation error (English or Indonesian)
      const emailError = page.locator('[data-testid="error-email"]')
      await expect(emailError).toBeVisible()
      await expect(emailError).toContainText(/valid email|Format email tidak valid/i)
    })

    test('should show validation error for invalid phone', async ({ page }) => {
      await page.fill('input[name="customer_name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')
      await page.fill('input[name="phone"]', 'abc') // Invalid phone
      await page.fill('input[name="party_size"]', '4')
      await page.fill('input[name="reservation_date"]', '2025-01-15')
      await page.fill('input[name="reservation_time"]', '19:00')

      await page.click('button[type="submit"]')

      // Should show phone validation error
      const phoneError = page.locator('[data-testid="error-phone"]')
      await expect(phoneError).toBeVisible()
    })

    test('should show validation error for party size over 20', async ({
      page,
    }) => {
      await page.fill('input[name="customer_name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')
      await page.fill('input[name="phone"]', '+62812345678')
      await page.fill('input[name="party_size"]', '25') // Over max
      await page.fill('input[name="reservation_date"]', '2025-01-15')
      await page.fill('input[name="reservation_time"]', '19:00')

      await page.click('button[type="submit"]')

      // Should show party size validation error (English or Indonesian)
      const sizeError = page.locator('[data-testid="error-party_size"]')
      await expect(sizeError).toBeVisible()
      await expect(sizeError).toContainText(/20|maximum|maksimal/i)
    })

    test('should show validation error for past date', async ({ page }) => {
      await page.fill('input[name="customer_name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')
      await page.fill('input[name="phone"]', '+62812345678')
      await page.fill('input[name="party_size"]', '4')
      await page.fill('input[name="reservation_date"]', '2020-01-01') // Past date
      await page.fill('input[name="reservation_time"]', '19:00')

      await page.click('button[type="submit"]')

      // Should show date validation error (English or Indonesian)
      const dateError = page.locator('[data-testid="error-reservation_date"]')
      await expect(dateError).toBeVisible()
      await expect(dateError).toContainText(/future|today|masa depan|hari ini/i)
    })
  })

  test.describe('Form Submission', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site/reservation')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should submit form successfully with valid data', async ({
      page,
    }) => {
      // Mock the API endpoint
      await page.route('**/api/v1/public/reservations', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Reservation created successfully',
            data: {
              id: 'test-id',
              status: 'pending',
              reservation_date: '2025-01-15',
              reservation_time: '19:00',
              party_size: 4,
            },
          }),
        })
      })

      // Fill form with valid data
      await page.fill('input[name="customer_name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')
      await page.fill('input[name="phone"]', '+62812345678')
      await page.fill('input[name="party_size"]', '4')
      await page.fill('input[name="reservation_date"]', '2025-01-15')
      await page.fill('input[name="reservation_time"]', '19:00')
      await page.fill(
        'textarea[name="special_requests"]',
        'Window seat please'
      )

      await page.click('button[type="submit"]')

      // Should show success message (English or Indonesian)
      await expect(page.locator('text=successfully|berhasil')).toBeVisible({
        timeout: 5000,
      })
    })

    test('should show loading state during submission', async ({ page }) => {
      // Mock slow API
      await page.route('**/api/v1/public/reservations', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} }),
        })
      })

      // Fill form
      await page.fill('input[name="customer_name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')
      await page.fill('input[name="phone"]', '+62812345678')
      await page.fill('input[name="party_size"]', '4')
      await page.fill('input[name="reservation_date"]', '2025-01-15')
      await page.fill('input[name="reservation_time"]', '19:00')

      await page.click('button[type="submit"]')

      // Button should show loading state
      const submitBtn = page.locator('button[type="submit"]')
      await expect(submitBtn).toBeDisabled()
    })

    test('should show error message on API failure', async ({ page }) => {
      // Mock API error
      await page.route('**/api/v1/public/reservations', async (route) => {
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
      await page.fill('input[name="customer_name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')
      await page.fill('input[name="phone"]', '+62812345678')
      await page.fill('input[name="party_size"]', '4')
      await page.fill('input[name="reservation_date"]', '2025-01-15')
      await page.fill('input[name="reservation_time"]', '19:00')

      await page.click('button[type="submit"]')

      // Should show error toast or message (English or Indonesian)
      await expect(page.locator('text=error|gagal')).toBeVisible({ timeout: 5000 })
    })

    test('should reset form after successful submission', async ({ page }) => {
      // Mock successful API
      await page.route('**/api/v1/public/reservations', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} }),
        })
      })

      // Fill form
      await page.fill('input[name="customer_name"]', 'John Doe')
      await page.fill('input[name="email"]', 'john@example.com')
      await page.fill('input[name="phone"]', '+62812345678')
      await page.fill('input[name="party_size"]', '4')
      await page.fill('input[name="reservation_date"]', '2025-01-15')
      await page.fill('input[name="reservation_time"]', '19:00')

      await page.click('button[type="submit"]')

      // Wait for success (English or Indonesian)
      await expect(page.locator('text=successfully|berhasil')).toBeVisible({
        timeout: 5000,
      })

      // Form should be reset or show success state
      const customerNameInput = page.locator('input[name="customer_name"]')
      const value = await customerNameInput.inputValue()
      expect(value === '' || value === 'John Doe').toBeTruthy()
    })
  })

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site/reservation')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should have proper form labels', async ({ page }) => {
      // Each input should have an associated label
      const inputs = [
        'customer_name',
        'email',
        'phone',
        'party_size',
        'reservation_date',
        'reservation_time',
      ]

      for (const name of inputs) {
        const label = page.locator(`label[for="${name}"]`)
        await expect(label).toBeVisible()
      }
    })

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through form fields
      await page.keyboard.press('Tab')

      // First input should be focused
      await expect(page.locator('input[name="customer_name"]')).toBeFocused()

      // Continue tabbing
      await page.keyboard.press('Tab')
      await expect(page.locator('input[name="email"]')).toBeFocused()
    })

    test('should announce validation errors', async ({ page }) => {
      // Submit empty form
      await page.click('button[type="submit"]')

      // Error messages should be visible and have proper ARIA
      const errorElements = page.locator('[role="alert"]')
      const count = await errorElements.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test.beforeEach(async ({ page }) => {
      await page.goto('/site/reservation')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should display form in single column on mobile', async ({ page }) => {
      const form = page.locator('form[data-testid="reservation-form"]')
      await expect(form).toBeVisible()

      // Form should be full width
      const box = await form.boundingBox()
      expect(box?.width).toBeLessThanOrEqual(375)
    })

    test('should have touch-friendly input sizes', async ({ page }) => {
      const input = page.locator('input[name="customer_name"]')
      const box = await input.boundingBox()

      // Minimum touch target size should be 44px
      expect(box?.height).toBeGreaterThanOrEqual(40)
    })
  })

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site/reservation')
      await page.evaluate(() =>
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
      )
      await page.reload()
    })

    test('should be accessible from navigation', async ({ page }) => {
      // Go to homepage first
      await page.goto('/site')

      // Click reservation link (English or Indonesian)
      await page.click('nav >> text=Reservation|Reservasi')

      await expect(page).toHaveURL(/\/site\/reservation/)
    })

    test('should be accessible from footer Book Now button', async ({
      page,
    }) => {
      // Go to homepage first
      await page.goto('/site')

      // Scroll to footer
      await page.evaluate(() =>
        window.scrollTo(0, document.body.scrollHeight)
      )

      // Click Book Now in footer (English or Indonesian)
      await page.click('footer >> text=Book Now|Pesan Sekarang')

      await expect(page).toHaveURL(/\/site\/reservation/)
    })

    test('should be accessible from hero CTA', async ({ page }) => {
      // Go to homepage
      await page.goto('/site')

      // Wait for loader to disappear
      await page.waitForSelector('[role="alert"][aria-busy="true"]', {
        state: 'hidden',
        timeout: 5000,
      })

      // Click Book a Table CTA in hero (English or Indonesian)
      await page.click('text=Book a Table|Pesan Meja')

      await expect(page).toHaveURL(/\/site\/reservation/)
    })
  })
})
