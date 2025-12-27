package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeaders returns a middleware that adds security headers to responses
// These headers protect against common web vulnerabilities
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// HSTS - Force HTTPS connections (1 year max-age)
		// Only effective when served over HTTPS (Cloudflare handles this)
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Clickjacking protection - prevent embedding in iframes
		c.Header("X-Frame-Options", "DENY")

		// XSS Protection (legacy browsers)
		c.Header("X-XSS-Protection", "1; mode=block")

		// Content Security Policy
		// Allow self for scripts/styles, data: for images (base64), and specific trusted sources
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")

		// Referrer Policy - control referrer information
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Permissions Policy - disable unnecessary browser features
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")

		// Cache control for API responses
		// Prevents caching of sensitive data
		if isAPIRoute(c.Request.URL.Path) {
			c.Header("Cache-Control", "no-store, no-cache, must-revalidate, private")
			c.Header("Pragma", "no-cache")
			c.Header("Expires", "0")
		}

		c.Next()
	}
}

// isAPIRoute checks if the request path is an API route
func isAPIRoute(path string) bool {
	return len(path) >= 4 && path[:4] == "/api"
}
