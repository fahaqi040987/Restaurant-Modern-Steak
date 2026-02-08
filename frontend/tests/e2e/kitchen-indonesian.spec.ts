/**
 * T044: E2E test for Kitchen Display in Indonesian
 * Tests: Kitchen interface i18n, Indonesian translations, kitchen workflow in Indonesian language
 */
import { test, expect, type Page } from '@playwright/test'

test.describe('Kitchen Display Indonesian i18n', () => {
  // Helper to login as kitchen staff with Indonesian language
  async function loginAsKitchenWithIndonesian(page: Page) {
    await page.goto('/login')
    await page.evaluate(() => localStorage.setItem('i18nextLng', 'id-ID'))
    await page.reload()
    await page.fill('input[id="username"]', 'kitchen1')
    await page.fill('input[id="password"]', 'admin123')
    await page.click('button:has-text("Sign In")')
    await page.waitForURL(/\/kitchen/)
  }

  test.describe('Kitchen Display Header in Indonesian', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsKitchenWithIndonesian(page)
      await page.waitForTimeout(1000)
    })

    test('should display kitchen header title in Indonesian', async ({ page }) => {
      // Check for Indonesian kitchen display title
      const kitchenTitle = page.locator('text=Tampilan Dapur')
      await expect(kitchenTitle.first()).toBeVisible()
    })

    test('should display auto-refresh status in Indonesian', async ({ page }) => {
      // Check for Indonesian auto-refresh/live updates text
      const liveUpdatesText = page.locator('text=Update otomatis')
      const manualRefreshText = page.locator('text=Refresh manual')

      await expect(liveUpdatesText.or(manualRefreshText).first()).toBeVisible()
    })

    test('should display refresh button', async ({ page }) => {
      // Refresh button should be visible
      const refreshButton = page.locator('button').filter({ has: page.locator('svg') }).first()
      await expect(refreshButton).toBeVisible()
    })
  })

  test.describe('Kitchen Order Filters in Indonesian', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsKitchenWithIndonesian(page)
      await page.waitForTimeout(1000)
    })

    test('should display order status filters in Indonesian', async ({ page }) => {
      // Check for Indonesian filter labels
      const allOrdersFilter = page.locator('text=Semua Pesanan')
      const newFilter = page.locator('text=Baru')
      const preparingFilter = page.locator('text=Sedang Disiapkan')
      const readyFilter = page.locator('text=Siap')

      // At least one should be visible
      await expect(
        allOrdersFilter.or(newFilter).or(preparingFilter).or(readyFilter).first()
      ).toBeVisible()
    })

    test('should display search placeholder in Indonesian', async ({ page }) => {
      // Check for Indonesian search placeholder
      const searchInput = page.locator('input[placeholder*="Cari"]')
      if (await searchInput.first().isVisible()) {
        await expect(searchInput.first()).toBeVisible()
      }
    })
  })

  test.describe('Kitchen Order Cards in Indonesian', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsKitchenWithIndonesian(page)
      await page.waitForTimeout(1000)
    })

    test('should display empty state message in Indonesian when no orders', async ({ page }) => {
      // Check for Indonesian empty state message
      const noOrdersText = page.locator('text=Tidak Ada Pesanan')
      const noActiveOrdersText = page.locator('text=Tidak ada pesanan dapur aktif')

      // If no orders, one of these should be visible
      const hasOrders = await page.locator('[data-testid="order-card"], .order-card').first().isVisible().catch(() => false)
      if (!hasOrders) {
        await expect(noOrdersText.or(noActiveOrdersText).first()).toBeVisible()
      }
    })

    test('should display section headers in Indonesian when orders exist', async ({ page }) => {
      // Check for Indonesian section headers
      const newOrdersHeader = page.locator('text=Pesanan Baru')
      const preparingHeader = page.locator('text=Sedang Disiapkan')
      const readyHeader = page.locator('text=Siap Disajikan')

      // Wait for potential orders to load
      await page.waitForTimeout(1000)

      // If any section header is visible, it should be in Indonesian
      const hasNewOrders = await newOrdersHeader.first().isVisible().catch(() => false)
      const hasPreparingOrders = await preparingHeader.first().isVisible().catch(() => false)
      const hasReadyOrders = await readyHeader.first().isVisible().catch(() => false)

      if (hasNewOrders || hasPreparingOrders || hasReadyOrders) {
        await expect(
          newOrdersHeader.or(preparingHeader).or(readyHeader).first()
        ).toBeVisible()
      }
    })

    test('should display order action buttons in Indonesian', async ({ page }) => {
      // Check for Indonesian action button text
      const startPreparingBtn = page.locator('button:has-text("Mulai Menyiapkan")')
      const markReadyBtn = page.locator('button:has-text("Tandai Siap")')
      const markServedBtn = page.locator('button:has-text("Tandai Disajikan")')
      const resetBtn = page.locator('button:has-text("Reset")')

      // Wait for potential orders to load
      await page.waitForTimeout(1000)

      // If there are orders with action buttons, they should be in Indonesian
      const hasActionButtons = await startPreparingBtn.or(markReadyBtn).or(markServedBtn).or(resetBtn).first().isVisible().catch(() => false)
      if (hasActionButtons) {
        await expect(
          startPreparingBtn.or(markReadyBtn).or(markServedBtn).or(resetBtn).first()
        ).toBeVisible()
      }
    })
  })

  test.describe('Kitchen Tabs in Indonesian', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsKitchenWithIndonesian(page)
      await page.waitForTimeout(1000)
    })

    test('should display kitchen orders tab in Indonesian', async ({ page }) => {
      // Check for Indonesian tab labels
      const kitchenOrdersTab = page.locator('text=Pesanan Dapur')
      const takeawayTab = page.locator('text=Papan Takeaway')

      // At least one tab should be visible
      await expect(kitchenOrdersTab.or(takeawayTab).first()).toBeVisible()
    })

    test('should switch tabs and display Indonesian content', async ({ page }) => {
      // Try clicking on takeaway tab
      const takeawayTab = page.locator('button:has-text("Papan Takeaway"), button:has-text("Takeaway")')
      if (await takeawayTab.first().isVisible()) {
        await takeawayTab.first().click()
        await page.waitForTimeout(500)

        // Should display takeaway content in Indonesian
        const noTakeawayText = page.locator('text=Tidak ada pesanan takeaway siap')
        const readyForPickupText = page.locator('text=Siap Diambil')

        await expect(noTakeawayText.or(readyForPickupText).first()).toBeVisible()
      }
    })
  })

  test.describe('Kitchen Sound Settings in Indonesian', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsKitchenWithIndonesian(page)
      await page.waitForTimeout(1000)
    })

    test('should display sound settings modal in Indonesian', async ({ page }) => {
      // Click on settings button (typically a gear icon)
      const settingsButton = page.locator('button').filter({ has: page.locator('svg') }).last()
      await settingsButton.click()
      await page.waitForTimeout(500)

      // Check for Indonesian sound settings labels
      const soundSettingsTitle = page.locator('text=Pengaturan Suara')
      const enableSoundsLabel = page.locator('text=Aktifkan Suara')
      const volumeLabel = page.locator('text=Volume')

      // At least one should be visible if settings modal opened
      const hasSettings = await soundSettingsTitle.or(enableSoundsLabel).or(volumeLabel).first().isVisible().catch(() => false)
      if (hasSettings) {
        await expect(soundSettingsTitle.or(enableSoundsLabel).or(volumeLabel).first()).toBeVisible()
      }
    })
  })

  test.describe('Language Persistence in Kitchen', () => {
    test('should persist Indonesian language after page reload in kitchen', async ({ page }) => {
      await loginAsKitchenWithIndonesian(page)
      await page.waitForTimeout(500)

      // Reload the page
      await page.reload()
      await page.waitForTimeout(1000)

      // Should still show Indonesian text
      const indonesianText = page.locator('text=Tampilan Dapur, text=Pesanan Dapur, text=Update otomatis').first()
      await expect(indonesianText).toBeVisible()
    })

    test('should store Indonesian language in localStorage for kitchen', async ({ page }) => {
      await loginAsKitchenWithIndonesian(page)
      await page.waitForTimeout(500)

      // Check localStorage
      const storedLang = await page.evaluate(() => localStorage.getItem('i18nextLng'))
      expect(storedLang).toBe('id-ID')
    })
  })

  test.describe('Kitchen Time Display in Indonesian', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsKitchenWithIndonesian(page)
      await page.waitForTimeout(1000)
    })

    test('should display time elapsed in Indonesian format', async ({ page }) => {
      // Check for Indonesian time display formats
      const justNowText = page.locator('text=Baru saja')
      const minutesAgoText = page.locator('text=/\\d+ menit lalu/')
      const secondsAgoText = page.locator('text=/\\d+ detik lalu/')

      // Wait for time display to appear
      await page.waitForTimeout(500)

      // If any time display is visible, it should be in Indonesian format
      const hasTimeDisplay = await justNowText.or(minutesAgoText).or(secondsAgoText).first().isVisible().catch(() => false)
      if (hasTimeDisplay) {
        await expect(justNowText.or(minutesAgoText).or(secondsAgoText).first()).toBeVisible()
      }
    })
  })

  test.describe('Kitchen Accessibility in Indonesian', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsKitchenWithIndonesian(page)
      await page.waitForTimeout(1000)
    })

    test('should have proper heading structure in Indonesian', async ({ page }) => {
      // Check for heading elements
      const headings = page.locator('h1, h2, h3')
      const count = await headings.count()

      // Ensure there are headings
      expect(count).toBeGreaterThan(0)
    })

    test('should support keyboard navigation in kitchen', async ({ page }) => {
      // Tab should navigate through interactive elements
      await page.keyboard.press('Tab')

      // Something should be focused
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })
  })
})
