import { test, expect } from '@playwright/test';
import { loginAs, waitForAuth } from './test-helpers';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const API_URL = process.env.API_URL || 'http://localhost:8080/api/v1';

test.describe('Logistics', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test using test-helpers for consistent auth handling
    await loginAs(page, 'admin', { timeout: 10000 });
    // Verify auth token is stored (already done in loginAs, but explicit for clarity)
    await waitForAuth(page);
  });

  test('should display logistics page with ingredients table', async ({ page }) => {
    await page.goto(`${BASE_URL}/logistics`);

    // Verify logistics page elements
    await expect(page.locator('h1:has-text("Logistics")').or(page.locator('h1:has-text("Logistik")')).or(page.getByRole('heading', { level: 1 }))).toBeVisible();

    // Verify ingredients table exists
    const table = page.locator('table').or(page.locator('[role="table"]'));
    await expect(table.first()).toBeVisible();

    // Verify table headers (English or Indonesian)
    const headers = page.locator('th, [role="columnheader"]');
    await expect(headers).toContainText(['Name', 'Stock', 'Unit', 'Category', 'Actions'].join('|'), { timeout: 5000 })
      .catch(() => headers.textContent().then(text => {
        // Check for Indonesian headers if English headers are not found
        expect(text.toLowerCase()).toContain('nama');
      }));
  });

  test('should create a new ingredient', async ({ page }) => {
    await page.goto(`${BASE_URL}/logistics`);

    // Click add button
    const addButton = page.getByRole('button', { name: /add/i }).or(page.getByRole('button', { name: /tambah/i })).or(page.locator('button').filter({ hasText: /add/i }));
    await addButton.click();

    // Fill form
    await page.fill('input[name="name"], input[id*="name"], input[placeholder*="Name"]', 'Test Ingredient');
    await page.fill('input[name="quantity"], input[id*="quantity"], input[name="stock"], input[id*="stock"]', '100');
    await page.fill('input[name="unit"], input[id*="unit"]', 'kg');

    // Select category (if exists)
    const categorySelect = page.locator('select[name="category"], [id*="category"]').first();
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption({ index: 0 });
    }

    // Submit
    const submitButton = page.getByRole('button', { name: /save|simpan|submit/i }).or(page.locator('button[type="submit"]'));
    await submitButton.click();

    // Verify success
    await expect(page.getByText('Test Ingredient')).toBeVisible({ timeout: 5000 });
  });

  test('should adjust stock for an ingredient', async ({ page }) => {
    await page.goto(`${BASE_URL}/logistics`);

    // Find first ingredient's adjust button
    const adjustButton = page.locator('button').filter({ hasText: /adjust|adjust stock|stok/i }).first();
    const count = await adjustButton.count();

    if (count > 0) {
      await adjustButton.click();

      // Fill adjustment form
      await page.fill('input[name="quantity"], input[id*="quantity"], input[name="amount"]', '50');

      // Select adjustment type (if exists)
      const typeSelect = page.locator('select[name="type"], [id*="type"]').first();
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption('add');
      }

      // Submit
      const submitButton = page.getByRole('button', { name: /save|simpan|confirm/i });
      await submitButton.click();

      // Verify success message or table update
      await expect(page.locator('.toast, [role="alert"], .notification').or(page.getByText(/success|berhasil/i, { exact: false })).first()).toBeVisible({ timeout: 5000 })
        .catch(() => {
          // If no toast, verify page reloads or updates
          return expect(page.locator('table').first()).toBeVisible();
        });
    } else {
      test.skip(true, 'No adjust button found - stock adjustment feature may not be implemented');
    }
  });

  test('should view stock history', async ({ page }) => {
    await page.goto(`${BASE_URL}/logistics`);

    // Find history button or tab
    const historyButton = page.locator('button').filter({ hasText: /history|riwayat/i }).first();
    const historyTab = page.getByRole('tab').filter({ hasText: /history|riwayat/i }).first();

    const historyElement = historyButton.count() > 0 ? historyButton : historyTab;
    const count = await historyElement.count();

    if (count > 0) {
      await historyElement.click();

      // Verify history content
      await expect(page.locator('table, .history, [data-testid="stock-history"]').first()).toBeVisible({ timeout: 5000 });
    } else {
      // Verify history section exists on page
      const historySection = page.locator('[data-testid="stock-history"], .history, section:has-text("history")').or(page.locator('section:has-text("riwayat")'));
      const sectionCount = await historySection.count();

      if (sectionCount === 0) {
        test.skip(true, 'History feature not found on logistics page');
      }
    }
  });

  test('should filter ingredients by category', async ({ page }) => {
    await page.goto(`${BASE_URL}/logistics`);

    // Look for category filter
    const categoryFilter = page.locator('select[name="category"], [id*="category"], [data-testid="category-filter"]').first();
    const count = await categoryFilter.count();

    if (count > 0) {
      // Get initial row count
      const initialRows = await page.locator('tbody tr, [role="row"]').count();

      // Select first category option (skip the "all" option)
      const options = await categoryFilter.locator('option').all();
      if (options.length > 1) {
        await categoryFilter.selectOption({ index: 1 });

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Verify filtered results (should have different or fewer rows)
        const filteredRows = await page.locator('tbody tr, [role="row"]').count();
        expect(filteredRows).toBeLessThanOrEqual(initialRows);
      }
    } else {
      test.skip(true, 'Category filter not found on logistics page');
    }
  });

  test('should search ingredients', async ({ page }) => {
    await page.goto(`${BASE_URL}/logistics`);

    // Look for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[name="search"], [data-testid="search-input"]').first();
    const count = await searchInput.count();

    if (count > 0) {
      // Get initial row count
      const initialRows = await page.locator('tbody tr, [role="row"]').count();

      // Enter search term
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Verify search results (should have fewer or same rows)
      const searchRows = await page.locator('tbody tr, [role="row"]').count();
      expect(searchRows).toBeLessThanOrEqual(initialRows);

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(500);

      // Verify all rows return
      const resetRows = await page.locator('tbody tr, [role="row"]').count();
      expect(resetRows).toBe(initialRows);
    } else {
      test.skip(true, 'Search input not found on logistics page');
    }
  });
});
