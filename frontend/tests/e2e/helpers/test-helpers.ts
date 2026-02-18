/**
 * Shared Test Helpers for E2E Tests
 *
 * Provides reusable utilities for common E2E testing patterns,
 * particularly around authentication and navigation.
 */

import { Page, expect } from '@playwright/test';

/**
 * User credentials for testing
 */
export const TEST_USERS = {
  admin: { username: 'admin', password: 'admin123', role: 'admin', expectedPath: '/admin/dashboard' },
  manager: { username: 'manager1', password: 'admin123', role: 'manager', expectedPath: '/admin/dashboard' },
  server: { username: 'server1', password: 'admin123', role: 'server', expectedPath: '/admin/server' },
  counter: { username: 'counter1', password: 'admin123', role: 'counter', expectedPath: '/admin/counter' },
  kitchen: { username: 'kitchen1', password: 'admin123', role: 'kitchen', expectedPath: '/kitchen' },
} as const;

/**
 * Login user with proper waiting and navigation handling
 *
 * This helper:
 * 1. Navigates to login page
 * 2. Fills in credentials
 * 3. Submits the form
 * 4. Waits for auth token to be stored in localStorage
 * 5. Waits for navigation to complete based on user role
 * 6. Verifies the final URL matches expected role-based path
 *
 * @param page - Playwright Page object
 * @param username - Username to login with
 * @param password - Password to login with
 * @param options - Optional configuration
 * @returns Promise that resolves when login is complete
 */
export async function login(
  page: Page,
  username: string,
  password: string,
  options: {
    /**
     * Expected URL pattern after login (defaults to any path)
     */
    expectedURL?: RegExp | string;
    /**
     * Maximum time to wait for navigation (ms)
     */
    timeout?: number;
    /**
     * Whether to verify localStorage has auth token
     */
    verifyToken?: boolean;
  } = {}
): Promise<void> {
  const {
    expectedURL = /.*/,
    timeout = 10000,
    verifyToken = true,
  } = options;

  // Navigate to login page
  await page.goto('/login');

  // Fill in credentials
  await page.fill('input[id="username"]', username);
  await page.fill('input[id="password"]', password);

  // Submit form and wait for navigation
  await Promise.all([
    // Wait for navigation to complete
    page.waitForURL(expectedURL, { timeout }),
    // Click the submit button
    page.click('button:has-text("Sign In")'),
  ]);

  // Verify auth token is stored in localStorage
  if (verifyToken) {
    await expect.poll(async () => {
      const token = await page.evaluate(() => localStorage.getItem('pos_token'));
      return token !== null && token.length > 0;
    }, {
      timeout: 5000,
      message: 'Expected auth token to be stored in localStorage after login'
    }).toBe(true);
  }
}

/**
 * Login by user type (role)
 *
 * Convenience wrapper around login() that uses predefined test users
 *
 * @param page - Playwright Page object
 * @param userType - Key from TEST_USERS object
 * @param options - Optional configuration passed to login()
 */
export async function loginAs(
  page: Page,
  userType: keyof typeof TEST_USERS,
  options?: {
    timeout?: number;
    verifyToken?: boolean;
  }
): Promise<void> {
  const user = TEST_USERS[userType];
  await login(page, user.username, user.password, {
    expectedURL: user.expectedPath,
    ...options,
  });
}

/**
 * Logout and clear authentication state
 *
 * @param page - Playwright Page object
 */
export async function logout(page: Page): Promise<void> {
  // Clear localStorage
  await page.evaluate(() => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_remember_user');
  });

  // Navigate to login page
  await page.goto('/login');
}

/**
 * Wait for authentication to be complete
 *
 * Polls localStorage until auth token is present
 *
 * @param page - Playwright Page object
 * @param timeout - Maximum time to wait (ms)
 */
export async function waitForAuth(page: Page, timeout = 5000): Promise<void> {
  await expect.poll(async () => {
    const token = await page.evaluate(() => localStorage.getItem('pos_token'));
    return token !== null && token.length > 0;
  }, {
    timeout,
    message: 'Expected auth token to be stored in localStorage'
  }).toBe(true);
}

/**
 * Check if user is authenticated
 *
 * @param page - Playwright Page object
 * @returns true if auth token exists in localStorage
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('pos_token'));
  return token !== null && token.length > 0;
}

/**
 * Get current user from localStorage
 *
 * @param page - Playwright Page object
 * @returns User object or null
 */
export async function getCurrentUser(page: Page): Promise<any> {
  const userStr = await page.evaluate(() => localStorage.getItem('pos_user'));
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Retry helper for flaky operations
 *
 * Wraps an operation in a retry loop with exponential backoff
 *
 * @param operation - Function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay between retries (ms)
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Navigate to URL with timeout and retry
 *
 * More robust navigation that handles slow page loads
 *
 * @param page - Playwright Page object
 * @param url - URL to navigate to
 * @param options - Navigation options
 */
export async function navigateTo(
  page: Page,
  url: string,
  options: {
    timeout?: number;
    waitForLoadState?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  } = {}
): Promise<void> {
  const {
    timeout = 10000,
    waitForLoadState = 'domcontentloaded',
  } = options;

  await retry(async () => {
    await page.goto(url, { timeout });
    await page.waitForLoadState(waitForLoadState);
  });
}

/**
 * Wait for element to be visible with polling
 *
 * More robust than single waitFor() call
 *
 * @param page - Playwright Page object
 * @param selector - Element selector
 * @param timeout - Maximum time to wait (ms)
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<void> {
  await expect.poll(async () => {
    const element = page.locator(selector).first();
    return await element.isVisible();
  }, {
    timeout,
    message: `Expected element "${selector}" to be visible`
  }).toBe(true);
}
