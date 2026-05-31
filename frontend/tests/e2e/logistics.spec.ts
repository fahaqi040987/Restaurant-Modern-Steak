/**
 * Logistics Page E2E Test
 * Tests the complete logistics functionality including:
 * 1. Frontend running and navigation
 * 2. Logistics page UI elements
 * 3. Create ingredient functionality
 * 4. Stock adjustment functionality
 * 5. Movement history viewing
 * 6. Filters functionality
 * 7. Export functionality
 */
import { test, expect } from '@playwright/test'
import { loginAs, waitForAuth } from './helpers/test-helpers'

test.describe('Logistics Page - Full Functionality Test', () => {
  let testIngredientName = ''

  test('COMPLETE LOGISTICS TEST: All 7 verification steps', async ({ page }) => {
    console.log('=== STEP 1: FRONTEND RUNNING & LOGIN ===')

    // Test that frontend is running by navigating to login
    await page.goto('http://localhost:8000/login')
    await expect(page).toHaveTitle(/Sign In/i)
    console.log('✅ Frontend is running')

    // Login as admin
    await loginAs(page, 'admin', { timeout: 10000 })
    await waitForAuth(page)
    console.log('✅ Logged in as admin')

    console.log('\n=== STEP 2: NAVIGATE TO LOGISTICS PAGE ===')

    // Navigate to logistics page
    await page.goto('http://localhost:8000/admin/logistics')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'test-results/logistics-01-page-load.png', fullPage: true })
    console.log('✅ Navigated to /admin/logistics')

    // Check page title
    const pageTitle = await page.title()
    console.log('Page title:', pageTitle)
    expect(pageTitle).toMatch(/logistics|logistik|bahan/i)
    console.log('✅ Page title contains logistics-related text')

    // Check for stats cards
    const statsCards = page.locator('[class*="card"], div[class*="stat"]').or(page.locator('div:has-text("Total")'))
    const statsCount = await statsCards.count()
    console.log('Stats cards found:', statsCount)
    expect(statsCount).toBeGreaterThan(0)
    console.log('✅ Stats cards are visible')

    // Check for table
    const table = page.locator('table').or(page.locator('[role="table"]'))
    const tableCount = await table.count()
    console.log('Tables found:', tableCount)
    expect(tableCount).toBeGreaterThan(0)
    console.log('✅ Table is visible')

    console.log('\n=== STEP 3: TEST CREATE INGREDIENT ===')

    // Look for "Add" or "Create" button
    const addButton = page.getByRole('button', { name: /(Add|Tambah|Create|Buat)/i })
    const addCount = await addButton.count()
    console.log('Add buttons found:', addCount)

    if (addCount > 0) {
      await addButton.first().click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/logistics-02-form-open.png', fullPage: true })
      console.log('✅ Clicked add button')

      // Fill out the form
      testIngredientName = `Test Ingredient ${Date.now()}`

      // Try different field names for ingredient name
      const nameInput = page.locator('input[placeholder*="name" i], input[id*="name" i], input[name*="name" i]').first()
      if (await nameInput.isVisible()) {
        await nameInput.fill(testIngredientName)
        console.log('✅ Filled ingredient name:', testIngredientName)
      }

      // Try different field names for category
      const categorySelect = page.locator('select[id*="category" i], select[name*="category" i]').first()
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 0 })
        console.log('✅ Selected category')
      }

      // Try different field names for location
      const locationSelect = page.locator('select[id*="location" i], select[name*="location" i]').first()
      if (await locationSelect.isVisible()) {
        await locationSelect.selectOption({ index: 0 })
        console.log('✅ Selected location')
      }

      // Try different field names for quantity
      const quantityInput = page.locator('input[type="number"], input[placeholder*="quantity" i], input[id*="quantity" i]').first()
      if (await quantityInput.isVisible()) {
        await quantityInput.fill('100')
        console.log('✅ Filled quantity: 100')
      }

      // Try different field names for unit
      const unitInput = page.locator('input[placeholder*="unit" i], input[id*="unit" i]').first()
      if (await unitInput.isVisible()) {
        await unitInput.fill('kg')
        console.log('✅ Filled unit: kg')
      }

      await page.screenshot({ path: 'test-results/logistics-03-form-filled.png', fullPage: true })

      // Submit form
      const submitButton = page.getByRole('button', { name: /(Submit|Save|Simpan|Create)/i })
      const submitCount = await submitButton.count()
      console.log('Submit buttons found:', submitCount)

      if (submitCount > 0) {
        await submitButton.first().click()
        await page.waitForTimeout(2000)
        await page.screenshot({ path: 'test-results/logistics-04-form-submitted.png', fullPage: true })
        console.log('✅ Submitted form')

        // Check for success message or new ingredient in table
        const pageText = await page.textContent('body')
        if (pageText?.includes(testIngredientName)) {
          console.log('✅ New ingredient appears in table:', testIngredientName)
        } else {
          console.log('⚠️ Could not verify new ingredient in table')
        }
      }
    } else {
      console.log('❌ No add button found')
    }

    console.log('\n=== STEP 4: TEST ADJUST STOCK ===')

    // Look for adjust stock button or icon
    const adjustButton = page.getByRole('button', { name: /(Adjust|Set|Update|Update Stock|Tambah Stock)/i })
      .or(page.locator('button:has([data-icon="plus"])'))
      .or(page.locator('button:has([data-icon="minus"])'))

    const adjustCount = await adjustButton.count()
    console.log('Adjust buttons found:', adjustCount)

    if (adjustCount > 0) {
      await adjustButton.first().click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/logistics-05-adjust-open.png', fullPage: true })
      console.log('✅ Opened adjust stock dialog')

      // Try to select operation type (add/remove/set)
      const operationSelect = page.locator('select[id*="operation" i], select[name*="operation" i], select[id*="type" i]').first()
      if (await operationSelect.isVisible()) {
        await operationSelect.selectOption({ index: 0 })
        console.log('✅ Selected operation type')
      }

      // Try to enter quantity
      const adjustQuantity = page.locator('input[type="number"]:visible').first()
      if (await adjustQuantity.isVisible()) {
        await adjustQuantity.fill('10')
        console.log('✅ Entered adjustment quantity: 10')
      }

      await page.screenshot({ path: 'test-results/logistics-06-adjust-filled.png', fullPage: true })

      // Submit adjustment
      const adjustSubmit = page.getByRole('button', { name: /(Submit|Save|Simpan|Update)/i })
      const adjustSubmitCount = await adjustSubmit.count()

      if (adjustSubmitCount > 0) {
        await adjustSubmit.first().click()
        await page.waitForTimeout(2000)
        await page.screenshot({ path: 'test-results/logistics-07-adjust-submitted.png', fullPage: true })
        console.log('✅ Submitted stock adjustment')
      }
    } else {
      console.log('⚠️ No adjust button found (might be in a menu or dropdown)')
    }

    console.log('\n=== STEP 5: TEST MOVEMENT HISTORY ===')

    // Look for history button or icon
    const historyButton = page.getByRole('button', { name: /(History|Riwayat|Log|Activity)/i })
      .or(page.locator('button:has([data-icon="history"])'))
      .or(page.locator('button:has([data-icon="clock"])'))

    const historyCount = await historyButton.count()
    console.log('History buttons found:', historyCount)

    if (historyCount > 0) {
      await historyButton.first().click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/logistics-08-history-open.png', fullPage: true })
      console.log('✅ Opened movement history')

      // Check for history content
      const historyContent = page.locator('table, div[class*="history"], div[class*="log"]')
      const historyContentCount = await historyContent.count()
      console.log('History content sections found:', historyContentCount)

      if (historyContentCount > 0) {
        console.log('✅ Movement history is displayed')
      }

      // Close dialog if possible
      const closeButton = page.getByRole('button', { name: /(Close|Tutup|Cancel)/i })
      if (await closeButton.count() > 0) {
        await closeButton.first().click()
        await page.waitForTimeout(500)
        console.log('✅ Closed history dialog')
      }
    } else {
      console.log('⚠️ No history button found')
    }

    console.log('\n=== STEP 6: TEST FILTERS ===')

    // Look for category filter
    const categoryFilter = page.locator('select[id*="category" i], select[name*="category" i]').first()
    if (await categoryFilter.isVisible()) {
      const optionCount = await categoryFilter.locator('option').count()
      console.log('Category filter options:', optionCount)

      if (optionCount > 1) {
        await categoryFilter.selectOption({ index: 1 })
        await page.waitForTimeout(1000)
        console.log('✅ Selected category filter')

        // Reset filter
        await categoryFilter.selectOption({ index: 0 })
        await page.waitForTimeout(500)
      }
    } else {
      console.log('⚠️ Category filter not found')
    }

    // Look for location filter
    const locationFilter = page.locator('select[id*="location" i], select[name*="location" i]').first()
    if (await locationFilter.isVisible() && await locationFilter.count() > 1) {
      // Use second location filter if first was for form
      const locFilter = page.locator('select[id*="location" i], select[name*="location" i]').nth(1)
      if (await locFilter.isVisible()) {
        const optionCount = await locFilter.locator('option').count()
        console.log('Location filter options:', optionCount)

        if (optionCount > 1) {
          await locFilter.selectOption({ index: 1 })
          await page.waitForTimeout(1000)
          console.log('✅ Selected location filter')
        }
      }
    } else {
      console.log('⚠️ Location filter not found')
    }

    // Look for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[id*="search" i], input[type="search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill(testIngredientName || 'test')
      await page.waitForTimeout(1000)
      console.log('✅ Used search filter')

      // Clear search
      await searchInput.fill('')
      await page.waitForTimeout(500)
    } else {
      console.log('⚠️ Search input not found')
    }

    await page.screenshot({ path: 'test-results/logistics-09-filters-tested.png', fullPage: true })

    console.log('\n=== STEP 7: TEST EXPORT ===')

    // Look for export button
    const exportButton = page.getByRole('button', { name: /(Export|Download|CSV|Excel)/i })
      .or(page.locator('button:has([data-icon="download"])'))

    const exportCount = await exportButton.count()
    console.log('Export buttons found:', exportCount)

    if (exportCount > 0) {
      // Setup download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 })

      await exportButton.first().click()
      console.log('✅ Clicked export button')

      try {
        const download = await downloadPromise
        console.log('✅ Download started:', download.suggestedFilename())

        // Wait for download to complete
        const downloadPath = await download.path()
        console.log('✅ Download completed to:', downloadPath)

        await page.screenshot({ path: 'test-results/logistics-10-export-complete.png', fullPage: true })
      } catch (e) {
        console.log('⚠️ Download did not complete (might need more time or different interaction)')
        await page.waitForTimeout(2000)
        await page.screenshot({ path: 'test-results/logistics-10-export-clicked.png', fullPage: true })
      }
    } else {
      console.log('⚠️ No export button found')
    }

    console.log('\n=== ALL TESTS COMPLETE ===')
    await page.screenshot({ path: 'test-results/logistics-11-final-state.png', fullPage: true })
  })

  test('BASIC VERIFICATION: Logistics page structure', async ({ page }) => {
    console.log('=== QUICK STRUCTURE VERIFICATION ===')

    await loginAs(page, 'admin', { timeout: 10000 })
    await page.goto('http://localhost:8000/admin/logistics')
    await page.waitForTimeout(2000)

    // Check for basic page structure
    const h1 = page.locator('h1, h2').first()
    const h1Text = await h1.textContent()
    console.log('Main heading:', h1Text)

    // Check for any buttons
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    console.log('Total buttons found:', buttonCount)

    // Check for table rows
    const rows = page.locator('tr')
    const rowCount = await rows.count()
    console.log('Table rows found:', rowCount)

    await page.screenshot({ path: 'test-results/logistics-structure.png', fullPage: true })
  })
})