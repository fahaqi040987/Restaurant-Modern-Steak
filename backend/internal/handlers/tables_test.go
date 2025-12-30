package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pos-public/internal/handlers/testutil"
	"pos-public/internal/models"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ========================
// GetTables Tests (T242, T246)
// ========================

func TestGetTables_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	// Setup mock data
	tableID := uuid.MustParse(testutil.TestTableID1)
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "table_number", "seating_capacity", "location", "is_occupied",
		"qr_code", "created_at", "updated_at",
		"order_id", "order_number", "customer_name", "order_status", "order_created_at", "total_amount",
	}).AddRow(
		tableID, "T01", 4, "Indoor", false,
		"qr-t01", now, now,
		nil, nil, nil, nil, nil, nil,
	)

	mock.ExpectQuery("SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied").
		WillReturnRows(rows)

	// Create test request
	router := gin.New()
	router.GET("/tables", handler.GetTables)

	req, _ := http.NewRequest("GET", "/tables", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Tables retrieved successfully", response.Message)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetTables_WithOccupiedOrder(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	tableID := uuid.MustParse(testutil.TestTableID2)
	orderID := uuid.MustParse(testutil.TestOrderID1)
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "table_number", "seating_capacity", "location", "is_occupied",
		"qr_code", "created_at", "updated_at",
		"order_id", "order_number", "customer_name", "order_status", "order_created_at", "total_amount",
	}).AddRow(
		tableID, "T02", 6, "Outdoor", true,
		"qr-t02", now, now,
		orderID.String(), "ORD-001", "Budi Santoso", "pending", now, 200000.0,
	)

	mock.ExpectQuery("SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied").
		WillReturnRows(rows)

	router := gin.New()
	router.GET("/tables", handler.GetTables)

	req, _ := http.NewRequest("GET", "/tables", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	// Verify table data is returned
	data, ok := response.Data.([]interface{})
	assert.True(t, ok)
	assert.Len(t, data, 1)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetTables_FilterByAvailable(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	tableID := uuid.MustParse(testutil.TestTableID1)
	now := time.Now()

	// Only available tables should be returned
	rows := sqlmock.NewRows([]string{
		"id", "table_number", "seating_capacity", "location", "is_occupied",
		"qr_code", "created_at", "updated_at",
		"order_id", "order_number", "customer_name", "order_status", "order_created_at", "total_amount",
	}).AddRow(
		tableID, "T01", 4, "Indoor", false,
		"qr-t01", now, now,
		nil, nil, nil, nil, nil, nil,
	)

	// Expect query with available_only filter
	mock.ExpectQuery("SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied").
		WillReturnRows(rows)

	router := gin.New()
	router.GET("/tables", handler.GetTables)

	req, _ := http.NewRequest("GET", "/tables?available_only=true", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetTables_FilterByOccupied(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	tableID := uuid.MustParse(testutil.TestTableID2)
	orderID := uuid.MustParse(testutil.TestOrderID1)
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "table_number", "seating_capacity", "location", "is_occupied",
		"qr_code", "created_at", "updated_at",
		"order_id", "order_number", "customer_name", "order_status", "order_created_at", "total_amount",
	}).AddRow(
		tableID, "T02", 6, "Outdoor", true,
		"qr-t02", now, now,
		orderID.String(), "ORD-001", "Budi Santoso", "pending", now, 200000.0,
	)

	mock.ExpectQuery("SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied").
		WillReturnRows(rows)

	router := gin.New()
	router.GET("/tables", handler.GetTables)

	req, _ := http.NewRequest("GET", "/tables?occupied_only=true", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetTables_FilterByLocation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	tableID := uuid.MustParse(testutil.TestTableID1)
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "table_number", "seating_capacity", "location", "is_occupied",
		"qr_code", "created_at", "updated_at",
		"order_id", "order_number", "customer_name", "order_status", "order_created_at", "total_amount",
	}).AddRow(
		tableID, "T01", 4, "Indoor", false,
		"qr-t01", now, now,
		nil, nil, nil, nil, nil, nil,
	)

	mock.ExpectQuery("SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied").
		WithArgs("%Indoor%").
		WillReturnRows(rows)

	router := gin.New()
	router.GET("/tables", handler.GetTables)

	req, _ := http.NewRequest("GET", "/tables?location=Indoor", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetTables_DatabaseError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	mock.ExpectQuery("SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied").
		WillReturnError(sql.ErrConnDone)

	router := gin.New()
	router.GET("/tables", handler.GetTables)

	req, _ := http.NewRequest("GET", "/tables", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Failed to fetch tables", response.Message)

	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// GetTable Tests (T244)
// ========================

func TestGetTable_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	tableID := uuid.MustParse(testutil.TestTableID1)
	now := time.Now()

	// Mock table query
	tableRows := sqlmock.NewRows([]string{
		"id", "table_number", "seating_capacity", "location", "is_occupied", "qr_code", "created_at", "updated_at",
	}).AddRow(tableID, "T01", 4, "Indoor", false, "qr-t01", now, now)

	mock.ExpectQuery("SELECT id, table_number, seating_capacity, location, is_occupied, qr_code, created_at, updated_at").
		WithArgs(tableID).
		WillReturnRows(tableRows)

	// Mock order query - no current order
	mock.ExpectQuery("SELECT o.id, o.order_number, o.customer_name, o.order_type, o.status").
		WithArgs(tableID).
		WillReturnError(sql.ErrNoRows)

	router := gin.New()
	router.GET("/tables/:id", handler.GetTable)

	req, _ := http.NewRequest("GET", "/tables/"+tableID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Table retrieved successfully", response.Message)

	// Verify response data contains table info
	data, ok := response.Data.(map[string]interface{})
	assert.True(t, ok)
	assert.Equal(t, "T01", data["table_number"])
	assert.Equal(t, float64(4), data["seating_capacity"])

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetTable_WithCurrentOrder(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	tableID := uuid.MustParse(testutil.TestTableID2)
	orderID := uuid.MustParse(testutil.TestOrderID1)
	now := time.Now()

	// Mock table query - occupied table
	tableRows := sqlmock.NewRows([]string{
		"id", "table_number", "seating_capacity", "location", "is_occupied", "qr_code", "created_at", "updated_at",
	}).AddRow(tableID, "T02", 6, "Outdoor", true, "qr-t02", now, now)

	mock.ExpectQuery("SELECT id, table_number, seating_capacity, location, is_occupied, qr_code, created_at, updated_at").
		WithArgs(tableID).
		WillReturnRows(tableRows)

	// Mock order query - has current order
	orderRows := sqlmock.NewRows([]string{
		"id", "order_number", "customer_name", "order_type", "status",
		"subtotal", "tax_amount", "total_amount", "created_at", "updated_at",
	}).AddRow(orderID, "ORD-001", "Budi Santoso", "dine_in", "pending", 200000.0, 22000.0, 222000.0, now, now)

	mock.ExpectQuery("SELECT o.id, o.order_number, o.customer_name, o.order_type, o.status").
		WithArgs(tableID).
		WillReturnRows(orderRows)

	router := gin.New()
	router.GET("/tables/:id", handler.GetTable)

	req, _ := http.NewRequest("GET", "/tables/"+tableID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	// Verify current_order is included
	data, ok := response.Data.(map[string]interface{})
	assert.True(t, ok)
	assert.NotNil(t, data["current_order"])

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetTable_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	tableID := uuid.New()

	mock.ExpectQuery("SELECT id, table_number, seating_capacity, location, is_occupied, qr_code, created_at, updated_at").
		WithArgs(tableID).
		WillReturnError(sql.ErrNoRows)

	router := gin.New()
	router.GET("/tables/:id", handler.GetTable)

	req, _ := http.NewRequest("GET", "/tables/"+tableID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Table not found", response.Message)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetTable_InvalidUUID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	router := gin.New()
	router.GET("/tables/:id", handler.GetTable)

	req, _ := http.NewRequest("GET", "/tables/invalid-uuid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Invalid table ID", response.Message)
}

func TestGetTable_DatabaseError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	tableID := uuid.MustParse(testutil.TestTableID1)

	mock.ExpectQuery("SELECT id, table_number, seating_capacity, location, is_occupied, qr_code, created_at, updated_at").
		WithArgs(tableID).
		WillReturnError(sql.ErrConnDone)

	router := gin.New()
	router.GET("/tables/:id", handler.GetTable)

	req, _ := http.NewRequest("GET", "/tables/"+tableID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Failed to fetch table", response.Message)

	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// GetTablesByLocation Tests
// ========================

func TestGetTablesByLocation_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	tableID1 := uuid.MustParse(testutil.TestTableID1)
	tableID2 := uuid.MustParse(testutil.TestTableID2)
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "table_number", "seating_capacity", "location", "is_occupied",
		"qr_code", "created_at", "updated_at",
		"order_id", "order_number", "customer_name", "order_status",
	}).
		AddRow(tableID1, "T01", 4, "Indoor", false, "qr-t01", now, now, nil, nil, nil, nil).
		AddRow(tableID2, "T02", 6, "Outdoor", true, "qr-t02", now, now, nil, nil, nil, nil)

	mock.ExpectQuery("SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied").
		WillReturnRows(rows)

	router := gin.New()
	router.GET("/tables/by-location", handler.GetTablesByLocation)

	req, _ := http.NewRequest("GET", "/tables/by-location", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Tables grouped by location retrieved successfully", response.Message)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetTablesByLocation_DatabaseError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	mock.ExpectQuery("SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied").
		WillReturnError(sql.ErrConnDone)

	router := gin.New()
	router.GET("/tables/by-location", handler.GetTablesByLocation)

	req, _ := http.NewRequest("GET", "/tables/by-location", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Failed to fetch tables", response.Message)

	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// GetTableStatus Tests
// ========================

func TestGetTableStatus_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	rows := sqlmock.NewRows([]string{
		"total_tables", "occupied_tables", "available_tables", "location",
	}).
		AddRow(5, 2, 3, "Indoor").
		AddRow(3, 1, 2, "Outdoor")

	mock.ExpectQuery("SELECT").
		WillReturnRows(rows)

	router := gin.New()
	router.GET("/tables/status", handler.GetTableStatus)

	req, _ := http.NewRequest("GET", "/tables/status", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Table status retrieved successfully", response.Message)

	// Verify aggregated data
	data, ok := response.Data.(map[string]interface{})
	assert.True(t, ok)
	assert.Equal(t, float64(8), data["total_tables"])
	assert.Equal(t, float64(3), data["occupied_tables"])
	assert.Equal(t, float64(5), data["available_tables"])

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetTableStatus_DatabaseError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	mock.ExpectQuery("SELECT").
		WillReturnError(sql.ErrConnDone)

	router := gin.New()
	router.GET("/tables/status", handler.GetTableStatus)

	req, _ := http.NewRequest("GET", "/tables/status", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Failed to fetch table status", response.Message)

	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// Empty Results Tests
// ========================

func TestGetTables_EmptyResults(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	// Empty result set
	rows := sqlmock.NewRows([]string{
		"id", "table_number", "seating_capacity", "location", "is_occupied",
		"qr_code", "created_at", "updated_at",
		"order_id", "order_number", "customer_name", "order_status", "order_created_at", "total_amount",
	})

	mock.ExpectQuery("SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied").
		WillReturnRows(rows)

	router := gin.New()
	router.GET("/tables", handler.GetTables)

	req, _ := http.NewRequest("GET", "/tables", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	// Empty array is valid response
	assert.Nil(t, response.Data)

	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// QR Code Tests
// ========================

func TestGetTable_WithQRCode(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	tableID := uuid.MustParse(testutil.TestTableID1)
	now := time.Now()

	tableRows := sqlmock.NewRows([]string{
		"id", "table_number", "seating_capacity", "location", "is_occupied", "qr_code", "created_at", "updated_at",
	}).AddRow(tableID, "T01", 4, "Indoor", false, "https://menu.steakkenangan.com/table/T01", now, now)

	mock.ExpectQuery("SELECT id, table_number, seating_capacity, location, is_occupied, qr_code, created_at, updated_at").
		WithArgs(tableID).
		WillReturnRows(tableRows)

	mock.ExpectQuery("SELECT o.id, o.order_number, o.customer_name, o.order_type, o.status").
		WithArgs(tableID).
		WillReturnError(sql.ErrNoRows)

	router := gin.New()
	router.GET("/tables/:id", handler.GetTable)

	req, _ := http.NewRequest("GET", "/tables/"+tableID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	// Verify QR code is included
	data, ok := response.Data.(map[string]interface{})
	assert.True(t, ok)
	assert.Equal(t, "https://menu.steakkenangan.com/table/T01", data["qr_code"])

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetTable_WithNullQRCode(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewTableHandler(db)

	tableID := uuid.MustParse(testutil.TestTableID1)
	now := time.Now()

	tableRows := sqlmock.NewRows([]string{
		"id", "table_number", "seating_capacity", "location", "is_occupied", "qr_code", "created_at", "updated_at",
	}).AddRow(tableID, "T01", 4, "Indoor", false, nil, now, now)

	mock.ExpectQuery("SELECT id, table_number, seating_capacity, location, is_occupied, qr_code, created_at, updated_at").
		WithArgs(tableID).
		WillReturnRows(tableRows)

	mock.ExpectQuery("SELECT o.id, o.order_number, o.customer_name, o.order_type, o.status").
		WithArgs(tableID).
		WillReturnError(sql.ErrNoRows)

	router := gin.New()
	router.GET("/tables/:id", handler.GetTable)

	req, _ := http.NewRequest("GET", "/tables/"+tableID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	// QR code should be nil
	data, ok := response.Data.(map[string]interface{})
	assert.True(t, ok)
	assert.Nil(t, data["qr_code"])

	assert.NoError(t, mock.ExpectationsWereMet())
}
