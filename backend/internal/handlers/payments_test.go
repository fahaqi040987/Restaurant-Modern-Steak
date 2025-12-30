package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pos-public/internal/models"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ========================
// T212: Create test file backend/internal/handlers/payments_test.go
// ========================

// Helper function to set user in gin context for payment tests
func setPaymentUserContext(c *gin.Context, userID uuid.UUID, username, role string) {
	c.Set("user_id", userID)
	c.Set("username", username)
	c.Set("role", role)
}

// ========================
// T213: TestProcessPayment_Cash_Success
// ========================

func TestProcessPayment_Cash_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	userID := uuid.New()
	paymentID := uuid.New()
	now := time.Now()

	// Expect transaction start
	mock.ExpectBegin()

	// Mock order query
	mock.ExpectQuery("SELECT total_amount, status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"total_amount", "status"}).AddRow(200000.00, "pending"))

	// Mock total paid query
	mock.ExpectQuery("SELECT COALESCE\\(SUM\\(amount\\), 0\\)").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"sum"}).AddRow(0.00))

	// Mock payment insert
	mock.ExpectExec("INSERT INTO payments").
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Mock order update (fully paid)
	mock.ExpectExec("UPDATE orders").
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock table update
	mock.ExpectExec("UPDATE dining_tables").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Mock status history insert
	mock.ExpectExec("INSERT INTO order_status_history").
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Expect transaction commit
	mock.ExpectCommit()

	// Mock fetch payment
	mock.ExpectQuery("SELECT p.id, p.order_id, p.payment_method").
		WithArgs(sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "order_id", "payment_method", "amount", "reference_number",
			"status", "processed_by", "processed_at", "created_at",
			"username", "first_name", "last_name",
		}).AddRow(
			paymentID, orderID, "cash", 200000.00, nil,
			"completed", userID, now, now,
			"counter1", "Counter", "Staff",
		))

	reqBody := models.ProcessPaymentRequest{
		PaymentMethod: "cash",
		Amount:        200000.00,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}
	setPaymentUserContext(c, userID, "counter1", "counter")

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Payment processed successfully", response.Message)
}

// ========================
// T214: TestProcessPayment_Card_Success
// ========================

func TestProcessPayment_Card_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	userID := uuid.New()
	paymentID := uuid.New()
	now := time.Now()

	// Expect transaction start
	mock.ExpectBegin()

	// Mock order query
	mock.ExpectQuery("SELECT total_amount, status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"total_amount", "status"}).AddRow(350000.00, "ready"))

	// Mock total paid query
	mock.ExpectQuery("SELECT COALESCE\\(SUM\\(amount\\), 0\\)").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"sum"}).AddRow(0.00))

	// Mock payment insert
	mock.ExpectExec("INSERT INTO payments").
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Mock order update (fully paid)
	mock.ExpectExec("UPDATE orders").
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock table update
	mock.ExpectExec("UPDATE dining_tables").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Mock status history insert
	mock.ExpectExec("INSERT INTO order_status_history").
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Expect transaction commit
	mock.ExpectCommit()

	// Mock fetch payment
	mock.ExpectQuery("SELECT p.id, p.order_id, p.payment_method").
		WithArgs(sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "order_id", "payment_method", "amount", "reference_number",
			"status", "processed_by", "processed_at", "created_at",
			"username", "first_name", "last_name",
		}).AddRow(
			paymentID, orderID, "credit_card", 350000.00, "REF-123456",
			"completed", userID, now, now,
			"counter1", "Counter", "Staff",
		))

	reqBody := models.ProcessPaymentRequest{
		PaymentMethod:   "credit_card",
		Amount:          350000.00,
		ReferenceNumber: stringPtr("REF-123456"),
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}
	setPaymentUserContext(c, userID, "counter1", "counter")

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
}

func TestProcessPayment_DebitCard_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	userID := uuid.New()
	paymentID := uuid.New()
	now := time.Now()

	// Expect transaction start
	mock.ExpectBegin()

	// Mock order query
	mock.ExpectQuery("SELECT total_amount, status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"total_amount", "status"}).AddRow(250000.00, "served"))

	// Mock total paid query
	mock.ExpectQuery("SELECT COALESCE\\(SUM\\(amount\\), 0\\)").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"sum"}).AddRow(0.00))

	// Mock payment insert
	mock.ExpectExec("INSERT INTO payments").
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Mock order update
	mock.ExpectExec("UPDATE orders").
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock table update
	mock.ExpectExec("UPDATE dining_tables").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Mock status history
	mock.ExpectExec("INSERT INTO order_status_history").
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Expect transaction commit
	mock.ExpectCommit()

	// Mock fetch payment
	mock.ExpectQuery("SELECT p.id, p.order_id, p.payment_method").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "order_id", "payment_method", "amount", "reference_number",
			"status", "processed_by", "processed_at", "created_at",
			"username", "first_name", "last_name",
		}).AddRow(
			paymentID, orderID, "debit_card", 250000.00, nil,
			"completed", userID, now, now,
			"counter1", "Counter", "Staff",
		))

	reqBody := models.ProcessPaymentRequest{
		PaymentMethod: "debit_card",
		Amount:        250000.00,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}
	setPaymentUserContext(c, userID, "counter1", "counter")

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusCreated, w.Code)
}

// ========================
// T215: TestProcessPayment_InsufficientFunds
// ========================

func TestProcessPayment_InsufficientFunds(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	userID := uuid.New()

	// Expect transaction start
	mock.ExpectBegin()

	// Mock order query - total is 500000
	mock.ExpectQuery("SELECT total_amount, status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"total_amount", "status"}).AddRow(500000.00, "pending"))

	// Mock total paid query - already paid 400000
	mock.ExpectQuery("SELECT COALESCE\\(SUM\\(amount\\), 0\\)").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"sum"}).AddRow(400000.00))

	// Expect rollback because amount exceeds remaining
	mock.ExpectRollback()

	// Request to pay 150000 but only 100000 remaining
	reqBody := models.ProcessPaymentRequest{
		PaymentMethod: "cash",
		Amount:        150000.00, // Exceeds remaining balance of 100000
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}
	setPaymentUserContext(c, userID, "counter1", "counter")

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Payment amount exceeds remaining balance", response.Message)
}

func TestProcessPayment_InvalidAmount(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	userID := uuid.New()

	reqBody := models.ProcessPaymentRequest{
		PaymentMethod: "cash",
		Amount:        -100.00, // Invalid negative amount
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}
	setPaymentUserContext(c, userID, "counter1", "counter")

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Payment amount must be greater than zero", response.Message)
}

func TestProcessPayment_InvalidMethod(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	userID := uuid.New()

	reqBody := models.ProcessPaymentRequest{
		PaymentMethod: "bitcoin", // Invalid payment method
		Amount:        100000.00,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}
	setPaymentUserContext(c, userID, "counter1", "counter")

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Invalid payment method", response.Message)
}

// ========================
// T216: TestProcessPayment_OrderNotFound
// ========================

func TestProcessPayment_OrderNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	userID := uuid.New()

	// Expect transaction start
	mock.ExpectBegin()

	// Mock order not found
	mock.ExpectQuery("SELECT total_amount, status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnError(sql.ErrNoRows)

	// Expect rollback
	mock.ExpectRollback()

	reqBody := models.ProcessPaymentRequest{
		PaymentMethod: "cash",
		Amount:        200000.00,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}
	setPaymentUserContext(c, userID, "counter1", "counter")

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Order not found", response.Message)
}

func TestProcessPayment_InvalidOrderID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	userID := uuid.New()

	reqBody := models.ProcessPaymentRequest{
		PaymentMethod: "cash",
		Amount:        200000.00,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/invalid-uuid/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: "invalid-uuid"}}
	setPaymentUserContext(c, userID, "counter1", "counter")

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Invalid order ID", response.Message)
}

// ========================
// T217: TestProcessPayment_AlreadyPaid
// ========================

func TestProcessPayment_AlreadyPaid(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	userID := uuid.New()

	// Expect transaction start
	mock.ExpectBegin()

	// Mock order query
	mock.ExpectQuery("SELECT total_amount, status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"total_amount", "status"}).AddRow(200000.00, "pending"))

	// Mock total paid query - already fully paid
	mock.ExpectQuery("SELECT COALESCE\\(SUM\\(amount\\), 0\\)").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"sum"}).AddRow(200000.00))

	// Expect rollback
	mock.ExpectRollback()

	reqBody := models.ProcessPaymentRequest{
		PaymentMethod: "cash",
		Amount:        50000.00,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}
	setPaymentUserContext(c, userID, "counter1", "counter")

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Order is already fully paid", response.Message)
}

func TestProcessPayment_OrderCancelled(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	userID := uuid.New()

	// Expect transaction start
	mock.ExpectBegin()

	// Mock order query - order is cancelled
	mock.ExpectQuery("SELECT total_amount, status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"total_amount", "status"}).AddRow(200000.00, "cancelled"))

	// Expect rollback
	mock.ExpectRollback()

	reqBody := models.ProcessPaymentRequest{
		PaymentMethod: "cash",
		Amount:        200000.00,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}
	setPaymentUserContext(c, userID, "counter1", "counter")

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Contains(t, response.Message, "Order cannot be paid")
}

func TestProcessPayment_OrderCompleted(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	userID := uuid.New()

	// Expect transaction start
	mock.ExpectBegin()

	// Mock order query - order is completed
	mock.ExpectQuery("SELECT total_amount, status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"total_amount", "status"}).AddRow(200000.00, "completed"))

	// Expect rollback
	mock.ExpectRollback()

	reqBody := models.ProcessPaymentRequest{
		PaymentMethod: "cash",
		Amount:        200000.00,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}
	setPaymentUserContext(c, userID, "counter1", "counter")

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
}

// ========================
// T218: TestGetPayment_Success
// ========================

func TestGetPayments_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	paymentID := uuid.New()
	userID := uuid.New()
	now := time.Now()

	// Mock order exists check
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// Mock payments query
	mock.ExpectQuery("SELECT p.id, p.payment_method, p.amount").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "payment_method", "amount", "reference_number", "status",
			"processed_by", "processed_at", "created_at",
			"username", "first_name", "last_name",
		}).AddRow(
			paymentID, "cash", 200000.00, nil, "completed",
			userID, now, now,
			"counter1", "Counter", "Staff",
		))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/orders/"+orderID.String()+"/payments", nil)
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.GetPayments(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Payments retrieved successfully", response.Message)
}

func TestGetPayments_OrderNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()

	// Mock order does not exist
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/orders/"+orderID.String()+"/payments", nil)
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.GetPayments(c)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Order not found", response.Message)
}

// ========================
// T219: TestListPayments_ByOrder
// ========================

func TestListPayments_ByOrder(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	paymentID1 := uuid.New()
	paymentID2 := uuid.New()
	userID := uuid.New()
	now := time.Now()

	// Mock order exists check
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// Mock payments query - multiple payments for split payment scenario
	mock.ExpectQuery("SELECT p.id, p.payment_method, p.amount").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "payment_method", "amount", "reference_number", "status",
			"processed_by", "processed_at", "created_at",
			"username", "first_name", "last_name",
		}).
			AddRow(paymentID1, "cash", 100000.00, nil, "completed", userID, now, now, "counter1", "Counter", "One").
			AddRow(paymentID2, "credit_card", 100000.00, "REF-001", "completed", userID, now, now, "counter1", "Counter", "One"))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/orders/"+orderID.String()+"/payments", nil)
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.GetPayments(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	// Verify multiple payments returned
	payments, ok := response.Data.([]interface{})
	assert.True(t, ok)
	assert.Equal(t, 2, len(payments))
}

// Additional tests

func TestGetPaymentSummary_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()

	// Mock payment summary query
	mock.ExpectQuery("SELECT").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{
			"total_amount", "total_paid", "pending_amount", "payment_count",
		}).AddRow(300000.00, 200000.00, 0.00, 2))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/orders/"+orderID.String()+"/payments/summary", nil)
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.GetPaymentSummary(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Payment summary retrieved successfully", response.Message)
}

func TestGetPaymentSummary_OrderNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()

	// Mock payment summary query returns no rows
	mock.ExpectQuery("SELECT").
		WithArgs(orderID).
		WillReturnError(sql.ErrNoRows)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/orders/"+orderID.String()+"/payments/summary", nil)
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.GetPaymentSummary(c)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Order not found", response.Message)
}

func TestProcessPayment_Unauthenticated(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()

	reqBody := models.ProcessPaymentRequest{
		PaymentMethod: "cash",
		Amount:        200000.00,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}
	// Not setting user context - unauthenticated

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Authentication required", response.Message)
}

func TestProcessPayment_DigitalWallet_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewPaymentHandler(db)

	orderID := uuid.New()
	userID := uuid.New()
	paymentID := uuid.New()
	now := time.Now()

	// Expect transaction start
	mock.ExpectBegin()

	// Mock order query
	mock.ExpectQuery("SELECT total_amount, status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"total_amount", "status"}).AddRow(150000.00, "ready"))

	// Mock total paid query
	mock.ExpectQuery("SELECT COALESCE\\(SUM\\(amount\\), 0\\)").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"sum"}).AddRow(0.00))

	// Mock payment insert
	mock.ExpectExec("INSERT INTO payments").
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Mock order update
	mock.ExpectExec("UPDATE orders").
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock table update
	mock.ExpectExec("UPDATE dining_tables").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// Mock status history
	mock.ExpectExec("INSERT INTO order_status_history").
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Expect transaction commit
	mock.ExpectCommit()

	// Mock fetch payment
	mock.ExpectQuery("SELECT p.id, p.order_id, p.payment_method").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "order_id", "payment_method", "amount", "reference_number",
			"status", "processed_by", "processed_at", "created_at",
			"username", "first_name", "last_name",
		}).AddRow(
			paymentID, orderID, "digital_wallet", 150000.00, "GOPAY-123",
			"completed", userID, now, now,
			"counter1", "Counter", "Staff",
		))

	reqBody := models.ProcessPaymentRequest{
		PaymentMethod:   "digital_wallet",
		Amount:          150000.00,
		ReferenceNumber: stringPtr("GOPAY-123"),
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/payments", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}
	setPaymentUserContext(c, userID, "counter1", "counter")

	handler.ProcessPayment(c)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
}
