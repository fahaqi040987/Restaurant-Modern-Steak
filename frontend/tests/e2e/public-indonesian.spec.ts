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
      await page.click('[data-testid="language-switcher"]')
      await page.waitForTimeout(300)

      // Click Indonesian option
      await page.click('text=Bahasa Indonesia')
      await page.waitForTimeout(500)

      // Verify navigation changed to Indonesian
      const homeLink = page.locator('nav >> text=Beranda')
      await expect(homeLink).toBeVisible()
    })

    test('should switch back to English', async ({ page }) => {
      // First switch to Indonesian
      await page.click('[data-testid="language-switcher"]')
      await page.waitForTimeout(300)
      await page.click('text=Bahasa Indonesia')
      await page.waitForTimeout(500)

      // Then switch back to English
      await page.click('[data-testid="language-switcher"]')
      await page.waitForTimeout(300)
      await page.click('text=English')
      await page.waitForTimeout(500)

      // Verify navigation changed to English
      const homeLink = page.locator('nav >> text=Home')
      await expect(homeLink).toBeVisible()
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
      // Check Indonesian section titles
      await expect(page.locator('text=Reservasi Meja Anda')).toBeVisible()
      await expect(page.locator('text=Tautan Cepat')).toBeVisible()
      await expect(page.locator('text=Hubungi Kami')).toBeVisible()
      await expect(page.locator('text=Jam Buka')).toBeVisible()
    })

    test('should display "Pesan Sekarang" button in footer', async ({ page }) => {
      const bookNowBtn = page.locator('footer >> text=Pesan Sekarang')
      await expect(bookNowBtn).toBeVisible()
    })

    test('should display "Portal Staf" link', async ({ page }) => {
      const staffPortal = page.locator('footer >> text=Portal Staf')
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
      // Check form labels
      await expect(page.locator('text=Nama Lengkap')).toBeVisible()
      await expect(page.locator('text=Alamat Email')).toBeVisible()
      await expect(page.locator('text=Nomor Telepon')).toBeVisible()
      await expect(page.locator('text=Jumlah Tamu')).toBeVisible()
      await expect(page.locator('text=Tanggal')).toBeVisible()
      await expect(page.locator('text=Waktu')).toBeVisible()
    })

    test('should display "Pesan Meja Anda" submit button', async ({ page }) => {
      const submitBtn = page.locator('button:has-text("Pesan Meja Anda")')
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
      // Check form labels
      await expect(page.locator('label:has-text("Nama")')).toBeVisible()
      await expect(page.locator('label:has-text("Email")')).toBeVisible()
      await expect(page.locator('label:has-text("Subjek")')).toBeVisible()
      await expect(page.locator('label:has-text("Pesan")')).toBeVisible()
    })

    test('should display "Kirim Pesan" submit button', async ({ page }) => {
      const submitBtn = page.locator('button:has-text("Kirim Pesan")')
      await expect(submitBtn).toBeVisible()
    })

    test('should display subject options in Indonesian', async ({ page }) => {
      // Click subject dropdown
      await page.click('[data-testid="subject-trigger"]')
      await page.waitForTimeout(300)

      // Check Indonesian subject options
      await expect(page.locator('text=Reservasi')).toBeVisible()
      await expect(page.locator('text=Masukan')).toBeVisible()
      await expect(page.locator('text=Katering')).toBeVisible()
      await expect(page.locator('text=Pertanyaan Umum')).toBeVisible()
    })
  })

  test.describe('Language Persistence', () => {
    test('should persist Indonesian language after page reload', async ({ page }) => {
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
      await page.reload()

      // Switch to Indonesian
      await page.click('[data-testid="language-switcher"]')
      await page.waitForTimeout(300)
      await page.click('text=Bahasa Indonesia')
      await page.waitForTimeout(500)

      // Reload page
      await page.reload()
      await page.waitForTimeout(500)

      // Verify language is still Indonesian
      const homeLink = page.locator('nav >> text=Beranda')
      await expect(homeLink).toBeVisible()
    })

    test('should persist language across different public pages', async ({ page }) => {
      await page.goto('/site')
      await page.evaluate(() => {
        sessionStorage.setItem('hasVisitedPublicSite', 'true')
        localStorage.setItem('i18nextLng', 'id-ID')
      })
      await page.reload()

      // Navigate to different pages and verify Indonesian text
      await page.click('nav >> text=Menu')
      await page.waitForTimeout(500)
      await expect(page.locator('text=Semua Item')).toBeVisible()

      await page.click('nav >> text=Tentang')
      await page.waitForTimeout(500)
      await expect(page.locator('text=Tentang Kami')).toBeVisible()

      await page.click('nav >> text=Kontak')
      await page.waitForTimeout(500)
      await expect(page.locator('button:has-text("Kirim Pesan")')).toBeVisible()
    })

    test('should store language preference in localStorage', async ({ page }) => {
      await page.goto('/site')
      await page.evaluate(() => sessionStorage.setItem('hasVisitedPublicSite', 'true'))
      await page.reload()

      // Switch to Indonesian
      await page.click('[data-testid="language-switcher"]')
      await page.waitForTimeout(300)
      await page.click('text=Bahasa Indonesia')
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
      await page.click('button[aria-label*="menu"]')
      await page.waitForTimeout(300)

      // Language buttons should be visible in mobile menu
      const mobileMenu = page.locator('#mobile-menu')
      await expect(mobileMenu.locator('button:has-text("EN")')).toBeVisible()
      await expect(mobileMenu.locator('button:has-text("ID")')).toBeVisible()
    })

    test('should switch language in mobile menu', async ({ page }) => {
      // Open mobile menu
      await page.click('button[aria-label*="menu"]')
      await page.waitForTimeout(300)

      // Click Indonesian button
      const mobileMenu = page.locator('#mobile-menu')
      await mobileMenu.locator('button:has-text("ID")').click()
      await page.waitForTimeout(500)

      // Verify mobile menu links changed to Indonesian
      await expect(mobileMenu.locator('text=Beranda')).toBeVisible()
      await expect(mobileMenu.locator('text=Reservasi')).toBeVisible()
    })
  })
})
