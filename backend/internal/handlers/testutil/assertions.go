package testutil

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// AssertAPIResponse checks standard API response structure
func AssertAPIResponse(t *testing.T, tc *TestContext, expectedStatus int, expectedSuccess bool) {
	t.Helper()

	assert.Equal(t, expectedStatus, tc.Recorder.Code, "HTTP status code mismatch")

	var response APIResponse
	err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response)
	require.NoError(t, err, "Failed to parse API response")

	assert.Equal(t, expectedSuccess, response.Success, "API success field mismatch")
}

// AssertAPISuccess checks for successful API response
func AssertAPISuccess(t *testing.T, tc *TestContext) {
	t.Helper()
	AssertAPIResponse(t, tc, http.StatusOK, true)
}

// AssertAPICreated checks for successful creation response
func AssertAPICreated(t *testing.T, tc *TestContext) {
	t.Helper()
	AssertAPIResponse(t, tc, http.StatusCreated, true)
}

// AssertAPIBadRequest checks for bad request response
func AssertAPIBadRequest(t *testing.T, tc *TestContext) {
	t.Helper()
	AssertAPIResponse(t, tc, http.StatusBadRequest, false)
}

// AssertAPIUnauthorized checks for unauthorized response
func AssertAPIUnauthorized(t *testing.T, tc *TestContext) {
	t.Helper()
	AssertAPIResponse(t, tc, http.StatusUnauthorized, false)
}

// AssertAPIForbidden checks for forbidden response
func AssertAPIForbidden(t *testing.T, tc *TestContext) {
	t.Helper()
	AssertAPIResponse(t, tc, http.StatusForbidden, false)
}

// AssertAPINotFound checks for not found response
func AssertAPINotFound(t *testing.T, tc *TestContext) {
	t.Helper()
	AssertAPIResponse(t, tc, http.StatusNotFound, false)
}

// AssertAPIInternalError checks for internal server error response
func AssertAPIInternalError(t *testing.T, tc *TestContext) {
	t.Helper()
	AssertAPIResponse(t, tc, http.StatusInternalServerError, false)
}

// AssertResponseContains checks if response contains expected key
func AssertResponseContains(t *testing.T, tc *TestContext, key string) {
	t.Helper()

	response, err := tc.GetResponse()
	require.NoError(t, err, "Failed to parse response")

	assert.Contains(t, response, key, "Response should contain key: %s", key)
}

// AssertResponseMessage checks if response message matches
func AssertResponseMessage(t *testing.T, tc *TestContext, expectedMessage string) {
	t.Helper()

	var response APIResponse
	err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response)
	require.NoError(t, err, "Failed to parse API response")

	assert.Equal(t, expectedMessage, response.Message, "Response message mismatch")
}

// AssertResponseError checks if response error matches
func AssertResponseError(t *testing.T, tc *TestContext, expectedError string) {
	t.Helper()

	var response APIResponse
	err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response)
	require.NoError(t, err, "Failed to parse API response")

	assert.Equal(t, expectedError, response.Error, "Response error mismatch")
}

// AssertResponseErrorContains checks if response error contains expected substring
func AssertResponseErrorContains(t *testing.T, tc *TestContext, substring string) {
	t.Helper()

	var response APIResponse
	err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response)
	require.NoError(t, err, "Failed to parse API response")

	assert.Contains(t, response.Error, substring, "Response error should contain: %s", substring)
}

// AssertDataField checks if response data contains expected field with value
func AssertDataField(t *testing.T, tc *TestContext, fieldName string, expectedValue any) {
	t.Helper()

	var response struct {
		Data map[string]any `json:"data"`
	}
	err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response)
	require.NoError(t, err, "Failed to parse API response")
	require.NotNil(t, response.Data, "Response data should not be nil")

	assert.Equal(t, expectedValue, response.Data[fieldName], "Data field %s mismatch", fieldName)
}

// AssertDataFieldExists checks if response data contains expected field
func AssertDataFieldExists(t *testing.T, tc *TestContext, fieldName string) {
	t.Helper()

	var response struct {
		Data map[string]any `json:"data"`
	}
	err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response)
	require.NoError(t, err, "Failed to parse API response")
	require.NotNil(t, response.Data, "Response data should not be nil")

	assert.Contains(t, response.Data, fieldName, "Data should contain field: %s", fieldName)
}

// AssertPaginatedResponse checks paginated response structure
func AssertPaginatedResponse(t *testing.T, tc *TestContext, expectedTotal int) {
	t.Helper()

	var response PaginatedResponse
	err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response)
	require.NoError(t, err, "Failed to parse paginated response")

	assert.True(t, response.Success, "Paginated response should be successful")
	assert.Equal(t, expectedTotal, response.Meta.Total, "Total count mismatch")
}

// AssertPaginationMeta checks pagination metadata
func AssertPaginationMeta(t *testing.T, tc *TestContext, currentPage, perPage, total, totalPages int) {
	t.Helper()

	var response PaginatedResponse
	err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response)
	require.NoError(t, err, "Failed to parse paginated response")

	assert.Equal(t, currentPage, response.Meta.CurrentPage, "Current page mismatch")
	assert.Equal(t, perPage, response.Meta.PerPage, "Per page mismatch")
	assert.Equal(t, total, response.Meta.Total, "Total mismatch")
	assert.Equal(t, totalPages, response.Meta.TotalPages, "Total pages mismatch")
}

// AssertContentType checks Content-Type header
func AssertContentType(t *testing.T, tc *TestContext, expectedContentType string) {
	t.Helper()

	contentType := tc.Recorder.Header().Get("Content-Type")
	assert.Contains(t, contentType, expectedContentType, "Content-Type mismatch")
}

// AssertJSONContentType checks for application/json Content-Type
func AssertJSONContentType(t *testing.T, tc *TestContext) {
	t.Helper()
	AssertContentType(t, tc, "application/json")
}

// AssertHeader checks if response header matches expected value
func AssertHeader(t *testing.T, tc *TestContext, headerName, expectedValue string) {
	t.Helper()

	actualValue := tc.Recorder.Header().Get(headerName)
	assert.Equal(t, expectedValue, actualValue, "Header %s mismatch", headerName)
}

// AssertHeaderExists checks if response header exists
func AssertHeaderExists(t *testing.T, tc *TestContext, headerName string) {
	t.Helper()

	actualValue := tc.Recorder.Header().Get(headerName)
	assert.NotEmpty(t, actualValue, "Header %s should exist", headerName)
}

// AssertNoDBError checks that all database expectations were met
func AssertNoDBError(t *testing.T, mockDB *MockDB) {
	t.Helper()

	err := mockDB.ExpectationsWereMet()
	assert.NoError(t, err, "Unfulfilled database expectations")
}

// AssertIDRCurrency checks if value is formatted as IDR (Indonesian Rupiah)
// Expected format: "Rp xxx.xxx" or numeric value in IDR
func AssertIDRCurrency(t *testing.T, value float64, minExpected, maxExpected float64) {
	t.Helper()

	assert.GreaterOrEqual(t, value, minExpected, "IDR value should be >= %f", minExpected)
	assert.LessOrEqual(t, value, maxExpected, "IDR value should be <= %f", maxExpected)
}

// AssertValidUUID checks if string is a valid UUID format
func AssertValidUUID(t *testing.T, value string) {
	t.Helper()

	assert.Len(t, value, 36, "UUID should be 36 characters long")
	assert.Equal(t, '-', rune(value[8]), "UUID should have dash at position 8")
	assert.Equal(t, '-', rune(value[13]), "UUID should have dash at position 13")
	assert.Equal(t, '-', rune(value[18]), "UUID should have dash at position 18")
	assert.Equal(t, '-', rune(value[23]), "UUID should have dash at position 23")
}

// AssertOrderStatus checks if order status is valid
func AssertOrderStatus(t *testing.T, status string) {
	t.Helper()

	validStatuses := []string{"pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"}
	assert.Contains(t, validStatuses, status, "Invalid order status: %s", status)
}

// AssertPaymentStatus checks if payment status is valid
func AssertPaymentStatus(t *testing.T, status string) {
	t.Helper()

	validStatuses := []string{"pending", "completed", "failed", "refunded"}
	assert.Contains(t, validStatuses, status, "Invalid payment status: %s", status)
}

// AssertUserRole checks if user role is valid
func AssertUserRole(t *testing.T, role string) {
	t.Helper()

	validRoles := []string{"admin", "manager", "server", "counter", "kitchen"}
	assert.Contains(t, validRoles, role, "Invalid user role: %s", role)
}

// AssertOrderType checks if order type is valid
func AssertOrderType(t *testing.T, orderType string) {
	t.Helper()

	validTypes := []string{"dine_in", "takeout", "delivery"}
	assert.Contains(t, validTypes, orderType, "Invalid order type: %s", orderType)
}
