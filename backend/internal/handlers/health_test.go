package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestHealthHandler(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create a mock database (nil for now, we'll improve this)
	handler := NewHealthHandler(nil)

	tests := []struct {
		name           string
		expectedStatus int
		checkFields    []string
		dbNil          bool
	}{
		{
			name:           "Health endpoint returns unhealthy when DB is nil",
			expectedStatus: http.StatusServiceUnavailable, // 503 when unhealthy
			checkFields:    []string{"status", "timestamp", "version", "database"},
			dbNil:          true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a test HTTP request
			req, _ := http.NewRequest("GET", "/health", nil)
			w := httptest.NewRecorder()

			// Create Gin context
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			// Call the handler
			handler.GetSystemHealth(c)

			// Check status code
			assert.Equal(t, tt.expectedStatus, w.Code)

			// Parse response
			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			// Check required fields exist
			for _, field := range tt.checkFields {
				assert.Contains(t, response, field, "Response should contain %s", field)
			}

			// Verify status field value
			if status, ok := response["status"].(string); ok {
				assert.Contains(t, []string{"healthy", "unhealthy"}, status)
			}

			// Verify version field
			if version, ok := response["version"].(string); ok {
				assert.NotEmpty(t, version)
			}
		})
	}
}

func TestHealthHandler_DatabaseConnection(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Returns unhealthy when database is nil", func(t *testing.T) {
		handler := NewHealthHandler(nil)

		req, _ := http.NewRequest("GET", "/health", nil)
		w := httptest.NewRecorder()

		c, _ := gin.CreateTestContext(w)
		c.Request = req

		handler.GetSystemHealth(c)

		// Should return unhealthy status when DB is nil
		var response HealthResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		// Database should be marked as not connected
		assert.False(t, response.Database.Connected)
		assert.NotEmpty(t, response.Database.Error)
	})
}

// Example of table-driven test pattern for future handler tests
// Example of table-driven test pattern for future reference
// func TestExampleTableDrivenPattern(t *testing.T) {
// 	gin.SetMode(gin.TestMode)
//
// 	tests := []struct {
// 		name           string
// 		method         string
// 		path           string
// 		body           interface{}
// 		expectedStatus int
// 		expectedBody   map[string]interface{}
// 	}{
// 		{
// 			name:           "GET request success",
// 			method:         "GET",
// 			path:           "/test",
// 			body:           nil,
// 			expectedStatus: 200,
// 			expectedBody:   map[string]interface{}{"status": "ok"},
// 		},
// 		{
// 			name:           "POST request with JSON body",
// 			method:         "POST",
// 			path:           "/test",
// 			body:           map[string]string{"key": "value"},
// 			expectedStatus: 201,
// 			expectedBody:   map[string]interface{}{"created": true},
// 		},
// 	}
//
// 	for _, tt := range tests {
// 		t.Run(tt.name, func(t *testing.T) {
// 			// Create request body if provided
// 			var reqBody *bytes.Buffer
// 			if tt.body != nil {
// 				jsonData, _ := json.Marshal(tt.body)
// 				reqBody = bytes.NewBuffer(jsonData)
// 			} else {
// 				reqBody = bytes.NewBuffer([]byte{})
// 			}
//
// 			// Create HTTP request
// 			req, _ := http.NewRequest(tt.method, tt.path, reqBody)
// 			req.Header.Set("Content-Type", "application/json")
//
// 			// Create response recorder
// 			w := httptest.NewRecorder()
//
// 			// Create Gin context and router
// 			router := gin.New()
//
// 			// Register your handler here
// 			// router.GET("/test", yourHandler)
// 			// router.POST("/test", yourHandler)
//
// 			// Serve the request
// 			router.ServeHTTP(w, req)
//
// 			// Assertions
// 			assert.Equal(t, tt.expectedStatus, w.Code)
//
// 			// Parse and check response body if expected
// 			if tt.expectedBody != nil {
// 				var response map[string]interface{}
// 				err := json.Unmarshal(w.Body.Bytes(), &response)
// 				assert.NoError(t, err)
//
// 				for key, expectedValue := range tt.expectedBody {
// 					assert.Equal(t, expectedValue, response[key])
// 				}
// 			}
// 		})
// 	}
// }
