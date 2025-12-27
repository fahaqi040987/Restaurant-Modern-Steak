package middleware

import (
	"fmt"
	"log"
	"os"
	"regexp"
	"time"

	"github.com/getsentry/sentry-go"
	"github.com/gin-gonic/gin"
)

var sentryInitialized = false

// Sensitive data patterns for masking (shared with logging.go)
var sentryMaskPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)(password|passwd|pwd)["']?\s*[:=]\s*["']?([^"'\s,}]+)`),
	regexp.MustCompile(`(?i)(token|bearer|authorization)["']?\s*[:=]\s*["']?([^"'\s,}]+)`),
	regexp.MustCompile(`(?i)(api[_-]?key|apikey)["']?\s*[:=]\s*["']?([^"'\s,}]+)`),
	regexp.MustCompile(`(?i)(secret|private[_-]?key)["']?\s*[:=]\s*["']?([^"'\s,}]+)`),
}

// maskSensitiveDataForSentry masks sensitive information in strings for Sentry
func maskSensitiveDataForSentry(data string) string {
	result := data
	for _, pattern := range sentryMaskPatterns {
		result = pattern.ReplaceAllString(result, "$1=***MASKED***")
	}
	return result
}

// InitializeSentry initializes Sentry error tracking
// This should be called early in the application startup
func InitializeSentry() error {
	dsn := os.Getenv("SENTRY_DSN")
	if dsn == "" {
		log.Println("Sentry DSN not configured, error tracking disabled")
		return nil
	}

	environment := os.Getenv("ENVIRONMENT")
	if environment == "" {
		environment = "development"
	}

	err := sentry.Init(sentry.ClientOptions{
		Dsn:              dsn,
		Environment:      environment,
		TracesSampleRate: getSampleRate(),
		AttachStacktrace: true,
		BeforeSend: func(event *sentry.Event, hint *sentry.EventHint) *sentry.Event {
			// Mask sensitive data in event
			if event.Request != nil {
				// Mask authorization headers
				if event.Request.Headers != nil {
					if _, ok := event.Request.Headers["Authorization"]; ok {
						event.Request.Headers["Authorization"] = "***MASKED***"
					}
				}
				// Mask sensitive query parameters
				if event.Request.QueryString != "" {
					event.Request.QueryString = maskSensitiveDataForSentry(event.Request.QueryString)
				}
			}
			return event
		},
	})

	if err != nil {
		return fmt.Errorf("failed to initialize Sentry: %w", err)
	}

	sentryInitialized = true
	log.Printf("Sentry initialized successfully for environment: %s", environment)
	return nil
}

// getSampleRate returns the sample rate for Sentry traces
func getSampleRate() float64 {
	env := os.Getenv("ENVIRONMENT")
	switch env {
	case "production":
		return 0.1 // 10% sampling in production
	case "staging":
		return 0.5 // 50% sampling in staging
	default:
		return 1.0 // 100% sampling in development
	}
}

// SentryErrorReporting middleware captures unhandled errors and reports them to Sentry
func SentryErrorReporting() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !sentryInitialized {
			c.Next()
			return
		}

		// Create a new hub for this request to isolate context
		hub := sentry.CurrentHub().Clone()
		hub.Scope().SetRequest(c.Request)

		// Add user context if available
		if userID, exists := c.Get("user_id"); exists {
			hub.Scope().SetUser(sentry.User{
				ID: fmt.Sprintf("%v", userID),
			})
		}

		// Add request ID for tracing
		if requestID, exists := c.Get("request_id"); exists {
			hub.Scope().SetTag("request_id", fmt.Sprintf("%v", requestID))
		}

		// Add custom context
		hub.Scope().SetContext("request", map[string]interface{}{
			"method":     c.Request.Method,
			"path":       c.Request.URL.Path,
			"ip":         c.ClientIP(),
			"user_agent": c.Request.UserAgent(),
		})

		// Process request
		c.Next()

		// Check for errors
		if len(c.Errors) > 0 {
			for _, err := range c.Errors {
				// Only report server errors (5xx) to Sentry
				if c.Writer.Status() >= 500 {
					hub.CaptureException(err.Err)
				}
			}
		}

		// Check for panics
		if c.Writer.Status() >= 500 {
			// Flush events to Sentry
			sentry.Flush(2 * time.Second)
		}
	}
}

// RecoveryWithSentry is a custom recovery middleware that reports panics to Sentry
func RecoveryWithSentry() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// Log the panic
				log.Printf("PANIC recovered: %v", err)

				// Report to Sentry if initialized
				if sentryInitialized {
					hub := sentry.CurrentHub().Clone()
					hub.Scope().SetRequest(c.Request)

					if requestID, exists := c.Get("request_id"); exists {
						hub.Scope().SetTag("request_id", fmt.Sprintf("%v", requestID))
					}

					// Capture the panic - convert to error type if needed
					switch e := err.(type) {
					case error:
						hub.CaptureException(e)
					default:
						hub.CaptureMessage(fmt.Sprintf("Panic: %v", e))
					}
					sentry.Flush(2 * time.Second)
				}

				// Return 500 error
				c.AbortWithStatusJSON(500, gin.H{
					"success": false,
					"message": "Internal server error",
					"error":   "An unexpected error occurred",
				})
			}
		}()

		c.Next()
	}
}
