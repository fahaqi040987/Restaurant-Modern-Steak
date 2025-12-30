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
// T201: Create test file backend/internal/handlers/products_test.go
// ========================

// ========================
// T202: TestCreateProduct_Success
// ========================

func TestCreateProduct_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	categoryID := uuid.New()
	productID := uuid.New()
	now := time.Now()

	// Mock category exists check
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM categories WHERE id").
		WithArgs(categoryID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// Mock product insert
	mock.ExpectQuery("INSERT INTO products").
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).
			AddRow(productID, now, now))

	// Create request
	reqBody := models.CreateProductRequest{
		Name:       "Wagyu Steak Premium",
		CategoryID: categoryID,
		Price:      350000,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/admin/products", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.CreateProduct(c)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Product created successfully", response.Message)
	assert.NoError(t, mock.ExpectationsWereMet())
}

// ========================
// T203: TestCreateProduct_DuplicateName
// ========================

func TestCreateProduct_DuplicateName(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	categoryID := uuid.New()

	// Mock category exists check
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM categories WHERE id").
		WithArgs(categoryID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// Mock product insert with duplicate key error
	mock.ExpectQuery("INSERT INTO products").
		WillReturnError(sql.ErrNoRows) // Simulate unique constraint violation

	// Create request
	reqBody := models.CreateProductRequest{
		Name:       "Existing Product",
		CategoryID: categoryID,
		Price:      150000,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/admin/products", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.CreateProduct(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
}

func TestCreateProduct_MissingName(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	categoryID := uuid.New()

	// Create request with missing name - binding validation will catch this
	reqBody := map[string]interface{}{
		"name":        "", // Empty name fails binding:"required"
		"category_id": categoryID.String(),
		"price":       150000,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/admin/products", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.CreateProduct(c)

	// Binding validation returns 400 with "Invalid request body"
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Invalid request body", response.Message)
}

func TestCreateProduct_InvalidPrice(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	categoryID := uuid.New()

	// Create request with invalid price - binding validation "gt=0" will catch this
	reqBody := map[string]interface{}{
		"name":        "Test Product",
		"category_id": categoryID.String(),
		"price":       -100, // Invalid negative price fails binding:"gt=0"
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/admin/products", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.CreateProduct(c)

	// Binding validation returns 400 with "Invalid request body"
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Invalid request body", response.Message)
}

func TestCreateProduct_CategoryNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	categoryID := uuid.New()

	// Mock category does not exist
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM categories WHERE id").
		WithArgs(categoryID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	// Create request
	reqBody := models.CreateProductRequest{
		Name:       "Test Product",
		CategoryID: categoryID,
		Price:      150000,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/admin/products", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.CreateProduct(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Category not found", response.Message)
}

// ========================
// T204: TestGetProduct_Success
// ========================

func TestGetProduct_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID := uuid.New()
	categoryID := uuid.New()
	now := time.Now()

	// Mock product query with category join
	mock.ExpectQuery("SELECT p.id, p.category_id, p.name").
		WithArgs(productID).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "category_id", "name", "description", "price", "image_url",
			"barcode", "sku", "is_available", "preparation_time", "sort_order",
			"created_at", "updated_at", "category_name", "category_color",
		}).AddRow(
			productID, categoryID, "Wagyu Steak", "Premium wagyu beef", 350000.00, nil,
			nil, nil, true, 20, 1,
			now, now, "Steaks", "#FF5733",
		))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/products/"+productID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: productID.String()}}

	handler.GetProduct(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Product retrieved successfully", response.Message)
	assert.NotNil(t, response.Data)
}

// ========================
// T205: TestGetProduct_NotFound
// ========================

func TestGetProduct_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID := uuid.New()

	// Mock product not found
	mock.ExpectQuery("SELECT p.id, p.category_id, p.name").
		WithArgs(productID).
		WillReturnError(sql.ErrNoRows)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/products/"+productID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: productID.String()}}

	handler.GetProduct(c)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Product not found", response.Message)
}

func TestGetProduct_InvalidUUID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/products/invalid-uuid", nil)
	c.Params = gin.Params{{Key: "id", Value: "invalid-uuid"}}

	handler.GetProduct(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Invalid product ID", response.Message)
}

// ========================
// T206: TestListProducts_Paginated
// ========================

func TestListProducts_Paginated(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID1 := uuid.New()
	productID2 := uuid.New()
	categoryID := uuid.New()
	now := time.Now()

	// Mock count query
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(25))

	// Mock products query with pagination
	mock.ExpectQuery("SELECT p.id, p.category_id, p.name").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "category_id", "name", "description", "price", "image_url",
			"barcode", "sku", "is_available", "preparation_time", "sort_order",
			"created_at", "updated_at", "category_name", "category_color",
		}).
			AddRow(productID1, categoryID, "Product 1", "Description 1", 100000.00, nil, nil, nil, true, 15, 1, now, now, "Category", "#FFF").
			AddRow(productID2, categoryID, "Product 2", "Description 2", 200000.00, nil, nil, nil, true, 20, 2, now, now, "Category", "#FFF"))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/products?page=1&per_page=10", nil)

	handler.GetProducts(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.PaginatedResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, 25, response.Meta.Total)
	assert.Equal(t, 1, response.Meta.CurrentPage)
}

// ========================
// T207: TestListProducts_ByCategory
// ========================

func TestListProducts_ByCategory(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID := uuid.New()
	categoryID := uuid.New()
	now := time.Now()

	// Mock count query with category filter
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM").
		WithArgs(categoryID.String()).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))

	// Mock products query with category filter
	mock.ExpectQuery("SELECT p.id, p.category_id, p.name").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "category_id", "name", "description", "price", "image_url",
			"barcode", "sku", "is_available", "preparation_time", "sort_order",
			"created_at", "updated_at", "category_name", "category_color",
		}).AddRow(productID, categoryID, "Steak Product", "Description", 250000.00, nil, nil, nil, true, 20, 1, now, now, "Steaks", "#FF5733"))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/products?category_id="+categoryID.String(), nil)

	handler.GetProducts(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.PaginatedResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, 5, response.Meta.Total)
}

func TestListProducts_ByAvailability(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID := uuid.New()
	categoryID := uuid.New()
	now := time.Now()

	// Mock count query with available filter
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(10))

	// Mock products query with available filter
	mock.ExpectQuery("SELECT p.id, p.category_id, p.name").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "category_id", "name", "description", "price", "image_url",
			"barcode", "sku", "is_available", "preparation_time", "sort_order",
			"created_at", "updated_at", "category_name", "category_color",
		}).AddRow(productID, categoryID, "Available Product", "Description", 150000.00, nil, nil, nil, true, 15, 1, now, now, "Category", "#FFF"))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/products?available=true", nil)

	handler.GetProducts(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.PaginatedResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
}

func TestListProducts_WithSearch(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID := uuid.New()
	categoryID := uuid.New()
	now := time.Now()

	// Mock count query with search
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(3))

	// Mock products query with search
	mock.ExpectQuery("SELECT p.id, p.category_id, p.name").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "category_id", "name", "description", "price", "image_url",
			"barcode", "sku", "is_available", "preparation_time", "sort_order",
			"created_at", "updated_at", "category_name", "category_color",
		}).AddRow(productID, categoryID, "Wagyu Steak", "Premium wagyu beef", 350000.00, nil, nil, nil, true, 20, 1, now, now, "Steaks", "#FF5733"))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/products?search=wagyu", nil)

	handler.GetProducts(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.PaginatedResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
}

// ========================
// T208: TestUpdateProduct_Success
// ========================

func TestUpdateProduct_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID := uuid.New()
	categoryID := uuid.New()
	now := time.Now()

	// Mock product exists check
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM products WHERE id").
		WithArgs(productID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// Mock update query
	mock.ExpectExec("UPDATE products SET updated_at").
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock fetch updated product
	mock.ExpectQuery("SELECT p.id, p.category_id, p.name").
		WithArgs(productID).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "category_id", "name", "description", "price", "image_url",
			"barcode", "sku", "is_available", "preparation_time", "sort_order",
			"created_at", "updated_at", "category_name", "category_color",
		}).AddRow(productID, categoryID, "Updated Product Name", "Updated description", 400000.00, nil, nil, nil, true, 25, 1, now, now, "Category", "#FFF"))

	newName := "Updated Product Name"
	newPrice := 400000.00
	reqBody := models.UpdateProductRequest{
		Name:  &newName,
		Price: &newPrice,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PUT", "/api/v1/admin/products/"+productID.String(), bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: productID.String()}}

	handler.UpdateProduct(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Product updated successfully", response.Message)
}

// ========================
// T209: TestUpdateProduct_NotFound
// ========================

func TestUpdateProduct_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID := uuid.New()

	// Mock product does not exist
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM products WHERE id").
		WithArgs(productID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	newName := "New Name"
	reqBody := models.UpdateProductRequest{
		Name: &newName,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PUT", "/api/v1/admin/products/"+productID.String(), bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: productID.String()}}

	handler.UpdateProduct(c)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Product not found", response.Message)
}

func TestUpdateProduct_InvalidPrice(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID := uuid.New()

	// Mock product exists check
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM products WHERE id").
		WithArgs(productID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	invalidPrice := -50.00
	reqBody := models.UpdateProductRequest{
		Price: &invalidPrice,
	}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PUT", "/api/v1/admin/products/"+productID.String(), bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: productID.String()}}

	handler.UpdateProduct(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Price must be greater than 0", response.Message)
}

// ========================
// T210: TestDeleteProduct_Success
// ========================

func TestDeleteProduct_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID := uuid.New()

	// Mock product exists check
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM products WHERE id").
		WithArgs(productID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// Mock check if product is used in orders
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM order_items WHERE product_id").
		WithArgs(productID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	// Mock delete query
	mock.ExpectExec("DELETE FROM products WHERE id").
		WithArgs(productID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("DELETE", "/api/v1/admin/products/"+productID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: productID.String()}}

	handler.DeleteProduct(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Product deleted successfully", response.Message)
}

func TestDeleteProduct_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID := uuid.New()

	// Mock product does not exist
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM products WHERE id").
		WithArgs(productID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("DELETE", "/api/v1/admin/products/"+productID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: productID.String()}}

	handler.DeleteProduct(c)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Product not found", response.Message)
}

// ========================
// T211: TestDeleteProduct_InUse
// ========================

func TestDeleteProduct_InUse(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID := uuid.New()

	// Mock product exists check
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM products WHERE id").
		WithArgs(productID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// Mock check if product is used in orders - it IS used
	mock.ExpectQuery("SELECT EXISTS\\(SELECT 1 FROM order_items WHERE product_id").
		WithArgs(productID).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// Mock soft delete (mark as unavailable)
	mock.ExpectExec("UPDATE products SET is_available = false").
		WithArgs(productID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("DELETE", "/api/v1/admin/products/"+productID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: productID.String()}}

	handler.DeleteProduct(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Product deactivated (used in existing orders)", response.Message)
}

// Additional tests for completeness

func TestGetCategories_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	categoryID := uuid.New()
	now := time.Now()

	// Mock categories query
	mock.ExpectQuery("SELECT id, name, description, color, sort_order, is_active, created_at, updated_at").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "description", "color", "sort_order", "is_active", "created_at", "updated_at",
		}).AddRow(categoryID, "Steaks", "Premium steaks", "#FF5733", 1, true, now, now))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/categories", nil)

	handler.GetCategories(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Categories retrieved successfully", response.Message)
}

func TestGetProductsByCategory_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewProductHandler(db)

	productID := uuid.New()
	categoryID := uuid.New()
	now := time.Now()

	// Mock products by category query
	mock.ExpectQuery("SELECT p.id, p.category_id, p.name").
		WithArgs(categoryID).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "category_id", "name", "description", "price", "image_url",
			"barcode", "sku", "is_available", "preparation_time", "sort_order",
			"created_at", "updated_at", "category_name", "category_color",
		}).AddRow(productID, categoryID, "Wagyu Steak", "Description", 350000.00, nil, nil, nil, true, 20, 1, now, now, "Steaks", "#FF5733"))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/categories/"+categoryID.String()+"/products", nil)
	c.Params = gin.Params{{Key: "id", Value: categoryID.String()}}

	handler.GetProductsByCategory(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
}
