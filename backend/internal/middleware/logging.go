package middleware

import (
	"encoding/json"
	"log"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// LogLevel represents the logging level
type LogLevel string

const (
	LogLevelDebug LogLevel = "DEBUG"
	LogLevelInfo  LogLevel = "INFO"
	LogLevelWarn  LogLevel = "WARN"
	LogLevelError LogLevel = "ERROR"
)

// Global log level configuration
var currentLogLevel = LogLevelInfo

// SetLogLevel configures the global log level
func SetLogLevel(level string) {
	switch strings.ToUpper(level) {
	case "DEBUG":
		currentLogLevel = LogLevelDebug
	case "INFO":
		currentLogLevel = LogLevelInfo
	case "WARN", "WARNING":
		currentLogLevel = LogLevelWarn
	case "ERROR":
		currentLogLevel = LogLevelError
	default:
		currentLogLevel = LogLevelInfo
	}
}

// shouldLog checks if a message at the given level should be logged
func shouldLog(level LogLevel) bool {
	levelOrder := map[LogLevel]int{
		LogLevelDebug: 0,
		LogLevelInfo:  1,
		LogLevelWarn:  2,
		LogLevelError: 3,
	}
	return levelOrder[level] >= levelOrder[currentLogLevel]
}

// StructuredLog represents a structured log entry
type StructuredLog struct {
	Timestamp  string                 `json:"timestamp"`
	Level      string                 `json:"level"`
	RequestID  string                 `json:"request_id,omitempty"`
	Method     string                 `json:"method,omitempty"`
	Path       string                 `json:"path,omitempty"`
	StatusCode int                    `json:"status_code,omitempty"`
	Latency    string                 `json:"latency,omitempty"`
	ClientIP   string                 `json:"client_ip,omitempty"`
	UserAgent  string                 `json:"user_agent,omitempty"`
	Error      string                 `json:"error,omitempty"`
	Message    string                 `json:"message,omitempty"`
	Extra      map[string]interface{} `json:"extra,omitempty"`
}

// Sensitive data patterns for masking
var sensitivePatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)(password|passwd|pwd)["']?\s*[:=]\s*["']?([^"'\s,}]+)`),
	regexp.MustCompile(`(?i)(token|bearer|authorization)["']?\s*[:=]\s*["']?([^"'\s,}]+)`),
	regexp.MustCompile(`(?i)(api[_-]?key|apikey)["']?\s*[:=]\s*["']?([^"'\s,}]+)`),
	regexp.MustCompile(`(?i)(secret|private[_-]?key)["']?\s*[:=]\s*["']?([^"'\s,}]+)`),
}

// maskSensitiveData masks sensitive information in strings
func maskSensitiveData(data string) string {
	result := data
	for _, pattern := range sensitivePatterns {
		result = pattern.ReplaceAllString(result, "$1=***MASKED***")
	}
	return result
}

// logStructured outputs a structured JSON log
func logStructured(entry StructuredLog) {
	if !shouldLog(LogLevel(entry.Level)) {
		return
	}

	// Mask sensitive data in path, message, and error
	if entry.Path != "" {
		entry.Path = maskSensitiveData(entry.Path)
	}
	if entry.Message != "" {
		entry.Message = maskSensitiveData(entry.Message)
	}
	if entry.Error != "" {
		entry.Error = maskSensitiveData(entry.Error)
	}

	jsonData, err := json.Marshal(entry)
	if err != nil {
		log.Printf("Failed to marshal log entry: %v", err)
		return
	}

	// Write to stderr for errors, stdout for everything else
	if entry.Level == string(LogLevelError) {
		os.Stderr.Write(jsonData)
		os.Stderr.WriteString("\n")
	} else {
		os.Stdout.Write(jsonData)
		os.Stdout.WriteString("\n")
	}
}

// RequestIDMiddleware generates and attaches a unique request ID to each request
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if request ID already exists in header
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			// Generate new UUID for request ID
			requestID = uuid.New().String()
		}

		// Store request ID in context
		c.Set("request_id", requestID)

		// Add request ID to response header
		c.Header("X-Request-ID", requestID)

		c.Next()
	}
}

// StructuredLogger provides structured JSON logging middleware with request ID and sensitive data masking
func StructuredLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		// Get request ID from context
		requestID, _ := c.Get("request_id")
		requestIDStr := ""
		if rid, ok := requestID.(string); ok {
			requestIDStr = rid
		}

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(startTime)

		// Build log entry
		entry := StructuredLog{
			Timestamp:  time.Now().UTC().Format(time.RFC3339),
			Level:      string(LogLevelInfo),
			RequestID:  requestIDStr,
			Method:     c.Request.Method,
			Path:       c.Request.URL.Path,
			StatusCode: c.Writer.Status(),
			Latency:    latency.String(),
			ClientIP:   c.ClientIP(),
			UserAgent:  c.Request.UserAgent(),
		}

		// Set log level based on status code
		switch {
		case entry.StatusCode >= 500:
			entry.Level = string(LogLevelError)
		case entry.StatusCode >= 400:
			entry.Level = string(LogLevelWarn)
		default:
			entry.Level = string(LogLevelInfo)
		}

		// Add query string if present
		if c.Request.URL.RawQuery != "" {
			entry.Path = entry.Path + "?" + c.Request.URL.RawQuery
		}

		// Log errors if any
		if len(c.Errors) > 0 {
			var errorMessages []string
			for _, e := range c.Errors.Errors() {
				errorMessages = append(errorMessages, e)
			}
			entry.Error = strings.Join(errorMessages, "; ")
		}

		logStructured(entry)
	}
}

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
