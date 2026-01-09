import { describe, it, expect } from 'vitest'
import { isValidOperatingTime, formatOperatingTime } from '@/lib/utils'

/**
 * T008: Unit tests for isValidOperatingTime() helper
 * Validates that operating time strings are valid (not 00:00 or empty)
 */
describe('isValidOperatingTime', () => {
  it('should return false for empty string', () => {
    expect(isValidOperatingTime('')).toBe(false)
  })

  it('should return false for null/undefined', () => {
    expect(isValidOperatingTime(null as unknown as string)).toBe(false)
    expect(isValidOperatingTime(undefined as unknown as string)).toBe(false)
  })

  it('should return false for 00:00:00 (closed day indicator)', () => {
    expect(isValidOperatingTime('00:00:00')).toBe(false)
  })

  it('should return false for 00:00 (short format)', () => {
    expect(isValidOperatingTime('00:00')).toBe(false)
  })

  it('should return false for ISO datetime with 00:00', () => {
    expect(isValidOperatingTime('0000-01-01T00:00:00Z')).toBe(false)
  })

  it('should return true for valid time HH:MM:SS format', () => {
    expect(isValidOperatingTime('08:00:00')).toBe(true)
    expect(isValidOperatingTime('11:30:00')).toBe(true)
    expect(isValidOperatingTime('23:00:00')).toBe(true)
  })

  it('should return true for valid ISO datetime format', () => {
    expect(isValidOperatingTime('0000-01-01T08:00:00Z')).toBe(true)
    expect(isValidOperatingTime('0000-01-01T11:30:00Z')).toBe(true)
    expect(isValidOperatingTime('0000-01-01T23:00:00Z')).toBe(true)
  })

  it('should return true for valid time HH:MM format', () => {
    expect(isValidOperatingTime('08:00')).toBe(true)
    expect(isValidOperatingTime('11:30')).toBe(true)
  })
})

/**
 * T009: Unit tests for formatOperatingTime() helper
 * Formats time from various formats to display format (H:MM)
 */
describe('formatOperatingTime', () => {
  it('should format ISO datetime to H:MM', () => {
    expect(formatOperatingTime('0000-01-01T08:00:00Z')).toBe('8:00')
    expect(formatOperatingTime('0000-01-01T11:30:00Z')).toBe('11:30')
    expect(formatOperatingTime('0000-01-01T23:00:00Z')).toBe('23:00')
  })

  it('should format HH:MM:SS to H:MM', () => {
    expect(formatOperatingTime('08:00:00')).toBe('8:00')
    expect(formatOperatingTime('11:30:00')).toBe('11:30')
    expect(formatOperatingTime('23:00:00')).toBe('23:00')
  })

  it('should format HH:MM to H:MM', () => {
    expect(formatOperatingTime('08:00')).toBe('8:00')
    expect(formatOperatingTime('11:30')).toBe('11:30')
  })

  it('should handle edge case times', () => {
    expect(formatOperatingTime('00:00:00')).toBe('0:00')
    expect(formatOperatingTime('12:00:00')).toBe('12:00')
    expect(formatOperatingTime('09:05:00')).toBe('9:05')
  })

  it('should return empty string for invalid input', () => {
    expect(formatOperatingTime('')).toBe('')
    expect(formatOperatingTime(null as unknown as string)).toBe('')
    expect(formatOperatingTime(undefined as unknown as string)).toBe('')
  })
})
