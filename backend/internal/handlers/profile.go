package handlers

import (
	"database/sql"
	"net/http"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
)

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
