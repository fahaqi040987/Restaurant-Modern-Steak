package middleware

import (
	"net/http"
	"sync"
	"time"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
)

// RateLimiter implements a simple in-memory rate limiter using token bucket algorithm
type RateLimiter struct {
	visitors map[string]*visitor
	mu       sync.RWMutex
	rate     int           // requests per interval
	interval time.Duration // time interval
}

type visitor struct {
	tokens    int
	lastVisit time.Time
}

// NewRateLimiter creates a new rate limiter
// rate: number of requests allowed per interval
// interval: time window for rate limiting
func NewRateLimiter(rate int, interval time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		rate:     rate,
		interval: interval,
	}

	// Start cleanup goroutine to remove old entries
	go rl.cleanupVisitors()

	return rl
}

// cleanupVisitors removes old visitor entries every minute
func (rl *RateLimiter) cleanupVisitors() {
	for {
		time.Sleep(time.Minute)

		rl.mu.Lock()
		for ip, v := range rl.visitors {
			if time.Since(v.lastVisit) > rl.interval*2 {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// getVisitor returns or creates a visitor for the given IP
func (rl *RateLimiter) getVisitor(ip string) *visitor {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[ip]
	if !exists {
		v = &visitor{
			tokens:    rl.rate,
			lastVisit: time.Now(),
		}
		rl.visitors[ip] = v
		return v
	}

	// Refill tokens based on time passed
	elapsed := time.Since(v.lastVisit)
	tokensToAdd := int(elapsed / rl.interval) * rl.rate
	v.tokens += tokensToAdd
	if v.tokens > rl.rate {
		v.tokens = rl.rate
	}
	v.lastVisit = time.Now()

	return v
}

// Allow checks if a request from the given IP should be allowed
func (rl *RateLimiter) Allow(ip string) bool {
	v := rl.getVisitor(ip)

	rl.mu.Lock()
	defer rl.mu.Unlock()

	if v.tokens > 0 {
		v.tokens--
		return true
	}

	return false
}

// RateLimitMiddleware returns a Gin middleware for rate limiting
// rate: number of requests allowed per interval
// interval: time window (e.g., time.Minute for requests per minute)
func RateLimitMiddleware(rate int, interval time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(rate, interval)

	return func(c *gin.Context) {
		// Get client IP
		ip := c.ClientIP()

		if !limiter.Allow(ip) {
			c.JSON(http.StatusTooManyRequests, models.APIResponse{
				Success: false,
				Message: "Rate limit exceeded. Please try again later.",
				Error:   stringPtr("rate_limit_exceeded"),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// PublicRateLimiter creates a rate limiter suitable for public endpoints
// Default: 30 requests per minute per IP
func PublicRateLimiter() gin.HandlerFunc {
	return RateLimitMiddleware(30, time.Minute)
}

// StrictRateLimiter creates a stricter rate limiter for sensitive endpoints (login, etc.)
// Default: 5 requests per minute per IP
func StrictRateLimiter() gin.HandlerFunc {
	return RateLimitMiddleware(5, time.Minute)
}

// ContactFormRateLimiter creates a rate limiter for contact form submissions
// Default: 3 requests per 5 minutes per IP
func ContactFormRateLimiter() gin.HandlerFunc {
	return RateLimitMiddleware(3, 5*time.Minute)
}
