package handlers

import (
	"database/sql"
	"net/http"
	"regexp"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// PasswordStrengthError represents validation errors for password requirements
type PasswordStrengthError struct {
	MinLength  bool `json:"min_length"`  // At least 8 characters
	HasUpper   bool `json:"has_upper"`   // At least one uppercase letter
	HasLower   bool `json:"has_lower"`   // At least one lowercase letter
	HasNumber  bool `json:"has_number"`  // At least one number
	HasSpecial bool `json:"has_special"` // At least one special character
}

// ValidatePasswordStrength checks if a password meets all strength requirements
// Returns nil if valid, or a PasswordStrengthError with failed checks
func ValidatePasswordStrength(password string) *PasswordStrengthError {
	errors := &PasswordStrengthError{
		MinLength:  len(password) >= 8,
		HasUpper:   regexp.MustCompile(`[A-Z]`).MatchString(password),
		HasLower:   regexp.MustCompile(`[a-z]`).MatchString(password),
		HasNumber:  regexp.MustCompile(`[0-9]`).MatchString(password),
		HasSpecial: regexp.MustCompile(`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]`).MatchString(password),
	}

	// Check if all requirements are met
	if errors.MinLength && errors.HasUpper && errors.HasLower && errors.HasNumber && errors.HasSpecial {
		return nil
	}

	return errors
}

// GetPasswordStrengthMessage returns a human-readable message for password requirements
func GetPasswordStrengthMessage(errors *PasswordStrengthError) string {
	if errors == nil {
		return ""
	}

	var missing []string
	if !errors.MinLength {
		missing = append(missing, "at least 8 characters")
	}
	if !errors.HasUpper {
		missing = append(missing, "one uppercase letter")
	}
	if !errors.HasLower {
		missing = append(missing, "one lowercase letter")
	}
	if !errors.HasNumber {
		missing = append(missing, "one number")
	}
	if !errors.HasSpecial {
		missing = append(missing, "one special character (!@#$%^&*()_+-=[]{}|;':\",./<>?~)")
	}

	if len(missing) == 0 {
		return ""
	}

	return "Password must contain: " + joinStrings(missing, ", ")
}

// joinStrings joins a slice of strings with a separator
func joinStrings(strs []string, sep string) string {
	if len(strs) == 0 {
		return ""
	}
	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += sep + strs[i]
	}
	return result
}

type ProfileHandler struct {
	db *sql.DB
}

func NewProfileHandler(db *sql.DB) *ProfileHandler {
	return &ProfileHandler{db: db}
}

// GetProfile returns the current user's profile information
// GET /api/v1/profile
func (h *ProfileHandler) GetProfile(c *gin.Context) {
	// Get user ID from JWT middleware context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Unauthorized - user not authenticated",
		})
		return
	}

	// Query user from database
	var user models.User
	query := `
		SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at 
		FROM users 
		WHERE id = $1
	`

	err := h.db.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "User profile not found",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to retrieve user profile",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Return profile data
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Profile retrieved successfully",
		Data:    user,
	})
}

// UpdateProfile updates the current user's profile information
// PUT /api/v1/profile
func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	// Get user ID from JWT middleware context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Unauthorized - user not authenticated",
		})
		return
	}

	// Parse request body
	var req struct {
		FirstName string `json:"first_name" binding:"required"`
		LastName  string `json:"last_name" binding:"required"`
		Email     string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body - please check first_name, last_name, and email fields",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Check if email is already taken by another user
	var existingUserID string
	emailCheckQuery := `SELECT id FROM users WHERE email = $1 AND id != $2`
	err := h.db.QueryRow(emailCheckQuery, req.Email, userID).Scan(&existingUserID)
	if err == nil {
		// Email exists for another user
		c.JSON(http.StatusConflict, models.APIResponse{
			Success: false,
			Message: "Email address already in use by another account",
		})
		return
	} else if err != sql.ErrNoRows {
		// Database error
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to validate email",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Update user profile
	updateQuery := `
		UPDATE users
		SET first_name = $1, last_name = $2, email = $3, updated_at = NOW()
		WHERE id = $4
	`

	result, err := h.db.Exec(updateQuery, req.FirstName, req.LastName, req.Email, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to update profile",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Check if user was found and updated
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to verify update",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "User profile not found",
		})
		return
	}

	// Fetch and return updated profile
	var updatedUser models.User
	query := `
		SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at 
		FROM users 
		WHERE id = $1
	`

	err = h.db.QueryRow(query, userID).Scan(
		&updatedUser.ID,
		&updatedUser.Username,
		&updatedUser.Email,
		&updatedUser.FirstName,
		&updatedUser.LastName,
		&updatedUser.Role,
		&updatedUser.IsActive,
		&updatedUser.CreatedAt,
		&updatedUser.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Profile updated but failed to retrieve updated data",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Profile updated successfully",
		Data:    updatedUser,
	})
}

// ChangePassword changes the current user's password
// PUT /api/v1/profile/password
func (h *ProfileHandler) ChangePassword(c *gin.Context) {
	// Get user ID from JWT middleware context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Unauthorized - user not authenticated",
		})
		return
	}

	// Parse request body
	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body - current_password and new_password are required (min 8 chars)",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Validate password strength (min 8 chars, uppercase, lowercase, number, special char)
	if strengthErrors := ValidatePasswordStrength(req.NewPassword); strengthErrors != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: GetPasswordStrengthMessage(strengthErrors),
			Data: map[string]any{
				"password_requirements": strengthErrors,
			},
		})
		return
	}

	// Get current password hash from database
	var currentHash string
	err := h.db.QueryRow("SELECT password_hash FROM users WHERE id = $1", userID).Scan(&currentHash)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to retrieve user data",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Verify current password matches
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
			Message: "Failed to hash new password",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Update password in database
	result, err := h.db.Exec(`
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

	// Verify update was successful
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to verify password update",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Password changed successfully",
	})
}
