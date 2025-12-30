package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pos-public/internal/models"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
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
	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "username", "email", "first_name", "last_name", "role", "is_active", "created_at", "updated_at"}).
		AddRow(userID, username, email, firstName, lastName, role, true, now, now)

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

// ========================
// UpdateProfile Tests
// ========================

func TestUpdateProfile_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)
	userID := uuid.New()

	// Mock email uniqueness check - no rows means email is available
	mock.ExpectQuery("SELECT id FROM users WHERE email").
		WithArgs("newemail@example.com", userID).
		WillReturnError(sql.ErrNoRows)

	// Mock update query
	mock.ExpectExec("UPDATE users").
		WithArgs("NewFirst", "NewLast", "newemail@example.com", userID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock fetch updated user
	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "username", "email", "first_name", "last_name", "role", "is_active", "created_at", "updated_at"}).
		AddRow(userID, "testuser", "newemail@example.com", "NewFirst", "NewLast", "admin", true, now, now)
	mock.ExpectQuery("SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at FROM users WHERE id").
		WithArgs(userID).
		WillReturnRows(rows)

	router := gin.New()
	router.PUT("/profile", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.UpdateProfile(c)
	})

	body := `{"first_name":"NewFirst","last_name":"NewLast","email":"newemail@example.com"}`
	req, _ := http.NewRequest("PUT", "/profile", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Profile updated successfully", response.Message)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUpdateProfile_Unauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)

	router := gin.New()
	router.PUT("/profile", handler.UpdateProfile)

	body := `{"first_name":"NewFirst","last_name":"NewLast","email":"newemail@example.com"}`
	req, _ := http.NewRequest("PUT", "/profile", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Unauthorized - user not authenticated", response.Message)
}

func TestUpdateProfile_InvalidBody(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)
	userID := uuid.New()

	router := gin.New()
	router.PUT("/profile", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.UpdateProfile(c)
	})

	// Missing required fields
	body := `{"first_name":"NewFirst"}`
	req, _ := http.NewRequest("PUT", "/profile", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
}

func TestUpdateProfile_EmailTaken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)
	userID := uuid.New()
	existingUserID := uuid.New()

	// Mock email check - returns a row meaning email is taken
	rows := sqlmock.NewRows([]string{"id"}).AddRow(existingUserID)
	mock.ExpectQuery("SELECT id FROM users WHERE email").
		WithArgs("taken@example.com", userID).
		WillReturnRows(rows)

	router := gin.New()
	router.PUT("/profile", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.UpdateProfile(c)
	})

	body := `{"first_name":"NewFirst","last_name":"NewLast","email":"taken@example.com"}`
	req, _ := http.NewRequest("PUT", "/profile", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusConflict, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Email address already in use by another account", response.Message)
	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// ChangePassword Tests
// ========================

func TestChangePassword_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)
	userID := uuid.New()

	// Create a hashed password for "OldPass123!"
	oldPasswordHash, _ := bcrypt.GenerateFromPassword([]byte("OldPass123!"), bcrypt.DefaultCost)

	// Mock get current password
	rows := sqlmock.NewRows([]string{"password_hash"}).AddRow(string(oldPasswordHash))
	mock.ExpectQuery("SELECT password_hash FROM users WHERE id").
		WithArgs(userID).
		WillReturnRows(rows)

	// Mock update password
	mock.ExpectExec("UPDATE users").
		WithArgs(sqlmock.AnyArg(), userID). // AnyArg for the new hash
		WillReturnResult(sqlmock.NewResult(0, 1))

	router := gin.New()
	router.PUT("/profile/password", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.ChangePassword(c)
	})

	body := `{"current_password":"OldPass123!","new_password":"NewPass456!"}`
	req, _ := http.NewRequest("PUT", "/profile/password", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Password changed successfully", response.Message)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestChangePassword_Unauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)

	router := gin.New()
	router.PUT("/profile/password", handler.ChangePassword)

	body := `{"current_password":"OldPass123!","new_password":"NewPass456!"}`
	req, _ := http.NewRequest("PUT", "/profile/password", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Unauthorized - user not authenticated", response.Message)
}

func TestChangePassword_InvalidBody(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)
	userID := uuid.New()

	router := gin.New()
	router.PUT("/profile/password", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.ChangePassword(c)
	})

	// Missing new_password
	body := `{"current_password":"OldPass123!"}`
	req, _ := http.NewRequest("PUT", "/profile/password", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
}

func TestChangePassword_WeakPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)
	userID := uuid.New()

	router := gin.New()
	router.PUT("/profile/password", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.ChangePassword(c)
	})

	// Password missing uppercase, number, special char
	body := `{"current_password":"OldPass123!","new_password":"weakpassword"}`
	req, _ := http.NewRequest("PUT", "/profile/password", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Contains(t, response.Message, "Password must contain")
}

func TestChangePassword_IncorrectCurrentPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)
	userID := uuid.New()

	// Create a hashed password for "RealPass123!"
	realPasswordHash, _ := bcrypt.GenerateFromPassword([]byte("RealPass123!"), bcrypt.DefaultCost)

	// Mock get current password
	rows := sqlmock.NewRows([]string{"password_hash"}).AddRow(string(realPasswordHash))
	mock.ExpectQuery("SELECT password_hash FROM users WHERE id").
		WithArgs(userID).
		WillReturnRows(rows)

	router := gin.New()
	router.PUT("/profile/password", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.ChangePassword(c)
	})

	// Wrong current password
	body := `{"current_password":"WrongPass123!","new_password":"NewPass456!"}`
	req, _ := http.NewRequest("PUT", "/profile/password", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Current password is incorrect", response.Message)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestChangePassword_UserNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProfileHandler(db)
	userID := uuid.New()

	// Mock user not found
	mock.ExpectQuery("SELECT password_hash FROM users WHERE id").
		WithArgs(userID).
		WillReturnError(sql.ErrNoRows)

	router := gin.New()
	router.PUT("/profile/password", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.ChangePassword(c)
	})

	body := `{"current_password":"OldPass123!","new_password":"NewPass456!"}`
	req, _ := http.NewRequest("PUT", "/profile/password", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "User not found", response.Message)
	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// Password Strength Validation Tests
// ========================

func TestValidatePasswordStrength_StrongPassword(t *testing.T) {
	// Valid password with all requirements
	result := ValidatePasswordStrength("StrongPass123!")
	assert.Nil(t, result, "Strong password should pass validation")
}

func TestValidatePasswordStrength_TooShort(t *testing.T) {
	result := ValidatePasswordStrength("Sh0rt!")
	assert.NotNil(t, result)
	assert.False(t, result.MinLength)
	assert.True(t, result.HasUpper)
	assert.True(t, result.HasLower)
	assert.True(t, result.HasNumber)
	assert.True(t, result.HasSpecial)
}

func TestValidatePasswordStrength_NoUppercase(t *testing.T) {
	result := ValidatePasswordStrength("lowercase123!")
	assert.NotNil(t, result)
	assert.True(t, result.MinLength)
	assert.False(t, result.HasUpper)
	assert.True(t, result.HasLower)
	assert.True(t, result.HasNumber)
	assert.True(t, result.HasSpecial)
}

func TestValidatePasswordStrength_NoLowercase(t *testing.T) {
	result := ValidatePasswordStrength("UPPERCASE123!")
	assert.NotNil(t, result)
	assert.True(t, result.MinLength)
	assert.True(t, result.HasUpper)
	assert.False(t, result.HasLower)
	assert.True(t, result.HasNumber)
	assert.True(t, result.HasSpecial)
}

func TestValidatePasswordStrength_NoNumber(t *testing.T) {
	result := ValidatePasswordStrength("NoNumbers!")
	assert.NotNil(t, result)
	assert.True(t, result.MinLength)
	assert.True(t, result.HasUpper)
	assert.True(t, result.HasLower)
	assert.False(t, result.HasNumber)
	assert.True(t, result.HasSpecial)
}

func TestValidatePasswordStrength_NoSpecialChar(t *testing.T) {
	result := ValidatePasswordStrength("NoSpecial123")
	assert.NotNil(t, result)
	assert.True(t, result.MinLength)
	assert.True(t, result.HasUpper)
	assert.True(t, result.HasLower)
	assert.True(t, result.HasNumber)
	assert.False(t, result.HasSpecial)
}

func TestValidatePasswordStrength_AllFailing(t *testing.T) {
	result := ValidatePasswordStrength("weak")
	assert.NotNil(t, result)
	assert.False(t, result.MinLength)
	assert.False(t, result.HasUpper)
	assert.True(t, result.HasLower)
	assert.False(t, result.HasNumber)
	assert.False(t, result.HasSpecial)
}

func TestGetPasswordStrengthMessage_Valid(t *testing.T) {
	message := GetPasswordStrengthMessage(nil)
	assert.Equal(t, "", message)
}

func TestGetPasswordStrengthMessage_MissingMultiple(t *testing.T) {
	errors := &PasswordStrengthError{
		MinLength:  true,
		HasUpper:   false,
		HasLower:   true,
		HasNumber:  false,
		HasSpecial: true,
	}
	message := GetPasswordStrengthMessage(errors)
	assert.Contains(t, message, "Password must contain")
	assert.Contains(t, message, "one uppercase letter")
	assert.Contains(t, message, "one number")
}
