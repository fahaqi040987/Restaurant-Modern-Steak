/**
 * Complete Order Flow E2E Test
 * Tests the full order lifecycle from counter to kitchen to completion
 *
 * Flow: Counter creates order -> Kitchen processes -> Counter completes payment
 */
import { test, expect, Page } from '@playwright/test'

// Helper function to login
async function login(page: Page, username: string, password: string) {
  await page.goto('/login')
  await page.fill('input[id="username"]', username)
  await page.fill('input[id="password"]', password)
  await page.click('button:has-text("Sign In")')
  await page.waitForTimeout(2000)
}

test.describe('Complete Order Flow - Full Lifecycle Test', () => {

  test('FULL FLOW: Create order at Counter -> Process in Kitchen -> Complete Payment', async ({ page, browser }) => {
    console.log('=== PART 1: COUNTER - CREATE TAKEAWAY ORDER ===')

    // Step 1: Login as counter staff
    await page.goto('/login')
    await page.screenshot({ path: 'test-results/flow-01-login-page.png', fullPage: true })

    await page.fill('input[id="username"]', 'counter1')
    await page.fill('input[id="password"]', 'admin123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(3000)

    // Verify we're at the counter interface
    await expect(page).toHaveURL('/')
    await page.screenshot({ path: 'test-results/flow-02-counter-interface.png', fullPage: true })
    console.log('Counter URL:', page.url())

    // Step 2: Select Takeout order type
    const takeoutButton = page.getByRole('button', { name: 'Takeout' })
    await expect(takeoutButton).toBeVisible()
    await takeoutButton.click()
    console.log('Selected Takeout order type')

    // Step 3: Add items to order
    // The button shows "Add" with a plus icon - use text matching
    const addButtons = page.locator('button:has-text("Add")')
    await expect(addButtons.first()).toBeVisible()

    // Add Air Mineral
    await addButtons.first().click()
    await page.waitForTimeout(500)
    console.log('Added first item to order')

    // Add another item - Australian Angus Ribeye
    await addButtons.nth(1).click()
    await page.waitForTimeout(500)
    console.log('Added second item to order')

    // Verify cart shows items
    const orderItems = page.locator('text=Order Items')
    await expect(orderItems).toBeVisible()
    await page.screenshot({ path: 'test-results/flow-03-items-in-cart.png', fullPage: true })

    // Step 4: Enter customer name (optional)
    const customerNameInput = page.getByPlaceholder('Customer name')
    if (await customerNameInput.isVisible()) {
      await customerNameInput.fill('Test Customer E2E')
      console.log('Entered customer name')
    }

    // Step 5: Click Create Order button
    const createOrderButton = page.getByRole('button', { name: /Create Order/i })
    await expect(createOrderButton).toBeVisible()
    await createOrderButton.click()
    console.log('Clicked Create Order button')

    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/flow-04-order-created.png', fullPage: true })

    // Check for order confirmation or order number
    const pageContent = await page.textContent('body')
    console.log('Page content after order creation (excerpt):', pageContent?.substring(0, 500))

    console.log('\n=== PART 2: KITCHEN - PROCESS ORDER ===')

    // Open a new browser context for kitchen staff
    const kitchenContext = await browser.newContext()
    const kitchenPage = await kitchenContext.newPage()

    // Login as kitchen staff
    await kitchenPage.goto('http://localhost:4000/login')
    await kitchenPage.fill('input[id="username"]', 'kitchen1')
    await kitchenPage.fill('input[id="password"]', 'admin123')
    await kitchenPage.click('button:has-text("Sign In")')
    await kitchenPage.waitForTimeout(3000)

    await kitchenPage.screenshot({ path: 'test-results/flow-05-kitchen-display.png', fullPage: true })
    console.log('Kitchen URL:', kitchenPage.url())

    // Verify kitchen display
    await expect(kitchenPage).toHaveURL('/kitchen')
    await expect(kitchenPage.getByText('Tampilan Dapur')).toBeVisible()

    // Check for orders - look at both tabs
    const pesananDapur = kitchenPage.locator('button:has-text("Pesanan Dapur")')
    const papanTakeaway = kitchenPage.locator('button:has-text("Papan Takeaway")')

    // Click on Takeaway tab since we created a takeaway order
    if (await papanTakeaway.isVisible()) {
      await papanTakeaway.click()
      await kitchenPage.waitForTimeout(1000)
      await kitchenPage.screenshot({ path: 'test-results/flow-06-kitchen-takeaway-tab.png', fullPage: true })
      console.log('Switched to Takeaway tab')
    }

    // Look for order cards
    const orderCards = kitchenPage.locator('[class*="card"], [class*="order"]')
    const orderCount = await orderCards.count()
    console.log('Order cards found in kitchen:', orderCount)

    // Look for action buttons on orders
    const startPrepButton = kitchenPage.getByRole('button', { name: /Start|Mulai|Prepare|Siapkan/i })
    const startButtonCount = await startPrepButton.count()
    console.log('Start/Prepare buttons found:', startButtonCount)

    if (startButtonCount > 0) {
      // Click the first Start Preparing button
      await startPrepButton.first().click()
      await kitchenPage.waitForTimeout(1000)
      await kitchenPage.screenshot({ path: 'test-results/flow-07-order-preparing.png', fullPage: true })
      console.log('Started preparing order')

      // Look for Ready/Complete button
      const readyButton = kitchenPage.getByRole('button', { name: /Ready|Selesai|Done|Complete/i })
      if (await readyButton.count() > 0) {
        await readyButton.first().click()
        await kitchenPage.waitForTimeout(1000)
        await kitchenPage.screenshot({ path: 'test-results/flow-08-order-ready.png', fullPage: true })
        console.log('Marked order as ready')
      }
    }

    // Close kitchen context
    await kitchenContext.close()

    console.log('\n=== PART 3: COUNTER - PROCESS PAYMENT ===')

    // Back to counter page - click Process Payment
    const processPaymentButton = page.getByRole('button', { name: /Process Payment/i })
    if (await processPaymentButton.isVisible()) {
      await processPaymentButton.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/flow-09-payment-interface.png', fullPage: true })
      console.log('Opened payment interface')

      // Look for payment methods
      const cashPayment = page.getByRole('button', { name: /Cash|Tunai/i })
      const cardPayment = page.getByRole('button', { name: /Card|Kartu|Debit|Credit/i })

      if (await cashPayment.count() > 0) {
        await cashPayment.first().click()
        await page.waitForTimeout(1000)
        console.log('Selected Cash payment')
      }

      // Look for confirm payment button
      const confirmPayment = page.getByRole('button', { name: /Confirm|Konfirmasi|Pay|Bayar/i })
      if (await confirmPayment.count() > 0) {
        await confirmPayment.first().click()
        await page.waitForTimeout(2000)
        await page.screenshot({ path: 'test-results/flow-10-payment-complete.png', fullPage: true })
        console.log('Payment confirmed')
      }
    }

    console.log('\n=== FLOW COMPLETE ===')
    await page.screenshot({ path: 'test-results/flow-11-final-state.png', fullPage: true })
  })

  test('PART 4: QR Code / Customer Table Ordering Interface', async ({ page }) => {
    console.log('=== TESTING QR CODE / TABLE ORDERING ===')

    // Try different customer ordering URLs
    const testUrls = [
      '/order/TABLE-01',
      '/order/T012',
      '/customer/table/TABLE-01',
      '/customer/order/TABLE-01',
    ]

    for (const url of testUrls) {
      await page.goto(url)
      await page.waitForTimeout(2000)

      const currentUrl = page.url()
      console.log(`Tried: ${url} -> Redirected to: ${currentUrl}`)

      if (!currentUrl.includes('login') && !currentUrl.includes('404')) {
        console.log('Found working customer ordering URL:', url)
        await page.screenshot({ path: `test-results/flow-12-qr-order-${url.replace(/\//g, '-')}.png`, fullPage: true })
        break
      }
    }

    // Also test the public menu page
    await page.goto('/site/menu')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/flow-13-public-menu.png', fullPage: true })

    // Check if there's an "Order Now" or similar button on menu
    const orderNowButton = page.getByRole('button', { name: /Order|Pesan/i })
    console.log('Order buttons on public menu:', await orderNowButton.count())
  })
})

// Additional test to explore the server station (dine-in orders)
test.describe('Server Station - Dine-in Orders', () => {
  test('Server creates dine-in order with table assignment', async ({ page }) => {
    console.log('=== SERVER STATION - DINE-IN ORDER ===')

    // Login as server staff
    await page.goto('/login')
    await page.fill('input[id="username"]', 'server1')
    await page.fill('input[id="password"]', 'admin123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(3000)

    await page.screenshot({ path: 'test-results/server-01-interface.png', fullPage: true })
    console.log('Server URL:', page.url())

    // Look for server-specific interface elements
    const tableSelection = page.getByText(/Select Table|Pilih Meja/i)
    const dineInOption = page.getByRole('button', { name: /Dine-In/i })

    console.log('Table selection visible:', await tableSelection.count() > 0)
    console.log('Dine-In option visible:', await dineInOption.count() > 0)

    // If we have table buttons, click one
    const tableButtons = page.locator('button:has-text("seats")')
    console.log('Table buttons found:', await tableButtons.count())

    if (await tableButtons.count() > 0) {
      await tableButtons.first().click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/server-02-table-selected.png', fullPage: true })
      console.log('Selected a table')
    }
  })
})

// Test for viewing existing orders
test.describe('Order Management - View and Track Orders', () => {
  test('View orders in admin dashboard', async ({ page }) => {
    console.log('=== ADMIN - ORDER MANAGEMENT ===')

    // Login as admin
    await page.goto('/login')
    await page.fill('input[id="username"]', 'admin')
    await page.fill('input[id="password"]', 'admin123')
    await page.click('button:has-text("Sign In")')
    await page.waitForTimeout(3000)

    await page.screenshot({ path: 'test-results/admin-01-login-result.png', fullPage: true })
    console.log('Admin login URL:', page.url())

    // Navigate to orders page if not already there
    await page.goto('/admin/orders')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/admin-02-orders-page.png', fullPage: true })

    // Look for order list
    const orderTable = page.locator('table')
    const orderRows = page.locator('tr')
    console.log('Order tables found:', await orderTable.count())
    console.log('Order rows found:', await orderRows.count())
  })
})
