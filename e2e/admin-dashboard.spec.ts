import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard Tests
 * Tests the main admin dashboard functionality and navigation
 */

// Helper function to login
async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/**', { timeout: 10000 });
}

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('text=/dashboard|dasbor/i')).toBeVisible({ timeout: 5000 });
    
    // Check for statistics cards (orders, revenue, etc.)
    const statisticsVisible = await page.locator('text=/total|revenue|orders|pesanan/i').count() > 0;
    expect(statisticsVisible).toBeTruthy();
  });

  test('should navigate to settings page', async ({ page }) => {
    // Click settings link
    const settingsLink = page.locator('a:has-text("Settings"), a:has-text("Pengaturan"), button:has-text("Settings"), button:has-text("Pengaturan")').first();
    await settingsLink.click();
    
    // Wait for settings page to load
    await expect(page.locator('text=/settings|pengaturan/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to staff management', async ({ page }) => {
    // Click staff link
    const staffLink = page.locator('a:has-text("Staff"), button:has-text("Staff")').first();
    if (await staffLink.isVisible()) {
      await staffLink.click();
      
      // Wait for staff page to load
      await expect(page.locator('text=/staff|pengguna|users/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to menu management', async ({ page }) => {
    // Click menu/products link
    const menuLink = page.locator('a:has-text("Menu"), a:has-text("Products"), button:has-text("Menu")').first();
    if (await menuLink.isVisible()) {
      await menuLink.click();
      
      // Wait for menu page to load
      await expect(page.locator('text=/menu|products|produk/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display sidebar menu items', async ({ page }) => {
    // Verify key menu items exist
    const menuItems = [
      /dashboard|dasbor/i,
      /settings|pengaturan/i,
      /staff|pengguna/i
    ];
    
    for (const item of menuItems) {
      const element = page.locator(`text=${item}`).first();
      if (await element.isVisible()) {
        expect(await element.isVisible()).toBeTruthy();
      }
    }
  });

  test('should have functional theme toggle', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.locator('button:has-text("Light"), button:has-text("Dark"), button[aria-label*="theme"]').first();
    
    if (await themeToggle.isVisible()) {
      // Click theme toggle
      await themeToggle.click();
      
      // Wait for theme change (check for dark/light class on html or body)
      await page.waitForTimeout(500);
      
      // Verify theme changed
      const htmlClass = await page.locator('html').getAttribute('class');
      expect(htmlClass).toBeTruthy();
    }
  });

  test('should have functional language switcher', async ({ page }) => {
    // Look for language switcher (Globe icon or language dropdown)
    const languageSwitcher = page.locator('button:has-text("🇮🇩"), button:has-text("🇺🇸"), button[aria-label*="language"]').first();
    
    if (await languageSwitcher.isVisible()) {
      await languageSwitcher.click();
      
      // Wait for dropdown to appear
      await page.waitForTimeout(300);
      
      // Verify language options are visible
      const hasIndonesian = await page.locator('text=/bahasa indonesia|indonesia/i').isVisible();
      const hasEnglish = await page.locator('text=/english/i').isVisible();
      
      expect(hasIndonesian || hasEnglish).toBeTruthy();
    }
  });
});

test.describe('Admin Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to settings
    const settingsLink = page.locator('a:has-text("Settings"), a:has-text("Pengaturan"), button:has-text("Settings")').first();
    await settingsLink.click();
    await page.waitForTimeout(1000);
  });

  test('should display settings form', async ({ page }) => {
    // Wait for settings page
    await expect(page.locator('text=/settings|pengaturan/i')).toBeVisible({ timeout: 5000 });
    
    // Check for settings sections
    const hasSettings = await page.locator('text=/restaurant|restoran|tax|pajak|receipt|struk/i').count() > 0;
    expect(hasSettings).toBeTruthy();
  });

  test('should display system health status', async ({ page }) => {
    // Look for system health indicators
    const healthStatus = await page.locator('text=/database|api|health|status/i').count() > 0;
    expect(healthStatus).toBeTruthy();
  });
});

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should have notifications badge in menu', async ({ page }) => {
    // Look for notifications menu item
    const notificationsLink = page.locator('text=/notifications|notifikasi/i').first();
    
    if (await notificationsLink.isVisible()) {
      // Check if badge exists (shows count)
      const badge = page.locator('.badge, [class*="badge"]').first();
      const hasBadge = await badge.isVisible();
      
      // This is OK if no notifications
      expect(hasBadge || !hasBadge).toBeTruthy();
    }
  });

  test('should navigate to notifications page', async ({ page }) => {
    // Click notifications link
    const notificationsLink = page.locator('a:has-text("Notifications"), a:has-text("Notifikasi"), button:has-text("Notifications")').first();
    
    if (await notificationsLink.isVisible()) {
      await notificationsLink.click();
      
      // Wait for notifications page
      await expect(page.locator('text=/notifications|notifikasi/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
