package handlers

import (
	"database/sql"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PublicHandler handles public API endpoints (no authentication required)
type PublicHandler struct {
	db *sql.DB
}

// NewPublicHandler creates a new PublicHandler with database dependency
func NewPublicHandler(db *sql.DB) *PublicHandler {
	return &PublicHandler{db: db}
}

// GetPublicMenu returns active products with categories for the public menu
// Endpoint: GET /api/v1/public/menu
// Query params: category_id (optional), search (optional)
func (h *PublicHandler) GetPublicMenu(c *gin.Context) {
	categoryID := c.Query("category_id")
	search := c.Query("search")

	// Build query with filters
	query := `
		SELECT p.id, p.name, p.description, p.price, p.image_url, p.category_id, c.name as category_name
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.is_available = true
	`

	var args []interface{}
	argIndex := 0

	// Add category filter if provided
	if categoryID != "" {
		if _, err := uuid.Parse(categoryID); err == nil {
			argIndex++
			query += " AND p.category_id = $" + strconv.Itoa(argIndex)
			args = append(args, categoryID)
		}
	}

	// Add search filter if provided
	if search != "" {
		argIndex++
		query += " AND (p.name ILIKE $" + strconv.Itoa(argIndex) + " OR p.description ILIKE $" + strconv.Itoa(argIndex) + ")"
		args = append(args, "%"+search+"%")
	}

	// Add ordering
	query += " ORDER BY p.sort_order ASC, p.name ASC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch menu items",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	var menuItems []models.PublicMenuItem
	for rows.Next() {
		var item models.PublicMenuItem
		var description, imageURL sql.NullString
		var categoryID sql.NullString
		var categoryName sql.NullString

		err := rows.Scan(
			&item.ID,
			&item.Name,
			&description,
			&item.Price,
			&imageURL,
			&categoryID,
			&categoryName,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan menu item",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		if description.Valid {
			item.Description = &description.String
		}
		if imageURL.Valid {
			item.ImageURL = &imageURL.String
		}
		if categoryID.Valid {
			parsedID, _ := uuid.Parse(categoryID.String)
			item.CategoryID = parsedID
		}
		if categoryName.Valid {
			item.CategoryName = categoryName.String
		}

		menuItems = append(menuItems, item)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Menu retrieved successfully",
		Data:    menuItems,
	})
}

// GetPublicCategories returns active categories for the public menu
// Endpoint: GET /api/v1/public/categories
func (h *PublicHandler) GetPublicCategories(c *gin.Context) {
	query := `
		SELECT id, name, description, color, sort_order
		FROM categories
		WHERE is_active = true
		ORDER BY sort_order ASC, name ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch categories",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	type PublicCategory struct {
		ID          uuid.UUID `json:"id"`
		Name        string    `json:"name"`
		Description *string   `json:"description"`
		Color       *string   `json:"color"`
		SortOrder   int       `json:"sort_order"`
	}

	var categories []PublicCategory
	for rows.Next() {
		var category PublicCategory
		var description, color sql.NullString

		err := rows.Scan(
			&category.ID,
			&category.Name,
			&description,
			&color,
			&category.SortOrder,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan category",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		if description.Valid {
			category.Description = &description.String
		}
		if color.Valid {
			category.Color = &color.String
		}

		categories = append(categories, category)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Categories retrieved successfully",
		Data:    categories,
	})
}

// GetRestaurantInfo returns restaurant configuration including operating hours
// Endpoint: GET /api/v1/public/restaurant
func (h *PublicHandler) GetRestaurantInfo(c *gin.Context) {
	// Query restaurant info (singleton row)
	infoQuery := `
		SELECT id, name, tagline, description, address, city, postal_code, country,
		       phone, email, whatsapp, map_latitude, map_longitude, google_maps_url,
		       instagram_url, facebook_url, twitter_url, logo_url, hero_image_url
		FROM restaurant_info
		LIMIT 1
	`

	var info models.RestaurantInfo
	var tagline, description, city, postalCode, country sql.NullString
	var whatsapp, googleMapsURL, instagramURL, facebookURL, twitterURL sql.NullString
	var logoURL, heroImageURL sql.NullString
	var mapLatitude, mapLongitude sql.NullFloat64

	err := h.db.QueryRow(infoQuery).Scan(
		&info.ID,
		&info.Name,
		&tagline,
		&description,
		&info.Address,
		&city,
		&postalCode,
		&country,
		&info.Phone,
		&info.Email,
		&whatsapp,
		&mapLatitude,
		&mapLongitude,
		&googleMapsURL,
		&instagramURL,
		&facebookURL,
		&twitterURL,
		&logoURL,
		&heroImageURL,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Restaurant information not found",
			Error:   stringPtr("restaurant_info_not_found"),
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch restaurant information",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Set nullable fields
	if tagline.Valid {
		info.Tagline = &tagline.String
	}
	if description.Valid {
		info.Description = &description.String
	}
	if city.Valid {
		info.City = &city.String
	}
	if postalCode.Valid {
		info.PostalCode = &postalCode.String
	}
	if country.Valid {
		info.Country = &country.String
	}
	if whatsapp.Valid {
		info.WhatsApp = &whatsapp.String
	}
	if mapLatitude.Valid {
		info.MapLatitude = &mapLatitude.Float64
	}
	if mapLongitude.Valid {
		info.MapLongitude = &mapLongitude.Float64
	}
	if googleMapsURL.Valid {
		info.GoogleMapsURL = &googleMapsURL.String
	}
	if instagramURL.Valid {
		info.InstagramURL = &instagramURL.String
	}
	if facebookURL.Valid {
		info.FacebookURL = &facebookURL.String
	}
	if twitterURL.Valid {
		info.TwitterURL = &twitterURL.String
	}
	if logoURL.Valid {
		info.LogoURL = &logoURL.String
	}
	if heroImageURL.Valid {
		info.HeroImageURL = &heroImageURL.String
	}

	// Query operating hours
	hoursQuery := `
		SELECT id, restaurant_info_id, day_of_week, open_time, close_time, is_closed
		FROM operating_hours
		WHERE restaurant_info_id = $1
		ORDER BY day_of_week ASC
	`

	rows, err := h.db.Query(hoursQuery, info.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch operating hours",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	var operatingHours []models.OperatingHours
	for rows.Next() {
		var oh models.OperatingHours
		var openTime, closeTime time.Time
		err := rows.Scan(
			&oh.ID,
			&oh.RestaurantInfoID,
			&oh.DayOfWeek,
			&openTime,
			&closeTime,
			&oh.IsClosed,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan operating hours",
				Error:   stringPtr(err.Error()),
			})
			return
		}
		
		// Format time to HH:MM:SS
		oh.OpenTime = openTime.Format("15:04:05")
		oh.CloseTime = closeTime.Format("15:04:05")
		operatingHours = append(operatingHours, oh)
	}

	// Calculate is_open_now based on current server time
	isOpenNow := models.CalculateIsOpenNow(operatingHours, time.Now())

	// Build response DTO
	response := models.RestaurantInfoResponse{
		ID:             info.ID,
		Name:           info.Name,
		Tagline:        info.Tagline,
		Description:    info.Description,
		Address:        info.Address,
		City:           info.City,
		PostalCode:     info.PostalCode,
		Country:        info.Country,
		Phone:          info.Phone,
		Email:          info.Email,
		WhatsApp:       info.WhatsApp,
		MapLatitude:    info.MapLatitude,
		MapLongitude:   info.MapLongitude,
		GoogleMapsURL:  info.GoogleMapsURL,
		InstagramURL:   info.InstagramURL,
		FacebookURL:    info.FacebookURL,
		TwitterURL:     info.TwitterURL,
		LogoURL:        info.LogoURL,
		HeroImageURL:   info.HeroImageURL,
		IsOpenNow:      isOpenNow,
		OperatingHours: operatingHours,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Restaurant information retrieved successfully",
		Data:    response,
	})
}

// SubmitContactForm handles contact form submissions from the public website
// Endpoint: POST /api/v1/public/contact
func (h *PublicHandler) SubmitContactForm(c *gin.Context) {
	var req models.ContactFormRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Validate required fields
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)
	req.Subject = strings.TrimSpace(req.Subject)
	req.Message = strings.TrimSpace(req.Message)

	if req.Name == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Name is required",
			Error:   stringPtr("name_required"),
		})
		return
	}

	if req.Email == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Email is required",
			Error:   stringPtr("email_required"),
		})
		return
	}

	// Validate email format
	if !isValidEmail(req.Email) {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid email format",
			Error:   stringPtr("invalid_email"),
		})
		return
	}

	if req.Subject == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Subject is required",
			Error:   stringPtr("subject_required"),
		})
		return
	}

	if req.Message == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Message is required",
			Error:   stringPtr("message_required"),
		})
		return
	}

	// Store submission in database
	query := `
		INSERT INTO contact_submissions (name, email, phone, subject, message)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`

	var submissionID string
	err := h.db.QueryRow(query, req.Name, req.Email, req.Phone, req.Subject, req.Message).Scan(&submissionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to submit contact form",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Thank you for your message. We will get back to you soon.",
		Data:    map[string]string{"id": submissionID},
	})
}

// isValidEmail validates email format using a simple regex pattern
func isValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}
