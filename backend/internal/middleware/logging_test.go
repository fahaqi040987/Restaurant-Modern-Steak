package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// ========================
// SetLogLevel Tests
// ========================

func TestSetLogLevel_Debug(t *testing.T) {
	SetLogLevel("DEBUG")
	assert.Equal(t, LogLevelDebug, currentLogLevel)
}

func TestSetLogLevel_Info(t *testing.T) {
	SetLogLevel("INFO")
	assert.Equal(t, LogLevelInfo, currentLogLevel)
}

func TestSetLogLevel_Warn(t *testing.T) {
	SetLogLevel("WARN")
	assert.Equal(t, LogLevelWarn, currentLogLevel)

	SetLogLevel("WARNING")
	assert.Equal(t, LogLevelWarn, currentLogLevel)
}

func TestSetLogLevel_Error(t *testing.T) {
	SetLogLevel("ERROR")
	assert.Equal(t, LogLevelError, currentLogLevel)
}

func TestSetLogLevel_Invalid(t *testing.T) {
	SetLogLevel("INVALID")
	assert.Equal(t, LogLevelInfo, currentLogLevel)
}

func TestSetLogLevel_CaseInsensitive(t *testing.T) {
	SetLogLevel("debug")
	assert.Equal(t, LogLevelDebug, currentLogLevel)

	SetLogLevel("Error")
	assert.Equal(t, LogLevelError, currentLogLevel)
}

// ========================
// shouldLog Tests
// ========================

func TestShouldLog_DebugLevel(t *testing.T) {
	SetLogLevel("DEBUG")

	assert.True(t, shouldLog(LogLevelDebug))
	assert.True(t, shouldLog(LogLevelInfo))
	assert.True(t, shouldLog(LogLevelWarn))
	assert.True(t, shouldLog(LogLevelError))
}

func TestShouldLog_InfoLevel(t *testing.T) {
	SetLogLevel("INFO")

	assert.False(t, shouldLog(LogLevelDebug))
	assert.True(t, shouldLog(LogLevelInfo))
	assert.True(t, shouldLog(LogLevelWarn))
	assert.True(t, shouldLog(LogLevelError))
}

func TestShouldLog_WarnLevel(t *testing.T) {
	SetLogLevel("WARN")

	assert.False(t, shouldLog(LogLevelDebug))
	assert.False(t, shouldLog(LogLevelInfo))
	assert.True(t, shouldLog(LogLevelWarn))
	assert.True(t, shouldLog(LogLevelError))
}

func TestShouldLog_ErrorLevel(t *testing.T) {
	SetLogLevel("ERROR")

	assert.False(t, shouldLog(LogLevelDebug))
	assert.False(t, shouldLog(LogLevelInfo))
	assert.False(t, shouldLog(LogLevelWarn))
	assert.True(t, shouldLog(LogLevelError))
}

// ========================
// maskSensitiveData Tests
// ========================

func TestMaskSensitiveData_Password(t *testing.T) {
	testCases := []struct {
		input    string
		expected string
	}{
		{`password=secret123`, `password=***MASKED***`},
		{`"password": "secret123"`, `"password"=***MASKED***`},
		{`passwd:mypassword`, `passwd=***MASKED***`},
		{`pwd=test`, `pwd=***MASKED***`},
	}

	for _, tc := range testCases {
		result := maskSensitiveData(tc.input)
		assert.Contains(t, result, "***MASKED***", "Should mask sensitive data in: %s", tc.input)
	}
}

func TestMaskSensitiveData_Token(t *testing.T) {
	testCases := []struct {
		input    string
		expected string
	}{
		{`token=abc123def456`, `token=***MASKED***`},
		{`bearer=eyJhbGciOiJIUzI1NiJ9`, `bearer=***MASKED***`},
		{`Authorization: Bearer secret_token`, `Authorization=***MASKED***`},
	}

	for _, tc := range testCases {
		result := maskSensitiveData(tc.input)
		assert.Contains(t, result, "***MASKED***", "Should mask sensitive data in: %s", tc.input)
	}
}

func TestMaskSensitiveData_APIKey(t *testing.T) {
	testCases := []struct {
		input string
	}{
		{`api_key=sk_live_123456789`},
		{`apikey=my_secret_key`},
		{`api-key=another_key`},
	}

	for _, tc := range testCases {
		result := maskSensitiveData(tc.input)
		assert.Contains(t, result, "***MASKED***", "Should mask sensitive data in: %s", tc.input)
	}
}

func TestMaskSensitiveData_Secret(t *testing.T) {
	testCases := []struct {
		input string
	}{
		{`secret=my_secret_value`},
		{`private_key=-----BEGIN RSA PRIVATE KEY-----`},
		{`private-key=sensitive_data`},
	}

	for _, tc := range testCases {
		result := maskSensitiveData(tc.input)
		assert.Contains(t, result, "***MASKED***", "Should mask sensitive data in: %s", tc.input)
	}
}

func TestMaskSensitiveData_NoMasking(t *testing.T) {
	testCases := []struct {
		input string
	}{
		{`username=john_doe`},
		{`email=test@example.com`},
		{`path=/api/v1/users`},
		{`method=GET`},
	}

	for _, tc := range testCases {
		result := maskSensitiveData(tc.input)
		assert.NotContains(t, result, "***MASKED***", "Should not mask non-sensitive data in: %s", tc.input)
		assert.Equal(t, tc.input, result)
	}
}

// ========================
// RequestIDMiddleware Tests
// ========================

func TestRequestIDMiddleware_GeneratesNewID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.GET("/test", func(c *gin.Context) {
		requestID, exists := c.Get("request_id")
		assert.True(t, exists)
		assert.NotEmpty(t, requestID)
		c.JSON(http.StatusOK, gin.H{"request_id": requestID})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Check response header
	responseRequestID := w.Header().Get("X-Request-ID")
	assert.NotEmpty(t, responseRequestID)

	// Verify UUID format (36 characters with dashes)
	assert.Len(t, responseRequestID, 36)
	assert.Equal(t, '-', rune(responseRequestID[8]))
	assert.Equal(t, '-', rune(responseRequestID[13]))
}

func TestRequestIDMiddleware_UsesProvidedID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.GET("/test", func(c *gin.Context) {
		requestID, _ := c.Get("request_id")
		c.JSON(http.StatusOK, gin.H{"request_id": requestID})
	})

	providedID := "custom-request-id-12345"
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Request-ID", providedID)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Check response header contains provided ID
	responseRequestID := w.Header().Get("X-Request-ID")
	assert.Equal(t, providedID, responseRequestID)

	// Check response body
	var response map[string]string
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, providedID, response["request_id"])
}

// ========================
// StructuredLogger Tests (T256, T257, T258)
// ========================

func TestStructuredLogger_RequestLogged(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	// Set log level to capture INFO logs
	SetLogLevel("INFO")

	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.Use(StructuredLogger())
	router.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	req, _ := http.NewRequest("GET", "/api/v1/health", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	// Restore stdout and read captured output
	w.Close()
	os.Stdout = oldStdout
	var buf bytes.Buffer
	io.Copy(&buf, r)
	output := buf.String()

	assert.Equal(t, http.StatusOK, recorder.Code)

	// Verify structured log was output
	assert.Contains(t, output, `"method":"GET"`)
	assert.Contains(t, output, `"path":"/api/v1/health"`)
	assert.Contains(t, output, `"status_code":200`)
	assert.Contains(t, output, `"level":"INFO"`)
}

func TestStructuredLogger_ErrorLogged(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Capture stderr for error logs
	oldStderr := os.Stderr
	r, w, _ := os.Pipe()
	os.Stderr = w

	// Set log level to capture ERROR logs
	SetLogLevel("ERROR")

	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.Use(StructuredLogger())
	router.GET("/api/v1/error", func(c *gin.Context) {
		// Just return 500 error - the middleware will log it as ERROR
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
	})

	req, _ := http.NewRequest("GET", "/api/v1/error", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	// Restore stderr and read captured output
	w.Close()
	os.Stderr = oldStderr
	var buf bytes.Buffer
	io.Copy(&buf, r)
	output := buf.String()

	assert.Equal(t, http.StatusInternalServerError, recorder.Code)

	// Verify error log was output
	assert.Contains(t, output, `"level":"ERROR"`)
	assert.Contains(t, output, `"status_code":500`)
}

func TestStructuredLogger_ResponseTimeRecorded(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	SetLogLevel("DEBUG")

	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.Use(StructuredLogger())
	router.GET("/api/v1/slow", func(c *gin.Context) {
		// Simulate slow response
		time.Sleep(10 * time.Millisecond)
		c.JSON(http.StatusOK, gin.H{"status": "done"})
	})

	req, _ := http.NewRequest("GET", "/api/v1/slow", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	// Restore stdout and read captured output
	w.Close()
	os.Stdout = oldStdout
	var buf bytes.Buffer
	io.Copy(&buf, r)
	output := buf.String()

	assert.Equal(t, http.StatusOK, recorder.Code)

	// Verify latency is recorded
	assert.Contains(t, output, `"latency":`)

	// Parse the JSON to verify latency is present and non-zero
	lines := strings.Split(strings.TrimSpace(output), "\n")
	if len(lines) > 0 {
		var logEntry StructuredLog
		err := json.Unmarshal([]byte(lines[0]), &logEntry)
		if err == nil {
			assert.NotEmpty(t, logEntry.Latency)
			// Latency should be at least 10ms
			assert.NotEqual(t, "0s", logEntry.Latency)
		}
	}
}

func TestStructuredLogger_WarnFor4xxStatus(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Capture stdout for warn logs
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	SetLogLevel("WARN")

	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.Use(StructuredLogger())
	router.GET("/api/v1/notfound", func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
	})

	req, _ := http.NewRequest("GET", "/api/v1/notfound", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	// Restore stdout and read captured output
	w.Close()
	os.Stdout = oldStdout
	var buf bytes.Buffer
	io.Copy(&buf, r)
	output := buf.String()

	assert.Equal(t, http.StatusNotFound, recorder.Code)

	// Verify warn log was output for 4xx status
	assert.Contains(t, output, `"level":"WARN"`)
	assert.Contains(t, output, `"status_code":404`)
}

func TestStructuredLogger_QueryStringIncluded(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	SetLogLevel("INFO")

	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.Use(StructuredLogger())
	router.GET("/api/v1/search", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"results": []string{}})
	})

	req, _ := http.NewRequest("GET", "/api/v1/search?q=test&page=1", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	// Restore stdout and read captured output
	w.Close()
	os.Stdout = oldStdout
	var buf bytes.Buffer
	io.Copy(&buf, r)
	output := buf.String()

	assert.Equal(t, http.StatusOK, recorder.Code)

	// Verify query string is included in path
	// JSON escapes '&' as '\u0026', so check for both possible formats
	assert.True(t,
		strings.Contains(output, `"path":"/api/v1/search?q=test&page=1"`) ||
			strings.Contains(output, `"path":"/api/v1/search?q=test\u0026page=1"`),
		"Query string should be included in path")
}

func TestStructuredLogger_SensitiveDataMasked(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	SetLogLevel("INFO")

	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.Use(StructuredLogger())
	router.GET("/api/v1/auth", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Request with sensitive query parameter
	req, _ := http.NewRequest("GET", "/api/v1/auth?token=secret_token_value", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	// Restore stdout and read captured output
	w.Close()
	os.Stdout = oldStdout
	var buf bytes.Buffer
	io.Copy(&buf, r)
	output := buf.String()

	assert.Equal(t, http.StatusOK, recorder.Code)

	// Verify sensitive data is masked
	assert.Contains(t, output, "***MASKED***")
	assert.NotContains(t, output, "secret_token_value")
}

// ========================
// RequestLogger Tests (Basic Logger)
// ========================

func TestRequestLogger_LogsRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(RequestLogger())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	assert.Equal(t, http.StatusOK, recorder.Code)
}

func TestRequestLogger_LogsErrors(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(RequestLogger())
	router.GET("/error", func(c *gin.Context) {
		// Just return a bad request - no c.Error needed
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
	})

	req, _ := http.NewRequest("GET", "/error", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
}

// ========================
// RequestLoggerConfigured Tests
// ========================

func TestRequestLoggerConfigured_SkipsPaths(t *testing.T) {
	gin.SetMode(gin.TestMode)

	config := LoggerConfig{
		SkipPaths: []string{"/health", "/metrics"},
		LogBody:   false,
	}

	router := gin.New()
	router.Use(RequestLoggerConfigured(config))
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})
	router.GET("/api", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Health endpoint (should be skipped)
	req, _ := http.NewRequest("GET", "/health", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)
	assert.Equal(t, http.StatusOK, recorder.Code)

	// API endpoint (should be logged)
	req, _ = http.NewRequest("GET", "/api", nil)
	recorder = httptest.NewRecorder()
	router.ServeHTTP(recorder, req)
	assert.Equal(t, http.StatusOK, recorder.Code)
}

// ========================
// Color Functions Tests
// ========================

func TestGetStatusColor(t *testing.T) {
	testCases := []struct {
		code     int
		expected string
	}{
		{200, greenColor},
		{201, greenColor},
		{204, greenColor},
		{301, blueColor},
		{302, blueColor},
		{304, blueColor},
		{400, yellowColor},
		{401, yellowColor},
		{404, yellowColor},
		{500, redColor},
		{502, redColor},
		{503, redColor},
	}

	for _, tc := range testCases {
		result := getStatusColor(tc.code)
		assert.Equal(t, tc.expected, result, "Unexpected color for status code %d", tc.code)
	}
}

func TestGetMethodColor(t *testing.T) {
	testCases := []struct {
		method   string
		expected string
	}{
		{"GET", blueColor},
		{"POST", cyanColor},
		{"PUT", yellowColor},
		{"PATCH", yellowColor},
		{"DELETE", redColor},
		{"OPTIONS", resetColor},
		{"HEAD", resetColor},
	}

	for _, tc := range testCases {
		result := getMethodColor(tc.method)
		assert.Equal(t, tc.expected, result, "Unexpected color for method %s", tc.method)
	}
}

// ========================
// StructuredLog Tests
// ========================

func TestStructuredLog_JSON_Format(t *testing.T) {
	log := StructuredLog{
		Timestamp:  "2025-12-27T10:00:00Z",
		Level:      "INFO",
		RequestID:  "test-request-id",
		Method:     "GET",
		Path:       "/api/v1/test",
		StatusCode: 200,
		Latency:    "10ms",
		ClientIP:   "127.0.0.1",
		UserAgent:  "Test/1.0",
	}

	jsonData, err := json.Marshal(log)
	assert.NoError(t, err)

	var decoded StructuredLog
	err = json.Unmarshal(jsonData, &decoded)
	assert.NoError(t, err)

	assert.Equal(t, log.Timestamp, decoded.Timestamp)
	assert.Equal(t, log.Level, decoded.Level)
	assert.Equal(t, log.RequestID, decoded.RequestID)
	assert.Equal(t, log.Method, decoded.Method)
	assert.Equal(t, log.Path, decoded.Path)
	assert.Equal(t, log.StatusCode, decoded.StatusCode)
	assert.Equal(t, log.Latency, decoded.Latency)
	assert.Equal(t, log.ClientIP, decoded.ClientIP)
	assert.Equal(t, log.UserAgent, decoded.UserAgent)
}

func TestStructuredLog_WithError(t *testing.T) {
	log := StructuredLog{
		Timestamp:  "2025-12-27T10:00:00Z",
		Level:      "ERROR",
		RequestID:  "test-request-id",
		Method:     "POST",
		Path:       "/api/v1/users",
		StatusCode: 500,
		Latency:    "50ms",
		ClientIP:   "192.168.1.1",
		Error:      "Database connection failed",
		Message:    "Failed to create user",
	}

	jsonData, err := json.Marshal(log)
	assert.NoError(t, err)

	assert.Contains(t, string(jsonData), `"error":"Database connection failed"`)
	assert.Contains(t, string(jsonData), `"message":"Failed to create user"`)
}

func TestStructuredLog_WithExtra(t *testing.T) {
	log := StructuredLog{
		Timestamp: "2025-12-27T10:00:00Z",
		Level:     "INFO",
		Method:    "GET",
		Path:      "/api/v1/orders",
		Extra: map[string]interface{}{
			"user_id":    "user-123",
			"order_id":   "order-456",
			"action":     "fetch",
			"item_count": 5,
		},
	}

	jsonData, err := json.Marshal(log)
	assert.NoError(t, err)

	assert.Contains(t, string(jsonData), `"user_id":"user-123"`)
	assert.Contains(t, string(jsonData), `"order_id":"order-456"`)
}

// ========================
// Integration Tests
// ========================

func TestLoggingMiddleware_FullPipeline(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	SetLogLevel("DEBUG")

	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.Use(StructuredLogger())

	// Test endpoint that simulates a real request
	router.POST("/api/v1/orders", func(c *gin.Context) {
		requestID, _ := c.Get("request_id")
		c.JSON(http.StatusCreated, gin.H{
			"order_id":   "order-12345",
			"request_id": requestID,
		})
	})

	body := `{"customer": "Test Customer", "items": [{"product_id": "1", "quantity": 2}]}`
	req, _ := http.NewRequest("POST", "/api/v1/orders", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "TestClient/1.0")
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	// Restore stdout and read captured output
	w.Close()
	os.Stdout = oldStdout
	var buf bytes.Buffer
	io.Copy(&buf, r)
	output := buf.String()

	assert.Equal(t, http.StatusCreated, recorder.Code)

	// Verify response
	var response map[string]string
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NotEmpty(t, response["order_id"])
	assert.NotEmpty(t, response["request_id"])

	// Verify log output
	assert.Contains(t, output, `"method":"POST"`)
	assert.Contains(t, output, `"/api/v1/orders"`)
	assert.Contains(t, output, `"status_code":201`)
	assert.Contains(t, output, `"user_agent":"TestClient/1.0"`)
}

func TestLoggingMiddleware_ErrorScenario(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Capture stderr for errors
	oldStderr := os.Stderr
	r, w, _ := os.Pipe()
	os.Stderr = w

	SetLogLevel("ERROR")

	router := gin.New()
	router.Use(RequestIDMiddleware())
	router.Use(StructuredLogger())

	// Create a 500 error scenario - just return 500 without c.Error
	router.GET("/api/v1/crash", func(c *gin.Context) {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Something went wrong",
		})
	})

	req, _ := http.NewRequest("GET", "/api/v1/crash", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	// Restore stderr
	w.Close()
	os.Stderr = oldStderr
	var buf bytes.Buffer
	io.Copy(&buf, r)
	output := buf.String()

	assert.Equal(t, http.StatusInternalServerError, recorder.Code)

	// Verify error log
	assert.Contains(t, output, `"level":"ERROR"`)
	assert.Contains(t, output, `"status_code":500`)
}
