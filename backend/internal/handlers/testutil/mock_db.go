// Package testutil provides shared testing utilities for handler tests
package testutil

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
)

// MockDB holds the sqlmock instance and mock controller
type MockDB struct {
	DB   *sql.DB
	Mock sqlmock.Sqlmock
}

// NewMockDB creates a new mock database connection for testing
func NewMockDB() (*MockDB, error) {
	db, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherRegexp))
	if err != nil {
		return nil, err
	}
	return &MockDB{
		DB:   db,
		Mock: mock,
	}, nil
}

// NewMockDBExact creates a mock with exact query matching
func NewMockDBExact() (*MockDB, error) {
	db, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherEqual))
	if err != nil {
		return nil, err
	}
	return &MockDB{
		DB:   db,
		Mock: mock,
	}, nil
}

// Close closes the mock database connection
func (m *MockDB) Close() error {
	return m.DB.Close()
}

// ExpectationsWereMet checks if all expected queries were executed
func (m *MockDB) ExpectationsWereMet() error {
	return m.Mock.ExpectationsWereMet()
}

// ExpectPing sets up expectation for database ping
func (m *MockDB) ExpectPing() {
	m.Mock.ExpectPing()
}

// ExpectBegin sets up expectation for beginning a transaction
func (m *MockDB) ExpectBegin() {
	m.Mock.ExpectBegin()
}

// ExpectCommit sets up expectation for committing a transaction
func (m *MockDB) ExpectCommit() {
	m.Mock.ExpectCommit()
}

// ExpectRollback sets up expectation for rolling back a transaction
func (m *MockDB) ExpectRollback() {
	m.Mock.ExpectRollback()
}

// TestContext holds the test HTTP context
type TestContext struct {
	Recorder *httptest.ResponseRecorder
	Context  *gin.Context
	Router   *gin.Engine
}

// NewTestContext creates a new test context for HTTP testing
func NewTestContext() *TestContext {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, router := gin.CreateTestContext(w)
	return &TestContext{
		Recorder: w,
		Context:  c,
		Router:   router,
	}
}

// SetRequest sets up an HTTP request on the test context
func (tc *TestContext) SetRequest(method, path string, body interface{}) error {
	var reqBody string
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reqBody = string(jsonData)
	}

	req, err := http.NewRequest(method, path, strings.NewReader(reqBody))
	if err != nil {
		return err
	}

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	tc.Context.Request = req
	return nil
}

// SetAuthHeader sets JWT authorization header
func (tc *TestContext) SetAuthHeader(token string) {
	tc.Context.Request.Header.Set("Authorization", "Bearer "+token)
}

// SetUserContext sets user info in gin context (simulates authenticated user)
func (tc *TestContext) SetUserContext(userID, username, role string) {
	tc.Context.Set("user_id", userID)
	tc.Context.Set("username", username)
	tc.Context.Set("user_role", role)
}

// GetResponse returns the response body as a map
func (tc *TestContext) GetResponse() (map[string]interface{}, error) {
	var response map[string]interface{}
	err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response)
	return response, err
}

// GetResponseStruct unmarshals response into provided struct
func (tc *TestContext) GetResponseStruct(v interface{}) error {
	return json.Unmarshal(tc.Recorder.Body.Bytes(), v)
}

// APIResponse represents the standard API response format
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// PaginatedMeta represents pagination metadata
type PaginatedMeta struct {
	CurrentPage int `json:"current_page"`
	PerPage     int `json:"per_page"`
	Total       int `json:"total"`
	TotalPages  int `json:"total_pages"`
}

// PaginatedResponse represents paginated API response
type PaginatedResponse struct {
	Success bool          `json:"success"`
	Message string        `json:"message"`
	Data    interface{}   `json:"data"`
	Meta    PaginatedMeta `json:"meta"`
}

// TimeNow returns a standardized time for testing (fixed point in time)
func TimeNow() time.Time {
	return time.Date(2025, 12, 27, 10, 0, 0, 0, time.UTC)
}

// TimeString returns the time as a string in RFC3339 format
func TimeString() string {
	return TimeNow().Format(time.RFC3339)
}

// UUIDRegex is a regex pattern for matching UUIDs in SQL queries
const UUIDRegex = `[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`

// AnyTimeArg is a sqlmock argument matcher for time.Time values
type AnyTimeArg struct{}

// Match implements sqlmock.Argument interface
func (a AnyTimeArg) Match(v interface{}) bool {
	_, ok := v.(time.Time)
	return ok
}

// AnyUUIDArg is a sqlmock argument matcher for UUID strings
type AnyUUIDArg struct{}

// Match implements sqlmock.Argument interface
func (a AnyUUIDArg) Match(v interface{}) bool {
	s, ok := v.(string)
	if !ok {
		return false
	}
	// Simple UUID format check
	return len(s) == 36 && s[8] == '-' && s[13] == '-' && s[18] == '-' && s[23] == '-'
}
