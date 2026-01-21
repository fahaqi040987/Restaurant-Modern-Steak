package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// T102: Input length validation constants
const (
	maxCustomerNameLength        = 100
	maxSpecialInstructionsLength = 500
	maxSurveyCommentsLength      = 1000
	maxNotesLength               = 500
	maxContactNameLength         = 100
	maxContactSubjectLength      = 200
	maxContactMessageLength      = 2000
)

// T101: Rate limiting configuration
type rateLimiter struct {
	requests map[string][]time.Time
	mu       sync.RWMutex
}

var customerRateLimiter = &rateLimiter{
	requests: make(map[string][]time.Time),
}

// T101: Rate limit configuration per endpoint type
const (
	qrScanRateLimit       = 10 // per minute
	orderCreationLimit    = 5  // per minute
	surveySubmissionLimit = 3  // per order per minute
)

// checkRateLimit checks if the client has exceeded the rate limit
func (rl *rateLimiter) checkRateLimit(clientKey string, limit int, window time.Duration) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-window)

	// Clean old entries
	var validRequests []time.Time
	for _, t := range rl.requests[clientKey] {
		if t.After(windowStart) {
			validRequests = append(validRequests, t)
		}
	}
	rl.requests[clientKey] = validRequests

	// Check limit
	if len(validRequests) >= limit {
		return false // Rate limit exceeded
	}

	// Add new request
	rl.requests[clientKey] = append(rl.requests[clientKey], now)
	return true
}

// T099: CSRF token generation and validation
var csrfTokens = struct {
	tokens map[string]time.Time
	mu     sync.RWMutex
}{
	tokens: make(map[string]time.Time),
}

// generateCSRFToken creates a new CSRF token
func generateCSRFToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	token := hex.EncodeToString(bytes)

	csrfTokens.mu.Lock()
	csrfTokens.tokens[token] = time.Now().Add(30 * time.Minute) // Token valid for 30 minutes
	csrfTokens.mu.Unlock()

	return token
}

// validateCSRFToken validates and consumes a CSRF token
func validateCSRFToken(token string) bool {
	csrfTokens.mu.Lock()
	defer csrfTokens.mu.Unlock()

	expiry, exists := csrfTokens.tokens[token]
	if !exists {
		return false
	}

	// Token expired
	if time.Now().After(expiry) {
		delete(csrfTokens.tokens, token)
		return false
	}

	// Consume the token (one-time use)
	delete(csrfTokens.tokens, token)
	return true
}

// cleanExpiredCSRFTokens removes expired tokens periodically
func init() {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			csrfTokens.mu.Lock()
			now := time.Now()
			for token, expiry := range csrfTokens.tokens {
				if now.After(expiry) {
					delete(csrfTokens.tokens, token)
				}
			}
			csrfTokens.mu.Unlock()
		}
	}()
}

// PublicHandler handles public API endpoints (no authentication required)
type PublicHandler struct {
	db *sql.DB
}

// NewPublicHandler creates a new PublicHandler with database dependency
func NewPublicHandler(db *sql.DB) *PublicHandler {
	return &PublicHandler{db: db}
}

// GetOpenStatusDebug returns detailed debug information about restaurant open status
// Endpoint: GET /api/v1/public/health/open-status
// This is a debug endpoint to help diagnose timezone and opening hours issues
func (h *PublicHandler) GetOpenStatusDebug(c *gin.Context) {
	// Query restaurant info (singleton row)
	infoQuery := `
		SELECT id, name, timezone
		FROM restaurant_info
		LIMIT 1
	`

	var info struct {
		ID       uuid.UUID `json:"id"`
		Name     string    `json:"name"`
		Timezone string    `json:"timezone"`
	}

	err := h.db.QueryRow(infoQuery).Scan(&info.ID, &info.Name, &info.Timezone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch restaurant information",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// If timezone is empty, set default
	if info.Timezone == "" {
		info.Timezone = "Asia/Jakarta"
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
		var openTimeStr, closeTimeStr string

		err := rows.Scan(
			&oh.ID,
			&oh.RestaurantInfoID,
			&oh.DayOfWeek,
			&openTimeStr,
			&closeTimeStr,
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

		// Parse the time from database format
		if len(openTimeStr) > 8 {
			if idx := strings.Index(openTimeStr, "T"); idx != -1 {
				timePart := openTimeStr[idx+1:]
				if idx2 := strings.Index(timePart, "Z"); idx2 != -1 {
					openTimeStr = timePart[:idx2]
				} else if idx2 := strings.Index(timePart, "+"); idx2 != -1 {
					openTimeStr = timePart[:idx2]
				}
			}
		}

		if len(closeTimeStr) > 8 {
			if idx := strings.Index(closeTimeStr, "T"); idx != -1 {
				timePart := closeTimeStr[idx+1:]
				if idx2 := strings.Index(timePart, "Z"); idx2 != -1 {
					closeTimeStr = timePart[:idx2]
				} else if idx2 := strings.Index(timePart, "+"); idx2 != -1 {
					closeTimeStr = timePart[:idx2]
				}
			}
		}

		oh.OpenTime = openTimeStr
		oh.CloseTime = closeTimeStr

		operatingHours = append(operatingHours, oh)
	}

	// Get current times
	utcTime := time.Now().UTC()
	timezoneLocation, err := time.LoadLocation(info.Timezone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Invalid timezone configuration",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	currentTimeInTimezone := time.Now().In(timezoneLocation)

	// Calculate if restaurant is open now
	isOpenNow := models.CalculateIsOpenNow(operatingHours, currentTimeInTimezone)

	// Build detailed debug response
	type OperatingHourDebug struct {
		DayOfWeek int    `json:"day_of_week"`
		DayName   string `json:"day_name"`
		OpenTime  string `json:"open_time"`
		CloseTime string `json:"close_time"`
		IsClosed  bool   `json:"is_closed"`
	}

	var debugHours []OperatingHourDebug
	for _, oh := range operatingHours {
		debugHours = append(debugHours, OperatingHourDebug{
			DayOfWeek: oh.DayOfWeek,
			DayName:   models.GetDayName(oh.DayOfWeek),
			OpenTime:  oh.OpenTime,
			CloseTime: oh.CloseTime,
			IsClosed:  oh.IsClosed,
		})
	}

	type TodayHoursDebug struct {
		DayOfWeek   int    `json:"day_of_week"`
		DayName     string `json:"day_name"`
		OpenTime    string `json:"open_time"`
		CloseTime   string `json:"close_time"`
		IsClosed    bool   `json:"is_closed"`
		CurrentHour int    `json:"current_hour"`
		CurrentMin  int    `json:"current_min"`
		CurrentSec  int    `json:"current_sec"`
		OpenHour    int    `json:"open_hour"`
		CloseHour   int    `json:"close_hour"`
		IsOpen      bool   `json:"is_open"`
		Reason      string `json:"reason"`
	}

	todayHours := TodayHoursDebug{}
	currentDayOfWeek := int(currentTimeInTimezone.Weekday())
	for _, oh := range operatingHours {
		if oh.DayOfWeek == currentDayOfWeek {
			// Parse times
			openTime, _ := time.Parse("15:04:05", oh.OpenTime)
			closeTime, _ := time.Parse("15:04:05", oh.CloseTime)

			todayHours = TodayHoursDebug{
				DayOfWeek:   oh.DayOfWeek,
				DayName:     models.GetDayName(oh.DayOfWeek),
				OpenTime:    oh.OpenTime,
				CloseTime:   oh.CloseTime,
				IsClosed:    oh.IsClosed,
				CurrentHour: currentTimeInTimezone.Hour(),
				CurrentMin:  currentTimeInTimezone.Minute(),
				CurrentSec:  currentTimeInTimezone.Second(),
				OpenHour:    openTime.Hour(),
				CloseHour:   closeTime.Hour(),
			}

			if oh.IsClosed {
				todayHours.IsOpen = false
				todayHours.Reason = "Restaurant is closed on this day"
			} else {
				checkSeconds := currentTimeInTimezone.Hour()*3600 + currentTimeInTimezone.Minute()*60 + currentTimeInTimezone.Second()
				openSeconds := openTime.Hour()*3600 + openTime.Minute()*60 + openTime.Second()
				closeSeconds := closeTime.Hour()*3600 + closeTime.Minute()*60 + closeTime.Second()

				todayHours.IsOpen = checkSeconds >= openSeconds && checkSeconds < closeSeconds
				if checkSeconds < openSeconds {
					todayHours.Reason = fmt.Sprintf("Too early (current: %02d:%02d:%02d, opens: %s)",
						currentTimeInTimezone.Hour(), currentTimeInTimezone.Minute(), currentTimeInTimezone.Second(), oh.OpenTime)
				} else if checkSeconds >= closeSeconds {
					todayHours.Reason = fmt.Sprintf("Too late (current: %02d:%02d:%02d, closes: %s)",
						currentTimeInTimezone.Hour(), currentTimeInTimezone.Minute(), currentTimeInTimezone.Second(), oh.CloseTime)
				} else {
					todayHours.Reason = fmt.Sprintf("Within business hours (current: %02d:%02d:%02d, open: %s, close: %s)",
						currentTimeInTimezone.Hour(), currentTimeInTimezone.Minute(), currentTimeInTimezone.Second(), oh.OpenTime, oh.CloseTime)
				}
			}
			break
		}
	}

	debugResponse := gin.H{
		"restaurant_timezone":      info.Timezone,
		"current_utc_time":         utcTime.Format("2006-01-02 15:04:05 MST"),
		"current_timezone_time":    currentTimeInTimezone.Format("2006-01-02 15:04:05 MST"),
		"current_weekday":          int(currentTimeInTimezone.Weekday()),
		"current_weekday_name":     models.GetDayName(int(currentTimeInTimezone.Weekday())),
		"is_open_now":              isOpenNow,
		"operating_hours":          debugHours,
		"today_schedule":           todayHours,
		"server_timezone":          time.Now().Format("MST"),
		"server_location":          timezoneLocation.String(),
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Open status debug information",
		Data:    debugResponse,
	})
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
		       instagram_url, facebook_url, twitter_url, logo_url, hero_image_url, timezone
		FROM restaurant_info
		LIMIT 1
	`

	var info models.RestaurantInfo
	var tagline, description, city, postalCode, country sql.NullString
	var whatsapp, googleMapsURL, instagramURL, facebookURL, twitterURL sql.NullString
	var logoURL, heroImageURL sql.NullString
	var mapLatitude, mapLongitude sql.NullFloat64
	var timezone sql.NullString

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
		&timezone,
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
	if timezone.Valid {
		info.Timezone = timezone.String
	} else {
		info.Timezone = "Asia/Jakarta"
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
		var openTimeStr, closeTimeStr string

		err := rows.Scan(
			&oh.ID,
			&oh.RestaurantInfoID,
			&oh.DayOfWeek,
			&openTimeStr,
			&closeTimeStr,
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

		// Parse the time from database format (ISO or HH:MM:SS)
		// PostgreSQL TIME type returns as "HH:MM:SS" or "0000-01-01THH:MM:SSZ"
		if len(openTimeStr) > 8 {
			// ISO format: extract just the time portion "HH:MM:SS"
			// Format: 0000-01-01T03:00:00Z -> extract 03:00:00
			if idx := strings.Index(openTimeStr, "T"); idx != -1 {
				timePart := openTimeStr[idx+1:]
				if idx2 := strings.Index(timePart, "Z"); idx2 != -1 {
					openTimeStr = timePart[:idx2]
				} else if idx2 := strings.Index(timePart, "+"); idx2 != -1 {
					openTimeStr = timePart[:idx2]
				}
			}
		}

		if len(closeTimeStr) > 8 {
			// ISO format: extract just the time portion "HH:MM:SS"
			if idx := strings.Index(closeTimeStr, "T"); idx != -1 {
				timePart := closeTimeStr[idx+1:]
				if idx2 := strings.Index(timePart, "Z"); idx2 != -1 {
					closeTimeStr = timePart[:idx2]
				} else if idx2 := strings.Index(timePart, "+"); idx2 != -1 {
					closeTimeStr = timePart[:idx2]
				}
			}
		}

		oh.OpenTime = openTimeStr
		oh.CloseTime = closeTimeStr

		operatingHours = append(operatingHours, oh)
	}

	// Calculate is_open_now based on restaurant's timezone
	// Load the restaurant's timezone location
	log.Printf("OPEN_STATUS_DEBUG: Restaurant timezone from DB: '%s'", info.Timezone)
	timezoneLocation, err := time.LoadLocation(info.Timezone)
	if err != nil {
		// Fallback to UTC if timezone is invalid
		log.Printf("WARNING: Invalid timezone '%s' for restaurant, falling back to UTC: %v", info.Timezone, err)
		timezoneLocation = time.UTC
	}

	// Get current time in restaurant's timezone
	currentTimeInTimezone := time.Now().In(timezoneLocation)
	utcTime := time.Now().UTC()
	log.Printf("OPEN_STATUS_DEBUG: Current UTC time: %s", utcTime.Format("2006-01-02 15:04:05 MST"))
	log.Printf("OPEN_STATUS_DEBUG: Current time in restaurant timezone (%s): %s", info.Timezone, currentTimeInTimezone.Format("2006-01-02 15:04:05 MST"))
	log.Printf("OPEN_STATUS_DEBUG: Weekday: %d (%s), Hour: %d, Minute: %d, Second: %d",
		currentTimeInTimezone.Weekday(),
		models.GetDayName(int(currentTimeInTimezone.Weekday())),
		currentTimeInTimezone.Hour(),
		currentTimeInTimezone.Minute(),
		currentTimeInTimezone.Second())

	// Log all operating hours for debugging
	for i, oh := range operatingHours {
		log.Printf("OPEN_STATUS_DEBUG: Operating hour[%d]: day=%d (%s), open=%s, close=%s, is_closed=%v",
			i, oh.DayOfWeek, models.GetDayName(oh.DayOfWeek), oh.OpenTime, oh.CloseTime, oh.IsClosed)
	}

	// Calculate if restaurant is open now
	isOpenNow := models.CalculateIsOpenNow(operatingHours, currentTimeInTimezone)
	log.Printf("OPEN_STATUS_DEBUG: FINAL RESULT: is_open_now = %v", isOpenNow)

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
		Timezone:       info.Timezone,
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

// GetCSRFToken generates a CSRF token for customer order creation
// T099: Endpoint: GET /api/v1/customer/csrf-token
func (h *PublicHandler) GetCSRFToken(c *gin.Context) {
	token := generateCSRFToken()
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "CSRF token generated",
		Data: map[string]string{
			"csrf_token": token,
		},
	})
}

// GetTableByQRCode returns table info by QR code for customer self-ordering
// Endpoint: GET /api/v1/customer/table/:qr_code
func (h *PublicHandler) GetTableByQRCode(c *gin.Context) {
	// T101: Rate limiting for QR scans
	clientIP := c.ClientIP()
	if !customerRateLimiter.checkRateLimit("qr:"+clientIP, qrScanRateLimit, time.Minute) {
		log.Printf("RATE_LIMIT: QR scan limit exceeded for IP %s", clientIP)
		c.JSON(http.StatusTooManyRequests, models.APIResponse{
			Success: false,
			Message: "Too many requests. Please wait a moment before scanning again.",
			Error:   stringPtr("rate_limit_exceeded"),
		})
		return
	}

	qrCode := c.Param("qr_code")
	if qrCode == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "QR code is required",
			Error:   stringPtr("qr_code_required"),
		})
		return
	}

	query := `
		SELECT id, table_number, seating_capacity, location, qr_code
		FROM dining_tables
		WHERE qr_code = $1
	`

	var tableID, tableNumber string
	var seatingCapacity int
	var location, storedQRCode sql.NullString

	err := h.db.QueryRow(query, qrCode).Scan(&tableID, &tableNumber, &seatingCapacity, &location, &storedQRCode)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Table not found. Please scan a valid QR code.",
			Error:   stringPtr("table_not_found"),
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch table information",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	tableInfo := map[string]interface{}{
		"id":               tableID,
		"table_number":     tableNumber,
		"seating_capacity": seatingCapacity,
	}
	if location.Valid {
		tableInfo["location"] = location.String
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Table found",
		Data:    tableInfo,
	})
}

// CreateCustomerOrder creates an order from customer self-ordering (no auth required)
// Endpoint: POST /api/v1/customer/orders
func (h *PublicHandler) CreateCustomerOrder(c *gin.Context) {
	// T101: Rate limiting for order creation
	clientIP := c.ClientIP()
	if !customerRateLimiter.checkRateLimit("order:"+clientIP, orderCreationLimit, time.Minute) {
		log.Printf("RATE_LIMIT: Order creation limit exceeded for IP %s", clientIP)
		c.JSON(http.StatusTooManyRequests, models.APIResponse{
			Success: false,
			Message: "Too many order attempts. Please wait a moment before trying again.",
			Error:   stringPtr("rate_limit_exceeded"),
		})
		return
	}

	// T099: CSRF validation - check Origin/Referer header for state-changing requests
	// This is enforced via CSRFProtection middleware, but we add extra validation here
	csrfToken := c.GetHeader("X-CSRF-Token")
	csrfEnabled := os.Getenv("CSRF_ENABLED") != "false" // Default enabled

	if csrfEnabled && csrfToken != "" {
		if !validateCSRFToken(csrfToken) {
			log.Printf("CSRF_ALERT: Invalid CSRF token from IP %s", clientIP)
			c.JSON(http.StatusForbidden, models.APIResponse{
				Success: false,
				Message: "Invalid or expired security token. Please refresh and try again.",
				Error:   stringPtr("invalid_csrf_token"),
			})
			return
		}
	}

	var req struct {
		TableID      string `json:"table_id" binding:"required"`
		CustomerName string `json:"customer_name"`
		Items        []struct {
			ProductID           string `json:"product_id" binding:"required"`
			Quantity            int    `json:"quantity" binding:"required,min=1"`
			SpecialInstructions string `json:"special_instructions"`
		} `json:"items" binding:"required,min=1"`
		Notes string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// T102: Input length validation
	req.CustomerName = strings.TrimSpace(req.CustomerName)
	if len(req.CustomerName) > maxCustomerNameLength {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Customer name is too long (max 100 characters)",
			Error:   stringPtr("customer_name_too_long"),
		})
		return
	}

	req.Notes = strings.TrimSpace(req.Notes)
	if len(req.Notes) > maxNotesLength {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Notes are too long (max 500 characters)",
			Error:   stringPtr("notes_too_long"),
		})
		return
	}

	// T102: Validate special instructions length for each item
	for i, item := range req.Items {
		item.SpecialInstructions = strings.TrimSpace(item.SpecialInstructions)
		if len(item.SpecialInstructions) > maxSpecialInstructionsLength {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Special instructions too long (max 500 characters)",
				Error:   stringPtr("special_instructions_too_long"),
			})
			return
		}
		req.Items[i].SpecialInstructions = item.SpecialInstructions
	}

	// Sanitize text inputs (strip HTML tags)
	req.CustomerName = stripHTMLTags(req.CustomerName)
	req.Notes = stripHTMLTags(req.Notes)
	for i := range req.Items {
		req.Items[i].SpecialInstructions = stripHTMLTags(req.Items[i].SpecialInstructions)
	}

	// Verify table exists
	var tableNumber string
	err := h.db.QueryRow("SELECT table_number FROM dining_tables WHERE id = $1", req.TableID).Scan(&tableNumber)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid table ID",
			Error:   stringPtr("table_not_found"),
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to verify table",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Generate order number
	orderNumber := "QR" + time.Now().Format("060102") + "-" + strconv.FormatInt(time.Now().UnixNano()%10000, 10)

	// Calculate subtotal
	var subtotal float64
	for _, item := range req.Items {
		var price float64
		err := h.db.QueryRow("SELECT price FROM products WHERE id = $1 AND is_available = true", item.ProductID).Scan(&price)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Product not found or unavailable",
				Error:   stringPtr("product_not_found"),
			})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to get product price",
				Error:   stringPtr(err.Error()),
			})
			return
		}
		subtotal += price * float64(item.Quantity)
	}

	// Get tax rate from settings (default 11%)
	var taxRateStr string
	err = h.db.QueryRow("SELECT setting_value FROM system_settings WHERE setting_key = 'tax_rate'").Scan(&taxRateStr)
	taxRate := 11.0
	if err == nil {
		if parsed, parseErr := strconv.ParseFloat(taxRateStr, 64); parseErr == nil {
			taxRate = parsed
		}
	}

	taxAmount := subtotal * (taxRate / 100)
	totalAmount := subtotal + taxAmount

	// Create order
	var orderID string
	err = h.db.QueryRow(`
		INSERT INTO orders (order_number, table_id, customer_name, order_type, status, subtotal, tax_amount, total_amount, notes)
		VALUES ($1, $2, $3, 'dine_in', 'pending', $4, $5, $6, $7)
		RETURNING id
	`, orderNumber, req.TableID, req.CustomerName, subtotal, taxAmount, totalAmount, req.Notes).Scan(&orderID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to create order",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Create order items
	for _, item := range req.Items {
		var price float64
		h.db.QueryRow("SELECT price FROM products WHERE id = $1", item.ProductID).Scan(&price)

		_, err = h.db.Exec(`
			INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, special_instructions)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, orderID, item.ProductID, item.Quantity, price, price*float64(item.Quantity), item.SpecialInstructions)

		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to create order item",
				Error:   stringPtr(err.Error()),
			})
			return
		}
	}

	// Mark table as occupied
	h.db.Exec("UPDATE dining_tables SET is_occupied = true WHERE id = $1", req.TableID)

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Order placed successfully! Your order will be prepared shortly.",
		Data: map[string]interface{}{
			"order_id":     orderID,
			"order_number": orderNumber,
			"table_number": tableNumber,
			"subtotal":     subtotal,
			"tax_amount":   taxAmount,
			"total_amount": totalAmount,
		},
	})
}
