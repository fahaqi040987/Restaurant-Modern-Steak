package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// RequestLogger logs incoming HTTP requests with timing and status information
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Start timer
		startTime := time.Now()

		// Get request details
		path := c.Request.URL.Path
		rawQuery := c.Request.URL.RawQuery
		method := c.Request.Method
		clientIP := c.ClientIP()

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(startTime)

		// Get response status
		statusCode := c.Writer.Status()
		bodySize := c.Writer.Size()

		// Build query string
		if rawQuery != "" {
			path = path + "?" + rawQuery
		}

		// Log format: [METHOD] /path STATUS LATENCY CLIENT_IP BODY_SIZE
		log.Printf("[%s] %s %d %v %s %d bytes",
			method,
			path,
			statusCode,
			latency,
			clientIP,
			bodySize,
		)

		// Log errors if any
		if len(c.Errors) > 0 {
			for _, e := range c.Errors.Errors() {
				log.Printf("[ERROR] %s", e)
			}
		}
	}
}

// RequestLoggerWithConfig provides configurable request logging
type LoggerConfig struct {
	// SkipPaths are paths that should not be logged
	SkipPaths []string
	// LogBody enables logging of request/response bodies (use with caution)
	LogBody bool
}

// RequestLoggerConfigured creates a logger with custom configuration
func RequestLoggerConfigured(config LoggerConfig) gin.HandlerFunc {
	skipPaths := make(map[string]bool)
	for _, path := range config.SkipPaths {
		skipPaths[path] = true
	}

	return func(c *gin.Context) {
		path := c.Request.URL.Path

		// Skip logging for configured paths
		if skipPaths[path] {
			c.Next()
			return
		}

		startTime := time.Now()
		method := c.Request.Method
		clientIP := c.ClientIP()
		rawQuery := c.Request.URL.RawQuery

		// Process request
		c.Next()

		latency := time.Since(startTime)
		statusCode := c.Writer.Status()
		bodySize := c.Writer.Size()

		if rawQuery != "" {
			path = path + "?" + rawQuery
		}

		// Color-coded status (for terminal output)
		statusColor := getStatusColor(statusCode)
		methodColor := getMethodColor(method)

		log.Printf("%s[%s]%s %s %s%d%s %v %s %d bytes",
			methodColor, method, resetColor,
			path,
			statusColor, statusCode, resetColor,
			latency,
			clientIP,
			bodySize,
		)
	}
}

// ANSI color codes for terminal output
const (
	resetColor  = "\033[0m"
	greenColor  = "\033[32m"
	yellowColor = "\033[33m"
	redColor    = "\033[31m"
	blueColor   = "\033[34m"
	cyanColor   = "\033[36m"
)

func getStatusColor(code int) string {
	switch {
	case code >= 200 && code < 300:
		return greenColor
	case code >= 300 && code < 400:
		return blueColor
	case code >= 400 && code < 500:
		return yellowColor
	default:
		return redColor
	}
}

func getMethodColor(method string) string {
	switch method {
	case "GET":
		return blueColor
	case "POST":
		return cyanColor
	case "PUT", "PATCH":
		return yellowColor
	case "DELETE":
		return redColor
	default:
		return resetColor
	}
}
