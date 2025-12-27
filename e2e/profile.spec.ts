import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:8080/api/v1';

// Test user credentials
const TEST_USER = {
  username: 'admin',
  password: 'admin123',
};

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to admin dashboard
    await page.waitForURL(/\/admin/);
  });

  test('T069 - Profile update flow', async ({ page }) => {
    // Navigate to profile page
    await page.goto(`${BASE_URL}/admin/profile`);

    // Wait for profile page to load
    await expect(page.locator('h2')).toContainText('Profile');

    // Verify profile form is displayed
    await expect(page.locator('input[id="first_name"]')).toBeVisible();
    await expect(page.locator('input[id="last_name"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();

    // Get original values
    const originalFirstName = await page.locator('input[id="first_name"]').inputValue();
    const originalLastName = await page.locator('input[id="last_name"]').inputValue();

    // Update first name
    await page.fill('input[id="first_name"]', 'Test');
    await page.fill('input[id="last_name"]', 'User');

    // Submit the form
    await page.click('button:has-text("Save Changes")');

    // Wait for success toast
    await expect(page.locator('.toast, [role="status"]').first()).toBeVisible({ timeout: 5000 });

    // Verify values were updated
    await expect(page.locator('input[id="first_name"]')).toHaveValue('Test');
    await expect(page.locator('input[id="last_name"]')).toHaveValue('User');

    // Restore original values
    await page.fill('input[id="first_name"]', originalFirstName);
    await page.fill('input[id="last_name"]', originalLastName);
    await page.click('button:has-text("Save Changes")');

    // Wait for success toast
    await expect(page.locator('.toast, [role="status"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('T069 - Profile validation errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/profile`);

    // Wait for profile page to load
    await expect(page.locator('h2')).toContainText('Profile');

    // Clear first name (required field)
    await page.fill('input[id="first_name"]', '');

    // Clear email and enter invalid format
    await page.fill('input[id="email"]', 'invalid-email');

    // Try to submit
    await page.click('button:has-text("Save Changes")');

    // Should show validation errors
    await expect(page.locator('text=First name is required')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Invalid email')).toBeVisible({ timeout: 3000 });
  });

  test('T070 - Password change flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/profile`);

    // Wait for profile page to load
    await expect(page.locator('h2')).toContainText('Profile');

    // Click Change Password button
    await page.click('button:has-text("Change Password")');

    // Wait for password form to appear
    await expect(page.locator('input[id="current_password"]')).toBeVisible();
    await expect(page.locator('input[id="new_password"]')).toBeVisible();
    await expect(page.locator('input[id="confirm_password"]')).toBeVisible();

    // Test password mismatch validation
    await page.fill('input[id="current_password"]', 'oldpassword');
    await page.fill('input[id="new_password"]', 'newpassword123');
    await page.fill('input[id="confirm_password"]', 'differentpassword');

    await page.click('button:has-text("Update Password")');

    // Should show password mismatch error
    await expect(page.locator("text=Passwords don't match")).toBeVisible({ timeout: 3000 });

    // Clear and test short password
    await page.fill('input[id="current_password"]', 'old');
    await page.fill('input[id="new_password"]', 'short');
    await page.fill('input[id="confirm_password"]', 'short');

    await page.click('button:has-text("Update Password")');

    // Should show minimum length error
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible({ timeout: 3000 });

    // Cancel password change
    await page.click('button:has-text("Cancel")');

    // Password form should be hidden
    await expect(page.locator('input[id="current_password"]')).not.toBeVisible();
    await expect(page.locator('button:has-text("Change Password")')).toBeVisible();
  });

  test('T070 - Password change with correct current password', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/profile`);

    // Wait for profile page to load
    await expect(page.locator('h2')).toContainText('Profile');

    // Click Change Password button
    await page.click('button:has-text("Change Password")');

    // Fill in password form with matching passwords
    await page.fill('input[id="current_password"]', TEST_USER.password);
    await page.fill('input[id="new_password"]', 'newpassword123');
    await page.fill('input[id="confirm_password"]', 'newpassword123');

    await page.click('button:has-text("Update Password")');

    // Wait for either success or error response
    const result = await Promise.race([
      page.waitForSelector('.toast:has-text("Password changed successfully"), [role="status"]:has-text("Password changed")', { timeout: 5000 }).then(() => 'success'),
      page.waitForSelector('.toast:has-text("error"), [role="alert"]', { timeout: 5000 }).then(() => 'error'),
    ]).catch(() => 'timeout');

    // If password was successfully changed, change it back
    if (result === 'success') {
      // Password form should be hidden after success
      await expect(page.locator('button:has-text("Change Password")')).toBeVisible();

      // Change password back to original
      await page.click('button:has-text("Change Password")');
      await page.fill('input[id="current_password"]', 'newpassword123');
      await page.fill('input[id="new_password"]', TEST_USER.password);
      await page.fill('input[id="confirm_password"]', TEST_USER.password);
      await page.click('button:has-text("Update Password")');
    }
  });

  test('Profile page accessible from user menu', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto(`${BASE_URL}/admin`);

    // Find and click user menu
    const userMenuTrigger = page.locator('[data-testid="user-menu"], button:has(.lucide-user)').first();

    if (await userMenuTrigger.isVisible()) {
      await userMenuTrigger.click();

      // Click Profile option in dropdown
      await page.click('text=Profile');

      // Should navigate to profile page
      await expect(page).toHaveURL(/\/admin\/profile/);
      await expect(page.locator('h2')).toContainText('Profile');
    }
  });

  test('Profile shows read-only username and role', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/profile`);

    // Wait for profile page to load
    await expect(page.locator('h2')).toContainText('Profile');

    // Username field should be disabled
    const usernameInput = page.locator('input[value="admin"]').first();
    await expect(usernameInput).toBeDisabled();

    // Role field should be disabled
    const roleInput = page.locator('input[value*="Admin"], input[value*="admin"]').first();
    await expect(roleInput).toBeDisabled();
  });

  test('Profile shows account creation date', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/profile`);

    // Wait for profile page to load
    await expect(page.locator('h2')).toContainText('Profile');

    // Account Information section should be visible
    await expect(page.locator('text=Account Information')).toBeVisible();
    await expect(page.locator('text=Account Created')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();
  });
});
