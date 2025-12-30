package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// ========================
// T220: Create test file backend/internal/middleware/security_test.go
// ========================

// ========================
// T221: TestSecurityHeaders_HSTS
// ========================

func TestSecurityHeaders_HSTS(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create test router with security headers middleware
	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/api/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/api/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify HSTS header
	hstsHeader := w.Header().Get("Strict-Transport-Security")
	assert.Contains(t, hstsHeader, "max-age=31536000")
	assert.Contains(t, hstsHeader, "includeSubDomains")
	assert.Contains(t, hstsHeader, "preload")
}

func TestSecurityHeaders_HSTS_MaxAge(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	hstsHeader := w.Header().Get("Strict-Transport-Security")
	// Verify max-age is set to 1 year (31536000 seconds)
	assert.Contains(t, hstsHeader, "max-age=31536000")
}

// ========================
// T222: TestSecurityHeaders_CSP
// ========================

func TestSecurityHeaders_CSP(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/api/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/api/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify Content-Security-Policy header
	cspHeader := w.Header().Get("Content-Security-Policy")
	assert.NotEmpty(t, cspHeader)
	assert.Contains(t, cspHeader, "default-src 'self'")
	assert.Contains(t, cspHeader, "script-src")
	assert.Contains(t, cspHeader, "style-src")
	assert.Contains(t, cspHeader, "frame-ancestors 'none'")
}

func TestSecurityHeaders_CSP_FrameAncestors(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	cspHeader := w.Header().Get("Content-Security-Policy")
	// Verify frame-ancestors is set to 'none' to prevent clickjacking
	assert.Contains(t, cspHeader, "frame-ancestors 'none'")
}

func TestSecurityHeaders_CSP_DefaultSrc(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	cspHeader := w.Header().Get("Content-Security-Policy")
	// Verify default-src is set to 'self'
	assert.Contains(t, cspHeader, "default-src 'self'")
}

// ========================
// T223: TestSecurityHeaders_XFrameOptions
// ========================

func TestSecurityHeaders_XFrameOptions(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/api/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/api/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify X-Frame-Options header
	xFrameOptions := w.Header().Get("X-Frame-Options")
	assert.Equal(t, "DENY", xFrameOptions)
}

func TestSecurityHeaders_XFrameOptions_DenyEmbedding(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "sensitive"})
	})

	req, _ := http.NewRequest("GET", "/protected", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// X-Frame-Options should be DENY to prevent all framing
	xFrameOptions := w.Header().Get("X-Frame-Options")
	assert.Equal(t, "DENY", xFrameOptions)
}

// ========================
// T224: TestSecurityHeaders_XContentType
// ========================

func TestSecurityHeaders_XContentType(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/api/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/api/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify X-Content-Type-Options header
	xContentType := w.Header().Get("X-Content-Type-Options")
	assert.Equal(t, "nosniff", xContentType)
}

func TestSecurityHeaders_XContentType_PreventsMIMESniffing(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/test.json", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "test"})
	})

	req, _ := http.NewRequest("GET", "/test.json", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// X-Content-Type-Options: nosniff prevents MIME type sniffing
	xContentType := w.Header().Get("X-Content-Type-Options")
	assert.Equal(t, "nosniff", xContentType)
}

// ========================
// Additional tests for completeness
// ========================

func TestSecurityHeaders_XSSProtection(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify X-XSS-Protection header
	xssProtection := w.Header().Get("X-XSS-Protection")
	assert.Equal(t, "1; mode=block", xssProtection)
}

func TestSecurityHeaders_ReferrerPolicy(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify Referrer-Policy header
	referrerPolicy := w.Header().Get("Referrer-Policy")
	assert.Equal(t, "strict-origin-when-cross-origin", referrerPolicy)
}

func TestSecurityHeaders_PermissionsPolicy(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify Permissions-Policy header
	permissionsPolicy := w.Header().Get("Permissions-Policy")
	assert.NotEmpty(t, permissionsPolicy)
	assert.Contains(t, permissionsPolicy, "camera=()")
	assert.Contains(t, permissionsPolicy, "microphone=()")
	assert.Contains(t, permissionsPolicy, "geolocation=()")
}

func TestSecurityHeaders_CacheControl_APIRoute(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/api/sensitive-data", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "sensitive"})
	})

	req, _ := http.NewRequest("GET", "/api/sensitive-data", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify Cache-Control for API routes
	cacheControl := w.Header().Get("Cache-Control")
	assert.Contains(t, cacheControl, "no-store")
	assert.Contains(t, cacheControl, "no-cache")
	assert.Contains(t, cacheControl, "must-revalidate")
	assert.Contains(t, cacheControl, "private")

	// Verify Pragma header
	pragma := w.Header().Get("Pragma")
	assert.Equal(t, "no-cache", pragma)

	// Verify Expires header
	expires := w.Header().Get("Expires")
	assert.Equal(t, "0", expires)
}

func TestSecurityHeaders_CacheControl_NonAPIRoute(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/static/image.png", func(c *gin.Context) {
		c.String(http.StatusOK, "image data")
	})

	req, _ := http.NewRequest("GET", "/static/image.png", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Non-API routes should not have cache-control headers
	cacheControl := w.Header().Get("Cache-Control")
	assert.Empty(t, cacheControl)
}

func TestSecurityHeaders_AllHeadersPresent(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/api/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/api/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify all security headers are present
	assert.NotEmpty(t, w.Header().Get("Strict-Transport-Security"))
	assert.NotEmpty(t, w.Header().Get("X-Content-Type-Options"))
	assert.NotEmpty(t, w.Header().Get("X-Frame-Options"))
	assert.NotEmpty(t, w.Header().Get("X-XSS-Protection"))
	assert.NotEmpty(t, w.Header().Get("Content-Security-Policy"))
	assert.NotEmpty(t, w.Header().Get("Referrer-Policy"))
	assert.NotEmpty(t, w.Header().Get("Permissions-Policy"))
}

func TestSecurityHeaders_MiddlewareContinues(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handlerCalled := false

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/test", func(c *gin.Context) {
		handlerCalled = true
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Verify that the middleware calls c.Next() and handler is executed
	assert.True(t, handlerCalled)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestSecurityHeaders_POSTRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.POST("/api/data", func(c *gin.Context) {
		c.JSON(http.StatusCreated, gin.H{"message": "created"})
	})

	req, _ := http.NewRequest("POST", "/api/data", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Security headers should be present on POST requests too
	assert.NotEmpty(t, w.Header().Get("Strict-Transport-Security"))
	assert.NotEmpty(t, w.Header().Get("X-Content-Type-Options"))
	assert.NotEmpty(t, w.Header().Get("X-Frame-Options"))
}

func TestIsAPIRoute(t *testing.T) {
	testCases := []struct {
		path     string
		expected bool
	}{
		{"/api/v1/users", true},
		{"/api/health", true},
		{"/api", true},
		{"/static/css/style.css", false},
		{"/images/logo.png", false},
		{"/", false},
		{"/ap", false},
		{"", false},
	}

	for _, tc := range testCases {
		t.Run(tc.path, func(t *testing.T) {
			result := isAPIRoute(tc.path)
			assert.Equal(t, tc.expected, result, "isAPIRoute(%q) should return %v", tc.path, tc.expected)
		})
	}
}

func TestSecurityHeaders_MultipleRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/api/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Make multiple requests to ensure headers are consistently applied
	for i := 0; i < 3; i++ {
		req, _ := http.NewRequest("GET", "/api/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "nosniff", w.Header().Get("X-Content-Type-Options"))
		assert.Equal(t, "DENY", w.Header().Get("X-Frame-Options"))
	}
}
