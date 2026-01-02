/**
 * T013: E2E test for admin language switching and persistence
 * Tests: Language switch functionality, persistence across navigation and page reload
 */
import { test, expect } from '@playwright/test'

test.describe('Admin Language Settings', () => {
  // Helper to login as admin
  async function loginAsAdmin(page: any) {
    await page.goto('/login')
    await page.fill('input[id="username"]', 'admin')
    await page.fill('input[id="password"]', 'admin123')
    await page.click('button:has-text("Sign In")')
    await page.waitForURL(/\/admin/)
  }

  test.describe('Language Switching', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page)
    })

    test('should display language switcher in admin settings', async ({ page }) => {
      // Navigate to settings
      await page.click('text=Settings')
      await page.waitForTimeout(500)

      // Language switcher should be visible
      const languageCard = page.locator('text=Bahasa Indonesia').first()
      await expect(languageCard).toBeVisible()

      const englishButton = page.locator('button:has-text("English")')
      await expect(englishButton).toBeVisible()
    })

    test('should switch to Indonesian when clicking Bahasa Indonesia button', async ({ page }) => {
      // Navigate to settings
      await page.click('text=Settings')
      await page.waitForTimeout(500)

      // Click Indonesian language button
      await page.click('button:has-text("Bahasa Indonesia")')
      await page.waitForTimeout(500)

      // Verify UI changed to Indonesian
      // The settings title should now be in Indonesian
      const settingsTitle = page.locator('h2:has-text("Pengaturan Sistem")')
      await expect(settingsTitle).toBeVisible()
    })

    test('should switch to English when clicking English button', async ({ page }) => {
      // First switch to Indonesian
      await page.click('text=Settings')
      await page.waitForTimeout(500)
      await page.click('button:has-text("Bahasa Indonesia")')
      await page.waitForTimeout(500)

      // Then switch back to English
      await page.click('button:has-text("English")')
      await page.waitForTimeout(500)

      // Verify UI changed to English
      const settingsTitle = page.locator('h2:has-text("System Settings")')
      await expect(settingsTitle).toBeVisible()
    })
  })

  test.describe('Language Persistence', () => {
    test('should persist language preference after page reload', async ({ page }) => {
      await loginAsAdmin(page)

      // Navigate to settings and switch to Indonesian
      await page.click('text=Settings')
      await page.waitForTimeout(500)
      await page.click('button:has-text("Bahasa Indonesia")')
      await page.waitForTimeout(500)

      // Reload the page
      await page.reload()
      await page.waitForTimeout(1000)

      // Verify language is still Indonesian after reload
      const settingsTitle = page.locator('h2:has-text("Pengaturan Sistem")')
      await expect(settingsTitle).toBeVisible()
    })

    test('should persist language across different admin sections', async ({ page }) => {
      await loginAsAdmin(page)

      // Switch to Indonesian in settings
      await page.click('text=Settings')
      await page.waitForTimeout(500)
      await page.click('button:has-text("Bahasa Indonesia")')
      await page.waitForTimeout(500)

      // Navigate to Dashboard - should still be in Indonesian
      await page.click('text=Dasbor')
      await page.waitForTimeout(500)

      // The Dashboard page should show Indonesian text
      // Check for Indonesian sidebar labels
      const dashboardSidebar = page.locator('text=Dasbor')
      await expect(dashboardSidebar).toBeVisible()
    })

    test('should store language preference in localStorage', async ({ page }) => {
      await loginAsAdmin(page)

      // Switch to Indonesian
      await page.click('text=Settings')
      await page.waitForTimeout(500)
      await page.click('button:has-text("Bahasa Indonesia")')
      await page.waitForTimeout(500)

      // Check localStorage
      const storedLang = await page.evaluate(() => localStorage.getItem('i18nextLng'))
      expect(storedLang).toBe('id-ID')

      // Switch to English
      await page.click('button:has-text("English")')
      await page.waitForTimeout(500)

      // Check localStorage updated
      const storedLangEn = await page.evaluate(() => localStorage.getItem('i18nextLng'))
      expect(storedLangEn).toBe('en-US')
    })
  })

  test.describe('Admin Navigation in Indonesian', () => {
    test.beforeEach(async ({ page }) => {
      // Set Indonesian language before login
      await page.goto('/login')
      await page.evaluate(() => localStorage.setItem('i18nextLng', 'id-ID'))
      await page.reload()
      await page.fill('input[id="username"]', 'admin')
      await page.fill('input[id="password"]', 'admin123')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL(/\/admin/)
    })

    test('should display sidebar menu items in Indonesian', async ({ page }) => {
      // Wait for sidebar to load
      await page.waitForTimeout(500)

      // Check Indonesian sidebar labels
      await expect(page.locator('text=Dasbor')).toBeVisible()
      await expect(page.locator('text=Pengaturan')).toBeVisible()
      await expect(page.locator('text=Kelola Staf')).toBeVisible()
      await expect(page.locator('text=Kelola Menu')).toBeVisible()
    })

    test('should navigate through admin sections in Indonesian', async ({ page }) => {
      // Click on Kelola Menu
      await page.click('text=Kelola Menu')
      await page.waitForTimeout(500)

      // Click on Laporan
      await page.click('text=Lihat Laporan')
      await page.waitForTimeout(500)

      // Click on Kelola Meja
      await page.click('text=Kelola Meja')
      await page.waitForTimeout(500)

      // All navigations should work without error
      await expect(page.locator('main')).toBeVisible()
    })
  })

  test.describe('Form Data Preservation', () => {
    test('should preserve unsaved form data when switching language', async ({ page }) => {
      await loginAsAdmin(page)

      // Navigate to settings
      await page.click('text=Settings')
      await page.waitForTimeout(500)

      // Enter some data in a form field (e.g., restaurant name)
      const restaurantNameInput = page.locator('input#restaurant_name')
      if (await restaurantNameInput.isVisible()) {
        await restaurantNameInput.fill('Test Restaurant Name')
      }

      // Switch language
      await page.click('button:has-text("Bahasa Indonesia")')
      await page.waitForTimeout(500)

      // Check if the form data is preserved
      if (await restaurantNameInput.isVisible()) {
        await expect(restaurantNameInput).toHaveValue('Test Restaurant Name')
      }
    })
  })
})
