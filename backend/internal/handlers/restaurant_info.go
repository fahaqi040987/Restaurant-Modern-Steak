package handlers

import (
	"database/sql"
	"net/http"
	"regexp"
	"strings"
	"time"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RestaurantInfoHandler handles admin operations for restaurant information
type RestaurantInfoHandler struct {
	db *sql.DB
}

// NewRestaurantInfoHandler creates a new restaurant info handler
func NewRestaurantInfoHandler(db *sql.DB) *RestaurantInfoHandler {
	return &RestaurantInfoHandler{db: db}
}

// UpdateRestaurantInfoRequest represents the request body for updating restaurant info
type UpdateRestaurantInfoRequest struct {
	Name          string   `json:"name" binding:"required"`
	Tagline       *string  `json:"tagline"`
	Description   *string  `json:"description"`
	Address       *string  `json:"address"`
	City          *string  `json:"city"`
	PostalCode    *string  `json:"postal_code"`
	Country       *string  `json:"country"`
	Phone         *string  `json:"phone"`
	Email         *string  `json:"email"`
	WhatsApp      *string  `json:"whatsapp"`
	MapLatitude   *float64 `json:"map_latitude"`
	MapLongitude  *float64 `json:"map_longitude"`
	GoogleMapsURL *string  `json:"google_maps_url"`
	InstagramURL  *string  `json:"instagram_url"`
	FacebookURL   *string  `json:"facebook_url"`
	TwitterURL    *string  `json:"twitter_url"`
	LogoURL       *string  `json:"logo_url"`
	HeroImageURL  *string  `json:"hero_image_url"`
}

// UpdateOperatingHoursRequest represents the request for updating operating hours
type UpdateOperatingHoursRequest struct {
	Hours []OperatingHourUpdate `json:"hours" binding:"required,dive"`
}

type OperatingHourUpdate struct {
	DayOfWeek int    `json:"day_of_week" binding:"min=0,max=6"`
	OpenTime  string `json:"open_time"`
	CloseTime string `json:"close_time"`
	IsClosed  bool   `json:"is_closed"`
}

// UpdateRestaurantInfo updates the restaurant information
// Endpoint: PUT /api/v1/admin/restaurant-info
func (h *RestaurantInfoHandler) UpdateRestaurantInfo(c *gin.Context) {
	var req UpdateRestaurantInfoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request format",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Validate required fields
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Restaurant name is required",
			Error:   stringPtr("name_required"),
		})
		return
	}

	// Validate email format if provided
	if req.Email != nil && *req.Email != "" {
		email := strings.TrimSpace(*req.Email)
		req.Email = &email
		if !isValidEmail(*req.Email) {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Invalid email format",
				Error:   stringPtr("invalid_email"),
			})
			return
		}
	}

	// Validate phone format if provided
	if req.Phone != nil && *req.Phone != "" {
		phone := strings.TrimSpace(*req.Phone)
		req.Phone = &phone
		if !isValidPhone(*req.Phone) {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Invalid phone format",
				Error:   stringPtr("invalid_phone"),
			})
			return
		}
	}

	// Get restaurant info ID (singleton table)
	var infoID uuid.UUID
	err := h.db.QueryRow("SELECT id FROM restaurant_info LIMIT 1").Scan(&infoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to retrieve restaurant info",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Update restaurant info
	updateQuery := `
		UPDATE restaurant_info SET
			name = $1, tagline = $2, description = $3, address = $4, city = $5,
			postal_code = $6, country = $7, phone = $8, email = $9, whatsapp = $10,
			map_latitude = $11, map_longitude = $12, google_maps_url = $13,
			instagram_url = $14, facebook_url = $15, twitter_url = $16,
			logo_url = $17, hero_image_url = $18, updated_at = NOW()
		WHERE id = $19
	`

	_, err = h.db.Exec(
		updateQuery,
		req.Name,
		req.Tagline,
		req.Description,
		req.Address,
		req.City,
		req.PostalCode,
		req.Country,
		req.Phone,
		req.Email,
		req.WhatsApp,
		req.MapLatitude,
		req.MapLongitude,
		req.GoogleMapsURL,
		req.InstagramURL,
		req.FacebookURL,
		req.TwitterURL,
		req.LogoURL,
		req.HeroImageURL,
		infoID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to update restaurant information",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Restaurant information updated successfully",
		Data: gin.H{
			"id": infoID,
		},
	})
}

// UpdateOperatingHours updates the restaurant operating hours
// Endpoint: PUT /api/v1/admin/operating-hours
func (h *RestaurantInfoHandler) UpdateOperatingHours(c *gin.Context) {
	var req UpdateOperatingHoursRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request format",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Validate hours count (must be 7 days)
	if len(req.Hours) != 7 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Operating hours must include all 7 days of the week",
			Error:   stringPtr("invalid_hours_count"),
		})
		return
	}

	// Validate time formats and business logic
	timePattern := regexp.MustCompile(`^([01]\d|2[0-3]):([0-5]\d)$`)
	for i, hour := range req.Hours {
		// Validate day_of_week range
		if hour.DayOfWeek < 0 || hour.DayOfWeek > 6 {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Invalid day_of_week (must be 0-6)",
				Error:   stringPtr("invalid_day_of_week"),
			})
			return
		}

		// Skip time validation if closed
		if hour.IsClosed {
			continue
		}

		// Validate required fields when not closed
		if strings.TrimSpace(hour.OpenTime) == "" {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Open time is required when not closed",
				Error:   stringPtr("open_time_required"),
			})
			return
		}

		if strings.TrimSpace(hour.CloseTime) == "" {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Close time is required when not closed",
				Error:   stringPtr("close_time_required"),
			})
			return
		}

		// Validate time format
		if !timePattern.MatchString(hour.OpenTime) {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Invalid open time format (use HH:MM)",
				Error:   stringPtr("invalid_open_time"),
			})
			return
		}

		if !timePattern.MatchString(hour.CloseTime) {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Invalid close time format (use HH:MM)",
				Error:   stringPtr("invalid_close_time"),
			})
			return
		}

		// T017: Validate that 00:00 is not used for non-closed days
		// 00:00 indicates a closed day and should only be allowed when is_closed is true
		if hour.OpenTime == "00:00" || hour.CloseTime == "00:00" {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "00:00 is not a valid time for an open day",
				Error:   stringPtr("invalid_zero_time"),
			})
			return
		}

		// Validate open < close (unless closed)
		if hour.OpenTime >= hour.CloseTime {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Opening time must be before closing time",
				Error:   stringPtr("invalid_time_range"),
			})
			return
		}

		// Store index for better error messages
		_ = i
	}

	// Get restaurant info ID
	var infoID uuid.UUID
	err := h.db.QueryRow("SELECT id FROM restaurant_info LIMIT 1").Scan(&infoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to retrieve restaurant info",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Update each day's operating hours
	updateQuery := `
		UPDATE operating_hours SET
			open_time = $1, close_time = $2, is_closed = $3, updated_at = NOW()
		WHERE restaurant_info_id = $4 AND day_of_week = $5
	`

	for _, hour := range req.Hours {
		// Normalize time format (handle both HH:MM and ISO datetime)
		openTime := normalizeTimeString(hour.OpenTime)
		closeTime := normalizeTimeString(hour.CloseTime)

		// For closed days, use default times (won't be shown in UI anyway)
		if hour.IsClosed {
			openTime = "00:00"
			closeTime = "00:00"
		}

		_, err := h.db.Exec(
			updateQuery,
			openTime,
			closeTime,
			hour.IsClosed,
			infoID,
			hour.DayOfWeek,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to update operating hours",
				Error:   stringPtr(err.Error()),
			})
			return
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Operating hours updated successfully",
		Data: gin.H{
			"updated_count": len(req.Hours),
		},
	})
}

// Helper function to validate phone format (Indonesian format)
func isValidPhone(phone string) bool {
	// Accept formats: +62xxx, 08xxx, 62xxx, or any standard phone format
	phoneRegex := regexp.MustCompile(`^(\+62|62|0)[0-9]{8,13}$`)
	return phoneRegex.MatchString(strings.ReplaceAll(phone, "-", ""))
}

// normalizeTimeString converts various time formats to HH:MM
// Handles: HH:MM, ISO datetime (0000-01-01T10:00:00Z), etc.
func normalizeTimeString(timeStr string) string {
	timeStr = strings.TrimSpace(timeStr)

	// If already in HH:MM format, return as-is
	if matched, _ := regexp.MatchString(`^([01]\d|2[0-3]):([0-5]\d)$`, timeStr); matched {
		return timeStr
	}

	// Try parsing as ISO datetime and extract time
	formats := []string{
		time.RFC3339,          // 0000-01-01T10:00:00Z
		"2006-01-02T15:04:05", // Without timezone
		"15:04:05",            // HH:MM:SS
	}

	for _, format := range formats {
		if t, err := time.Parse(format, timeStr); err == nil {
			return t.Format("15:04") // Return as HH:MM
		}
	}

	// If parsing fails, return original (will fail validation)
	return timeStr
}
