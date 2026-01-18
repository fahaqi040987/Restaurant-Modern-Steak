import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function formatTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function getOrderStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'confirmed':
      return 'bg-blue-100 text-blue-800'
    case 'preparing':
      return 'bg-orange-100 text-orange-800'
    case 'ready':
      return 'bg-green-100 text-green-800'
    case 'served':
      return 'bg-indigo-100 text-indigo-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'refunded':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function calculateOrderTotals(items: Array<{ quantity: number; unit_price?: number; price?: number }>) {
  const subtotal = items.reduce((sum, item) => {
    const price = item.unit_price || item.price || 0
    return sum + (item.quantity * price)
  }, 0)
  
  const taxRate = 0.10 // 10% tax
  const taxAmount = subtotal * taxRate
  const totalAmount = subtotal + taxAmount
  
  return {
    subtotal,
    taxAmount,
    totalAmount,
  }
}

export function getPreparationTimeDisplay(minutes: number): string {
  if (minutes === 0) return 'No prep time'
  if (minutes < 60) return `${minutes}m`
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}

export function generateOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `ORD${timestamp}${random}`.slice(-10)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Validates that an operating time string is valid (not 00:00 or empty)
 * Handles ISO datetime format (0000-01-01T08:00:00Z) and HH:MM:SS format
 *
 * @param time - Time string in various formats
 * @returns true if time is valid and not 00:00, false otherwise
 */
export function isValidOperatingTime(time: string | null | undefined): boolean {
  if (!time || time === '') return false

  const timeStr = String(time).trim()

  // Extract time portion from ISO datetime format
  let hours = '00'
  let minutes = '00'

  if (timeStr.includes('T')) {
    // ISO datetime format: 0000-01-01T08:00:00Z
    const match = timeStr.match(/T(\d{2}):(\d{2})/)
    if (match) {
      hours = match[1]
      minutes = match[2]
    }
  } else if (timeStr.includes(':')) {
    // HH:MM:SS or HH:MM format
    const parts = timeStr.split(':')
    hours = parts[0] || '00'
    minutes = parts[1] || '00'
  }

  // Check if time is 00:00 (indicates closed day or invalid)
  const hourNum = parseInt(hours, 10)
  const minNum = parseInt(minutes, 10)

  return !(hourNum === 0 && minNum === 0)
}

/**
 * Formats operating time from various formats to display format (H:MM)
 * Handles ISO datetime format (0000-01-01T08:00:00Z), HH:MM:SS, and HH:MM
 *
 * @param time - Time string in various formats
 * @returns Formatted time string (e.g., "8:00", "11:30") or empty string if invalid
 */
export function formatOperatingTime(time: string | null | undefined): string {
  if (!time || time === '') return ''

  const timeStr = String(time).trim()

  let hours = '00'
  let minutes = '00'

  if (timeStr.includes('T')) {
    // ISO datetime format: 0000-01-01T08:00:00Z
    const match = timeStr.match(/T(\d{2}):(\d{2})/)
    if (match) {
      hours = match[1]
      minutes = match[2]
    }
  } else if (timeStr.includes(':')) {
    // HH:MM:SS or HH:MM format
    const parts = timeStr.split(':')
    hours = parts[0] || '00'
    minutes = parts[1] || '00'
  } else {
    return ''
  }

  // Convert to number to remove leading zeros from hours
  const hourNum = parseInt(hours, 10)

  return `${hourNum}:${minutes}`
}

/**
 * Get timezone abbreviation from IANA timezone identifier
 * @param timezone - IANA timezone (e.g., "Asia/Jakarta")
 * @returns Timezone abbreviation (WIB, WITA, WIT) or default to WIB
 */
export function getTimezoneAbbreviation(
  timezone: string | null | undefined
): string {
  if (!timezone) return 'WIB'

  const timezoneMap: Record<string, string> = {
    'Asia/Jakarta': 'WIB',
    'Asia/Makassar': 'WITA',
    'Asia/Jayapura': 'WIT',
  }

  return timezoneMap[timezone] || 'WIB'
}

