package handlers

import (
	"bytes"
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
// T284: TestGetContactSubmissions_Success
// ========================

func TestGetContactSubmissions_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)
	contactID := uuid.New()
	now := time.Now()

	mock.ExpectQuery("SELECT id, name, email, phone, subject, message, status, created_at, updated_at").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "email", "phone", "subject", "message", "status", "created_at", "updated_at",
		}).AddRow(
			contactID, "John Doe", "john@example.com", "+62812345678", "Inquiry", "Test message", "new", now, now,
		).AddRow(
			uuid.New(), "Jane Doe", "jane@example.com", "+62876543210", "Feedback", "Great service!", "resolved", now, now,
		))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/admin/contacts", nil)

	handler.GetContactSubmissions(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var submissions []map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &submissions)
	assert.NoError(t, err)
	assert.Len(t, submissions, 2)
	assert.Equal(t, "John Doe", submissions[0]["name"])
	assert.Equal(t, "john@example.com", submissions[0]["email"])
}

func TestGetContactSubmissions_Empty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)

	mock.ExpectQuery("SELECT id, name, email, phone, subject, message, status, created_at, updated_at").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "email", "phone", "subject", "message", "status", "created_at", "updated_at",
		}))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/admin/contacts", nil)

	handler.GetContactSubmissions(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var submissions []map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &submissions)
	assert.NoError(t, err)
	assert.Len(t, submissions, 0)
}

func TestGetContactSubmissions_WithStatusFilter(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)
	contactID := uuid.New()
	now := time.Now()

	mock.ExpectQuery("SELECT id, name, email, phone, subject, message, status, created_at, updated_at").
		WithArgs("new").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "email", "phone", "subject", "message", "status", "created_at", "updated_at",
		}).AddRow(
			contactID, "John Doe", "john@example.com", "+62812345678", "Inquiry", "Test message", "new", now, now,
		))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/admin/contacts?status=new", nil)

	handler.GetContactSubmissions(c)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetContactSubmissions_DBError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)

	mock.ExpectQuery("SELECT id, name, email, phone, subject, message, status, created_at, updated_at").
		WillReturnError(sql.ErrConnDone)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/admin/contacts", nil)

	handler.GetContactSubmissions(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ========================
// T285: TestGetContactSubmission_NotFound
// ========================

func TestGetContactSubmission_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)
	contactID := uuid.New()
	now := time.Now()

	mock.ExpectQuery("SELECT id, name, email, phone, subject, message, status, created_at, updated_at").
		WithArgs(contactID.String()).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "email", "phone", "subject", "message", "status", "created_at", "updated_at",
		}).AddRow(
			contactID, "John Doe", "john@example.com", "+62812345678", "Inquiry", "Test message", "new", now, now,
		))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/admin/contacts/"+contactID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: contactID.String()}}

	handler.GetContactSubmission(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var submission map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &submission)
	assert.NoError(t, err)
	assert.Equal(t, "John Doe", submission["name"])
}

func TestGetContactSubmission_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)
	contactID := uuid.New()

	mock.ExpectQuery("SELECT id, name, email, phone, subject, message, status, created_at, updated_at").
		WithArgs(contactID.String()).
		WillReturnError(sql.ErrNoRows)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/admin/contacts/"+contactID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: contactID.String()}}

	handler.GetContactSubmission(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ========================
// T286: TestUpdateContactStatus_InvalidStatus
// ========================

func TestUpdateContactStatus_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)
	contactID := uuid.New()
	now := time.Now()

	mock.ExpectQuery("UPDATE contact_submissions").
		WithArgs("resolved", contactID.String()).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "email", "phone", "subject", "message", "status", "created_at", "updated_at",
		}).AddRow(
			contactID, "John Doe", "john@example.com", "+62812345678", "Inquiry", "Test message", "resolved", now, now,
		))

	reqBody := map[string]string{"status": "resolved"}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PATCH", "/api/v1/admin/contacts/"+contactID.String()+"/status", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: contactID.String()}}

	handler.UpdateContactStatus(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var submission map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &submission)
	assert.NoError(t, err)
	assert.Equal(t, "resolved", submission["status"])
}

func TestUpdateContactStatus_InvalidStatus(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)
	contactID := uuid.New()

	reqBody := map[string]string{"status": "invalid_status"}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PATCH", "/api/v1/admin/contacts/"+contactID.String()+"/status", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: contactID.String()}}

	handler.UpdateContactStatus(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response["error"], "Invalid status")
}

func TestUpdateContactStatus_MissingStatus(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)
	contactID := uuid.New()

	reqBody := map[string]string{}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PATCH", "/api/v1/admin/contacts/"+contactID.String()+"/status", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: contactID.String()}}

	handler.UpdateContactStatus(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUpdateContactStatus_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)
	contactID := uuid.New()

	mock.ExpectQuery("UPDATE contact_submissions").
		WithArgs("resolved", contactID.String()).
		WillReturnError(sql.ErrNoRows)

	reqBody := map[string]string{"status": "resolved"}
	body, _ := json.Marshal(reqBody)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("PATCH", "/api/v1/admin/contacts/"+contactID.String()+"/status", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: contactID.String()}}

	handler.UpdateContactStatus(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// TestDeleteContactSubmission tests
func TestDeleteContactSubmission_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)
	contactID := uuid.New()

	mock.ExpectExec("DELETE FROM contact_submissions WHERE id").
		WithArgs(contactID.String()).
		WillReturnResult(sqlmock.NewResult(0, 1))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("DELETE", "/api/v1/admin/contacts/"+contactID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: contactID.String()}}

	handler.DeleteContactSubmission(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Contact submission deleted successfully", response["message"])
}

func TestDeleteContactSubmission_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)
	contactID := uuid.New()

	mock.ExpectExec("DELETE FROM contact_submissions WHERE id").
		WithArgs(contactID.String()).
		WillReturnResult(sqlmock.NewResult(0, 0))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("DELETE", "/api/v1/admin/contacts/"+contactID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: contactID.String()}}

	handler.DeleteContactSubmission(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// TestGetNewContactsCount tests
func TestGetNewContactsCount_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)

	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM contact_submissions WHERE status = 'new'").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/admin/contacts/counts", nil)

	handler.GetNewContactsCount(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	data := response["data"].(map[string]interface{})
	assert.Equal(t, float64(5), data["new_contacts"])
}

func TestGetNewContactsCount_DBError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	handler := NewHandler(db)

	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM contact_submissions WHERE status = 'new'").
		WillReturnError(sql.ErrConnDone)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/v1/admin/contacts/counts", nil)

	handler.GetNewContactsCount(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}
