/**
 * T063: XSS Prevention Utility
 * Sanitizes user input to prevent cross-site scripting attacks
 */

/**
 * Strips HTML tags from user input to prevent XSS attacks.
 * This is a basic sanitization - for production, consider using DOMPurify.
 * 
 * @param input - The string to sanitize
 * @returns Sanitized string with HTML tags removed
 * 
 * @example
 * ```ts
 * const clean = stripHTMLTags('<script>alert("xss")</script>Hello')
 * // Returns: 'Hello'
 * ```
 */
export function stripHTMLTags(input: string): string {
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '')
  return sanitized.trim()
}

/**
 * Sanitizes reservation form data before submission.
 * Removes potentially dangerous HTML/script content from text fields.
 * 
 * @param data - Form data object
 * @returns Sanitized form data
 */
export function sanitizeReservationData<T extends Record<string, unknown>>(data: T): T {
  const sanitized = { ...data } as Record<string, unknown>

  // Sanitize string fields
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = stripHTMLTags(sanitized[key] as string)
    }
  }

  return sanitized as T
}
