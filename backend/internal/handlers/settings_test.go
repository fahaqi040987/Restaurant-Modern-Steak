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
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ========================
// T281: TestGetSettings_Success
// ========================

func TestGetSettings_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// Expect settings query
	mock.ExpectQuery("SELECT setting_key, setting_value, setting_type").
		WillReturnRows(sqlmock.NewRows([]string{
			"setting_key", "setting_value", "setting_type",
		}).AddRow("restaurant_name", "Modern Steak House", "string").
			AddRow("tax_rate", "11.00", "number").
			AddRow("enable_rounding", "true", "boolean"))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/settings", nil)

	handler := GetSettings(db)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Settings retrieved successfully", response["message"])

	data := response["data"].(map[string]interface{})
	assert.Equal(t, "Modern Steak House", data["restaurant_name"])
	assert.Equal(t, float64(11), data["tax_rate"])
	assert.Equal(t, true, data["enable_rounding"])
}

func TestGetSettings_Empty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	mock.ExpectQuery("SELECT setting_key, setting_value, setting_type").
		WillReturnRows(sqlmock.NewRows([]string{
			"setting_key", "setting_value", "setting_type",
		}))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/settings", nil)

	handler := GetSettings(db)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	data := response["data"].(map[string]interface{})
	assert.Len(t, data, 0)
}

func TestGetSettings_DBError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	mock.ExpectQuery("SELECT setting_key, setting_value, setting_type").
		WillReturnError(sql.ErrConnDone)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/settings", nil)

	handler := GetSettings(db)
	handler(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestGetSettings_TypeConversions(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	mock.ExpectQuery("SELECT setting_key, setting_value, setting_type").
		WillReturnRows(sqlmock.NewRows([]string{
			"setting_key", "setting_value", "setting_type",
		}).AddRow("string_setting", "hello", "string").
			AddRow("number_setting", "42.5", "number").
			AddRow("boolean_true", "true", "boolean").
			AddRow("boolean_false", "false", "boolean").
			AddRow("json_setting", `{"key": "value"}`, "json"))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/settings", nil)

	handler := GetSettings(db)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	data := response["data"].(map[string]interface{})
	assert.Equal(t, "hello", data["string_setting"])
	assert.Equal(t, 42.5, data["number_setting"])
	assert.Equal(t, true, data["boolean_true"])
	assert.Equal(t, false, data["boolean_false"])
	assert.Equal(t, `{"key": "value"}`, data["json_setting"])
}

// ========================
// T282: TestUpdateSettings_Success
// ========================

func TestUpdateSettings_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()

	// Expect upsert query for each setting
	mock.ExpectExec("INSERT INTO system_settings").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec("INSERT INTO system_settings").
		WillReturnResult(sqlmock.NewResult(0, 1))

	settingsUpdate := map[string]string{
		"restaurant_name": "New Restaurant Name",
		"tax_rate":        "12.00",
	}
	body, _ := json.Marshal(settingsUpdate)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PUT", "/api/v1/settings", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("user_id", userID)

	handler := UpdateSettings(db)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Settings updated successfully", response["message"])
}

func TestUpdateSettings_Unauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	settingsUpdate := map[string]string{
		"restaurant_name": "New Restaurant Name",
	}
	body, _ := json.Marshal(settingsUpdate)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PUT", "/api/v1/settings", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	// Note: user_id not set

	handler := UpdateSettings(db)
	handler(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestUpdateSettings_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PUT", "/api/v1/settings", bytes.NewBufferString("invalid json"))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("user_id", userID)

	handler := UpdateSettings(db)
	handler(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUpdateSettings_DBError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()

	mock.ExpectExec("INSERT INTO system_settings").
		WillReturnError(sql.ErrConnDone)

	settingsUpdate := map[string]string{
		"restaurant_name": "New Restaurant Name",
	}
	body, _ := json.Marshal(settingsUpdate)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PUT", "/api/v1/settings", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("user_id", userID)

	handler := UpdateSettings(db)
	handler(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ========================
// T283: TestGetSystemHealth_Success
// ========================

func TestGetSystemHealth_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// Expect ping
	mock.ExpectPing()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/system/health", nil)

	handler := GetSystemHealth(db)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Health status retrieved successfully", response["message"])

	data := response["data"].(map[string]interface{})
	database := data["database"].(map[string]interface{})
	assert.Equal(t, "connected", database["status"])

	api := data["api"].(map[string]interface{})
	assert.Equal(t, "online", api["status"])
	assert.Equal(t, "1.0.0", api["version"])

	backup := data["backup"].(map[string]interface{})
	assert.Equal(t, "up_to_date", backup["status"])
}

func TestGetSystemHealth_DBDisconnected(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New(sqlmock.MonitorPingsOption(true))
	assert.NoError(t, err)
	defer db.Close()

	// Expect ping to fail
	mock.ExpectPing().WillReturnError(sql.ErrConnDone)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/system/health", nil)

	handler := GetSystemHealth(db)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	data := response["data"].(map[string]interface{})
	database := data["database"].(map[string]interface{})
	assert.Equal(t, "disconnected", database["status"])
}

// Test helper functions
func TestDetermineSettingType(t *testing.T) {
	tests := []struct {
		value    string
		expected string
	}{
		{"true", "boolean"},
		{"false", "boolean"},
		{"123", "number"},
		{"45.67", "number"},
		{"hello", "string"},
		{`{"key": "value"}`, "string"},
	}

	for _, tt := range tests {
		result := determineSettingType(tt.value)
		assert.Equal(t, tt.expected, result, "for value: %s", tt.value)
	}
}

func TestDetermineCategoryFromKey(t *testing.T) {
	tests := []struct {
		key      string
		expected string
	}{
		{"restaurant_name", "restaurant"},
		{"default_language", "restaurant"},
		{"currency", "restaurant"},
		{"tax_rate", "financial"},
		{"service_charge", "financial"},
		{"receipt_header", "receipt"},
		{"paper_size", "receipt"},
		{"kitchen_paper_size", "kitchen"},
		{"auto_print_kitchen", "kitchen"},
		{"backup_frequency", "system"},
		{"session_timeout", "system"},
		{"unknown_setting", "general"},
	}

	for _, tt := range tests {
		result := determineCategoryFromKey(tt.key)
		assert.Equal(t, tt.expected, result, "for key: %s", tt.key)
	}
}
