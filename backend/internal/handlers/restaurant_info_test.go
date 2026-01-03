package handlers

import (
	"bytes"
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
// T015: Backend time validation tests for UpdateOperatingHours
// ========================

// TestUpdateOperatingHours_ValidTimes tests successful update with valid times
func TestUpdateOperatingHours_ValidTimes(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewRestaurantInfoHandler(db)
	restaurantInfoID := uuid.New()

	// Mock getting restaurant info ID
	mock.ExpectQuery("SELECT id FROM restaurant_info LIMIT 1").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(restaurantInfoID))

	// Mock 7 update queries (one for each day)
	for i := 0; i < 7; i++ {
		mock.ExpectExec("UPDATE operating_hours SET").
			WillReturnResult(sqlmock.NewResult(0, 1))
	}

	// Create test request with valid hours
	hours := []OperatingHourUpdate{
		{DayOfWeek: 0, OpenTime: "00:00", CloseTime: "00:00", IsClosed: true}, // Sunday closed
		{DayOfWeek: 1, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 2, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 3, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 4, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 5, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 6, OpenTime: "09:00", CloseTime: "23:00", IsClosed: false},
	}

	reqBody := UpdateOperatingHoursRequest{Hours: hours}
	body, _ := json.Marshal(reqBody)

	router := gin.New()
	router.PUT("/operating-hours", handler.UpdateOperatingHours)

	req, _ := http.NewRequest("PUT", "/operating-hours", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "Operating hours updated successfully", response.Message)

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

// TestUpdateOperatingHours_ZeroTimeForNonClosedDay tests that 00:00 is rejected for non-closed days
func TestUpdateOperatingHours_ZeroTimeForNonClosedDay(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewRestaurantInfoHandler(db)

	// Create test request with 00:00 for non-closed day
	hours := []OperatingHourUpdate{
		{DayOfWeek: 0, OpenTime: "00:00", CloseTime: "00:00", IsClosed: true}, // OK - closed
		{DayOfWeek: 1, OpenTime: "00:00", CloseTime: "22:00", IsClosed: false}, // INVALID - 00:00 for open day
		{DayOfWeek: 2, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 3, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 4, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 5, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 6, OpenTime: "09:00", CloseTime: "23:00", IsClosed: false},
	}

	reqBody := UpdateOperatingHoursRequest{Hours: hours}
	body, _ := json.Marshal(reqBody)

	router := gin.New()
	router.PUT("/operating-hours", handler.UpdateOperatingHours)

	req, _ := http.NewRequest("PUT", "/operating-hours", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert - should be rejected
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "00:00 is not a valid time for an open day", response.Message)
	assert.NotNil(t, response.Error)
	assert.Equal(t, "invalid_zero_time", *response.Error)
}

// TestUpdateOperatingHours_ZeroCloseTimeForNonClosedDay tests that close_time 00:00 is rejected
func TestUpdateOperatingHours_ZeroCloseTimeForNonClosedDay(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewRestaurantInfoHandler(db)

	// Create test request with close_time 00:00 for non-closed day
	hours := []OperatingHourUpdate{
		{DayOfWeek: 0, OpenTime: "00:00", CloseTime: "00:00", IsClosed: true},
		{DayOfWeek: 1, OpenTime: "08:00", CloseTime: "00:00", IsClosed: false}, // INVALID - close 00:00
		{DayOfWeek: 2, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 3, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 4, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 5, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 6, OpenTime: "09:00", CloseTime: "23:00", IsClosed: false},
	}

	reqBody := UpdateOperatingHoursRequest{Hours: hours}
	body, _ := json.Marshal(reqBody)

	router := gin.New()
	router.PUT("/operating-hours", handler.UpdateOperatingHours)

	req, _ := http.NewRequest("PUT", "/operating-hours", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert - should be rejected
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "00:00 is not a valid time for an open day", response.Message)
}

// TestUpdateOperatingHours_InvalidHoursCount tests rejection of non-7 day arrays
func TestUpdateOperatingHours_InvalidHoursCount(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewRestaurantInfoHandler(db)

	// Create test request with only 3 days
	hours := []OperatingHourUpdate{
		{DayOfWeek: 0, OpenTime: "00:00", CloseTime: "00:00", IsClosed: true},
		{DayOfWeek: 1, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 2, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
	}

	reqBody := UpdateOperatingHoursRequest{Hours: hours}
	body, _ := json.Marshal(reqBody)

	router := gin.New()
	router.PUT("/operating-hours", handler.UpdateOperatingHours)

	req, _ := http.NewRequest("PUT", "/operating-hours", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Operating hours must include all 7 days of the week", response.Message)
}

// TestUpdateOperatingHours_OpenAfterClose tests rejection when open time >= close time
func TestUpdateOperatingHours_OpenAfterClose(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewRestaurantInfoHandler(db)

	// Create test request with open time after close time
	hours := []OperatingHourUpdate{
		{DayOfWeek: 0, OpenTime: "00:00", CloseTime: "00:00", IsClosed: true},
		{DayOfWeek: 1, OpenTime: "22:00", CloseTime: "08:00", IsClosed: false}, // INVALID
		{DayOfWeek: 2, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 3, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 4, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 5, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 6, OpenTime: "09:00", CloseTime: "23:00", IsClosed: false},
	}

	reqBody := UpdateOperatingHoursRequest{Hours: hours}
	body, _ := json.Marshal(reqBody)

	router := gin.New()
	router.PUT("/operating-hours", handler.UpdateOperatingHours)

	req, _ := http.NewRequest("PUT", "/operating-hours", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Opening time must be before closing time", response.Message)
}

// TestUpdateOperatingHours_InvalidTimeFormat tests rejection of invalid time format
func TestUpdateOperatingHours_InvalidTimeFormat(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewRestaurantInfoHandler(db)

	// Create test request with invalid time format
	hours := []OperatingHourUpdate{
		{DayOfWeek: 0, OpenTime: "00:00", CloseTime: "00:00", IsClosed: true},
		{DayOfWeek: 1, OpenTime: "8:00", CloseTime: "22:00", IsClosed: false}, // INVALID format
		{DayOfWeek: 2, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 3, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 4, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 5, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 6, OpenTime: "09:00", CloseTime: "23:00", IsClosed: false},
	}

	reqBody := UpdateOperatingHoursRequest{Hours: hours}
	body, _ := json.Marshal(reqBody)

	router := gin.New()
	router.PUT("/operating-hours", handler.UpdateOperatingHours)

	req, _ := http.NewRequest("PUT", "/operating-hours", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response.Success)
	assert.Equal(t, "Invalid open time format (use HH:MM)", response.Message)
}

// TestNormalizeTimeString tests the time normalization helper function
func TestNormalizeTimeString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"HH:MM format", "08:00", "08:00"},
		{"HH:MM format 2", "22:30", "22:30"},
		{"ISO datetime", "0000-01-01T08:00:00Z", "08:00"},
		{"ISO datetime 2", "0000-01-01T22:30:00Z", "22:30"},
		{"ISO without Z", "2024-01-01T11:00:00", "11:00"},
		{"HH:MM:SS format", "08:00:00", "08:00"},
		{"HH:MM:SS format 2", "23:59:59", "23:59"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := normalizeTimeString(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestUpdateOperatingHours_ClosedDayAllowsZeroTime tests that 00:00 is allowed for closed days
func TestUpdateOperatingHours_ClosedDayAllowsZeroTime(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewRestaurantInfoHandler(db)
	restaurantInfoID := uuid.New()

	// Mock getting restaurant info ID
	mock.ExpectQuery("SELECT id FROM restaurant_info LIMIT 1").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(restaurantInfoID))

	// Mock 7 update queries (one for each day)
	for i := 0; i < 7; i++ {
		mock.ExpectExec("UPDATE operating_hours SET").
			WillReturnResult(sqlmock.NewResult(0, 1))
	}

	// Create test request with multiple closed days having 00:00
	hours := []OperatingHourUpdate{
		{DayOfWeek: 0, OpenTime: "00:00", CloseTime: "00:00", IsClosed: true}, // Sunday closed - OK
		{DayOfWeek: 1, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 2, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 3, OpenTime: "00:00", CloseTime: "00:00", IsClosed: true}, // Wednesday closed - OK
		{DayOfWeek: 4, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 5, OpenTime: "08:00", CloseTime: "22:00", IsClosed: false},
		{DayOfWeek: 6, OpenTime: "00:00", CloseTime: "00:00", IsClosed: true}, // Saturday closed - OK
	}

	reqBody := UpdateOperatingHoursRequest{Hours: hours}
	body, _ := json.Marshal(reqBody)

	router := gin.New()
	router.PUT("/operating-hours", handler.UpdateOperatingHours)

	req, _ := http.NewRequest("PUT", "/operating-hours", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert - should succeed because all 00:00 are for closed days
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}
