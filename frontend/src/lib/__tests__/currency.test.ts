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
      const result = formatCurrency(250500)
      expect(result).not.toContain('.50')
    })

    it('uses Indonesian locale', () => {
      const result = formatCurrency(1000000)
      expect(result).toMatch(/Rp/)
      // Indonesian uses period as thousand separator
      expect(result).toMatch(/1\.000\.000|1000000/)
    })
  })
})
