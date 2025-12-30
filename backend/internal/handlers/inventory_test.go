package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pos-public/internal/handlers/testutil"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ========================
// GetInventory Tests (T249, T253)
// ========================

func TestGetInventory_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "name", "category_name",
		"current_stock", "min_stock", "max_stock",
		"unit", "last_restocked", "price", "status",
	}).AddRow(
		productID, "Rendang Wagyu", "Steak",
		50, 10, 100,
		"pcs", now, 185000.0, "ok",
	)

	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	router := gin.New()
	router.GET("/inventory", handler.GetInventory)

	req, _ := http.NewRequest("GET", "/inventory", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var items []InventoryItem
	err = json.Unmarshal(w.Body.Bytes(), &items)
	assert.NoError(t, err)
	assert.Len(t, items, 1)
	assert.Equal(t, "Rendang Wagyu", items[0].ProductName)
	assert.Equal(t, 50, items[0].CurrentStock)
	assert.Equal(t, "ok", items[0].Status)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetInventory_EmptyList(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	rows := sqlmock.NewRows([]string{
		"id", "name", "category_name",
		"current_stock", "min_stock", "max_stock",
		"unit", "last_restocked", "price", "status",
	})

	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	router := gin.New()
	router.GET("/inventory", handler.GetInventory)

	req, _ := http.NewRequest("GET", "/inventory", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var items []InventoryItem
	err = json.Unmarshal(w.Body.Bytes(), &items)
	assert.NoError(t, err)
	assert.Len(t, items, 0)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetInventory_DatabaseError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrConnDone)

	router := gin.New()
	router.GET("/inventory", handler.GetInventory)

	req, _ := http.NewRequest("GET", "/inventory", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetInventory_MultipleItems(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID1 := uuid.MustParse(testutil.TestProductID1)
	productID2 := uuid.MustParse(testutil.TestProductID2)
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "name", "category_name",
		"current_stock", "min_stock", "max_stock",
		"unit", "last_restocked", "price", "status",
	}).
		AddRow(productID1, "Rendang Wagyu", "Steak", 5, 10, 100, "pcs", now, 185000.0, "low").
		AddRow(productID2, "Es Teh Manis", "Beverages", 100, 20, 200, "pcs", now, 15000.0, "ok")

	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	router := gin.New()
	router.GET("/inventory", handler.GetInventory)

	req, _ := http.NewRequest("GET", "/inventory", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var items []InventoryItem
	err = json.Unmarshal(w.Body.Bytes(), &items)
	assert.NoError(t, err)
	assert.Len(t, items, 2)

	// First item should be low stock (sorted by status DESC)
	assert.Equal(t, "low", items[0].Status)
	assert.Equal(t, "ok", items[1].Status)

	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// GetProductInventory Tests (T253)
// ========================

func TestGetProductInventory_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "name", "category_name",
		"current_stock", "min_stock", "max_stock",
		"unit", "last_restocked", "price", "status",
	}).AddRow(
		productID, "Rendang Wagyu", "Steak",
		50, 10, 100,
		"pcs", now, 185000.0, "ok",
	)

	mock.ExpectQuery("SELECT").
		WithArgs(productID.String()).
		WillReturnRows(rows)

	router := gin.New()
	router.GET("/inventory/:product_id", handler.GetProductInventory)

	req, _ := http.NewRequest("GET", "/inventory/"+productID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var item InventoryItem
	err = json.Unmarshal(w.Body.Bytes(), &item)
	assert.NoError(t, err)
	assert.Equal(t, productID, item.ProductID)
	assert.Equal(t, "Rendang Wagyu", item.ProductName)
	assert.Equal(t, 50, item.CurrentStock)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetProductInventory_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.New()

	mock.ExpectQuery("SELECT").
		WithArgs(productID.String()).
		WillReturnError(sql.ErrNoRows)

	router := gin.New()
	router.GET("/inventory/:product_id", handler.GetProductInventory)

	req, _ := http.NewRequest("GET", "/inventory/"+productID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response map[string]string
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Product not found", response["error"])

	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// AdjustStock Tests (T250, T251, T252)
// ========================

func TestAdjustStock_Add_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)
	inventoryID := uuid.MustParse(testutil.TestInventoryID1)
	userID := uuid.MustParse(testutil.TestAdminID)

	// Mock transaction begin
	mock.ExpectBegin()

	// Mock inventory check
	rows := sqlmock.NewRows([]string{"id", "current_stock"}).
		AddRow(inventoryID, 50)
	mock.ExpectQuery("SELECT id, current_stock FROM inventory").
		WithArgs(productID).
		WillReturnRows(rows)

	// Mock update inventory
	mock.ExpectExec("UPDATE inventory").
		WithArgs(70, productID). // 50 + 20 = 70
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock create history record
	mock.ExpectExec("INSERT INTO inventory_history").
		WithArgs(productID, "add", 20, 50, 70, "purchase", "Restocking", userID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock commit
	mock.ExpectCommit()

	// Mock low stock check query
	stockRows := sqlmock.NewRows([]string{"name", "minimum_stock"}).
		AddRow("Rendang Wagyu", 10)
	mock.ExpectQuery("SELECT p.name, COALESCE").
		WithArgs(productID).
		WillReturnRows(stockRows)

	router := gin.New()
	router.POST("/inventory/adjust", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.AdjustStock(c)
	})

	body := `{
		"product_id": "` + productID.String() + `",
		"operation": "add",
		"quantity": 20,
		"reason": "purchase",
		"notes": "Restocking"
	}`

	req, _ := http.NewRequest("POST", "/inventory/adjust", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Stock adjusted successfully", response["message"])
	assert.Equal(t, float64(50), response["previous_stock"])
	assert.Equal(t, float64(70), response["new_stock"])

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestAdjustStock_Remove_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)
	inventoryID := uuid.MustParse(testutil.TestInventoryID1)
	userID := uuid.MustParse(testutil.TestAdminID)

	// Mock transaction begin
	mock.ExpectBegin()

	// Mock inventory check
	rows := sqlmock.NewRows([]string{"id", "current_stock"}).
		AddRow(inventoryID, 50)
	mock.ExpectQuery("SELECT id, current_stock FROM inventory").
		WithArgs(productID).
		WillReturnRows(rows)

	// Mock update inventory
	mock.ExpectExec("UPDATE inventory").
		WithArgs(40, productID). // 50 - 10 = 40
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock create history record
	mock.ExpectExec("INSERT INTO inventory_history").
		WithArgs(productID, "remove", 10, 50, 40, "sale", "Order #123", userID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock commit
	mock.ExpectCommit()

	// Mock low stock check query
	stockRows := sqlmock.NewRows([]string{"name", "minimum_stock"}).
		AddRow("Rendang Wagyu", 10)
	mock.ExpectQuery("SELECT p.name, COALESCE").
		WithArgs(productID).
		WillReturnRows(stockRows)

	router := gin.New()
	router.POST("/inventory/adjust", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.AdjustStock(c)
	})

	body := `{
		"product_id": "` + productID.String() + `",
		"operation": "remove",
		"quantity": 10,
		"reason": "sale",
		"notes": "Order #123"
	}`

	req, _ := http.NewRequest("POST", "/inventory/adjust", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Stock adjusted successfully", response["message"])
	assert.Equal(t, float64(50), response["previous_stock"])
	assert.Equal(t, float64(40), response["new_stock"])

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestAdjustStock_InsufficientStock(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)
	inventoryID := uuid.MustParse(testutil.TestInventoryID1)
	userID := uuid.MustParse(testutil.TestAdminID)

	// Mock transaction begin
	mock.ExpectBegin()

	// Mock inventory check - only 5 in stock
	rows := sqlmock.NewRows([]string{"id", "current_stock"}).
		AddRow(inventoryID, 5)
	mock.ExpectQuery("SELECT id, current_stock FROM inventory").
		WithArgs(productID).
		WillReturnRows(rows)

	// Expect rollback since stock is insufficient
	mock.ExpectRollback()

	router := gin.New()
	router.POST("/inventory/adjust", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.AdjustStock(c)
	})

	body := `{
		"product_id": "` + productID.String() + `",
		"operation": "remove",
		"quantity": 10,
		"reason": "sale",
		"notes": "Attempt to remove more than available"
	}`

	req, _ := http.NewRequest("POST", "/inventory/adjust", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]string
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Insufficient stock", response["error"])

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestAdjustStock_InvalidOperation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)
	userID := uuid.MustParse(testutil.TestAdminID)

	router := gin.New()
	router.POST("/inventory/adjust", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.AdjustStock(c)
	})

	body := `{
		"product_id": "` + productID.String() + `",
		"operation": "invalid_operation",
		"quantity": 10,
		"reason": "sale",
		"notes": "Test"
	}`

	req, _ := http.NewRequest("POST", "/inventory/adjust", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]string
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Operation must be 'add' or 'remove'", response["error"])
}

func TestAdjustStock_InvalidReason(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)
	userID := uuid.MustParse(testutil.TestAdminID)

	router := gin.New()
	router.POST("/inventory/adjust", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.AdjustStock(c)
	})

	body := `{
		"product_id": "` + productID.String() + `",
		"operation": "add",
		"quantity": 10,
		"reason": "invalid_reason",
		"notes": "Test"
	}`

	req, _ := http.NewRequest("POST", "/inventory/adjust", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]string
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid reason", response["error"])
}

func TestAdjustStock_Unauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)

	router := gin.New()
	router.POST("/inventory/adjust", handler.AdjustStock)

	body := `{
		"product_id": "` + productID.String() + `",
		"operation": "add",
		"quantity": 10,
		"reason": "purchase",
		"notes": "Test"
	}`

	req, _ := http.NewRequest("POST", "/inventory/adjust", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]string
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "User not authenticated", response["error"])
}

func TestAdjustStock_InvalidBody(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	userID := uuid.MustParse(testutil.TestAdminID)

	router := gin.New()
	router.POST("/inventory/adjust", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.AdjustStock(c)
	})

	// Missing required fields
	body := `{"operation": "add"}`

	req, _ := http.NewRequest("POST", "/inventory/adjust", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdjustStock_CreateNewInventoryRecord(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)
	userID := uuid.MustParse(testutil.TestAdminID)

	// Mock transaction begin
	mock.ExpectBegin()

	// Mock inventory check - no existing record
	mock.ExpectQuery("SELECT id, current_stock FROM inventory").
		WithArgs(productID).
		WillReturnError(sql.ErrNoRows)

	// Mock create new inventory record
	mock.ExpectExec("INSERT INTO inventory").
		WithArgs(sqlmock.AnyArg(), productID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock update inventory
	mock.ExpectExec("UPDATE inventory").
		WithArgs(20, productID). // 0 + 20 = 20
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock create history record
	mock.ExpectExec("INSERT INTO inventory_history").
		WithArgs(productID, "add", 20, 0, 20, "purchase", "Initial stock", userID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock commit
	mock.ExpectCommit()

	// Mock low stock check query
	stockRows := sqlmock.NewRows([]string{"name", "minimum_stock"}).
		AddRow("Rendang Wagyu", 10)
	mock.ExpectQuery("SELECT p.name, COALESCE").
		WithArgs(productID).
		WillReturnRows(stockRows)

	router := gin.New()
	router.POST("/inventory/adjust", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.AdjustStock(c)
	})

	body := `{
		"product_id": "` + productID.String() + `",
		"operation": "add",
		"quantity": 20,
		"reason": "purchase",
		"notes": "Initial stock"
	}`

	req, _ := http.NewRequest("POST", "/inventory/adjust", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Stock adjusted successfully", response["message"])
	assert.Equal(t, float64(0), response["previous_stock"])
	assert.Equal(t, float64(20), response["new_stock"])

	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// GetLowStock Tests (T254)
// ========================

func TestGetLowStock_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "name", "category_name",
		"current_stock", "min_stock", "max_stock",
		"unit", "last_restocked", "price", "status",
	}).AddRow(
		productID, "Rendang Wagyu", "Steak",
		5, 10, 100,
		"pcs", now, 185000.0, "low",
	)

	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	router := gin.New()
	router.GET("/inventory/low-stock", handler.GetLowStock)

	req, _ := http.NewRequest("GET", "/inventory/low-stock", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var items []InventoryItem
	err = json.Unmarshal(w.Body.Bytes(), &items)
	assert.NoError(t, err)
	assert.Len(t, items, 1)
	assert.Equal(t, "Rendang Wagyu", items[0].ProductName)
	assert.Equal(t, 5, items[0].CurrentStock)
	assert.Equal(t, "low", items[0].Status)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetLowStock_OutOfStock(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "name", "category_name",
		"current_stock", "min_stock", "max_stock",
		"unit", "last_restocked", "price", "status",
	}).AddRow(
		productID, "Rendang Wagyu", "Steak",
		0, 10, 100,
		"pcs", now, 185000.0, "out",
	)

	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	router := gin.New()
	router.GET("/inventory/low-stock", handler.GetLowStock)

	req, _ := http.NewRequest("GET", "/inventory/low-stock", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var items []InventoryItem
	err = json.Unmarshal(w.Body.Bytes(), &items)
	assert.NoError(t, err)
	assert.Len(t, items, 1)
	assert.Equal(t, "out", items[0].Status)
	assert.Equal(t, 0, items[0].CurrentStock)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetLowStock_Empty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	rows := sqlmock.NewRows([]string{
		"id", "name", "category_name",
		"current_stock", "min_stock", "max_stock",
		"unit", "last_restocked", "price", "status",
	})

	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	router := gin.New()
	router.GET("/inventory/low-stock", handler.GetLowStock)

	req, _ := http.NewRequest("GET", "/inventory/low-stock", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var items []InventoryItem
	err = json.Unmarshal(w.Body.Bytes(), &items)
	assert.NoError(t, err)
	assert.Len(t, items, 0)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetLowStock_DatabaseError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrConnDone)

	router := gin.New()
	router.GET("/inventory/low-stock", handler.GetLowStock)

	req, _ := http.NewRequest("GET", "/inventory/low-stock", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// GetStockHistory Tests
// ========================

func TestGetStockHistory_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)
	historyID := uuid.New()
	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "operation", "quantity", "previous_stock", "new_stock",
		"reason", "notes", "adjusted_by", "created_at",
	}).AddRow(
		historyID, "add", 20, 50, 70,
		"purchase", "Restocking", "admin", now,
	)

	mock.ExpectQuery("SELECT").
		WithArgs(productID.String()).
		WillReturnRows(rows)

	router := gin.New()
	router.GET("/inventory/:product_id/history", handler.GetStockHistory)

	req, _ := http.NewRequest("GET", "/inventory/"+productID.String()+"/history", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var history []HistoryRecord
	err = json.Unmarshal(w.Body.Bytes(), &history)
	assert.NoError(t, err)
	assert.Len(t, history, 1)
	assert.Equal(t, "add", history[0].Operation)
	assert.Equal(t, 20, history[0].Quantity)
	assert.Equal(t, 50, history[0].PreviousStock)
	assert.Equal(t, 70, history[0].NewStock)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetStockHistory_Empty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)

	rows := sqlmock.NewRows([]string{
		"id", "operation", "quantity", "previous_stock", "new_stock",
		"reason", "notes", "adjusted_by", "created_at",
	})

	mock.ExpectQuery("SELECT").
		WithArgs(productID.String()).
		WillReturnRows(rows)

	router := gin.New()
	router.GET("/inventory/:product_id/history", handler.GetStockHistory)

	req, _ := http.NewRequest("GET", "/inventory/"+productID.String()+"/history", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var history []HistoryRecord
	err = json.Unmarshal(w.Body.Bytes(), &history)
	assert.NoError(t, err)
	assert.Len(t, history, 0)

	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetStockHistory_DatabaseError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)

	mock.ExpectQuery("SELECT").
		WithArgs(productID.String()).
		WillReturnError(sql.ErrConnDone)

	router := gin.New()
	router.GET("/inventory/:product_id/history", handler.GetStockHistory)

	req, _ := http.NewRequest("GET", "/inventory/"+productID.String()+"/history", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// Low Stock Alert Tests (T254)
// ========================

func TestAdjustStock_TriggersLowStockAlert(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewInventoryHandler(db)

	productID := uuid.MustParse(testutil.TestProductID1)
	inventoryID := uuid.MustParse(testutil.TestInventoryID1)
	userID := uuid.MustParse(testutil.TestAdminID)

	// Mock transaction begin
	mock.ExpectBegin()

	// Mock inventory check - will result in low stock after removal
	rows := sqlmock.NewRows([]string{"id", "current_stock"}).
		AddRow(inventoryID, 15)
	mock.ExpectQuery("SELECT id, current_stock FROM inventory").
		WithArgs(productID).
		WillReturnRows(rows)

	// Mock update inventory
	mock.ExpectExec("UPDATE inventory").
		WithArgs(5, productID). // 15 - 10 = 5 (below minimum of 10)
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock create history record
	mock.ExpectExec("INSERT INTO inventory_history").
		WithArgs(productID, "remove", 10, 15, 5, "sale", "Order #456", userID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock commit
	mock.ExpectCommit()

	// Mock low stock check query - new stock (5) is below minimum (10)
	stockRows := sqlmock.NewRows([]string{"name", "minimum_stock"}).
		AddRow("Rendang Wagyu", 10)
	mock.ExpectQuery("SELECT p.name, COALESCE").
		WithArgs(productID).
		WillReturnRows(stockRows)

	// The notification service will be called asynchronously
	// We just verify the stock adjustment completes successfully

	router := gin.New()
	router.POST("/inventory/adjust", func(c *gin.Context) {
		c.Set("user_id", userID)
		handler.AdjustStock(c)
	})

	body := `{
		"product_id": "` + productID.String() + `",
		"operation": "remove",
		"quantity": 10,
		"reason": "sale",
		"notes": "Order #456"
	}`

	req, _ := http.NewRequest("POST", "/inventory/adjust", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Stock adjusted successfully", response["message"])
	assert.Equal(t, float64(5), response["new_stock"])

	// New stock (5) is below minimum (10), so low stock notification should be triggered
	// The notification happens asynchronously, so we just verify the adjustment succeeded

	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// Valid Reason Tests
// ========================

func TestAdjustStock_AllValidReasons(t *testing.T) {
	validReasons := []string{
		"purchase",
		"sale",
		"spoilage",
		"manual_adjustment",
		"inventory_count",
		"return",
		"damage",
		"theft",
		"expired",
	}

	for _, reason := range validReasons {
		t.Run("reason_"+reason, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			db, mock, err := sqlmock.New()
			assert.NoError(t, err)
			defer db.Close()

			handler := NewInventoryHandler(db)

			productID := uuid.MustParse(testutil.TestProductID1)
			inventoryID := uuid.MustParse(testutil.TestInventoryID1)
			userID := uuid.MustParse(testutil.TestAdminID)

			mock.ExpectBegin()

			rows := sqlmock.NewRows([]string{"id", "current_stock"}).
				AddRow(inventoryID, 50)
			mock.ExpectQuery("SELECT id, current_stock FROM inventory").
				WithArgs(productID).
				WillReturnRows(rows)

			mock.ExpectExec("UPDATE inventory").
				WithArgs(55, productID).
				WillReturnResult(sqlmock.NewResult(0, 1))

			mock.ExpectExec("INSERT INTO inventory_history").
				WithArgs(productID, "add", 5, 50, 55, reason, "", userID).
				WillReturnResult(sqlmock.NewResult(0, 1))

			mock.ExpectCommit()

			stockRows := sqlmock.NewRows([]string{"name", "minimum_stock"}).
				AddRow("Rendang Wagyu", 10)
			mock.ExpectQuery("SELECT p.name, COALESCE").
				WithArgs(productID).
				WillReturnRows(stockRows)

			router := gin.New()
			router.POST("/inventory/adjust", func(c *gin.Context) {
				c.Set("user_id", userID)
				handler.AdjustStock(c)
			})

			body := `{
				"product_id": "` + productID.String() + `",
				"operation": "add",
				"quantity": 5,
				"reason": "` + reason + `",
				"notes": ""
			}`

			req, _ := http.NewRequest("POST", "/inventory/adjust", bytes.NewBufferString(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)
			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}
