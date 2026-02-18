/**
 * T056: E2E test for public website in Indonesian
 * Tests: Language switcher, text translations, navigation labels, persistence
 */
import { test, expect } from '@playwright/test'

test.describe('Public Website Indonesian i18n', () => {
  test.describe('Language Switcher', () => {
    test.beforeEach(async ({ page }) => {
      // Skip loader
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
      await page.reload()
    })

    test('should display language switcher in header', async ({ page }) => {
      // Language switcher dropdown should be visible
      const languageSwitcher = page.locator('[data-testid="language-switcher"]')
      await expect(languageSwitcher).toBeVisible()
    })

    test('should switch to Indonesian when selecting from dropdown', async ({ page }) => {
      // Click language switcher dropdown
      await page.getByTestId('language-switcher').click()
      await page.waitForTimeout(300)

      // Click Indonesian option - use role-based selector
      await page.getByRole('menuitem', { name: 'Indonesia' }).click()
      await page.waitForTimeout(500)

      // Verify navigation changed to Indonesian
      const nav = page.locator('nav[aria-label="Main navigation"]')
      await expect(nav.getByRole('link', { name: 'Beranda' })).toBeVisible()
    })

    test('should switch back to English', async ({ page }) => {
      // First switch to Indonesian
      await page.getByTestId('language-switcher').click()
      await page.waitForTimeout(300)
      await page.getByRole('menuitem', { name: 'Indonesia' }).click()
      await page.waitForTimeout(500)

      // Then switch back to English
      await page.getByTestId('language-switcher').click()
      await page.waitForTimeout(300)
      await page.getByRole('menuitem', { name: 'English' }).click()
      await page.waitForTimeout(500)

      // Verify navigation changed to English
      const nav = page.locator('nav[aria-label="Main navigation"]')
      await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible()
    })
  })

  test.describe('Indonesian Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Set Indonesian language before visiting
      await page.goto('/site')
      await page.evaluate(() => {
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
        localStorage.setItem('i18nextLng', 'id-ID')
      })
      await page.reload()
    })

    test('should display navigation links in Indonesian', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Main navigation"]')
      await expect(nav).toBeVisible()

      // Check Indonesian navigation labels
      await expect(nav.getByRole('link', { name: 'Beranda' })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Menu' })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Tentang' })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Reservasi' })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Kontak' })).toBeVisible()
    })

    test('should display "Login Staf" instead of "Staff Login"', async ({ page }) => {
      const staffLoginLink = page.getByRole('link', { name: /Login Staf/i })
      await expect(staffLoginLink).toBeVisible()
    })

    test('should display "Pesan Meja" CTA button', async ({ page }) => {
      const ctaButton = page.getByRole('link', { name: /Pesan Meja/i })
      await expect(ctaButton).toBeVisible()
    })
  })

  test.describe('Indonesian Footer', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site')
      await page.evaluate(() => {
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
        localStorage.setItem('i18nextLng', 'id-ID')
      })
      await page.reload()
    })

    test('should display footer sections in Indonesian', async ({ page }) => {
      const footer = page.locator('footer[role="contentinfo"]')
      // Check Indonesian section titles - use getByText for better matching
      await expect(footer.getByText('Reservasi Meja Anda')).toBeVisible()
      await expect(footer.getByText('Tautan Cepat')).toBeVisible()
      await expect(footer.getByText('Hubungi Kami')).toBeVisible()
      await expect(footer.getByText('Jam Buka')).toBeVisible()
    })

    test('should display "Pesan Sekarang" button in footer', async ({ page }) => {
      const footer = page.locator('footer[role="contentinfo"]')
      const bookNowBtn = footer.getByRole('link', { name: 'Pesan Sekarang' })
      await expect(bookNowBtn).toBeVisible()
    })

    test('should display "Portal Staf" link', async ({ page }) => {
      const footer = page.locator('footer[role="contentinfo"]')
      const staffPortal = footer.getByRole('link', { name: /Portal Staf/i })
      await expect(staffPortal).toBeVisible()
    })
  })

  test.describe('Indonesian Reservation Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site/reservation')
      await page.evaluate(() => {
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
        localStorage.setItem('i18nextLng', 'id-ID')
      })
      await page.reload()
    })

    test('should display reservation form labels in Indonesian', async ({ page }) => {
      // Check form labels - use getByText for better matching
      await expect(page.getByText('Nama Lengkap')).toBeVisible()
      await expect(page.getByText('Alamat Email')).toBeVisible()
      await expect(page.getByText('Nomor Telepon')).toBeVisible()
      await expect(page.getByText('Jumlah Tamu')).toBeVisible()
      await expect(page.getByText('Tanggal')).toBeVisible()
      await expect(page.getByText('Waktu')).toBeVisible()
    })

    test('should display "Pesan Meja Anda" submit button', async ({ page }) => {
      const submitBtn = page.getByRole('button', { name: /Pesan Meja Anda/i })
      await expect(submitBtn).toBeVisible()
    })
  })

  test.describe('Indonesian Contact Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/site/contact')
      await page.evaluate(() => {
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
        localStorage.setItem('i18nextLng', 'id-ID')
      })
      await page.reload()
    })

    test('should display contact form labels in Indonesian', async ({ page }) => {
      // Check form labels - use getByLabel and getByText for better matching
      await expect(page.getByLabel(/Nama/i)).toBeVisible()
      await expect(page.getByLabel(/Email/i)).toBeVisible()
      await expect(page.getByLabel(/Subjek/i)).toBeVisible()
      await expect(page.getByLabel(/Pesan/i)).toBeVisible()
    })

    test('should display "Kirim Pesan" submit button', async ({ page }) => {
      const submitBtn = page.getByRole('button', { name: /Kirim Pesan/i })
      await expect(submitBtn).toBeVisible()
    })

    test('should display subject options in Indonesian', async ({ page }) => {
      // Click subject dropdown
      await page.getByTestId('subject-trigger').click()
      await page.waitForTimeout(300)

      // Check Indonesian subject options - use getByText with exact match
      await expect(page.getByText('Reservasi')).toBeVisible()
      await expect(page.getByText('Masukan')).toBeVisible()
      await expect(page.getByText('Katering')).toBeVisible()
      await expect(page.getByText('Pertanyaan Umum')).toBeVisible()
    })
  })

  test.describe('Language Persistence', () => {
    test('should persist Indonesian language after page reload', async ({ page }) => {
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
      await page.reload()

      // Switch to Indonesian
      await page.getByTestId('language-switcher').click()
      await page.waitForTimeout(300)
      await page.getByRole('menuitem', { name: 'Indonesia' }).click()
      await page.waitForTimeout(500)

      // Reload page
      await page.reload()
      await page.waitForTimeout(500)

      // Verify language is still Indonesian
      const nav = page.locator('nav[aria-label="Main navigation"]')
      await expect(nav.getByRole('link', { name: 'Beranda' })).toBeVisible()
    })

    test('should persist language across different public pages', async ({ page }) => {
      await page.goto('/site')
      await page.evaluate(() => {
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
        localStorage.setItem('i18nextLng', 'id-ID')
      })
      await page.reload()

      // Navigate to different pages and verify Indonesian text
      const nav = page.locator('nav[aria-label="Main navigation"]')
      await nav.getByRole('link', { name: 'Menu' }).first().click()
      await page.waitForTimeout(500)
      await expect(page.getByText('Semua Item')).toBeVisible()

      await nav.getByRole('link', { name: 'Tentang' }).first().click()
      await page.waitForTimeout(500)
      await expect(page.getByText('Tentang Kami')).toBeVisible()

      await nav.getByRole('link', { name: 'Kontak' }).first().click()
      await page.waitForTimeout(500)
      await expect(page.getByRole('button', { name: /Kirim Pesan/i })).toBeVisible()
    })

    test('should store language preference in localStorage', async ({ page }) => {
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
      await page.reload()

      // Switch to Indonesian
      await page.getByTestId('language-switcher').click()
      await page.waitForTimeout(300)
      await page.getByRole('menuitem', { name: 'Indonesia' }).click()
      await page.waitForTimeout(500)

      // Check localStorage
      const storedLang = await page.evaluate(() => localStorage.getItem('i18nextLng'))
      expect(storedLang).toBe('id-ID')
    })
  })

  test.describe('Mobile Language Switcher', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test.beforeEach(async ({ page }) => {
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
      await page.reload()
    })

    test('should show language switcher in mobile menu', async ({ page }) => {
      // Open mobile menu
      await page.getByRole('button', { name: /menu/i }).first().click()
      await page.waitForTimeout(300)

      // Language buttons should be visible in mobile menu
      const mobileMenu = page.locator('#mobile-menu')
      await expect(mobileMenu.getByRole('button', { name: /EN/i })).toBeVisible()
      await expect(mobileMenu.getByRole('button', { name: /ID/i })).toBeVisible()
    })

    test('should switch language in mobile menu', async ({ page }) => {
      // Open mobile menu
      await page.getByRole('button', { name: /menu/i }).first().click()
      await page.waitForTimeout(300)

      // Click Indonesian button
      const mobileMenu = page.locator('#mobile-menu')
      await mobileMenu.getByRole('button', { name: /ID/i }).first().click()
      await page.waitForTimeout(500)

      // Verify mobile menu links changed to Indonesian
      await expect(mobileMenu.getByRole('link', { name: 'Beranda' })).toBeVisible()
      await expect(mobileMenu.getByRole('link', { name: 'Reservasi' })).toBeVisible()
    })
  })
})
