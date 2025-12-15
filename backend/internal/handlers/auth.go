package handlers

import (
	"database/sql"
	"net/http"

	"pos-public/internal/middleware"
	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db *sql.DB
}

func NewAuthHandler(db *sql.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

// Login handles user authentication
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Validate input
	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Username and password are required",
			Error:   stringPtr("missing_credentials"),
		})
		return
	}

	// Get user from database
	var user models.User
	query := `
		SELECT id, username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at 
		FROM users 
		WHERE username = $1 AND is_active = true
	`

	err := h.db.QueryRow(query, req.Username).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash,
		&user.FirstName, &user.LastName, &user.Role, &user.IsActive,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Invalid username or password",
			Error:   stringPtr("invalid_credentials"),
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Database error",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Invalid username or password",
			Error:   stringPtr("invalid_credentials"),
		})
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to generate token",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Return successful login response
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Login successful",
		Data: models.LoginResponse{
			Token: token,
			User:  user,
		},
	})
}

// GetCurrentUser returns the current authenticated user
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Authentication required",
			Error:   stringPtr("auth_required"),
		})
		return
	}

	// Get user from database
	var user models.User
	query := `
		SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at 
		FROM users 
		WHERE id = $1
	`

	err := h.db.QueryRow(query, userID).Scan(
		&user.ID, &user.Username, &user.Email,
		&user.FirstName, &user.LastName, &user.Role, &user.IsActive,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "User not found",
			Error:   stringPtr("user_not_found"),
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Database error",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "User retrieved successfully",
		Data:    user,
	})
}

// Logout handles user logout (in a stateless JWT system, this is mainly client-side)
func (h *AuthHandler) Logout(c *gin.Context) {
	// In a stateless JWT system, logout is handled client-side by removing the token
	// For additional security, you could implement a token blacklist here
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Logout successful",
	})
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}

// GetUserProfile returns the current user's profile
func (h *AuthHandler) GetUserProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}

	var user models.User
	query := `
		SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at 
		FROM users 
		WHERE id = $1
	`
	err := h.db.QueryRow(query, userID).Scan(
		&user.ID, &user.Username, &user.Email,
		&user.FirstName, &user.LastName, &user.Role,
		&user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to retrieve user profile",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Profile retrieved successfully",
		Data:    user,
	})
}

// UpdateUserProfile updates the current user's profile
func (h *AuthHandler) UpdateUserProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}

	var req struct {
		FirstName string `json:"first_name" binding:"required"`
		LastName  string `json:"last_name" binding:"required"`
		Email     string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	_, err := h.db.Exec(`
		UPDATE users
		SET first_name = $1, last_name = $2, email = $3, updated_at = NOW()
		WHERE id = $4
	`, req.FirstName, req.LastName, req.Email, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to update profile",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Profile updated successfully",
	})
}

// ChangePassword changes the current user's password
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Unauthorized",
		})
		return
	}

	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Get current password hash
	var currentHash string
	err := h.db.QueryRow("SELECT password_hash FROM users WHERE id = $1", userID).Scan(&currentHash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to retrieve user",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Current password is incorrect",
		})
		return
	}

	// Hash new password
	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to hash password",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Update password
	_, err = h.db.Exec(`
		UPDATE users
		SET password_hash = $1, updated_at = NOW()
		WHERE id = $2
	`, string(newHash), userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to update password",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Password changed successfully",
	})
}
