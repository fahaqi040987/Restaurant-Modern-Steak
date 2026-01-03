package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"pos-public/internal/models"
)

// T032b: Restaurant operating hours configuration (can be moved to config/settings later)
const (
	restaurantOpenHour  = 10 // 10:00 AM
	restaurantCloseHour = 22 // 10:00 PM
	minAdvanceHours     = 2  // Minimum 2 hours advance booking
	maxAdvanceDays      = 90 // Maximum 90 days in advance
)

// CreateReservation handles public reservation submission
// T032a: Fixed 500 error with proper error handling, logging, and DATE/TIME type handling
func (h *Handler) CreateReservation(c *gin.Context) {
	var req models.CreateReservationRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[CreateReservation] JSON binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request format: " + err.Error(),
		})
		return
	}

	// Additional validation (includes T032b date/time validation)
	if err := validateReservationRequest(&req); err != nil {
		log.Printf("[CreateReservation] Validation error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// T032a: Use SQL casting to ensure DATE and TIME are returned as text for proper scanning
	query := `
		INSERT INTO reservations (
			customer_name, email, phone, party_size,
			reservation_date, reservation_time, special_requests
		) VALUES ($1, $2, $3, $4, $5::date, $6::time, $7)
		RETURNING id, customer_name, email, phone, party_size,
			to_char(reservation_date, 'YYYY-MM-DD') as reservation_date,
			to_char(reservation_time, 'HH24:MI') as reservation_time,
			special_requests, status, created_at, updated_at
	`

	var reservation models.Reservation
	var specialRequests sql.NullString

	err := h.db.QueryRow(
		query,
		req.CustomerName,
		req.Email,
		req.Phone,
		req.PartySize,
		req.ReservationDate,
		req.ReservationTime,
		req.SpecialRequests,
	).Scan(
		&reservation.ID,
		&reservation.CustomerName,
		&reservation.Email,
		&reservation.Phone,
		&reservation.PartySize,
		&reservation.ReservationDate,
		&reservation.ReservationTime,
		&specialRequests,
		&reservation.Status,
		&reservation.CreatedAt,
		&reservation.UpdatedAt,
	)

	if err != nil {
		// T032a: Log detailed error for debugging
		log.Printf("[CreateReservation] Database error: %v", err)
		log.Printf("[CreateReservation] Request data: name=%s, email=%s, phone=%s, date=%s, time=%s, party_size=%d",
			req.CustomerName, req.Email, req.Phone, req.ReservationDate, req.ReservationTime, req.PartySize)

		// Return user-friendly error message
		errorMsg := "Failed to create reservation. Please try again."
		if strings.Contains(err.Error(), "duplicate") {
			errorMsg = "A reservation with similar details already exists."
		} else if strings.Contains(err.Error(), "violates check constraint") {
			errorMsg = "Invalid reservation data. Please check your input."
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   errorMsg,
		})
		return
	}

	if specialRequests.Valid {
		reservation.SpecialRequests = &specialRequests.String
	}

	log.Printf("[CreateReservation] Success: ID=%s, Date=%s, Time=%s",
		reservation.ID.String(), reservation.ReservationDate, reservation.ReservationTime)

	// Return public response (limited fields)
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Reservation created successfully",
		"data": models.ReservationResponse{
			ID:              reservation.ID.String(),
			Status:          reservation.Status,
			ReservationDate: reservation.ReservationDate,
			ReservationTime: reservation.ReservationTime,
			PartySize:       reservation.PartySize,
		},
	})
}

// GetReservations retrieves all reservations with optional filtering (admin)
// T032a: Fixed DATE/TIME type handling with to_char()
func (h *Handler) GetReservations(c *gin.Context) {
	status := c.Query("status")
	date := c.Query("date")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	// Count query
	countQuery := `SELECT COUNT(*) FROM reservations WHERE 1=1`
	args := []interface{}{}
	argIndex := 1

	if status != "" {
		countQuery += " AND status = $" + strconv.Itoa(argIndex)
		args = append(args, status)
		argIndex++
	}

	if date != "" {
		countQuery += " AND reservation_date = $" + strconv.Itoa(argIndex) + "::date"
		args = append(args, date)
		argIndex++
	}

	var total int
	err := h.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		log.Printf("[GetReservations] Count query error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch reservations count",
		})
		return
	}

	// Main query - T032a: Use to_char() for DATE and TIME columns
	query := `
		SELECT id, customer_name, email, phone, party_size,
			to_char(reservation_date, 'YYYY-MM-DD') as reservation_date,
			to_char(reservation_time, 'HH24:MI') as reservation_time,
			special_requests, status, notes, confirmed_by, confirmed_at, created_at, updated_at
		FROM reservations
		WHERE 1=1
	`

	// Reset args for main query
	args = []interface{}{}
	argIndex = 1

	if status != "" {
		query += " AND status = $" + strconv.Itoa(argIndex)
		args = append(args, status)
		argIndex++
	}

	if date != "" {
		query += " AND reservation_date = $" + strconv.Itoa(argIndex) + "::date"
		args = append(args, date)
		argIndex++
	}

	query += " ORDER BY reservation_date DESC, reservation_time DESC"
	query += " LIMIT $" + strconv.Itoa(argIndex) + " OFFSET $" + strconv.Itoa(argIndex+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		log.Printf("[GetReservations] Query error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch reservations",
		})
		return
	}
	defer rows.Close()

	reservations := []models.Reservation{}
	for rows.Next() {
		var r models.Reservation
		var specialRequests, notes sql.NullString
		var confirmedBy sql.NullString
		var confirmedAt sql.NullTime

		if err := rows.Scan(
			&r.ID,
			&r.CustomerName,
			&r.Email,
			&r.Phone,
			&r.PartySize,
			&r.ReservationDate,
			&r.ReservationTime,
			&specialRequests,
			&r.Status,
			&notes,
			&confirmedBy,
			&confirmedAt,
			&r.CreatedAt,
			&r.UpdatedAt,
		); err != nil {
			log.Printf("[GetReservations] Row scan error: %v", err)
			continue
		}

		if specialRequests.Valid {
			r.SpecialRequests = &specialRequests.String
		}
		if notes.Valid {
			r.Notes = &notes.String
		}
		if confirmedBy.Valid {
			uid, _ := uuid.Parse(confirmedBy.String)
			r.ConfirmedBy = &uid
		}
		if confirmedAt.Valid {
			r.ConfirmedAt = &confirmedAt.Time
		}

		reservations = append(reservations, r)
	}

	totalPages := (total + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    reservations,
		"pagination": &models.Pagination{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

// GetReservation retrieves a single reservation by ID (admin)
// T032a: Fixed DATE/TIME type handling with to_char()
func (h *Handler) GetReservation(c *gin.Context) {
	id := c.Param("id")

	// T032a: Use to_char() for DATE and TIME columns
	query := `
		SELECT id, customer_name, email, phone, party_size,
			to_char(reservation_date, 'YYYY-MM-DD') as reservation_date,
			to_char(reservation_time, 'HH24:MI') as reservation_time,
			special_requests, status, notes, confirmed_by, confirmed_at, created_at, updated_at
		FROM reservations
		WHERE id = $1
	`

	var r models.Reservation
	var specialRequests, notes sql.NullString
	var confirmedBy sql.NullString
	var confirmedAt sql.NullTime

	err := h.db.QueryRow(query, id).Scan(
		&r.ID,
		&r.CustomerName,
		&r.Email,
		&r.Phone,
		&r.PartySize,
		&r.ReservationDate,
		&r.ReservationTime,
		&specialRequests,
		&r.Status,
		&notes,
		&confirmedBy,
		&confirmedAt,
		&r.CreatedAt,
		&r.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Reservation not found",
		})
		return
	}

	if err != nil {
		log.Printf("[GetReservation] Query error for ID %s: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch reservation",
		})
		return
	}

	if specialRequests.Valid {
		r.SpecialRequests = &specialRequests.String
	}
	if notes.Valid {
		r.Notes = &notes.String
	}
	if confirmedBy.Valid {
		uid, _ := uuid.Parse(confirmedBy.String)
		r.ConfirmedBy = &uid
	}
	if confirmedAt.Valid {
		r.ConfirmedAt = &confirmedAt.Time
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    r,
	})
}

// UpdateReservationStatus updates the status of a reservation (admin)
// T032a: Fixed DATE/TIME type handling with to_char()
func (h *Handler) UpdateReservationStatus(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status string  `json:"status" binding:"required"`
		Notes  *string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Validate status
	validStatuses := []string{"confirmed", "cancelled", "completed", "no_show"}
	isValid := false
	for _, status := range validStatuses {
		if req.Status == status {
			isValid = true
			break
		}
	}

	if !isValid {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid status. Must be one of: confirmed, cancelled, completed, no_show",
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, _ := c.Get("user_id")
	userIDStr, _ := userID.(string)

	var query string
	var args []interface{}

	// T032a: Use to_char() for DATE and TIME columns in RETURNING clause
	if req.Status == "confirmed" {
		// Set confirmed_by and confirmed_at
		query = `
			UPDATE reservations
			SET status = $1, notes = $2, confirmed_by = $3, confirmed_at = $4, updated_at = NOW()
			WHERE id = $5
			RETURNING id, customer_name, email, phone, party_size,
				to_char(reservation_date, 'YYYY-MM-DD') as reservation_date,
				to_char(reservation_time, 'HH24:MI') as reservation_time,
				special_requests, status, notes, confirmed_by, confirmed_at, created_at, updated_at
		`
		args = []interface{}{req.Status, req.Notes, userIDStr, time.Now(), id}
	} else {
		query = `
			UPDATE reservations
			SET status = $1, notes = $2, updated_at = NOW()
			WHERE id = $3
			RETURNING id, customer_name, email, phone, party_size,
				to_char(reservation_date, 'YYYY-MM-DD') as reservation_date,
				to_char(reservation_time, 'HH24:MI') as reservation_time,
				special_requests, status, notes, confirmed_by, confirmed_at, created_at, updated_at
		`
		args = []interface{}{req.Status, req.Notes, id}
	}

	var r models.Reservation
	var specialRequests, notes sql.NullString
	var confirmedBy sql.NullString
	var confirmedAt sql.NullTime

	err := h.db.QueryRow(query, args...).Scan(
		&r.ID,
		&r.CustomerName,
		&r.Email,
		&r.Phone,
		&r.PartySize,
		&r.ReservationDate,
		&r.ReservationTime,
		&specialRequests,
		&r.Status,
		&notes,
		&confirmedBy,
		&confirmedAt,
		&r.CreatedAt,
		&r.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Reservation not found",
		})
		return
	}

	if err != nil {
		log.Printf("[UpdateReservationStatus] Query error for ID %s: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update reservation status",
		})
		return
	}

	if specialRequests.Valid {
		r.SpecialRequests = &specialRequests.String
	}
	if notes.Valid {
		r.Notes = &notes.String
	}
	if confirmedBy.Valid {
		uid, _ := uuid.Parse(confirmedBy.String)
		r.ConfirmedBy = &uid
	}
	if confirmedAt.Valid {
		r.ConfirmedAt = &confirmedAt.Time
	}

	log.Printf("[UpdateReservationStatus] Success: ID=%s, NewStatus=%s", id, req.Status)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Reservation status updated successfully",
		"data":    r,
	})
}

// DeleteReservation deletes a reservation (admin)
func (h *Handler) DeleteReservation(c *gin.Context) {
	id := c.Param("id")

	query := `DELETE FROM reservations WHERE id = $1`

	result, err := h.db.Exec(query, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete reservation",
		})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Reservation not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Reservation deleted successfully",
	})
}

// GetPendingReservationsCount returns the count of pending reservations
func (h *Handler) GetPendingReservationsCount(c *gin.Context) {
	var count int
	err := h.db.QueryRow(`
		SELECT COUNT(*) FROM reservations WHERE status = 'pending'
	`).Scan(&count)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch pending reservations count",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"pending_reservations": count,
		},
	})
}

// stripHTMLTags removes HTML tags from user input to prevent XSS attacks
func stripHTMLTags(input string) string {
	// Remove HTML tags using regex
	htmlTagRegex := regexp.MustCompile(`<[^>]*>`)
	stripped := htmlTagRegex.ReplaceAllString(input, "")
	// Also remove any script tags content
	scriptRegex := regexp.MustCompile(`(?i)<script[^>]*>.*?</script>`)
	stripped = scriptRegex.ReplaceAllString(stripped, "")
	return strings.TrimSpace(stripped)
}

// validateReservationRequest performs additional validation on the request
// T032a: Basic validation + T032b: Enhanced date/time validation
func validateReservationRequest(req *models.CreateReservationRequest) error {
	// Sanitize text inputs to prevent XSS
	req.CustomerName = stripHTMLTags(req.CustomerName)
	req.Email = stripHTMLTags(req.Email)
	req.Phone = stripHTMLTags(req.Phone)
	if req.SpecialRequests != nil {
		stripped := stripHTMLTags(*req.SpecialRequests)
		req.SpecialRequests = &stripped
	}

	// Validate customer name
	if len(strings.TrimSpace(req.CustomerName)) < 2 {
		return &ValidationError{Field: "customer_name", Message: "Name must be at least 2 characters"}
	}
	if len(req.CustomerName) > 100 {
		return &ValidationError{Field: "customer_name", Message: "Name must be less than 100 characters"}
	}

	// Validate email format (improved regex for better security)
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		return &ValidationError{Field: "email", Message: "Invalid email format"}
	}

	// Validate phone (Indonesian format: +62/62/0 followed by 9-12 digits)
	phoneRegex := regexp.MustCompile(`^(\+62|62|0)[0-9]{9,12}$`)
	if !phoneRegex.MatchString(req.Phone) {
		return &ValidationError{Field: "phone", Message: "Invalid phone format. Use Indonesian format (+62/62/0 followed by 9-12 digits)"}
	}

	// Validate party size
	if req.PartySize < 1 || req.PartySize > 20 {
		return &ValidationError{Field: "party_size", Message: "Party size must be between 1 and 20"}
	}

	// T032b: Use Asia/Jakarta timezone explicitly for all date/time validation
	jakartaLocation, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		// Fallback to fixed UTC+7 offset if Asia/Jakarta is unavailable
		log.Printf("[validateReservationRequest] Warning: Asia/Jakarta timezone not available, using UTC+7 offset")
		jakartaLocation = time.FixedZone("WIB", 7*60*60)
	}

	// Parse reservation date
	reservationDate, err := time.Parse("2006-01-02", req.ReservationDate)
	if err != nil {
		return &ValidationError{Field: "reservation_date", Message: "Invalid date format. Use YYYY-MM-DD"}
	}

	// Validate reservation time format first
	timeRegex := regexp.MustCompile(`^([01]\d|2[0-3]):([0-5]\d)$`)
	if !timeRegex.MatchString(req.ReservationTime) {
		return &ValidationError{Field: "reservation_time", Message: "Invalid time format. Use HH:MM"}
	}

	// Parse reservation time
	reservationTime, err := time.Parse("15:04", req.ReservationTime)
	if err != nil {
		return &ValidationError{Field: "reservation_time", Message: "Invalid time format. Use HH:MM"}
	}

	// Get current time in Jakarta timezone
	nowInJakarta := time.Now().In(jakartaLocation)
	todayInJakarta := nowInJakarta.Truncate(24 * time.Hour)

	// Create full reservation datetime in Jakarta timezone
	reservationDateTime := time.Date(
		reservationDate.Year(), reservationDate.Month(), reservationDate.Day(),
		reservationTime.Hour(), reservationTime.Minute(), 0, 0,
		jakartaLocation,
	)

	// T032b: Validate reservation is not in the past
	if reservationDateTime.Before(nowInJakarta) {
		return &ValidationError{Field: "reservation_date", Message: "Reservation date and time must be in the future"}
	}

	// T032b: Validate minimum advance booking (at least 2 hours notice)
	minBookingTime := nowInJakarta.Add(time.Duration(minAdvanceHours) * time.Hour)
	if reservationDateTime.Before(minBookingTime) {
		return &ValidationError{
			Field:   "reservation_time",
			Message: "Reservations must be made at least 2 hours in advance",
		}
	}

	// T032b: Validate maximum advance booking (not more than 90 days)
	maxBookingDate := todayInJakarta.AddDate(0, 0, maxAdvanceDays)
	if reservationDate.After(maxBookingDate) {
		return &ValidationError{
			Field:   "reservation_date",
			Message: "Reservations can only be made up to 90 days in advance",
		}
	}

	// T032b: Validate reservation time is within operating hours
	reservationHour := reservationTime.Hour()
	if reservationHour < restaurantOpenHour || reservationHour >= restaurantCloseHour {
		return &ValidationError{
			Field:   "reservation_time",
			Message: "Reservations are only available between 10:00 and 22:00 (WIB)",
		}
	}

	// Validate special requests length
	if req.SpecialRequests != nil && len(*req.SpecialRequests) > 500 {
		return &ValidationError{Field: "special_requests", Message: "Special requests must be less than 500 characters"}
	}

	return nil
}

// ValidationError represents a validation error
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}
