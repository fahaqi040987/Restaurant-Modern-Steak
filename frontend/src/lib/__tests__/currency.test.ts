import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../utils'

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('formats IDR currency correctly', () => {
      const result = formatCurrency(250000)
      expect(result).toMatch(/Rp/)
      expect(result).toContain('250')
    })

    it('handles zero amount', () => {
      const result = formatCurrency(0)
      expect(result).toMatch(/Rp/)
      expect(result).toContain('0')
    })

    it('handles large amounts', () => {
      const result = formatCurrency(1500000)
      expect(result).toMatch(/Rp/)
      expect(result).toContain('1')
    })

    it('handles negative amounts', () => {
      const result = formatCurrency(-50000)
      expect(result).toMatch(/Rp/)
    })

    it('removes decimal places for IDR', () => {
      // IDR should have no decimal places (no ,00 or .00 for cents)
      const result = formatCurrency(250500)
      // In Indonesian locale, 250500 formats as "Rp 250.500" (period is thousand separator)
      // This test verifies there's no decimal portion like ",50" or fractional cents
      expect(result).not.toMatch(/,\d\d$/) // no ,XX at end for decimals
      expect(result).toContain('250')
      expect(result).toContain('500')
    })

    it('uses Indonesian locale', () => {
      const result = formatCurrency(1000000)
      expect(result).toMatch(/Rp/)
      // Indonesian uses period as thousand separator
      expect(result).toMatch(/1\.000\.000|1000000/)
    })
  })
})
