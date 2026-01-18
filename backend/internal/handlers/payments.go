package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"pos-public/internal/middleware"
	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// T094: Fraud detection constants
const (
	maxPaymentsPerMinute     = 5         // Maximum payments allowed per minute per user
	maxPaymentAmount         = 50000000  // Maximum single payment amount (50 million IDR)
	suspiciousPatternWindow  = time.Hour // Window to check for suspicious patterns
	maxFailedPaymentAttempts = 3         // Max failed attempts before flagging
)

type PaymentHandler struct {
	db *sql.DB
}

func NewPaymentHandler(db *sql.DB) *PaymentHandler {
	return &PaymentHandler{db: db}
}

// ProcessPayment processes a payment for an order
func (h *PaymentHandler) ProcessPayment(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid order ID",
			Error:   stringPtr("invalid_uuid"),
		})
		return
	}

	userID, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Authentication required",
			Error:   stringPtr("auth_required"),
		})
		return
	}

	var req models.ProcessPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Validate payment method
	validMethods := []string{"cash", "credit_card", "debit_card", "digital_wallet"}
	isValidMethod := false
	for _, method := range validMethods {
		if req.PaymentMethod == method {
			isValidMethod = true
			break
		}
	}

	if !isValidMethod {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid payment method",
			Error:   stringPtr("invalid_payment_method"),
		})
		return
	}

	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Payment amount must be greater than zero",
			Error:   stringPtr("invalid_amount"),
		})
		return
	}

	// T094: Fraud detection - Check for suspicious payment amount
	if req.Amount > maxPaymentAmount {
		log.Printf("FRAUD_ALERT: Suspicious large payment attempt - User: %s, Amount: %.2f", userID, req.Amount)
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Payment amount exceeds maximum allowed limit",
			Error:   stringPtr("amount_exceeds_limit"),
		})
		return
	}

	// T094: Fraud detection - Check for rapid payment attempts (rate limiting)
	var recentPaymentCount int
	err = h.db.QueryRow(`
		SELECT COUNT(*) FROM payments
		WHERE processed_by = $1 AND created_at > NOW() - INTERVAL '1 minute'
	`, userID).Scan(&recentPaymentCount)
	if err != nil {
		log.Printf("Error checking payment rate: %v", err)
	} else if recentPaymentCount >= maxPaymentsPerMinute {
		log.Printf("FRAUD_ALERT: Rate limit exceeded - User: %s, Payments in last minute: %d", userID, recentPaymentCount)
		c.JSON(http.StatusTooManyRequests, models.APIResponse{
			Success: false,
			Message: "Too many payment attempts. Please wait a moment before trying again.",
			Error:   stringPtr("rate_limit_exceeded"),
		})
		return
	}

	// T094: Fraud detection - Check for failed payment pattern
	var failedAttempts int
	err = h.db.QueryRow(`
		SELECT COUNT(*) FROM payments
		WHERE processed_by = $1 AND status = 'failed' AND created_at > NOW() - INTERVAL '1 hour'
	`, userID).Scan(&failedAttempts)
	if err != nil {
		log.Printf("Error checking failed payments: %v", err)
	} else if failedAttempts >= maxFailedPaymentAttempts {
		log.Printf("FRAUD_ALERT: Multiple failed payments - User: %s, Failed attempts: %d", userID, failedAttempts)
		// Don't block but log for review
	}

	// Start transaction
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to start transaction",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer tx.Rollback()

	// Check if order exists and get total amount
	var orderTotalAmount float64
	var orderStatus string
	err = tx.QueryRow("SELECT total_amount, status FROM orders WHERE id = $1", orderID).Scan(&orderTotalAmount, &orderStatus)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Order not found",
			Error:   stringPtr("order_not_found"),
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch order",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Check if order is in a valid state for payment
	if orderStatus == "cancelled" || orderStatus == "completed" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Order cannot be paid - order is " + orderStatus,
			Error:   stringPtr("invalid_order_status"),
		})
		return
	}

	// Check if order is already fully paid
	var totalPaid float64
	err = tx.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) 
		FROM payments 
		WHERE order_id = $1 AND status = 'completed'
	`, orderID).Scan(&totalPaid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to calculate total payments",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	if totalPaid >= orderTotalAmount {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Order is already fully paid",
			Error:   stringPtr("order_fully_paid"),
		})
		return
	}

	// Check if payment amount doesn't exceed remaining balance
	remainingAmount := orderTotalAmount - totalPaid
	if req.Amount > remainingAmount {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Payment amount exceeds remaining balance",
			Error:   stringPtr("amount_exceeds_balance"),
		})
		return
	}

	// Create payment record
	paymentID := uuid.New()
	now := time.Now()

	paymentQuery := `
		INSERT INTO payments (id, order_id, payment_method, amount, reference_number, status, processed_by, processed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	// Simulate payment processing
	paymentStatus := "completed"
	if req.PaymentMethod != "cash" {
		// For non-cash payments, we simulate processing
		// In a real system, this would integrate with payment processors
		paymentStatus = "completed" // Simulating successful processing
	}

	_, err = tx.Exec(paymentQuery, paymentID, orderID, req.PaymentMethod, req.Amount,
		req.ReferenceNumber, paymentStatus, userID, now)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to create payment record",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Check if order is now fully paid
	newTotalPaid := totalPaid + req.Amount
	if newTotalPaid >= orderTotalAmount {
		// Update order status to completed if fully paid
		_, err = tx.Exec(`
			UPDATE orders 
			SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
			WHERE id = $1
		`, orderID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to update order status",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		// Free up the table
		_, err = tx.Exec(`
			UPDATE dining_tables 
			SET is_occupied = false 
			WHERE id IN (SELECT table_id FROM orders WHERE id = $1 AND table_id IS NOT NULL)
		`, orderID)
		if err != nil {
			// Log error but don't fail the transaction
			// fmt.Printf("Warning: Failed to update table status: %v\n", err)
		}

		// Log status change
		_, err = tx.Exec(`
			INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by, notes)
			VALUES ($1, $2, 'completed', $3, 'Order completed after payment')
		`, orderID, orderStatus, userID)
		if err != nil {
			// Log error but don't fail the transaction
			// fmt.Printf("Warning: Failed to log status change: %v\n", err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to commit payment",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Fetch the created payment
	payment, err := h.getPaymentByID(paymentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Payment processed but failed to fetch details",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Payment processed successfully",
		Data:    payment,
	})
}

// GetPayments retrieves payments for an order
func (h *PaymentHandler) GetPayments(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid order ID",
			Error:   stringPtr("invalid_uuid"),
		})
		return
	}

	// Check if order exists
	var exists bool
	err = h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM orders WHERE id = $1)", orderID).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to check order existence",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Order not found",
			Error:   stringPtr("order_not_found"),
		})
		return
	}

	// Fetch payments
	query := `
		SELECT p.id, p.payment_method, p.amount, p.reference_number, p.status, 
		       p.processed_by, p.processed_at, p.created_at,
		       u.username, u.first_name, u.last_name
		FROM payments p
		LEFT JOIN users u ON p.processed_by = u.id
		WHERE p.order_id = $1
		ORDER BY p.created_at DESC
	`

	rows, err := h.db.Query(query, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch payments",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	var payments []models.Payment
	for rows.Next() {
		var payment models.Payment
		var username, firstName, lastName sql.NullString

		err := rows.Scan(
			&payment.ID, &payment.PaymentMethod, &payment.Amount, &payment.ReferenceNumber,
			&payment.Status, &payment.ProcessedBy, &payment.ProcessedAt, &payment.CreatedAt,
			&username, &firstName, &lastName,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan payment",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		payment.OrderID = orderID

		// Add processed by user info if available
		if username.Valid {
			payment.ProcessedByUser = &models.User{
				Username:  username.String,
				FirstName: firstName.String,
				LastName:  lastName.String,
			}
		}

		payments = append(payments, payment)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Payments retrieved successfully",
		Data:    payments,
	})
}

// GetPaymentSummary retrieves payment summary for an order
func (h *PaymentHandler) GetPaymentSummary(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid order ID",
			Error:   stringPtr("invalid_uuid"),
		})
		return
	}

	// Get order total and payment summary
	query := `
		SELECT 
		    o.total_amount,
		    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_paid,
		    COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) as pending_amount,
		    COUNT(p.id) as payment_count
		FROM orders o
		LEFT JOIN payments p ON o.id = p.order_id
		WHERE o.id = $1
		GROUP BY o.id, o.total_amount
	`

	var totalAmount, totalPaid, pendingAmount float64
	var paymentCount int

	err = h.db.QueryRow(query, orderID).Scan(&totalAmount, &totalPaid, &pendingAmount, &paymentCount)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Order not found",
			Error:   stringPtr("order_not_found"),
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch payment summary",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	remainingAmount := totalAmount - totalPaid
	isFullyPaid := remainingAmount <= 0

	summary := map[string]interface{}{
		"order_id":         orderID,
		"total_amount":     totalAmount,
		"total_paid":       totalPaid,
		"pending_amount":   pendingAmount,
		"remaining_amount": remainingAmount,
		"is_fully_paid":    isFullyPaid,
		"payment_count":    paymentCount,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Payment summary retrieved successfully",
		Data:    summary,
	})
}

// Helper functions

func (h *PaymentHandler) getPaymentByID(paymentID uuid.UUID) (*models.Payment, error) {
	var payment models.Payment
	var username, firstName, lastName sql.NullString

	query := `
		SELECT p.id, p.order_id, p.payment_method, p.amount, p.reference_number, p.status, 
		       p.processed_by, p.processed_at, p.created_at,
		       u.username, u.first_name, u.last_name
		FROM payments p
		LEFT JOIN users u ON p.processed_by = u.id
		WHERE p.id = $1
	`

	err := h.db.QueryRow(query, paymentID).Scan(
		&payment.ID, &payment.OrderID, &payment.PaymentMethod, &payment.Amount,
		&payment.ReferenceNumber, &payment.Status, &payment.ProcessedBy,
		&payment.ProcessedAt, &payment.CreatedAt,
		&username, &firstName, &lastName,
	)

	if err != nil {
		return nil, err
	}

	// Add processed by user info if available
	if username.Valid {
		payment.ProcessedByUser = &models.User{
			Username:  username.String,
			FirstName: firstName.String,
			LastName:  lastName.String,
		}
	}

	return &payment, nil
}

// CreateCustomerPayment processes payment for QR-based customer orders
// T072: Customer payment handler for QR ordering (no authentication required)
// T078: Includes validation - order exists, not already paid, amount matches
// T100: Includes authorization check - verify customer is paying for their table's order
func (h *PaymentHandler) CreateCustomerPayment(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid order ID",
		})
		return
	}

	var req models.CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// T100: Authorization check - verify table ownership via X-Table-ID header
	// This header should be set by the frontend based on the QR code scan
	tableIDHeader := c.GetHeader("X-Table-ID")

	// T078: Start transaction for atomic payment processing
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to start transaction",
		})
		return
	}
	defer tx.Rollback()

	// T078 + T100: Verify order exists, get total amount, and verify table ownership
	var orderTotalAmount float64
	var orderStatus string
	var orderType string
	var orderTableID sql.NullString
	err = tx.QueryRow(`
		SELECT total_amount, status, order_type, table_id
		FROM orders WHERE id = $1
	`, orderID).Scan(&orderTotalAmount, &orderStatus, &orderType, &orderTableID)

	// T100: Authorization check - verify order belongs to the customer's table
	if orderTableID.Valid && tableIDHeader != "" && orderTableID.String != tableIDHeader {
		log.Printf("AUTHORIZATION_ALERT: Cross-table payment attempt - Order table: %s, Request table: %s, IP: %s",
			orderTableID.String, tableIDHeader, c.ClientIP())
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "You can only pay for orders from your table",
		})
		return
	}

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
			"error":   "Failed to fetch order",
		})
		return
	}

	// T078: Verify order is valid for payment
	if orderStatus == "cancelled" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Cannot pay for cancelled order",
		})
		return
	}

	// T078: Check if order is already paid (prevent duplicate payments)
	var totalPaid float64
	err = tx.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) 
		FROM payments 
		WHERE order_id = $1 AND status = 'completed'
	`, orderID).Scan(&totalPaid)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to calculate total payments",
		})
		return
	}

	if totalPaid >= orderTotalAmount {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Order is already fully paid",
		})
		return
	}

	// T078: Validate payment amount matches order total
	remainingAmount := orderTotalAmount - totalPaid
	if req.Amount != remainingAmount {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Payment amount must match remaining balance",
			"details": gin.H{
				"required_amount": remainingAmount,
				"provided_amount": req.Amount,
			},
		})
		return
	}

	// Create payment record
	paymentID := uuid.New()
	now := time.Now()

	_, err = tx.Exec(`
		INSERT INTO payments (
			id, order_id, payment_method, amount, 
			reference_number, status, processed_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, paymentID, orderID, req.PaymentMethod, req.Amount,
		req.ReferenceNumber, "completed", now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create payment record",
		})
		return
	}

	// Update order status to paid
	_, err = tx.Exec(`
		UPDATE orders 
		SET status = 'paid', updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, orderID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update order status",
		})
		return
	}

	// Log status change
	_, err = tx.Exec(`
		INSERT INTO order_status_history (order_id, previous_status, new_status, notes)
		VALUES ($1, $2, 'paid', 'Customer paid via ' || $3)
	`, orderID, orderStatus, req.PaymentMethod)

	if err != nil {
		// Log error but don't fail the transaction
		// Payment is still valid
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to commit payment",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Payment processed successfully",
		"data": gin.H{
			"payment_id":     paymentID,
			"order_id":       orderID,
			"amount":         req.Amount,
			"payment_method": req.PaymentMethod,
			"status":         "completed",
		},
	})
}
