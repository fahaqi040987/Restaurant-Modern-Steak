package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
)

// setupTestRouter creates a test router with the public handler
func setupTestRouter(db *sql.DB) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	handler := NewPublicHandler(db)

	public := router.Group("/api/v1/public")
	{
		public.GET("/menu", handler.GetPublicMenu)
		public.GET("/categories", handler.GetPublicCategories)
		public.GET("/restaurant", handler.GetRestaurantInfo)
		public.POST("/contact", handler.SubmitContactForm)
	}

	return router
}

// TestGetPublicMenuReturnsActiveProducts tests GET /api/v1/public/menu returns only active products with categories
func TestGetPublicMenuReturnsActiveProducts(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	// Mock the query for active products with categories
	rows := sqlmock.NewRows([]string{
		"id", "name", "description", "price", "image_url", "category_id", "category_name",
	}).AddRow(
		"123e4567-e89b-12d3-a456-426614174000",
		"Ribeye Steak",
		"Premium aged ribeye",
		45.99,
		"https://example.com/ribeye.jpg",
		"223e4567-e89b-12d3-a456-426614174000",
		"Main Course",
	)

	mock.ExpectQuery("SELECT p.id, p.name, p.description, p.price, p.image_url, p.category_id, c.name as category_name").
		WillReturnRows(rows)

	router := setupTestRouter(db)

	req, _ := http.NewRequest("GET", "/api/v1/public/menu", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if response["success"] != true {
		t.Errorf("expected success true, got %v", response["success"])
	}

	data, ok := response["data"].([]interface{})
	if !ok {
		t.Fatalf("expected data to be an array")
	}

	if len(data) != 1 {
		t.Errorf("expected 1 menu item, got %d", len(data))
	}
}

// TestGetPublicCategoriesReturnsActiveCategories tests GET /api/v1/public/categories returns only active categories
func TestGetPublicCategoriesReturnsActiveCategories(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	// Mock the query for active categories
	rows := sqlmock.NewRows([]string{
		"id", "name", "description", "color", "sort_order",
	}).AddRow(
		"223e4567-e89b-12d3-a456-426614174000",
		"Main Course",
		"Our signature main dishes",
		"#722f37",
		1,
	).AddRow(
		"323e4567-e89b-12d3-a456-426614174000",
		"Appetizers",
		"Start your meal right",
		"#d4a574",
		0,
	)

	mock.ExpectQuery("SELECT id, name, description, color, sort_order FROM categories WHERE is_active = true").
		WillReturnRows(rows)

	router := setupTestRouter(db)

	req, _ := http.NewRequest("GET", "/api/v1/public/categories", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if response["success"] != true {
		t.Errorf("expected success true, got %v", response["success"])
	}

	data, ok := response["data"].([]interface{})
	if !ok {
		t.Fatalf("expected data to be an array")
	}

	if len(data) != 2 {
		t.Errorf("expected 2 categories, got %d", len(data))
	}
}

// TestGetRestaurantInfoReturnsWithOperatingHours tests GET /api/v1/public/restaurant returns restaurant info with operating hours
func TestGetRestaurantInfoReturnsWithOperatingHours(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	// Mock the restaurant info query
	infoRows := sqlmock.NewRows([]string{
		"id", "name", "tagline", "description", "address", "city", "postal_code", "country",
		"phone", "email", "whatsapp", "map_latitude", "map_longitude", "google_maps_url",
		"instagram_url", "facebook_url", "twitter_url", "logo_url", "hero_image_url",
	}).AddRow(
		"423e4567-e89b-12d3-a456-426614174000",
		"Modern Steak",
		"Premium Steakhouse Experience",
		"Fine dining restaurant",
		"123 Main Street",
		"Jakarta",
		"12345",
		"Indonesia",
		"+62 21 1234 5678",
		"info@modernsteak.com",
		"+62 812 1234 5678",
		-6.2088,
		106.8456,
		"https://maps.google.com",
		"https://instagram.com/modernsteak",
		"https://facebook.com/modernsteak",
		nil,
		"https://example.com/logo.png",
		"https://example.com/hero.jpg",
	)

	mock.ExpectQuery("SELECT id, name, tagline, description, address, city, postal_code, country").
		WillReturnRows(infoRows)

	// Mock the operating hours query
	hoursRows := sqlmock.NewRows([]string{
		"id", "restaurant_info_id", "day_of_week", "open_time", "close_time", "is_closed",
	}).AddRow(
		"523e4567-e89b-12d3-a456-426614174000",
		"423e4567-e89b-12d3-a456-426614174000",
		1,
		"11:00:00",
		"22:00:00",
		false,
	)

	mock.ExpectQuery("SELECT id, restaurant_info_id, day_of_week, open_time, close_time, is_closed FROM operating_hours").
		WillReturnRows(hoursRows)

	router := setupTestRouter(db)

	req, _ := http.NewRequest("GET", "/api/v1/public/restaurant", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if response["success"] != true {
		t.Errorf("expected success true, got %v", response["success"])
	}

	data, ok := response["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected data to be an object")
	}

	if data["name"] != "Modern Steak" {
		t.Errorf("expected name 'Modern Steak', got %v", data["name"])
	}

	// Check that is_open_now field exists
	if _, exists := data["is_open_now"]; !exists {
		t.Errorf("expected is_open_now field to exist")
	}

	// Check that operating_hours field exists
	if _, exists := data["operating_hours"]; !exists {
		t.Errorf("expected operating_hours field to exist")
	}
}

// TestSubmitContactFormValidatesRequiredFields tests POST /api/v1/public/contact validates required fields and stores submission
func TestSubmitContactFormValidatesRequiredFields(t *testing.T) {
	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	router := setupTestRouter(db)

	// Test with missing required fields
	testCases := []struct {
		name     string
		body     map[string]interface{}
		expected int
	}{
		{
			name:     "Missing name",
			body:     map[string]interface{}{"email": "test@example.com", "subject": "Test", "message": "Hello"},
			expected: http.StatusBadRequest,
		},
		{
			name:     "Missing email",
			body:     map[string]interface{}{"name": "John", "subject": "Test", "message": "Hello"},
			expected: http.StatusBadRequest,
		},
		{
			name:     "Missing subject",
			body:     map[string]interface{}{"name": "John", "email": "test@example.com", "message": "Hello"},
			expected: http.StatusBadRequest,
		},
		{
			name:     "Missing message",
			body:     map[string]interface{}{"name": "John", "email": "test@example.com", "subject": "Test"},
			expected: http.StatusBadRequest,
		},
		{
			name:     "Invalid email format",
			body:     map[string]interface{}{"name": "John", "email": "invalid-email", "subject": "Test", "message": "Hello"},
			expected: http.StatusBadRequest,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			jsonBody, _ := json.Marshal(tc.body)
			req, _ := http.NewRequest("POST", "/api/v1/public/contact", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != tc.expected {
				t.Errorf("expected status %d, got %d", tc.expected, w.Code)
			}
		})
	}
}

// TestSubmitContactFormStoresValidSubmission tests that valid contact form submissions are stored
func TestSubmitContactFormStoresValidSubmission(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	// Mock the insert query
	mock.ExpectQuery("INSERT INTO contact_submissions").
		WithArgs("John Doe", "john@example.com", nil, "General Inquiry", "This is a test message").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("623e4567-e89b-12d3-a456-426614174000"))

	router := setupTestRouter(db)

	body := map[string]interface{}{
		"name":    "John Doe",
		"email":   "john@example.com",
		"subject": "General Inquiry",
		"message": "This is a test message",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/v1/public/contact", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d. Body: %s", w.Code, w.Body.String())
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if response["success"] != true {
		t.Errorf("expected success true, got %v", response["success"])
	}
}
