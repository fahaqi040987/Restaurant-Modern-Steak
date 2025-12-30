package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ========================
// T177: Create test file backend/internal/middleware/auth_test.go
// ========================

// Helper function to generate a valid token for testing
func generateTestToken(userID uuid.UUID, username, role string, expiresIn time.Duration) string {
	claims := &Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiresIn)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "pos-system",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString(jwtSecret)
	return tokenString
}

// Helper function to generate an expired token
func generateExpiredToken(userID uuid.UUID, username, role string) string {
	claims := &Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)), // Expired 1 hour ago
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			Issuer:    "pos-system",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString(jwtSecret)
	return tokenString
}

// Helper function to generate a token with invalid signature
func generateTokenWithInvalidSignature(userID uuid.UUID, username, role string) string {
	claims := &Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "pos-system",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	// Sign with a different (wrong) secret
	wrongSecret := []byte("this-is-a-wrong-secret-key-32chars")
	tokenString, _ := token.SignedString(wrongSecret)
	return tokenString
}

// ========================
// T178: TestAuthMiddleware_ValidToken
// ========================

func TestAuthMiddleware_ValidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	userID := uuid.New()
	username := "testuser"
	role := "admin"

	// Generate a valid token
	validToken := generateTestToken(userID, username, role, 24*time.Hour)

	// Create test router with auth middleware
	router := gin.New()
	router.Use(AuthMiddleware())
	router.GET("/protected", func(c *gin.Context) {
		// Verify user context was set correctly
		ctxUserID, _ := c.Get("user_id")
		ctxUsername, _ := c.Get("username")
		ctxRole, _ := c.Get("role")

		c.JSON(http.StatusOK, gin.H{
			"user_id":  ctxUserID,
			"username": ctxUsername,
			"role":     ctxRole,
		})
	})

	// Create request with valid token
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+validToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, username, response["username"])
	assert.Equal(t, role, response["role"])
}

// ========================
// T179: TestAuthMiddleware_ExpiredToken
// ========================

func TestAuthMiddleware_ExpiredToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	userID := uuid.New()
	username := "expireduser"
	role := "server"

	// Generate an expired token
	expiredToken := generateExpiredToken(userID, username, role)

	// Create test router with auth middleware
	router := gin.New()
	router.Use(AuthMiddleware())
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create request with expired token
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+expiredToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert - should return 401 Unauthorized
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Invalid or expired token", response.Message)
	assert.NotNil(t, response.Error)
	assert.Equal(t, "invalid_token", *response.Error)
}

// ========================
// T180: TestAuthMiddleware_MalformedToken
// ========================

func TestAuthMiddleware_MalformedToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create test router with auth middleware
	router := gin.New()
	router.Use(AuthMiddleware())
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Test cases for malformed tokens
	malformedTokens := []struct {
		name  string
		token string
	}{
		{"empty_token", ""},
		{"garbage_token", "not-a-valid-jwt-token"},
		{"partial_token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"},
		{"wrong_format", "token.without.proper.encoding"},
	}

	for _, tc := range malformedTokens {
		t.Run(tc.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+tc.token)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Assert - should return 401 Unauthorized
			assert.Equal(t, http.StatusUnauthorized, w.Code)

			var response models.APIResponse
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.False(t, response.Success)
			assert.Equal(t, "Invalid or expired token", response.Message)
		})
	}
}

// ========================
// T181: TestAuthMiddleware_MissingToken
// ========================

func TestAuthMiddleware_MissingToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create test router with auth middleware
	router := gin.New()
	router.Use(AuthMiddleware())
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Test case 1: No Authorization header at all
	t.Run("no_auth_header", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/protected", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.False(t, response.Success)
		assert.Equal(t, "Authorization header is required", response.Message)
		assert.NotNil(t, response.Error)
		assert.Equal(t, "missing_auth_header", *response.Error)
	})

	// Test case 2: Wrong authorization format (not Bearer)
	t.Run("wrong_auth_format", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Basic dXNlcjpwYXNz") // Basic auth format
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.False(t, response.Success)
		assert.Equal(t, "Invalid authorization header format", response.Message)
		assert.NotNil(t, response.Error)
		assert.Equal(t, "invalid_auth_format", *response.Error)
	})

	// Test case 3: Empty Authorization header
	t.Run("empty_auth_header", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.False(t, response.Success)
		assert.Equal(t, "Authorization header is required", response.Message)
	})
}

// ========================
// T182: TestAuthMiddleware_InvalidSignature
// ========================

func TestAuthMiddleware_InvalidSignature(t *testing.T) {
	gin.SetMode(gin.TestMode)

	userID := uuid.New()
	username := "testuser"
	role := "admin"

	// Generate a token signed with wrong secret
	tokenWithWrongSignature := generateTokenWithInvalidSignature(userID, username, role)

	// Create test router with auth middleware
	router := gin.New()
	router.Use(AuthMiddleware())
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create request with token signed with wrong key
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenWithWrongSignature)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert - should return 401 Unauthorized due to signature mismatch
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Invalid or expired token", response.Message)
	assert.NotNil(t, response.Error)
	assert.Equal(t, "invalid_token", *response.Error)
}

// ========================
// T183: TestRoleCheck_AdminAllowed
// ========================

func TestRoleCheck_AdminAllowed(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create test router with RequireRole middleware
	router := gin.New()
	router.Use(func(c *gin.Context) {
		// Simulate auth middleware setting user context
		c.Set("user_id", uuid.New())
		c.Set("username", "admin")
		c.Set("role", "admin")
		c.Next()
	})
	router.Use(RequireRole("admin"))
	router.GET("/admin-only", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "admin access granted"})
	})

	// Create request
	req, _ := http.NewRequest("GET", "/admin-only", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert - admin should be allowed
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "admin access granted", response["message"])
}

// TestRequireRoles_MultipleRolesAllowed tests RequireRoles with multiple allowed roles
func TestRequireRoles_MultipleRolesAllowed(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testCases := []struct {
		name           string
		userRole       string
		requiredRoles  []string
		expectedStatus int
		shouldPass     bool
	}{
		{
			name:           "admin_in_admin_manager",
			userRole:       "admin",
			requiredRoles:  []string{"admin", "manager"},
			expectedStatus: http.StatusOK,
			shouldPass:     true,
		},
		{
			name:           "manager_in_admin_manager",
			userRole:       "manager",
			requiredRoles:  []string{"admin", "manager"},
			expectedStatus: http.StatusOK,
			shouldPass:     true,
		},
		{
			name:           "server_in_server_counter_kitchen",
			userRole:       "server",
			requiredRoles:  []string{"server", "counter", "kitchen"},
			expectedStatus: http.StatusOK,
			shouldPass:     true,
		},
		{
			name:           "counter_not_in_admin_only",
			userRole:       "counter",
			requiredRoles:  []string{"admin"},
			expectedStatus: http.StatusForbidden,
			shouldPass:     false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			router := gin.New()
			router.Use(func(c *gin.Context) {
				c.Set("user_id", uuid.New())
				c.Set("username", "testuser")
				c.Set("role", tc.userRole)
				c.Next()
			})
			router.Use(RequireRoles(tc.requiredRoles))
			router.GET("/test", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "access granted"})
			})

			req, _ := http.NewRequest("GET", "/test", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tc.expectedStatus, w.Code)
		})
	}
}

// ========================
// T184: TestRoleCheck_InsufficientRole
// ========================

func TestRoleCheck_InsufficientRole(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Test case 1: Server trying to access admin-only route
	t.Run("server_blocked_from_admin", func(t *testing.T) {
		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("user_id", uuid.New())
			c.Set("username", "server1")
			c.Set("role", "server")
			c.Next()
		})
		router.Use(RequireRole("admin"))
		router.GET("/admin-only", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "admin access granted"})
		})

		req, _ := http.NewRequest("GET", "/admin-only", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusForbidden, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.False(t, response.Success)
		assert.Equal(t, "Insufficient permissions", response.Message)
		assert.NotNil(t, response.Error)
		assert.Equal(t, "insufficient_permissions", *response.Error)
	})

	// Test case 2: Kitchen trying to access manager route
	t.Run("kitchen_blocked_from_manager", func(t *testing.T) {
		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("user_id", uuid.New())
			c.Set("username", "kitchen1")
			c.Set("role", "kitchen")
			c.Next()
		})
		router.Use(RequireRole("manager"))
		router.GET("/manager-only", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "manager access granted"})
		})

		req, _ := http.NewRequest("GET", "/manager-only", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusForbidden, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.False(t, response.Success)
		assert.Equal(t, "Insufficient permissions", response.Message)
	})

	// Test case 3: Missing role in context
	t.Run("missing_role_in_context", func(t *testing.T) {
		router := gin.New()
		router.Use(func(c *gin.Context) {
			// Don't set role - simulating incomplete auth
			c.Set("user_id", uuid.New())
			c.Set("username", "testuser")
			// Missing: c.Set("role", "...")
			c.Next()
		})
		router.Use(RequireRole("admin"))
		router.GET("/admin-only", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "admin access granted"})
		})

		req, _ := http.NewRequest("GET", "/admin-only", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusForbidden, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.False(t, response.Success)
		assert.Equal(t, "Role information not found", response.Message)
		assert.NotNil(t, response.Error)
		assert.Equal(t, "missing_role", *response.Error)
	})
}

// ========================
// Additional tests for completeness
// ========================

// TestGenerateToken tests the token generation function
func TestGenerateToken(t *testing.T) {
	user := &models.User{
		ID:       uuid.New(),
		Username: "testuser",
		Role:     "admin",
	}

	token, err := GenerateToken(user)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)

	// Validate the generated token
	claims, err := ValidateToken(token)
	assert.NoError(t, err)
	assert.Equal(t, user.ID, claims.UserID)
	assert.Equal(t, user.Username, claims.Username)
	assert.Equal(t, user.Role, claims.Role)
	assert.Equal(t, "pos-system", claims.Issuer)
}

// TestValidateToken tests the token validation function
func TestValidateToken(t *testing.T) {
	userID := uuid.New()

	t.Run("valid_token", func(t *testing.T) {
		token := generateTestToken(userID, "testuser", "admin", 24*time.Hour)
		claims, err := ValidateToken(token)

		assert.NoError(t, err)
		assert.NotNil(t, claims)
		assert.Equal(t, userID, claims.UserID)
		assert.Equal(t, "testuser", claims.Username)
		assert.Equal(t, "admin", claims.Role)
	})

	t.Run("expired_token", func(t *testing.T) {
		token := generateExpiredToken(userID, "testuser", "admin")
		claims, err := ValidateToken(token)

		assert.Error(t, err)
		assert.Nil(t, claims)
	})

	t.Run("invalid_signature", func(t *testing.T) {
		token := generateTokenWithInvalidSignature(userID, "testuser", "admin")
		claims, err := ValidateToken(token)

		assert.Error(t, err)
		assert.Nil(t, claims)
	})

	t.Run("malformed_token", func(t *testing.T) {
		claims, err := ValidateToken("not-a-valid-token")

		assert.Error(t, err)
		assert.Nil(t, claims)
	})
}

// TestGetUserFromContext tests extracting user info from context
func TestGetUserFromContext(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("complete_context", func(t *testing.T) {
		router := gin.New()
		userID := uuid.New()

		router.GET("/test", func(c *gin.Context) {
			c.Set("user_id", userID)
			c.Set("username", "testuser")
			c.Set("role", "admin")

			id, username, role, ok := GetUserFromContext(c)

			assert.True(t, ok)
			assert.Equal(t, userID, id)
			assert.Equal(t, "testuser", username)
			assert.Equal(t, "admin", role)

			c.JSON(http.StatusOK, gin.H{"success": true})
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("incomplete_context", func(t *testing.T) {
		router := gin.New()

		router.GET("/test", func(c *gin.Context) {
			// Only set partial context
			c.Set("user_id", uuid.New())
			// Missing username and role

			id, username, role, ok := GetUserFromContext(c)

			assert.False(t, ok)
			assert.Equal(t, uuid.Nil, id)
			assert.Equal(t, "", username)
			assert.Equal(t, "", role)

			c.JSON(http.StatusOK, gin.H{"success": true})
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}

// TestAuthMiddleware_AllRoles tests auth middleware with all valid roles
func TestAuthMiddleware_AllRoles(t *testing.T) {
	gin.SetMode(gin.TestMode)

	roles := []string{"admin", "manager", "server", "counter", "kitchen"}

	for _, role := range roles {
		t.Run(role, func(t *testing.T) {
			userID := uuid.New()
			token := generateTestToken(userID, role+"_user", role, 24*time.Hour)

			router := gin.New()
			router.Use(AuthMiddleware())
			router.GET("/protected", func(c *gin.Context) {
				ctxRole, _ := c.Get("role")
				c.JSON(http.StatusOK, gin.H{"role": ctxRole})
			})

			req, _ := http.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)

			var response map[string]string
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, role, response["role"])
		})
	}
}
