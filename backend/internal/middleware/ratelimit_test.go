package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// ========================
// T185: Create test file backend/internal/middleware/ratelimit_test.go
// ========================

// ========================
// T186: TestRateLimit_UnderLimit
// ========================

func TestRateLimit_UnderLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a rate limiter allowing 10 requests per second
	limiter := NewRateLimiter(10, time.Second)

	// Create test router with rate limit middleware
	router := gin.New()
	router.Use(func(c *gin.Context) {
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
	})
	router.GET("/api/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Make 5 requests (under the limit of 10)
	for i := 0; i < 5; i++ {
		req, _ := http.NewRequest("GET", "/api/test", nil)
		req.RemoteAddr = "192.168.1.1:12345"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code, "Request %d should succeed", i+1)
	}
}

// ========================
// T187: TestRateLimit_AtLimit
// ========================

func TestRateLimit_AtLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a rate limiter allowing 5 requests per second
	limiter := NewRateLimiter(5, time.Second)

	// Create test router
	router := gin.New()
	router.Use(func(c *gin.Context) {
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
	})
	router.GET("/api/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Make exactly 5 requests (at the limit)
	for i := 0; i < 5; i++ {
		req, _ := http.NewRequest("GET", "/api/test", nil)
		req.RemoteAddr = "192.168.1.2:12345"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code, "Request %d should succeed (at limit)", i+1)
	}
}

// ========================
// T188: TestRateLimit_OverLimit
// ========================

func TestRateLimit_OverLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a rate limiter allowing 3 requests per second
	limiter := NewRateLimiter(3, time.Second)

	// Create test router
	router := gin.New()
	router.Use(func(c *gin.Context) {
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
	})
	router.GET("/api/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Make 3 successful requests (using up the limit)
	for i := 0; i < 3; i++ {
		req, _ := http.NewRequest("GET", "/api/test", nil)
		req.RemoteAddr = "192.168.1.3:12345"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code, "Request %d should succeed", i+1)
	}

	// The 4th request should be rate limited
	req, _ := http.NewRequest("GET", "/api/test", nil)
	req.RemoteAddr = "192.168.1.3:12345"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Rate limit exceeded. Please try again later.", response.Message)
	assert.NotNil(t, response.Error)
	assert.Equal(t, "rate_limit_exceeded", *response.Error)

	// The 5th request should also be rate limited
	req2, _ := http.NewRequest("GET", "/api/test", nil)
	req2.RemoteAddr = "192.168.1.3:12345"
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusTooManyRequests, w2.Code)
}

// ========================
// T189: TestRateLimit_AfterWindowReset
// ========================

func TestRateLimit_AfterWindowReset(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a rate limiter allowing 2 requests per 100ms (short window for testing)
	limiter := NewRateLimiter(2, 100*time.Millisecond)

	// Create test router
	router := gin.New()
	router.Use(func(c *gin.Context) {
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
	})
	router.GET("/api/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Use up the rate limit
	for i := 0; i < 2; i++ {
		req, _ := http.NewRequest("GET", "/api/test", nil)
		req.RemoteAddr = "192.168.1.4:12345"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code, "Request %d should succeed", i+1)
	}

	// Verify rate limit is in effect
	req, _ := http.NewRequest("GET", "/api/test", nil)
	req.RemoteAddr = "192.168.1.4:12345"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)

	// Wait for the window to reset (110ms to be safe)
	time.Sleep(110 * time.Millisecond)

	// After window reset, requests should be allowed again
	req2, _ := http.NewRequest("GET", "/api/test", nil)
	req2.RemoteAddr = "192.168.1.4:12345"
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusOK, w2.Code, "Request should succeed after window reset")
}

// ========================
// Additional tests for completeness
// ========================

// TestRateLimiter_DifferentIPs tests that rate limiting is per-IP
func TestRateLimiter_DifferentIPs(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a rate limiter allowing 2 requests per second
	limiter := NewRateLimiter(2, time.Second)

	// Create test router
	router := gin.New()
	router.Use(func(c *gin.Context) {
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
	})
	router.GET("/api/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// IP 1: Use up the limit
	for i := 0; i < 2; i++ {
		req, _ := http.NewRequest("GET", "/api/test", nil)
		req.RemoteAddr = "10.0.0.1:12345"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	}

	// IP 1: Should be rate limited now
	req1, _ := http.NewRequest("GET", "/api/test", nil)
	req1.RemoteAddr = "10.0.0.1:12345"
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)

	assert.Equal(t, http.StatusTooManyRequests, w1.Code)

	// IP 2: Should still have their full limit available
	req2, _ := http.NewRequest("GET", "/api/test", nil)
	req2.RemoteAddr = "10.0.0.2:12345"
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusOK, w2.Code, "Different IP should have separate rate limit")
}

// TestNewRateLimiter tests creating a rate limiter
func TestNewRateLimiter(t *testing.T) {
	limiter := NewRateLimiter(100, time.Minute)

	assert.NotNil(t, limiter)
	assert.Equal(t, 100, limiter.rate)
	assert.Equal(t, time.Minute, limiter.interval)
	assert.NotNil(t, limiter.visitors)
}

// TestRateLimiter_Allow tests the Allow method directly
func TestRateLimiter_Allow(t *testing.T) {
	limiter := NewRateLimiter(3, time.Second)
	ip := "test-ip"

	// First 3 requests should be allowed
	assert.True(t, limiter.Allow(ip), "1st request should be allowed")
	assert.True(t, limiter.Allow(ip), "2nd request should be allowed")
	assert.True(t, limiter.Allow(ip), "3rd request should be allowed")

	// 4th request should be denied
	assert.False(t, limiter.Allow(ip), "4th request should be denied")
	assert.False(t, limiter.Allow(ip), "5th request should be denied")
}

// TestPublicRateLimiter tests the public rate limiter preset
func TestPublicRateLimiter(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Get the public rate limiter (30 requests per minute)
	middleware := PublicRateLimiter()

	assert.NotNil(t, middleware)

	// Create test router
	router := gin.New()
	router.Use(middleware)
	router.GET("/api/public", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// First request should succeed
	req, _ := http.NewRequest("GET", "/api/public", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

// TestStrictRateLimiter tests the strict rate limiter preset
func TestStrictRateLimiter(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Get the strict rate limiter (5 requests per minute)
	middleware := StrictRateLimiter()

	assert.NotNil(t, middleware)

	// Create test router
	router := gin.New()
	router.Use(middleware)
	router.GET("/api/login", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// First 5 requests should succeed
	for i := 0; i < 5; i++ {
		req, _ := http.NewRequest("GET", "/api/login", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code, "Request %d should succeed", i+1)
	}

	// 6th request should be rate limited
	req, _ := http.NewRequest("GET", "/api/login", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)
}

// TestContactFormRateLimiter tests the contact form rate limiter preset
func TestContactFormRateLimiter(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Get the contact form rate limiter (3 requests per 5 minutes)
	middleware := ContactFormRateLimiter()

	assert.NotNil(t, middleware)

	// Create test router
	router := gin.New()
	router.Use(middleware)
	router.POST("/api/contact", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// First 3 requests should succeed
	for i := 0; i < 3; i++ {
		req, _ := http.NewRequest("POST", "/api/contact", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code, "Request %d should succeed", i+1)
	}

	// 4th request should be rate limited
	req, _ := http.NewRequest("POST", "/api/contact", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)
}

// TestRateLimitMiddleware tests the middleware function directly
func TestRateLimitMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a rate limit middleware with custom settings
	middleware := RateLimitMiddleware(5, time.Second)

	assert.NotNil(t, middleware)

	router := gin.New()
	router.Use(middleware)
	router.GET("/api/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Make requests up to the limit
	for i := 0; i < 5; i++ {
		req, _ := http.NewRequest("GET", "/api/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	}

	// Next request should be rate limited
	req, _ := http.NewRequest("GET", "/api/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)
}

// TestRateLimiter_TokenRefill tests that tokens are refilled over time
func TestRateLimiter_TokenRefill(t *testing.T) {
	// Create a rate limiter allowing 2 requests per 50ms
	limiter := NewRateLimiter(2, 50*time.Millisecond)
	ip := "refill-test-ip"

	// Use all tokens
	assert.True(t, limiter.Allow(ip))
	assert.True(t, limiter.Allow(ip))
	assert.False(t, limiter.Allow(ip))

	// Wait for one interval (tokens should refill)
	time.Sleep(55 * time.Millisecond)

	// Tokens should be refilled - allow should succeed
	assert.True(t, limiter.Allow(ip), "Tokens should be refilled after interval")
}
