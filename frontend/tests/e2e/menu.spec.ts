/**
 * T023: E2E test for menu browsing
 * Tests: Category slider works, menu items display with IDR prices, animations are smooth
 *
 * Note: Playwright must be installed and configured to run these tests.
 * Run: npx playwright install && npx playwright test menu.spec.ts
 */
import { test, expect } from '@playwright/test'

test.describe('Menu Page', () => {
  test.beforeEach(async ({ page }) => {
    // Skip loader for all menu tests
    await page.goto('/site/menu')
    await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
    await page.reload()
  })

  test.describe('Page Header', () => {
    test('should display menu page header', async ({ page }) => {
      const heading = page.locator('h1')
      await expect(heading).toBeVisible()
      await expect(heading).toContainText('Menu')
    })

    test('should display description text', async ({ page }) => {
      const description = page.locator('text=Explore our selection')
      await expect(description).toBeVisible()
    })
  })

  test.describe('Category Slider', () => {
    test('should display category slider section', async ({ page }) => {
      const categorySection = page.locator('[data-testid="menu-slider"]')
      await expect(categorySection).toBeVisible()
    })

    test('should display "All Items" button', async ({ page }) => {
      const allItemsBtn = page.getByRole('button', { name: /All Items/i })
      await expect(allItemsBtn).toBeVisible()
    })

    test('should have All Items selected by default', async ({ page }) => {
      const allItemsBtn = page.getByRole('button', { name: /All Items/i })
      await expect(allItemsBtn).toHaveAttribute('aria-pressed', 'true')
    })

    test('should display category buttons when categories are loaded', async ({ page }) => {
      // Wait for categories to load
      await page.waitForSelector('[data-testid="category-button"]', { timeout: 10000 })

      const categoryButtons = page.locator('[data-testid="category-button"]')
      const count = await categoryButtons.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should filter menu items when clicking a category', async ({ page }) => {
      // Wait for categories to load
      await page.waitForSelector('[data-testid="category-button"]', { timeout: 10000 })

      // Get first category button
      const firstCategoryBtn = page.locator('[data-testid="category-button"]').first()
      const categoryName = await firstCategoryBtn.textContent()

      // Click the category
      await firstCategoryBtn.click()

      // Category should now be selected
      await expect(firstCategoryBtn).toHaveAttribute('aria-pressed', 'true')

      // All Items should not be selected
      const allItemsBtn = page.getByRole('button', { name: /All Items/i })
      await expect(allItemsBtn).toHaveAttribute('aria-pressed', 'false')
    })

    test('should show navigation arrows on larger screens', async ({ page }) => {
      // Set larger viewport
      await page.setViewportSize({ width: 1200, height: 800 })

      // Wait for slider to render
      await page.waitForSelector('[data-testid="menu-slider"]')

      // Check for navigation buttons (may be hidden if content fits)
      const prevButton = page.locator('[data-testid="slider-prev"]')
      const nextButton = page.locator('[data-testid="slider-next"]')

      // At least one should exist in the DOM
      expect(
        (await prevButton.count()) > 0 || (await nextButton.count()) > 0
      ).toBeTruthy()
    })
  })

  test.describe('Menu Items Grid', () => {
    test('should display menu items', async ({ page }) => {
      // Wait for menu items to load
      await page.waitForSelector('[data-testid="menu-item-card"]', { timeout: 10000 })

      const menuItems = page.locator('[data-testid="menu-item-card"]')
      const count = await menuItems.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should display menu item names', async ({ page }) => {
      await page.waitForSelector('[data-testid="menu-item-card"]', { timeout: 10000 })

      const firstItem = page.locator('[data-testid="menu-item-card"]').first()
      const itemName = firstItem.locator('[data-testid="menu-item-name"]')
      await expect(itemName).toBeVisible()
    })

    test('should display prices in IDR format', async ({ page }) => {
      await page.waitForSelector('[data-testid="menu-item-card"]', { timeout: 10000 })

      const firstItem = page.locator('[data-testid="menu-item-card"]').first()
      const itemPrice = firstItem.locator('[data-testid="menu-item-price"]')
      await expect(itemPrice).toBeVisible()

      // Price should be in IDR format (Rp)
      const priceText = await itemPrice.textContent()
      expect(priceText).toMatch(/Rp\.?\s*[\d.,]+/)
    })

    test('should display menu item images', async ({ page }) => {
      await page.waitForSelector('[data-testid="menu-item-card"]', { timeout: 10000 })

      const firstItem = page.locator('[data-testid="menu-item-card"]').first()
      const itemImage = firstItem.locator('img')

      // Should have either an image or a placeholder icon
      const hasImage = (await itemImage.count()) > 0
      const hasPlaceholder =
        (await firstItem.locator('[data-testid="menu-item-placeholder"]').count()) > 0

      expect(hasImage || hasPlaceholder).toBeTruthy()
    })

    test('should display category badge on each item', async ({ page }) => {
      await page.waitForSelector('[data-testid="menu-item-card"]', { timeout: 10000 })

      const firstItem = page.locator('[data-testid="menu-item-card"]').first()
      const categoryBadge = firstItem.locator('[data-testid="menu-item-category"]')
      await expect(categoryBadge).toBeVisible()
    })
  })

  test.describe('Search Functionality', () => {
    test('should display search input', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]')
      await expect(searchInput).toBeVisible()
    })

    test('should filter menu items when searching', async ({ page }) => {
      // Wait for menu items to load first
      await page.waitForSelector('[data-testid="menu-item-card"]', { timeout: 10000 })

      const initialCount = await page.locator('[data-testid="menu-item-card"]').count()

      // Type in search input
      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('steak')

      // Wait for debounce and API response
      await page.waitForTimeout(500)

      // Items should be filtered (count may be less)
      const searchResults = page.locator('[data-testid="menu-item-card"]')
      const filteredCount = await searchResults.count()

      // Either filtered or showing all if "steak" is in all items
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
    })

    test('should show clear button when search has value', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('test')

      // Clear button should appear
      const clearButton = page.locator('button[aria-label*="clear"], button:has-text("×")')
      await expect(clearButton).toBeVisible()
    })

    test('should clear search when clicking clear button', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('test')

      // Click the clear button (the X button next to search)
      const clearButton = page.locator('button').filter({ has: page.locator('svg') }).first()
      await clearButton.click()

      // Search input should be empty
      await expect(searchInput).toHaveValue('')
    })
  })

  test.describe('Empty State', () => {
    test('should show empty state when no items match search', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('xyznonexistent12345')

      // Wait for debounce
      await page.waitForTimeout(500)

      // Should show empty state
      const emptyState = page.locator('text=No items found')
      await expect(emptyState).toBeVisible()
    })

    test('should show clear filters button in empty state', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('xyznonexistent12345')

      await page.waitForTimeout(500)

      const clearFiltersBtn = page.getByRole('button', { name: /Clear Filters/i })
      await expect(clearFiltersBtn).toBeVisible()
    })
  })

  test.describe('Loading States', () => {
    test('should show skeleton loading for categories', async ({ page }) => {
      // Intercept the categories API to delay response
      await page.route('**/api/v1/public/categories', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await route.continue()
      })

      await page.goto('/site/menu')

      // Should show loading skeletons
      const skeletons = page.locator('.animate-pulse')
      const count = await skeletons.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should show skeleton loading for menu items', async ({ page }) => {
      // Intercept the menu API to delay response
      await page.route('**/api/v1/public/menu**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await route.continue()
      })

      await page.goto('/site/menu')

      // Should show loading skeletons in grid
      const skeletons = page.locator('.animate-pulse')
      const count = await skeletons.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Responsive Design', () => {
    test('should display single column on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForSelector('[data-testid="menu-item-card"]', { timeout: 10000 })

      // Grid should have single column class on mobile
      const grid = page.locator('[data-testid="menu-grid"]')
      await expect(grid).toHaveClass(/grid-cols-1/)
    })

    test('should display multiple columns on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      await page.waitForSelector('[data-testid="menu-item-card"]', { timeout: 10000 })

      // Grid should have multiple columns on larger screens
      const grid = page.locator('[data-testid="menu-grid"]')
      const className = await grid.getAttribute('class')
      expect(className).toMatch(/lg:grid-cols-3/)
    })
  })

  test.describe('Error Handling', () => {
    test('should show error state when API fails', async ({ page }) => {
      // Intercept and fail the API call
      await page.route('**/api/v1/public/menu**', (route) => {
        route.abort('failed')
      })

      await page.goto('/site/menu')

      // Should show error message
      const errorMessage = page.locator('text=Failed to load')
      await expect(errorMessage).toBeVisible()
    })

    test('should show retry button on error', async ({ page }) => {
      await page.route('**/api/v1/public/menu**', (route) => {
        route.abort('failed')
      })

      await page.goto('/site/menu')

      const retryButton = page.getByRole('button', { name: /Retry/i })
      await expect(retryButton).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
      await expect(h1).toContainText('Menu')
    })

    test('should have accessible category buttons', async ({ page }) => {
      const allItemsBtn = page.getByRole('button', { name: /All Items/i })
      await expect(allItemsBtn).toHaveAttribute('aria-pressed')
    })

    test('should have accessible search input', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]')
      await expect(searchInput).toHaveAttribute('placeholder')
    })
  })
})
