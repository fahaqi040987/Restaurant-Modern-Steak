package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Handler is a general handler with database connection
type Handler struct {
	db *sql.DB
}

// NewHandler creates a new Handler instance
func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// GetContactSubmissions retrieves all contact form submissions with optional filtering
func (h *Handler) GetContactSubmissions(c *gin.Context) {
	status := c.Query("status")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := `
		SELECT id, name, email, phone, subject, message, status, created_at, updated_at
		FROM contact_submissions
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	if status != "" {
		query += " AND status = $" + strconv.Itoa(argIndex)
		args = append(args, status)
		argIndex++
	}

	if startDate != "" {
		query += " AND created_at >= $" + strconv.Itoa(argIndex)
		args = append(args, startDate)
		argIndex++
	}

	if endDate != "" {
		query += " AND created_at <= $" + strconv.Itoa(argIndex)
		args = append(args, endDate)
		argIndex++
	}

	query += " ORDER BY created_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch contact submissions"})
		return
	}
	defer rows.Close()

	var submissions []map[string]interface{}
	for rows.Next() {
		var id uuid.UUID
		var name, email, phone, subject, message, status string
		var createdAt, updatedAt time.Time

		if err := rows.Scan(&id, &name, &email, &phone, &subject, &message, &status, &createdAt, &updatedAt); err != nil {
			continue
		}

		submissions = append(submissions, map[string]interface{}{
			"id":         id,
			"name":       name,
			"email":      email,
			"phone":      phone,
			"subject":    subject,
			"message":    message,
			"status":     status,
			"created_at": createdAt,
			"updated_at": updatedAt,
		})
	}

	if submissions == nil {
		submissions = []map[string]interface{}{}
	}

	c.JSON(http.StatusOK, submissions)
}

// GetContactSubmission retrieves a single contact submission by ID
func (h *Handler) GetContactSubmission(c *gin.Context) {
	id := c.Param("id")

	var submission struct {
		ID        uuid.UUID `json:"id"`
		Name      string    `json:"name"`
		Email     string    `json:"email"`
		Phone     string    `json:"phone"`
		Subject   string    `json:"subject"`
		Message   string    `json:"message"`
		Status    string    `json:"status"`
		CreatedAt time.Time `json:"created_at"`
		UpdatedAt time.Time `json:"updated_at"`
	}

	query := `
		SELECT id, name, email, phone, subject, message, status, created_at, updated_at
		FROM contact_submissions
		WHERE id = $1
	`

	err := h.db.QueryRow(query, id).Scan(
		&submission.ID,
		&submission.Name,
		&submission.Email,
		&submission.Phone,
		&submission.Subject,
		&submission.Message,
		&submission.Status,
		&submission.CreatedAt,
		&submission.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact submission not found"})
		return
	}

	c.JSON(http.StatusOK, submission)
}

// UpdateContactStatus updates the status of a contact submission
func (h *Handler) UpdateContactStatus(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	validStatuses := []string{"new", "in_progress", "resolved", "spam"}
	isValid := false
	for _, status := range validStatuses {
		if req.Status == status {
			isValid = true
			break
		}
	}

	if !isValid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Must be one of: new, in_progress, resolved, spam"})
		return
	}

	query := `
		UPDATE contact_submissions
		SET status = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING id, name, email, phone, subject, message, status, created_at, updated_at
	`

	var submission struct {
		ID        uuid.UUID `json:"id"`
		Name      string    `json:"name"`
		Email     string    `json:"email"`
		Phone     string    `json:"phone"`
		Subject   string    `json:"subject"`
		Message   string    `json:"message"`
		Status    string    `json:"status"`
		CreatedAt time.Time `json:"created_at"`
		UpdatedAt time.Time `json:"updated_at"`
	}

	err := h.db.QueryRow(query, req.Status, id).Scan(
		&submission.ID,
		&submission.Name,
		&submission.Email,
		&submission.Phone,
		&submission.Subject,
		&submission.Message,
		&submission.Status,
		&submission.CreatedAt,
		&submission.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact submission not found"})
		return
	}

	c.JSON(http.StatusOK, submission)
}

// DeleteContactSubmission deletes a contact submission
func (h *Handler) DeleteContactSubmission(c *gin.Context) {
	id := c.Param("id")

	query := `DELETE FROM contact_submissions WHERE id = $1`

	result, err := h.db.Exec(query, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete contact submission"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact submission not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contact submission deleted successfully"})
}
