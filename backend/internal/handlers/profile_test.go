package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"pos-public/internal/models"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestGetProfile_Success(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)

	// Mock user data
	userID := uuid.New()
	username := "testuser"
	email := "test@example.com"
	firstName := "Test"
	lastName := "User"
	role := "admin"

	// Expect query
	rows := sqlmock.NewRows([]string{"id", "username", "email", "first_name", "last_name", "role", "is_active", "created_at", "updated_at"}).
		AddRow(userID, username, email, firstName, lastName, role, true, "2024-01-01", "2024-01-01")

	mock.ExpectQuery("SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at FROM users WHERE id").
		WithArgs(userID).
		WillReturnRows(rows)

	// Create test request
	router := gin.New()
	router.GET("/profile", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.GetProfile(c)
	})

	req, _ := http.NewRequest("GET", "/profile", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Profile retrieved successfully", response.Message)

	// Verify no expectation errors
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetProfile_Unauthorized(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)

	// Create test request without user_id in context
	router := gin.New()
	router.GET("/profile", handler.GetProfile)

	req, _ := http.NewRequest("GET", "/profile", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Unauthorized - user not authenticated", response.Message)
}

func TestGetProfile_UserNotFound(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)

	// Mock user data
	userID := uuid.New()

	// Expect query to return no rows
	mock.ExpectQuery("SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at FROM users WHERE id").
		WithArgs(userID).
		WillReturnError(sql.ErrNoRows)

	// Create test request
	router := gin.New()
	router.GET("/profile", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.GetProfile(c)
	})

	req, _ := http.NewRequest("GET", "/profile", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusNotFound, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "User profile not found", response.Message)

	// Verify no expectation errors
	assert.NoError(t, mock.ExpectationsWereMet())
}
