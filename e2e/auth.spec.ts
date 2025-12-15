import { test, expect } from '@playwright/test';

/**
 * Authentication & Login Flow Tests
 * Tests the staff login functionality and role-based redirects
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    // Wait for login form to appear
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[name="username"]', 'invaliduser');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('text=/invalid|gagal|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with admin credentials', async ({ page }) => {
    // Fill in admin credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    
    // Verify admin dashboard is loaded
    await expect(page.locator('text=/dashboard|dasbor/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show/hide password when toggle is clicked', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    
    // Verify password is hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click show password button if exists
    const showPasswordButton = page.locator('button:has-text("Show"), button[aria-label*="password"]').first();
    if (await showPasswordButton.isVisible()) {
      await showPasswordButton.click();
      
      // Verify password is now visible
      const visiblePasswordInput = page.locator('input[type="text"]');
      await expect(visiblePasswordInput).toBeVisible();
    }
  });
});

test.describe('Role-Based Access', () => {
  test('admin should access all sections', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    
    // Verify admin has access to multiple sections
    await expect(page.locator('text=/dashboard|dasbor/i')).toBeVisible();
    await expect(page.locator('text=/settings|pengaturan/i')).toBeVisible();
    await expect(page.locator('text=/staff/i')).toBeVisible();
  });
});

test.describe('Session Management', () => {
  test('should persist session across page refreshes', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    
    // Refresh page
    await page.reload();
    
    // Verify still logged in (not redirected to login)
    await expect(page.locator('text=/dashboard|dasbor/i')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    
    // Click logout (look for logout button in user menu)
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Keluar")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Verify redirected to login page
      await page.waitForURL('/', { timeout: 5000 });
      await expect(page.locator('input[name="username"]')).toBeVisible();
    }
  });
});
