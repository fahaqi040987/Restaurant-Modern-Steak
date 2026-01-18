import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatCurrency,
  formatDate,
  formatTime,
  getOrderStatusColor,
  getPaymentStatusColor,
  calculateOrderTotals,
  getPreparationTimeDisplay,
  getTimezoneAbbreviation,
  generateOrderNumber,
  debounce,
} from '../utils'

describe('Utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles conditional classes', () => {
      expect(cn('foo', undefined, 'baz')).toBe('foo baz')
    })

    it('merges tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('handles undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })

    it('handles arrays of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('handles empty inputs', () => {
      expect(cn()).toBe('')
    })
  })

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
    })

    it('handles negative amounts', () => {
      const result = formatCurrency(-50000)
      expect(result).toMatch(/Rp/)
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const result = formatDate('2024-03-15T10:30:00Z')
      expect(result).toContain('2024')
      expect(result).toContain('Mar')
      expect(result).toContain('15')
    })

    it('includes time in the format', () => {
      const result = formatDate('2024-03-15T10:30:00Z')
      expect(result).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('formatTime', () => {
    it('formats time correctly', () => {
      const result = formatTime('2024-03-15T10:30:00Z')
      expect(result).toMatch(/\d{1,2}:\d{2}/)
    })

    it('handles different times', () => {
      const morning = formatTime('2024-03-15T06:00:00Z')
      const evening = formatTime('2024-03-15T18:00:00Z')
      expect(morning).toMatch(/\d{1,2}:\d{2}/)
      expect(evening).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('getOrderStatusColor', () => {
    it('returns yellow for pending', () => {
      expect(getOrderStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800')
    })

    it('returns blue for confirmed', () => {
      expect(getOrderStatusColor('confirmed')).toBe('bg-blue-100 text-blue-800')
    })

    it('returns orange for preparing', () => {
      expect(getOrderStatusColor('preparing')).toBe('bg-orange-100 text-orange-800')
    })

    it('returns green for ready', () => {
      expect(getOrderStatusColor('ready')).toBe('bg-green-100 text-green-800')
    })

    it('returns indigo for served', () => {
      expect(getOrderStatusColor('served')).toBe('bg-indigo-100 text-indigo-800')
    })

    it('returns green for completed', () => {
      expect(getOrderStatusColor('completed')).toBe('bg-green-100 text-green-800')
    })

    it('returns red for cancelled', () => {
      expect(getOrderStatusColor('cancelled')).toBe('bg-red-100 text-red-800')
    })

    it('returns gray for unknown status', () => {
      expect(getOrderStatusColor('unknown')).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('getPaymentStatusColor', () => {
    it('returns yellow for pending', () => {
      expect(getPaymentStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800')
    })

    it('returns green for completed', () => {
      expect(getPaymentStatusColor('completed')).toBe('bg-green-100 text-green-800')
    })

    it('returns red for failed', () => {
      expect(getPaymentStatusColor('failed')).toBe('bg-red-100 text-red-800')
    })

    it('returns purple for refunded', () => {
      expect(getPaymentStatusColor('refunded')).toBe('bg-purple-100 text-purple-800')
    })

    it('returns gray for unknown status', () => {
      expect(getPaymentStatusColor('unknown')).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('calculateOrderTotals', () => {
    it('calculates totals correctly with unit_price', () => {
      const items = [
        { quantity: 2, unit_price: 100 },
        { quantity: 1, unit_price: 200 },
      ]
      const result = calculateOrderTotals(items)
      expect(result.subtotal).toBe(400) // 2*100 + 1*200
      expect(result.taxAmount).toBe(40) // 10% of 400
      expect(result.totalAmount).toBe(440)
    })

    it('calculates totals correctly with price', () => {
      const items = [
        { quantity: 3, price: 50 },
        { quantity: 2, price: 100 },
      ]
      const result = calculateOrderTotals(items)
      expect(result.subtotal).toBe(350) // 3*50 + 2*100
      expect(result.taxAmount).toBe(35) // 10% of 350
      expect(result.totalAmount).toBe(385)
    })

    it('handles empty items', () => {
      const result = calculateOrderTotals([])
      expect(result.subtotal).toBe(0)
      expect(result.taxAmount).toBe(0)
      expect(result.totalAmount).toBe(0)
    })

    it('handles items without price', () => {
      const items = [{ quantity: 1 }]
      const result = calculateOrderTotals(items)
      expect(result.subtotal).toBe(0)
      expect(result.totalAmount).toBe(0)
    })
  })

  describe('getPreparationTimeDisplay', () => {
    it('returns "No prep time" for 0 minutes', () => {
      expect(getPreparationTimeDisplay(0)).toBe('No prep time')
    })

    it('formats minutes correctly', () => {
      expect(getPreparationTimeDisplay(30)).toBe('30m')
      expect(getPreparationTimeDisplay(45)).toBe('45m')
    })

    it('formats hours correctly', () => {
      expect(getPreparationTimeDisplay(60)).toBe('1h')
      expect(getPreparationTimeDisplay(120)).toBe('2h')
    })

    it('formats hours and minutes correctly', () => {
      expect(getPreparationTimeDisplay(90)).toBe('1h 30m')
      expect(getPreparationTimeDisplay(135)).toBe('2h 15m')
    })
  })

  describe('generateOrderNumber', () => {
    it('generates a 10 character order number', () => {
      const orderNumber = generateOrderNumber()
      expect(orderNumber).toHaveLength(10)
    })

    it('starts with expected characters', () => {
      const orderNumber = generateOrderNumber()
      // Should be numeric digits
      expect(orderNumber).toMatch(/^\d+$/)
    })

    it('generates unique numbers', () => {
      const numbers = new Set<string>()
      for (let i = 0; i < 10; i++) {
        numbers.add(generateOrderNumber())
      }
      // Should have at least some unique numbers (not all will be unique due to randomness)
      expect(numbers.size).toBeGreaterThan(1)
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('delays function execution', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('only calls once for multiple rapid calls', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('passes arguments to the function', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('arg1', 'arg2')

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('resets timer on subsequent calls', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      vi.advanceTimersByTime(50)
      debouncedFn()
      vi.advanceTimersByTime(50)

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})

describe('getTimezoneAbbreviation', () => {
  it('should return WIB for Asia/Jakarta', () => {
    expect(getTimezoneAbbreviation('Asia/Jakarta')).toBe('WIB')
  })

  it('should return WITA for Asia/Makassar', () => {
    expect(getTimezoneAbbreviation('Asia/Makassar')).toBe('WITA')
  })

  it('should return WIT for Asia/Jayapura', () => {
    expect(getTimezoneAbbreviation('Asia/Jayapura')).toBe('WIT')
  })

  it('should return WIB for null', () => {
    expect(getTimezoneAbbreviation(null)).toBe('WIB')
  })

  it('should return WIB for undefined', () => {
    expect(getTimezoneAbbreviation(undefined)).toBe('WIB')
  })

  it('should return WIB for empty string', () => {
    expect(getTimezoneAbbreviation('')).toBe('WIB')
  })

  it('should return WIB for unknown timezone', () => {
    expect(getTimezoneAbbreviation('America/New_York')).toBe('WIB')
  })
})
