/**
 * T049: E2E test for staff login access from public site
 * Tests: Staff login link visibility, navigation, login functionality, role-based redirects
 */
import { test, expect } from '@playwright/test'
import { login, loginAs, TEST_USERS, waitForAuth } from './helpers/test-helpers'

// Helper to set English language for consistent testing
async function setEnglishLanguage(page: any) {
  // Navigate to a page to access the language switcher
  await page.goto('/site')
  await page.waitForLoadState('domcontentloaded')

  // Click language switcher button to change to English
  try {
    const langButton = page.getByTestId('language-switcher')
    await langButton.click()
    await page.waitForTimeout(200)

    const englishOption = page.getByText('🇺🇸')
    await englishOption.click()
    await page.waitForTimeout(500) // Wait for language change to apply
  } catch {
    // Language might already be English, continue
  }
}

// Helper to navigate to specific URL and set language to English
async function gotoWithLanguage(page: any, url: string) {
  // Navigate to URL
  await page.goto(url)
  await page.waitForLoadState('domcontentloaded')

  // Click language switcher button (shows current flag, likely 🇮🇩)
  try {
    // Try desktop language switcher first
    const langButton = page.getByTestId('language-switcher')
    await langButton.click()
    await page.waitForTimeout(200)

    // Click English option (🇺🇸)
    const englishOption = page.getByText('🇺🇸')
    await englishOption.click()
    await page.waitForTimeout(500) // Wait for language change to apply
  } catch {
    // If desktop switcher fails, try mobile menu
    // Language might already be set, so continue
  }
}

test.describe('Staff Login Access', () => {
  // Use storage state to set English language before tests
  test.use({
    storageState: 'tests/e2e/storage-state.json',
  })

  test.beforeEach(async ({ context }) => {
    // Additional init script to ensure language is set on all pages
    await context.addInitScript(() => {
      localStorage.clear()
      localStorage.setItem('i18nextLng', 'en-US')
    })
  })

  test.describe('Login Link Accessibility', () => {
    test('should have Staff Login link in header on homepage', async ({ page }) => {
      await gotoWithLanguage(page, '/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))

      const staffLoginLink = page.getByRole('link', { name: /Staff Login/i })
      await expect(staffLoginLink).toBeVisible()
    })

    test('should have Staff Login link on menu page', async ({ page }) => {
      await gotoWithLanguage(page, '/site/menu')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))

      const staffLoginLink = page.getByRole('link', { name: /Staff Login/i })
      await expect(staffLoginLink).toBeVisible()
    })

    test('should have Staff Login link on about page', async ({ page }) => {
      await gotoWithLanguage(page, '/site/about')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))

      const staffLoginLink = page.getByRole('link', { name: /Staff Login/i })
      await expect(staffLoginLink).toBeVisible()
    })

    test('should have Staff Login link on contact page', async ({ page }) => {
      await gotoWithLanguage(page, '/site/contact')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))

      const staffLoginLink = page.getByRole('link', { name: /Staff Login/i })
      await expect(staffLoginLink).toBeVisible()
    })

    test('should have Staff Login link on reservation page', async ({ page }) => {
      await gotoWithLanguage(page, '/site/reservation')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))

      const staffLoginLink = page.getByRole('link', { name: /Staff Login/i })
      await expect(staffLoginLink).toBeVisible()
    })

    test('should have Staff Portal link in footer', async ({ page }) => {
      await gotoWithLanguage(page, '/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)

      const staffPortalLink = page.locator('footer >> text=Staff Portal')
      await expect(staffPortalLink).toBeVisible()
    })
  })

  test.describe('Navigation to Login Page', () => {
    test('should navigate to login page when clicking Staff Login in header', async ({
      page,
    }) => {
      await gotoWithLanguage(page, '/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))

      await page.click('text=Staff Login')

      await expect(page).toHaveURL(/\/login/)
    })

    test('should navigate to login page when clicking Staff Portal in footer', async ({
      page,
    }) => {
      await gotoWithLanguage(page, '/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)

      await page.click('footer >> text=Staff Portal')

      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      // Set English language before navigating to login page
      await setEnglishLanguage(page)
      await page.goto('/login')
    })

    test('should display login form', async ({ page }) => {
      await expect(page.locator('form')).toBeVisible()
    })

    test('should display username input', async ({ page }) => {
      await expect(page.getByRole('textbox', { name: /username/i })).toBeVisible()
    })

    test('should display password input', async ({ page }) => {
      await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible()
    })

    test('should display login button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('should display restaurant branding', async ({ page }) => {
      await expect(page.getByText(/Steak.*Kenangan/i)).toBeVisible()
    })

    test('should display Staff Portal title', async ({ page }) => {
      await expect(page.getByText(/Staff Portal/i)).toBeVisible()
    })

    test('should have Back to Website link', async ({ page }) => {
      const backLink = page.getByRole('link', { name: /Back to Website/i })
      await expect(backLink).toBeVisible()
    })

    test('should navigate back to public site when clicking Back to Website', async ({
      page,
    }) => {
      await page.click('text=Back to Website')

      await expect(page).toHaveURL(/\/site/)
    })
  })

  test.describe('Login Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Set English language before navigating to login page
      await setEnglishLanguage(page)
      await page.goto('/login')
    })

    test('should show error for empty credentials', async ({ page }) => {
      await page.click('button:has-text("Sign In")')

      const errorMessage = page.locator('[role="alert"], [data-testid="form-error"]')
      await expect(errorMessage).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.fill('input[id="username"]', 'invaliduser')
      await page.fill('input[id="password"]', 'wrongpassword')
      await page.click('button:has-text("Sign In")')

      // Wait for API response
      await page.waitForTimeout(1000)

      // Should show error message
      const errorMessage = page.locator(
        '[role="alert"], [data-testid="form-error"], text=/failed|invalid|incorrect/i'
      )
      await expect(errorMessage.first()).toBeVisible()
    })

    test('should toggle password visibility', async ({ page }) => {
      const passwordInput = page.locator('input[id="password"]')
      await passwordInput.fill('testpassword')

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password')

      // Click toggle button - using the correct aria-label
      await page.click('button[aria-label="Show password"]')

      // Password should now be visible
      await expect(passwordInput).toHaveAttribute('type', 'text')

      // Click again to hide
      await page.click('button[aria-label="Hide password"]')
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('should remember username when checkbox is checked', async ({ page }) => {
      await page.fill('input[id="username"]', 'testuser')
      await page.locator('[id="remember"]').check()

      // Navigate away and back
      await gotoWithLanguage(page, '/site')
      await page.goto('/login')

      // Username should be pre-filled
      const usernameInput = page.locator('input[id="username"]')
      await expect(usernameInput).toHaveValue('testuser')
    })
  })

  test.describe('Mobile Login Access', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should access login from mobile menu', async ({ page }) => {
      await gotoWithLanguage(page, '/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))

      // Open mobile menu - using correct aria-label
      await page.click('button[aria-label="Open menu"]')
      await page.waitForTimeout(500)

      // Find and click Staff Login in mobile menu
      const mobileMenu = page.locator('#mobile-menu')
      const staffLoginLink = mobileMenu.getByRole('link', { name: /Staff Login/i })
      await expect(staffLoginLink).toBeVisible()
      await staffLoginLink.click()

      await expect(page).toHaveURL(/\/login/)
    })

    test('should display login page correctly on mobile', async ({ page }) => {
      await gotoWithLanguage(page, '/login')

      // Form should be visible
      await expect(page.locator('form')).toBeVisible()

      // Inputs should be usable
      const usernameInput = page.locator('input[id="username"]')
      await usernameInput.fill('testuser')
      await expect(usernameInput).toHaveValue('testuser')
    })
  })

  test.describe('Theme Consistency', () => {
    test('should have consistent styling with public site', async ({ page }) => {
      await gotoWithLanguage(page, '/login')

      // Check for public theme CSS variables
      const card = page.locator('.bg-\\[var\\(--public-bg-elevated\\)\\]')
      await expect(card).toBeVisible()

      // Check for restaurant branding colors
      const accentElement = page.locator('.text-\\[var\\(--public-secondary\\)\\]')
      await expect(accentElement.first()).toBeVisible()
    })

    test('should have background pattern', async ({ page }) => {
      await gotoWithLanguage(page, '/login')

      // Check for decorative background
      const background = page.locator('.absolute.inset-0')
      await expect(background.first()).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      // Set English language before navigating to login page
      await setEnglishLanguage(page)
      await page.goto('/login')
    })

    test('should have proper form labels', async ({ page }) => {
      const usernameLabel = page.locator('label[for="username"]')
      const passwordLabel = page.locator('label[for="password"]')

      await expect(usernameLabel).toBeVisible()
      await expect(passwordLabel).toBeVisible()
    })

    test('should have keyboard navigation support', async ({ page }) => {
      // Tab through form elements
      await page.keyboard.press('Tab')
      await expect(page.locator('input[id="username"]')).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(page.locator('input[id="password"]')).toBeFocused()
    })

    test('should have accessible error messages', async ({ page }) => {
      await page.click('button:has-text("Sign In")')

      // Error should have alert role or be announced
      const errorElement = page.locator(
        '[role="alert"], .text-red-400, [data-testid="form-error"]'
      )
      await expect(errorElement.first()).toBeVisible()
    })
  })

  test.describe('Successful Login with Role-Based Redirects', () => {
    test.beforeEach(async ({ page }) => {
      // Set English language before login tests
      await setEnglishLanguage(page)
    })

    test('should login as admin and redirect to dashboard', async ({ page }) => {
      await loginAs(page, 'admin')
      await expect(page).toHaveURL(TEST_USERS.admin.expectedPath)
      // Verify auth token is stored
      await waitForAuth(page)
    })

    test('should login as manager and redirect to dashboard', async ({ page }) => {
      await loginAs(page, 'manager')
      await expect(page).toHaveURL(TEST_USERS.manager.expectedPath)
      await waitForAuth(page)
    })

    test('should login as server and redirect to server station', async ({ page }) => {
      await loginAs(page, 'server')
      await expect(page).toHaveURL(TEST_USERS.server.expectedPath)
      await waitForAuth(page)
    })

    test('should login as counter and redirect to counter station', async ({ page }) => {
      await loginAs(page, 'counter')
      await expect(page).toHaveURL(TEST_USERS.counter.expectedPath)
      await waitForAuth(page)
    })

    test('should login as kitchen and redirect to kitchen display', async ({ page }) => {
      await loginAs(page, 'kitchen')
      await expect(page).toHaveURL(TEST_USERS.kitchen.expectedPath)
      await waitForAuth(page)
    })

    test('should store user information in localStorage after login', async ({ page }) => {
      await loginAs(page, 'admin')

      const user = await page.evaluate(() => {
        const userStr = localStorage.getItem('pos_user')
        return userStr ? JSON.parse(userStr) : null
      })

      expect(user).not.toBeNull()
      expect(user).toHaveProperty('username', 'admin')
      expect(user).toHaveProperty('role', 'admin')
    })
  })
})
