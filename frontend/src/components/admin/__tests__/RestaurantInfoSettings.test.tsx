import { describe, it, expect } from 'vitest'

/**
 * T016: Unit tests for operating hours validation logic
 * Tests the validation rules that prevent saving invalid operating hours
 */

interface OperatingHourUpdate {
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

/**
 * Validates operating hours before saving
 * Returns an error message if invalid, or null if valid
 */
function validateOperatingHours(hours: OperatingHourUpdate[]): string | null {
  for (const hour of hours) {
    if (!hour.is_closed) {
      // Check for 00:00 times on non-closed days
      if (hour.open_time === '00:00' || hour.close_time === '00:00') {
        return `00:00 is not a valid time for day ${hour.day_of_week}`
      }
      // Check that open time is before close time
      if (hour.open_time >= hour.close_time) {
        return `Opening time must be before closing time for day ${hour.day_of_week}`
      }
    }
  }
  return null
}

describe('Operating Hours Validation', () => {
  describe('validateOperatingHours', () => {
    it('should accept valid operating hours', () => {
      const hours: OperatingHourUpdate[] = [
        { day_of_week: 0, open_time: '00:00', close_time: '00:00', is_closed: true },
        { day_of_week: 1, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 2, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 3, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 4, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 5, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 6, open_time: '09:00', close_time: '23:00', is_closed: false },
      ]

      expect(validateOperatingHours(hours)).toBeNull()
    })

    it('should reject 00:00 open time for non-closed day', () => {
      const hours: OperatingHourUpdate[] = [
        { day_of_week: 0, open_time: '00:00', close_time: '00:00', is_closed: true },
        { day_of_week: 1, open_time: '00:00', close_time: '22:00', is_closed: false }, // Invalid
        { day_of_week: 2, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 3, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 4, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 5, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 6, open_time: '09:00', close_time: '23:00', is_closed: false },
      ]

      expect(validateOperatingHours(hours)).toContain('00:00 is not a valid time')
    })

    it('should reject 00:00 close time for non-closed day', () => {
      const hours: OperatingHourUpdate[] = [
        { day_of_week: 0, open_time: '00:00', close_time: '00:00', is_closed: true },
        { day_of_week: 1, open_time: '08:00', close_time: '00:00', is_closed: false }, // Invalid
        { day_of_week: 2, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 3, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 4, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 5, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 6, open_time: '09:00', close_time: '23:00', is_closed: false },
      ]

      expect(validateOperatingHours(hours)).toContain('00:00 is not a valid time')
    })

    it('should allow 00:00 times for closed days', () => {
      const hours: OperatingHourUpdate[] = [
        { day_of_week: 0, open_time: '00:00', close_time: '00:00', is_closed: true }, // OK
        { day_of_week: 1, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 2, open_time: '00:00', close_time: '00:00', is_closed: true }, // OK
        { day_of_week: 3, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 4, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 5, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 6, open_time: '00:00', close_time: '00:00', is_closed: true }, // OK
      ]

      expect(validateOperatingHours(hours)).toBeNull()
    })

    it('should reject when open time equals close time for non-closed day', () => {
      const hours: OperatingHourUpdate[] = [
        { day_of_week: 0, open_time: '00:00', close_time: '00:00', is_closed: true },
        { day_of_week: 1, open_time: '10:00', close_time: '10:00', is_closed: false }, // Invalid
        { day_of_week: 2, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 3, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 4, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 5, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 6, open_time: '09:00', close_time: '23:00', is_closed: false },
      ]

      expect(validateOperatingHours(hours)).toContain('Opening time must be before closing time')
    })

    it('should reject when open time is after close time', () => {
      const hours: OperatingHourUpdate[] = [
        { day_of_week: 0, open_time: '00:00', close_time: '00:00', is_closed: true },
        { day_of_week: 1, open_time: '22:00', close_time: '08:00', is_closed: false }, // Invalid
        { day_of_week: 2, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 3, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 4, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 5, open_time: '08:00', close_time: '22:00', is_closed: false },
        { day_of_week: 6, open_time: '09:00', close_time: '23:00', is_closed: false },
      ]

      expect(validateOperatingHours(hours)).toContain('Opening time must be before closing time')
    })
  })
})

describe('Time Input Normalization', () => {
  /**
   * Normalizes time from various formats to HH:MM for HTML time input
   * This mirrors the normalizeTimeForInput function in RestaurantInfoSettings
   */
  function normalizeTimeForInput(time: string | null | undefined): string {
    if (!time || time === '') return '09:00'

    const timeStr = String(time).trim()

    // Handle ISO datetime format like "0000-01-01T11:00:00Z"
    if (timeStr.includes('T')) {
      const match = timeStr.match(/T(\d{2}):(\d{2})/)
      if (match) {
        return `${match[1]}:${match[2]}`
      }
    }

    // Handle HH:MM:SS or HH:MM format
    const parts = timeStr.split(':')
    if (parts.length >= 2) {
      const hour = parts[0].padStart(2, '0')
      const minute = parts[1].padStart(2, '0')
      const hourNum = parseInt(hour, 10)
      const minNum = parseInt(minute, 10)
      if (hourNum >= 0 && hourNum <= 23 && minNum >= 0 && minNum <= 59) {
        return `${hour}:${minute}`
      }
    }

    return '09:00'
  }

  it('should normalize ISO datetime to HH:MM', () => {
    expect(normalizeTimeForInput('0000-01-01T08:00:00Z')).toBe('08:00')
    expect(normalizeTimeForInput('0000-01-01T11:30:00Z')).toBe('11:30')
    expect(normalizeTimeForInput('0000-01-01T23:00:00Z')).toBe('23:00')
  })

  it('should normalize HH:MM:SS to HH:MM', () => {
    expect(normalizeTimeForInput('08:00:00')).toBe('08:00')
    expect(normalizeTimeForInput('11:30:00')).toBe('11:30')
    expect(normalizeTimeForInput('23:59:59')).toBe('23:59')
  })

  it('should keep HH:MM as-is', () => {
    expect(normalizeTimeForInput('08:00')).toBe('08:00')
    expect(normalizeTimeForInput('11:30')).toBe('11:30')
  })

  it('should return default for empty/null input', () => {
    expect(normalizeTimeForInput('')).toBe('09:00')
    expect(normalizeTimeForInput(null)).toBe('09:00')
    expect(normalizeTimeForInput(undefined)).toBe('09:00')
  })

  it('should handle edge case times', () => {
    expect(normalizeTimeForInput('00:00')).toBe('00:00')
    expect(normalizeTimeForInput('00:00:00')).toBe('00:00')
    expect(normalizeTimeForInput('0000-01-01T00:00:00Z')).toBe('00:00')
  })
})
