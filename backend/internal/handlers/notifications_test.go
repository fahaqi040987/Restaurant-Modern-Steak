package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// ========================
// T278: TestGetNotifications_Success
// ========================

func TestGetNotifications_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()
	notifID := uuid.New()
	now := time.Now()

	// Expect notifications query
	mock.ExpectQuery("SELECT id, user_id, type, title, message, is_read, read_at, created_at").
		WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "user_id", "type", "title", "message", "is_read", "read_at", "created_at",
		}).AddRow(
			notifID, userID, "order_update", "New Order", "Order #123 has been placed", false, nil, now,
		).AddRow(
			uuid.New(), userID, "low_stock", "Low Stock Alert", "Beef stock is low", false, nil, now,
		))

	// Create request
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/notifications", nil)
	c.Set("user_id", userID)

	// Execute
	handler := GetNotifications(db)
	handler(c)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Notifications retrieved successfully", response["message"])

	data := response["data"].([]interface{})
	assert.Len(t, data, 2)
}

func TestGetNotifications_Empty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()

	// Expect empty result
	mock.ExpectQuery("SELECT id, user_id, type, title, message, is_read, read_at, created_at").
		WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "user_id", "type", "title", "message", "is_read", "read_at", "created_at",
		}))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/notifications", nil)
	c.Set("user_id", userID)

	handler := GetNotifications(db)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	data := response["data"].([]interface{})
	assert.Len(t, data, 0)
}

func TestGetNotifications_Unauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/notifications", nil)
	// Note: user_id not set

	handler := GetNotifications(db)
	handler(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestGetNotifications_DBError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()

	// Simulate database error
	mock.ExpectQuery("SELECT id, user_id, type, title, message, is_read, read_at, created_at").
		WithArgs(userID).
		WillReturnError(sql.ErrConnDone)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/notifications", nil)
	c.Set("user_id", userID)

	handler := GetNotifications(db)
	handler(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ========================
// T279: TestMarkNotificationRead_Success
// ========================

func TestMarkNotificationRead_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()
	notifID := uuid.New()

	// Expect update query
	mock.ExpectExec("UPDATE notifications").
		WillReturnResult(sqlmock.NewResult(0, 1))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PATCH", "/api/v1/notifications/"+notifID.String()+"/read", nil)
	c.Set("user_id", userID)
	c.Params = gin.Params{{Key: "id", Value: notifID.String()}}

	handler := MarkNotificationRead(db)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Notification marked as read", response["message"])
}

func TestMarkNotificationRead_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()
	notifID := uuid.New()

	// Expect update query with 0 rows affected
	mock.ExpectExec("UPDATE notifications").
		WillReturnResult(sqlmock.NewResult(0, 0))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PATCH", "/api/v1/notifications/"+notifID.String()+"/read", nil)
	c.Set("user_id", userID)
	c.Params = gin.Params{{Key: "id", Value: notifID.String()}}

	handler := MarkNotificationRead(db)
	handler(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestMarkNotificationRead_InvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PATCH", "/api/v1/notifications/invalid-uuid/read", nil)
	c.Set("user_id", userID)
	c.Params = gin.Params{{Key: "id", Value: "invalid-uuid"}}

	handler := MarkNotificationRead(db)
	handler(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestMarkNotificationRead_Unauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	notifID := uuid.New()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PATCH", "/api/v1/notifications/"+notifID.String()+"/read", nil)
	c.Params = gin.Params{{Key: "id", Value: notifID.String()}}
	// Note: user_id not set

	handler := MarkNotificationRead(db)
	handler(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// ========================
// T280: TestGetUnreadCounts_Success
// ========================

func TestGetUnreadCounts_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()

	// Expect count query
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM notifications WHERE user_id").
		WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/notifications/counts", nil)
	c.Set("user_id", userID)

	handler := GetUnreadCounts(db)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	data := response["data"].(map[string]interface{})
	assert.Equal(t, float64(5), data["notifications"])
}

func TestGetUnreadCounts_ZeroNotifications(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()

	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM notifications WHERE user_id").
		WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/notifications/counts", nil)
	c.Set("user_id", userID)

	handler := GetUnreadCounts(db)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	data := response["data"].(map[string]interface{})
	assert.Equal(t, float64(0), data["notifications"])
}

func TestGetUnreadCounts_Unauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/notifications/counts", nil)
	// Note: user_id not set

	handler := GetUnreadCounts(db)
	handler(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestGetUnreadCounts_DBError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()

	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM notifications WHERE user_id").
		WithArgs(userID).
		WillReturnError(sql.ErrConnDone)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/notifications/counts", nil)
	c.Set("user_id", userID)

	handler := GetUnreadCounts(db)
	handler(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// TestDeleteNotification_Success tests successful notification deletion
func TestDeleteNotification_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()
	notifID := uuid.New()

	mock.ExpectExec("DELETE FROM notifications").
		WillReturnResult(sqlmock.NewResult(0, 1))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("DELETE", "/api/v1/notifications/"+notifID.String(), nil)
	c.Set("user_id", userID)
	c.Params = gin.Params{{Key: "id", Value: notifID.String()}}

	handler := DeleteNotification(db)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Notification deleted successfully", response["message"])
}

func TestDeleteNotification_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userID := uuid.New().String()
	notifID := uuid.New()

	mock.ExpectExec("DELETE FROM notifications").
		WillReturnResult(sqlmock.NewResult(0, 0))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("DELETE", "/api/v1/notifications/"+notifID.String(), nil)
	c.Set("user_id", userID)
	c.Params = gin.Params{{Key: "id", Value: notifID.String()}}

	handler := DeleteNotification(db)
	handler(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
}
