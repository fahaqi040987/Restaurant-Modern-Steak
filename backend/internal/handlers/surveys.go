package handlers

import (
	"database/sql"
	"net/http"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SurveyHandler handles satisfaction survey operations
// T075: Survey handler for QR-based ordering
type SurveyHandler struct {
	db *sql.DB
}

// NewSurveyHandler creates a new survey handler instance
func NewSurveyHandler(db *sql.DB) *SurveyHandler {
	return &SurveyHandler{db: db}
}

// CreateSurvey handles POST /customer/orders/:id/survey
// Allows customers to submit satisfaction survey after order completion
func (h *SurveyHandler) CreateSurvey(c *gin.Context) {
	orderID := c.Param("id")

	// Validate order ID
	orderUUID, err := uuid.Parse(orderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid order ID",
		})
		return
	}

	// Bind request
	var req models.CreateSurveyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Sanitize comments to prevent XSS (T097)
	if req.Comments != nil {
		sanitized := stripHTMLTags(*req.Comments)
		req.Comments = &sanitized
	}

	// Check if order exists and is completed
	var orderStatus string
	err = h.db.QueryRow(`
		SELECT status FROM orders WHERE id = $1
	`, orderUUID).Scan(&orderStatus)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Order not found",
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to verify order",
		})
		return
	}

	// Only allow surveys for completed orders
	if orderStatus != "completed" && orderStatus != "paid" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Survey can only be submitted for completed orders",
		})
		return
	}

	// Check if survey already exists for this order
	var existingSurveyID string
	err = h.db.QueryRow(`
		SELECT id FROM satisfaction_surveys WHERE order_id = $1
	`, orderUUID).Scan(&existingSurveyID)

	if err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"error":   "Survey already submitted for this order",
		})
		return
	}

	// Insert survey
	var surveyID uuid.UUID
	err = h.db.QueryRow(`
		INSERT INTO satisfaction_surveys (
			order_id, overall_rating, food_quality, service_quality,
			ambiance, value_for_money, comments, would_recommend,
			customer_name, customer_email
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`, orderUUID, req.OverallRating, req.FoodQuality, req.ServiceQuality,
		req.Ambiance, req.ValueForMoney, req.Comments, req.WouldRecommend,
		req.CustomerName, req.CustomerEmail).Scan(&surveyID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to submit survey",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Survey submitted successfully",
		"data": gin.H{
			"id":       surveyID,
			"order_id": orderUUID,
		},
	})
}

// GetSurveyStats handles GET /admin/surveys/stats
// Returns aggregated survey statistics for admin dashboard
func (h *SurveyHandler) GetSurveyStats(c *gin.Context) {
	// Query aggregated statistics
	var stats models.SurveyStatsResponse
	err := h.db.QueryRow(`
		SELECT
			COUNT(*) as total_surveys,
			COALESCE(AVG(overall_rating), 0) as average_rating,
			COALESCE(AVG(food_quality), 0) as average_food_quality,
			COALESCE(AVG(service_quality), 0) as average_service_quality,
			COALESCE(AVG(ambiance), 0) as average_ambiance,
			COALESCE(AVG(value_for_money), 0) as average_value_for_money,
			COALESCE(
				SUM(CASE WHEN would_recommend = true THEN 1 ELSE 0 END)::float /
				NULLIF(COUNT(would_recommend), 0) * 100,
				0
			) as recommendation_rate
		FROM satisfaction_surveys
	`).Scan(
		&stats.TotalSurveys,
		&stats.AverageRating,
		&stats.AverageFoodQuality,
		&stats.AverageServiceQuality,
		&stats.AverageAmbiance,
		&stats.AverageValueForMoney,
		&stats.RecommendationRate,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch survey statistics",
		})
		return
	}

	// Get rating distribution
	rows, err := h.db.Query(`
		SELECT overall_rating, COUNT(*) as count
		FROM satisfaction_surveys
		GROUP BY overall_rating
		ORDER BY overall_rating
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch rating distribution",
		})
		return
	}
	defer rows.Close()

	stats.RatingDistribution = make(map[int]int)
	for rows.Next() {
		var rating, count int
		if err := rows.Scan(&rating, &count); err != nil {
			continue
		}
		stats.RatingDistribution[rating] = count
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
