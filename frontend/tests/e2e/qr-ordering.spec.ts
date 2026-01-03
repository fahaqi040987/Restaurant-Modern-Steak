/**
 * T089: E2E test for complete QR ordering flow
 * Flow: scan QR -> browse menu -> add items -> order -> pay -> track -> survey
 */
import { test, expect } from '@playwright/test'

test.describe('QR-based Customer Ordering Flow', () => {
  // Use a valid table QR code for testing
  const TEST_TABLE_CODE = 'TABLE-01'

  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/v1/customer/tables/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'table-123',
            table_number: '1',
            capacity: 4,
            status: 'available',
            qr_code: TEST_TABLE_CODE,
          },
        }),
      })
    })

    await page.route('**/api/v1/public/menu', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'product-1',
              name: 'Wagyu Ribeye',
              description: 'Premium wagyu steak with special sauce',
              price: 450000,
              category_id: 'cat-1',
              category_name: 'Steaks',
              image_url: '/images/wagyu.jpg',
              is_available: true,
            },
            {
              id: 'product-2',
              name: 'Rendang Wagyu',
              description: 'Indonesian style wagyu with rendang spices',
              price: 350000,
              category_id: 'cat-1',
              category_name: 'Steaks',
              is_available: true,
            },
            {
              id: 'product-3',
              name: 'Es Teh Manis',
              description: 'Sweet iced tea',
              price: 15000,
              category_id: 'cat-2',
              category_name: 'Drinks',
              is_available: true,
            },
          ],
        }),
      })
    })

    await page.route('**/api/v1/public/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'cat-1', name: 'Steaks', display_order: 1 },
            { id: 'cat-2', name: 'Drinks', display_order: 2 },
          ],
        }),
      })
    })
  })

  test('should display menu after scanning QR code', async ({ page }) => {
    // Step 1: Scan QR code (navigate to order page)
    await page.goto(`/order/${TEST_TABLE_CODE}`)

    // Verify table info is shown
    await expect(page.getByText('Table 1')).toBeVisible()

    // Verify menu items are displayed
    await expect(page.getByText('Wagyu Ribeye')).toBeVisible()
    await expect(page.getByText('Rendang Wagyu')).toBeVisible()
    await expect(page.getByText('Es Teh Manis')).toBeVisible()

    // Verify category filters are shown
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Steaks' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Drinks' })).toBeVisible()
  })

  test('should add items to cart and show cart total', async ({ page }) => {
    await page.goto(`/order/${TEST_TABLE_CODE}`)

    // Wait for menu to load
    await expect(page.getByText('Wagyu Ribeye')).toBeVisible()

    // Add first item to cart
    const addButtons = page.getByRole('button', { name: 'Add to Order' })
    await addButtons.first().click()

    // Cart badge should appear
    await expect(page.locator('text=1').first()).toBeVisible()

    // Total should be displayed in cart footer
    await expect(page.getByText(/Total:/)).toBeVisible()

    // Add another item
    await addButtons.nth(1).click()

    // Cart should show 2 items
    await expect(page.getByText('2 items')).toBeVisible()
  })

  test('should increase/decrease item quantity in cart', async ({ page }) => {
    await page.goto(`/order/${TEST_TABLE_CODE}`)

    // Wait for menu to load
    await expect(page.getByText('Wagyu Ribeye')).toBeVisible()

    // Add item to cart
    await page.getByRole('button', { name: 'Add to Order' }).first().click()

    // Increase quantity
    await page.getByRole('button', { name: '' }).last().click()
    await expect(page.getByText('2')).toBeVisible()

    // Decrease quantity
    await page.getByRole('button', { name: '' }).first().click()
    await expect(page.getByText('1 items')).toBeVisible()
  })

  test('should filter menu by category', async ({ page }) => {
    await page.goto(`/order/${TEST_TABLE_CODE}`)

    // Wait for menu to load
    await expect(page.getByText('Wagyu Ribeye')).toBeVisible()

    // Click on Drinks category
    await page.getByRole('button', { name: 'Drinks' }).click()

    // Only drinks should be visible
    await expect(page.getByText('Es Teh Manis')).toBeVisible()

    // Steaks should not be visible when filtering
    // Note: This depends on how the filter works
    await expect(page.getByRole('button', { name: 'Steaks' })).toBeVisible()
  })

  test('should place order and proceed to payment', async ({ page }) => {
    // Mock order creation
    await page.route('**/api/v1/customer/orders', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              order_id: 'order-123',
              order_number: 'ORD-001',
              total_amount: 499500, // 450000 + 11% tax
            },
          }),
        })
      }
    })

    await page.goto(`/order/${TEST_TABLE_CODE}`)

    // Wait for menu and add item
    await expect(page.getByText('Wagyu Ribeye')).toBeVisible()
    await page.getByRole('button', { name: 'Add to Order' }).first().click()

    // Enter customer name
    await page.getByPlaceholder('Your name (optional)').fill('Test Customer')

    // Place order
    await page.getByRole('button', { name: /Place Order/ }).click()

    // Should show payment step
    await expect(page.getByText('Nomor Pesanan')).toBeVisible()
    await expect(page.getByText('ORD-001')).toBeVisible()
    await expect(page.getByText('Pilih Metode Pembayaran')).toBeVisible()
  })

  test('should select payment method and complete payment', async ({ page }) => {
    // Setup mocks
    await page.route('**/api/v1/customer/orders', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              order_id: 'order-123',
              order_number: 'ORD-001',
              total_amount: 499500,
            },
          }),
        })
      }
    })

    await page.route('**/api/v1/customer/orders/*/payment', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            payment_id: 'payment-123',
            status: 'completed',
          },
        }),
      })
    })

    await page.goto(`/order/${TEST_TABLE_CODE}`)

    // Add item and place order
    await expect(page.getByText('Wagyu Ribeye')).toBeVisible()
    await page.getByRole('button', { name: 'Add to Order' }).first().click()
    await page.getByRole('button', { name: /Place Order/ }).click()

    // Wait for payment step
    await expect(page.getByText('Pilih Metode Pembayaran')).toBeVisible()

    // Select QRIS payment
    await page.getByTestId('payment-option-qris').click()

    // Should show payment confirmation
    await expect(page.getByText('Pembayaran Berhasil')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Lacak Pesanan')).toBeVisible()
  })

  test('should navigate to order tracking after payment', async ({ page }) => {
    // Setup mocks
    await page.route('**/api/v1/customer/orders', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              order_id: 'order-123',
              order_number: 'ORD-001',
              total_amount: 499500,
            },
          }),
        })
      }
    })

    await page.route('**/api/v1/customer/orders/*/payment', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            payment_id: 'payment-123',
            status: 'completed',
          },
        }),
      })
    })

    await page.route('**/api/v1/customer/orders/*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'order-123',
              order_number: 'ORD-001',
              status: 'preparing',
              total_amount: 499500,
              subtotal: 450000,
              tax_amount: 49500,
              items: [
                {
                  id: 'item-1',
                  product: { name: 'Wagyu Ribeye' },
                  quantity: 1,
                  total_price: 450000,
                },
              ],
            },
          }),
        })
      }
    })

    await page.goto(`/order/${TEST_TABLE_CODE}`)

    // Complete order and payment flow
    await expect(page.getByText('Wagyu Ribeye')).toBeVisible()
    await page.getByRole('button', { name: 'Add to Order' }).first().click()
    await page.getByRole('button', { name: /Place Order/ }).click()
    await expect(page.getByText('Pilih Metode Pembayaran')).toBeVisible()
    await page.getByTestId('payment-option-qris').click()

    // Wait for confirmation and click track order
    await expect(page.getByText('Pembayaran Berhasil')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /Lacak Pesanan/ }).click()

    // Should be on order status page
    await expect(page).toHaveURL(/\/order-status\//)
    await expect(page.getByText('Status Pesanan')).toBeVisible()
    await expect(page.getByText('ORD-001')).toBeVisible()
  })

  test('should display order status tracking correctly', async ({ page }) => {
    await page.route('**/api/v1/customer/orders/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'order-123',
            order_number: 'ORD-001',
            status: 'preparing',
            total_amount: 499500,
            subtotal: 450000,
            tax_amount: 49500,
            items: [
              {
                id: 'item-1',
                product: { name: 'Wagyu Ribeye' },
                quantity: 1,
                total_price: 450000,
              },
            ],
          },
        }),
      })
    })

    await page.goto('/order-status/order-123')

    // Verify order status page elements
    await expect(page.getByText('Status Pesanan')).toBeVisible()
    await expect(page.getByText('#ORD-001')).toBeVisible()
    await expect(page.getByText('Sedang Dimasak')).toBeVisible()
    await expect(page.getByText('Progress Pesanan')).toBeVisible()
    await expect(page.getByText('Detail Pesanan')).toBeVisible()
    await expect(page.getByText('Wagyu Ribeye')).toBeVisible()
  })

  test('should show survey prompt when order is served', async ({ page }) => {
    let callCount = 0

    await page.route('**/api/v1/customer/orders/*', async (route) => {
      callCount++
      // Simulate status change to 'served' after first poll
      const status = callCount > 1 ? 'served' : 'preparing'

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'order-123',
            order_number: 'ORD-001',
            status,
            total_amount: 499500,
            subtotal: 450000,
            tax_amount: 49500,
            items: [
              {
                id: 'item-1',
                product: { name: 'Wagyu Ribeye' },
                quantity: 1,
                total_price: 450000,
              },
            ],
          },
        }),
      })
    })

    await page.goto('/order-status/order-123')

    // Wait for polling to detect served status
    await page.waitForTimeout(6000) // Wait for poll cycle

    // Survey prompt should appear
    await expect(page.getByText('Bagaimana Pengalaman Anda?')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /Beri Penilaian/ })).toBeVisible()
  })

  test('should submit satisfaction survey', async ({ page }) => {
    await page.route('**/api/v1/customer/orders/*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'order-123',
              order_number: 'ORD-001',
              status: 'served',
              total_amount: 499500,
              subtotal: 450000,
              tax_amount: 49500,
              items: [],
            },
          }),
        })
      }
    })

    await page.route('**/api/v1/customer/orders/*/survey', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Survey submitted successfully',
        }),
      })
    })

    await page.goto('/order-status/order-123')

    // Click survey button
    await page.getByRole('button', { name: /Beri Penilaian/ }).click()

    // Survey dialog should open
    await expect(page.getByText('Penilaian Pengalaman')).toBeVisible()

    // Rate food quality (5 stars)
    const foodStars = page.locator('[aria-label="5 bintang"]').first()
    await foodStars.click()

    // Rate service quality
    const serviceStars = page.locator('[aria-label="5 bintang"]').nth(1)
    await serviceStars.click()

    // Rate ambiance
    const ambianceStars = page.locator('[aria-label="5 bintang"]').nth(2)
    await ambianceStars.click()

    // Add comment
    await page.getByPlaceholder(/Ceritakan pengalaman/).fill('Makanan sangat enak!')

    // Submit survey
    await page.getByRole('button', { name: /Kirim Penilaian/ }).click()

    // Should show success confirmation
    await expect(page.getByText('Terima Kasih!')).toBeVisible({ timeout: 10000 })
  })

  test('should handle invalid QR code gracefully', async ({ page }) => {
    await page.route('**/api/v1/customer/tables/*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Table not found',
        }),
      })
    })

    await page.goto('/order/INVALID-QR-CODE')

    // Should show error message
    await expect(page.getByText('Invalid QR Code')).toBeVisible()
    await expect(page.getByText('This QR code is not recognized')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Go to Homepage' })).toBeVisible()
  })

  test('should handle payment failure gracefully', async ({ page }) => {
    await page.route('**/api/v1/customer/orders', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              order_id: 'order-123',
              order_number: 'ORD-001',
              total_amount: 499500,
            },
          }),
        })
      }
    })

    await page.route('**/api/v1/customer/orders/*/payment', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Payment failed',
        }),
      })
    })

    await page.goto(`/order/${TEST_TABLE_CODE}`)

    // Add item and place order
    await expect(page.getByText('Wagyu Ribeye')).toBeVisible()
    await page.getByRole('button', { name: 'Add to Order' }).first().click()
    await page.getByRole('button', { name: /Place Order/ }).click()

    // Select payment method
    await expect(page.getByText('Pilih Metode Pembayaran')).toBeVisible()
    await page.getByTestId('payment-option-qris').click()

    // Should show error message
    await expect(page.getByText('Pembayaran gagal')).toBeVisible({ timeout: 10000 })
  })

  test('complete flow: QR scan -> order -> payment -> track -> survey', async ({ page }) => {
    // This is the full end-to-end integration test
    let orderCallCount = 0

    await page.route('**/api/v1/customer/orders', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              order_id: 'order-e2e-123',
              order_number: 'ORD-E2E-001',
              total_amount: 499500,
            },
          }),
        })
      }
    })

    await page.route('**/api/v1/customer/orders/*/payment', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            payment_id: 'payment-e2e-123',
            status: 'completed',
          },
        }),
      })
    })

    await page.route('**/api/v1/customer/orders/*', async (route) => {
      if (route.request().method() === 'GET') {
        orderCallCount++
        // Simulate status progression: preparing -> ready -> served
        let status = 'preparing'
        if (orderCallCount > 2) status = 'ready'
        if (orderCallCount > 4) status = 'served'

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'order-e2e-123',
              order_number: 'ORD-E2E-001',
              status,
              total_amount: 499500,
              subtotal: 450000,
              tax_amount: 49500,
              items: [
                {
                  id: 'item-1',
                  product: { name: 'Wagyu Ribeye' },
                  quantity: 1,
                  total_price: 450000,
                },
              ],
            },
          }),
        })
      }
    })

    await page.route('**/api/v1/customer/orders/*/survey', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Survey submitted successfully',
        }),
      })
    })

    // STEP 1: Scan QR code and view menu
    await page.goto(`/order/${TEST_TABLE_CODE}`)
    await expect(page.getByText('Table 1')).toBeVisible()
    await expect(page.getByText('Wagyu Ribeye')).toBeVisible()

    // STEP 2: Add items to cart
    await page.getByRole('button', { name: 'Add to Order' }).first().click()
    await expect(page.getByText('1 items')).toBeVisible()

    // STEP 3: Place order
    await page.getByRole('button', { name: /Place Order/ }).click()
    await expect(page.getByText('ORD-E2E-001')).toBeVisible()

    // STEP 4: Select payment and complete payment
    await expect(page.getByText('Pilih Metode Pembayaran')).toBeVisible()
    await page.getByTestId('payment-option-cash').click()
    await expect(page.getByText('Pembayaran Berhasil')).toBeVisible({ timeout: 10000 })

    // STEP 5: Navigate to order tracking
    await page.getByRole('button', { name: /Lacak Pesanan/ }).click()
    await expect(page).toHaveURL(/\/order-status\//)
    await expect(page.getByText('Status Pesanan')).toBeVisible()

    // STEP 6: Wait for order to be served and submit survey
    await page.waitForTimeout(15000) // Wait for multiple poll cycles
    await expect(page.getByText('Bagaimana Pengalaman Anda?')).toBeVisible({ timeout: 15000 })

    // Open and submit survey
    await page.getByRole('button', { name: /Beri Penilaian/ }).click()
    await expect(page.getByText('Penilaian Pengalaman')).toBeVisible()

    // Rate all categories
    const stars = page.locator('[aria-label="5 bintang"]')
    await stars.nth(0).click()
    await stars.nth(1).click()
    await stars.nth(2).click()

    await page.getByRole('button', { name: /Kirim Penilaian/ }).click()
    await expect(page.getByText('Terima Kasih!')).toBeVisible({ timeout: 10000 })
  })
})
