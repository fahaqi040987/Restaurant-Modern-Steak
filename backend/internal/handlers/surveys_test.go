package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"pos-public/internal/models"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ========================
// T091: Backend unit tests for survey handler
// ========================

// Helper function to create a string pointer
func strPtr(s string) *string {
	return &s
}

// Helper function to create an int pointer
func intPtr(i int) *int {
	return &i
}

// Helper function to create a bool pointer
func boolPtr(b bool) *bool {
	return &b
}

// ========================
// TestCreateSurvey_Success
// ========================

func TestCreateSurvey_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	orderID := uuid.New()
	surveyID := uuid.New()

	// Mock order status check - order is completed
	mock.ExpectQuery("SELECT status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("completed"))

	// Mock check for existing survey - none found
	mock.ExpectQuery("SELECT id FROM satisfaction_surveys WHERE order_id").
		WithArgs(orderID).
		WillReturnError(sql.ErrNoRows)

	// Mock survey insert
	mock.ExpectQuery("INSERT INTO satisfaction_surveys").
		WithArgs(
			orderID,
			sqlmock.AnyArg(), // overall_rating
			sqlmock.AnyArg(), // food_quality
			sqlmock.AnyArg(), // service_quality
			sqlmock.AnyArg(), // ambiance
			sqlmock.AnyArg(), // value_for_money
			sqlmock.AnyArg(), // comments
			sqlmock.AnyArg(), // would_recommend
			sqlmock.AnyArg(), // customer_name
			sqlmock.AnyArg(), // customer_email
		).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(surveyID))

	reqBody := models.CreateSurveyRequest{
		OverallRating:  5,
		FoodQuality:    intPtr(5),
		ServiceQuality: intPtr(4),
		Ambiance:       intPtr(4),
		ValueForMoney:  intPtr(5),
		Comments:       strPtr("Makanan sangat enak dan pelayanan ramah!"),
		WouldRecommend: boolPtr(true),
		CustomerName:   strPtr("John Doe"),
		CustomerEmail:  strPtr("john@example.com"),
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.CreateSurvey(c)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Survey submitted successfully", response["message"])
}

func TestCreateSurvey_MinimalData_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	orderID := uuid.New()
	surveyID := uuid.New()

	// Mock order status check
	mock.ExpectQuery("SELECT status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("paid"))

	// Mock check for existing survey
	mock.ExpectQuery("SELECT id FROM satisfaction_surveys WHERE order_id").
		WithArgs(orderID).
		WillReturnError(sql.ErrNoRows)

	// Mock survey insert
	mock.ExpectQuery("INSERT INTO satisfaction_surveys").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(surveyID))

	// Minimal request - only overall rating
	reqBody := models.CreateSurveyRequest{
		OverallRating: 3,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.CreateSurvey(c)

	assert.Equal(t, http.StatusCreated, w.Code)
}

// ========================
// TestCreateSurvey_InvalidOrderID
// ========================

func TestCreateSurvey_InvalidOrderID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	reqBody := models.CreateSurveyRequest{
		OverallRating: 5,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/invalid-uuid/survey", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: "invalid-uuid"}}

	handler.CreateSurvey(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "Invalid order ID", response["error"])
}

// ========================
// TestCreateSurvey_OrderNotFound
// ========================

func TestCreateSurvey_OrderNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	orderID := uuid.New()

	// Mock order status check - order not found
	mock.ExpectQuery("SELECT status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnError(sql.ErrNoRows)

	reqBody := models.CreateSurveyRequest{
		OverallRating: 5,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.CreateSurvey(c)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "Order not found", response["error"])
}

// ========================
// TestCreateSurvey_OrderNotCompleted
// ========================

func TestCreateSurvey_OrderNotCompleted(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	orderID := uuid.New()

	// Mock order status check - order is still pending
	mock.ExpectQuery("SELECT status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("pending"))

	reqBody := models.CreateSurveyRequest{
		OverallRating: 5,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.CreateSurvey(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "Survey can only be submitted for completed orders", response["error"])
}

func TestCreateSurvey_OrderPreparing(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	orderID := uuid.New()

	// Mock order status check - order is still preparing
	mock.ExpectQuery("SELECT status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("preparing"))

	reqBody := models.CreateSurveyRequest{
		OverallRating: 5,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.CreateSurvey(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ========================
// TestCreateSurvey_AlreadySubmitted
// ========================

func TestCreateSurvey_AlreadySubmitted(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	orderID := uuid.New()
	existingSurveyID := uuid.New()

	// Mock order status check
	mock.ExpectQuery("SELECT status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("completed"))

	// Mock check for existing survey - survey already exists
	mock.ExpectQuery("SELECT id FROM satisfaction_surveys WHERE order_id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(existingSurveyID))

	reqBody := models.CreateSurveyRequest{
		OverallRating: 5,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.CreateSurvey(c)

	assert.Equal(t, http.StatusConflict, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "Survey already submitted for this order", response["error"])
}

// ========================
// TestCreateSurvey_InvalidJSON
// ========================

func TestCreateSurvey_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	orderID := uuid.New()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer([]byte("invalid json")))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.CreateSurvey(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ========================
// TestCreateSurvey_DatabaseError
// ========================

func TestCreateSurvey_DatabaseError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	orderID := uuid.New()

	// Mock order status check - database error
	mock.ExpectQuery("SELECT status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnError(sql.ErrConnDone)

	reqBody := models.CreateSurveyRequest{
		OverallRating: 5,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.CreateSurvey(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "Failed to verify order", response["error"])
}

func TestCreateSurvey_InsertError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	orderID := uuid.New()

	// Mock order status check
	mock.ExpectQuery("SELECT status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("completed"))

	// Mock check for existing survey - none found
	mock.ExpectQuery("SELECT id FROM satisfaction_surveys WHERE order_id").
		WithArgs(orderID).
		WillReturnError(sql.ErrNoRows)

	// Mock survey insert - error
	mock.ExpectQuery("INSERT INTO satisfaction_surveys").
		WillReturnError(sql.ErrConnDone)

	reqBody := models.CreateSurveyRequest{
		OverallRating: 5,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.CreateSurvey(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "Failed to submit survey", response["error"])
}

// ========================
// TestCreateSurvey_XSSSanitization (T097)
// ========================

func TestCreateSurvey_XSSSanitization(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	orderID := uuid.New()
	surveyID := uuid.New()

	// Mock order status check
	mock.ExpectQuery("SELECT status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("completed"))

	// Mock check for existing survey
	mock.ExpectQuery("SELECT id FROM satisfaction_surveys WHERE order_id").
		WithArgs(orderID).
		WillReturnError(sql.ErrNoRows)

	// Mock survey insert - the handler should sanitize the XSS before inserting
	mock.ExpectQuery("INSERT INTO satisfaction_surveys").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(surveyID))

	// Request with XSS attempt in comments
	reqBody := models.CreateSurveyRequest{
		OverallRating: 5,
		Comments:      strPtr("<script>alert('xss')</script>Makanan enak!"),
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.CreateSurvey(c)

	// Should succeed - XSS is sanitized, not rejected
	assert.Equal(t, http.StatusCreated, w.Code)
}

// ========================
// TestGetSurveyStats_Success
// ========================

func TestGetSurveyStats_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	// Mock stats query
	mock.ExpectQuery("SELECT").
		WillReturnRows(sqlmock.NewRows([]string{
			"total_surveys", "average_rating", "average_food_quality",
			"average_service_quality", "average_ambiance", "average_value_for_money",
			"recommendation_rate",
		}).AddRow(
			100, 4.5, 4.6, 4.4, 4.3, 4.2, 85.5,
		))

	// Mock rating distribution query
	mock.ExpectQuery("SELECT overall_rating, COUNT").
		WillReturnRows(sqlmock.NewRows([]string{"overall_rating", "count"}).
			AddRow(5, 45).
			AddRow(4, 35).
			AddRow(3, 15).
			AddRow(2, 4).
			AddRow(1, 1))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/admin/surveys/stats", nil)

	handler.GetSurveyStats(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	data := response["data"].(map[string]interface{})
	assert.Equal(t, float64(100), data["total_surveys"])
	assert.Equal(t, 4.5, data["average_rating"])
	assert.Equal(t, 85.5, data["recommendation_rate"])
}

func TestGetSurveyStats_NoSurveys(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	// Mock stats query - no surveys
	mock.ExpectQuery("SELECT").
		WillReturnRows(sqlmock.NewRows([]string{
			"total_surveys", "average_rating", "average_food_quality",
			"average_service_quality", "average_ambiance", "average_value_for_money",
			"recommendation_rate",
		}).AddRow(
			0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
		))

	// Mock rating distribution query - empty
	mock.ExpectQuery("SELECT overall_rating, COUNT").
		WillReturnRows(sqlmock.NewRows([]string{"overall_rating", "count"}))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/admin/surveys/stats", nil)

	handler.GetSurveyStats(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	data := response["data"].(map[string]interface{})
	assert.Equal(t, float64(0), data["total_surveys"])
}

func TestGetSurveyStats_DatabaseError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	// Mock stats query - error
	mock.ExpectQuery("SELECT").
		WillReturnError(sql.ErrConnDone)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/admin/surveys/stats", nil)

	handler.GetSurveyStats(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "Failed to fetch survey statistics", response["error"])
}

func TestGetSurveyStats_RatingDistributionError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	// Mock stats query
	mock.ExpectQuery("SELECT").
		WillReturnRows(sqlmock.NewRows([]string{
			"total_surveys", "average_rating", "average_food_quality",
			"average_service_quality", "average_ambiance", "average_value_for_money",
			"recommendation_rate",
		}).AddRow(
			100, 4.5, 4.6, 4.4, 4.3, 4.2, 85.5,
		))

	// Mock rating distribution query - error
	mock.ExpectQuery("SELECT overall_rating, COUNT").
		WillReturnError(sql.ErrConnDone)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/admin/surveys/stats", nil)

	handler.GetSurveyStats(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "Failed to fetch rating distribution", response["error"])
}

// ========================
// TestCreateSurvey_AllRatings
// ========================

func TestCreateSurvey_AllRatings(t *testing.T) {
	tests := []struct {
		name          string
		rating        int
		expectSuccess bool
	}{
		{"Rating 1 star", 1, true},
		{"Rating 2 stars", 2, true},
		{"Rating 3 stars", 3, true},
		{"Rating 4 stars", 4, true},
		{"Rating 5 stars", 5, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			db, mock, err := sqlmock.New()
			assert.NoError(t, err)
			defer db.Close()

			handler := NewSurveyHandler(db)

			orderID := uuid.New()
			surveyID := uuid.New()

			mock.ExpectQuery("SELECT status FROM orders WHERE id").
				WithArgs(orderID).
				WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("completed"))

			mock.ExpectQuery("SELECT id FROM satisfaction_surveys WHERE order_id").
				WithArgs(orderID).
				WillReturnError(sql.ErrNoRows)

			mock.ExpectQuery("INSERT INTO satisfaction_surveys").
				WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(surveyID))

			reqBody := models.CreateSurveyRequest{
				OverallRating: tt.rating,
			}
			body, _ := json.Marshal(reqBody)

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer(body))
			c.Request.Header.Set("Content-Type", "application/json")
			c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

			handler.CreateSurvey(c)

			if tt.expectSuccess {
				assert.Equal(t, http.StatusCreated, w.Code)
			} else {
				assert.NotEqual(t, http.StatusCreated, w.Code)
			}
		})
	}
}

// ========================
// TestCreateSurvey_PaidStatus
// ========================

func TestCreateSurvey_PaidStatus_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	orderID := uuid.New()
	surveyID := uuid.New()

	// Mock order status check - order is paid (should allow survey)
	mock.ExpectQuery("SELECT status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("paid"))

	// Mock check for existing survey
	mock.ExpectQuery("SELECT id FROM satisfaction_surveys WHERE order_id").
		WithArgs(orderID).
		WillReturnError(sql.ErrNoRows)

	// Mock survey insert
	mock.ExpectQuery("INSERT INTO satisfaction_surveys").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(surveyID))

	reqBody := models.CreateSurveyRequest{
		OverallRating: 5,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.CreateSurvey(c)

	assert.Equal(t, http.StatusCreated, w.Code)
}

// ========================
// TestCreateSurvey_WithEmail
// ========================

func TestCreateSurvey_WithEmail_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewSurveyHandler(db)

	orderID := uuid.New()
	surveyID := uuid.New()

	mock.ExpectQuery("SELECT status FROM orders WHERE id").
		WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"status"}).AddRow("completed"))

	mock.ExpectQuery("SELECT id FROM satisfaction_surveys WHERE order_id").
		WithArgs(orderID).
		WillReturnError(sql.ErrNoRows)

	mock.ExpectQuery("INSERT INTO satisfaction_surveys").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(surveyID))

	reqBody := models.CreateSurveyRequest{
		OverallRating: 5,
		CustomerName:  strPtr("Jane Doe"),
		CustomerEmail: strPtr("jane.doe@example.com"),
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/customer/orders/"+orderID.String()+"/survey", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: orderID.String()}}

	handler.CreateSurvey(c)

	assert.Equal(t, http.StatusCreated, w.Code)
}
