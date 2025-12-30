package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestIngredientsHandler_GetIngredients_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	now := time.Now()
	ingredientID := uuid.New()

	rows := sqlmock.NewRows([]string{
		"id", "name", "description", "unit",
		"current_stock", "minimum_stock", "maximum_stock", "unit_cost",
		"supplier", "last_restocked_at", "is_active",
		"created_at", "updated_at", "status", "total_value",
	}).AddRow(
		ingredientID, "Salt", "Table salt", "kg",
		50.0, 10.0, 100.0, 5000.0,
		"Salt Supplier Co", now, true,
		now, now, "ok", 250000.0,
	)

	mock.ExpectQuery(`SELECT`).WillReturnRows(rows)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodGet, "/api/v1/ingredients", nil)

	handler.GetIngredients(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response []Ingredient
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Len(t, response, 1)
	assert.Equal(t, "Salt", response[0].Name)
	assert.Equal(t, "ok", response[0].Status)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestIngredientsHandler_GetIngredients_Empty(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	rows := sqlmock.NewRows([]string{
		"id", "name", "description", "unit",
		"current_stock", "minimum_stock", "maximum_stock", "unit_cost",
		"supplier", "last_restocked_at", "is_active",
		"created_at", "updated_at", "status", "total_value",
	})

	mock.ExpectQuery(`SELECT`).WillReturnRows(rows)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodGet, "/api/v1/ingredients", nil)

	handler.GetIngredients(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response []Ingredient
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Len(t, response, 0)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestIngredientsHandler_GetIngredients_DBError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	mock.ExpectQuery(`SELECT`).WillReturnError(sql.ErrConnDone)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodGet, "/api/v1/ingredients", nil)

	handler.GetIngredients(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Contains(t, w.Body.String(), "Failed to fetch ingredients")
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestIngredientsHandler_GetIngredient_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	now := time.Now()
	ingredientID := uuid.New()

	mock.ExpectQuery(`SELECT`).WithArgs(ingredientID.String()).WillReturnRows(
		sqlmock.NewRows([]string{
			"id", "name", "description", "unit",
			"current_stock", "minimum_stock", "maximum_stock", "unit_cost",
			"supplier", "last_restocked_at", "is_active",
			"created_at", "updated_at", "status", "total_value",
		}).AddRow(
			ingredientID, "Salt", "Table salt", "kg",
			50.0, 10.0, 100.0, 5000.0,
			"Salt Supplier Co", now, true,
			now, now, "ok", 250000.0,
		),
	)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodGet, "/api/v1/ingredients/"+ingredientID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: ingredientID.String()}}

	handler.GetIngredient(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response Ingredient
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Salt", response.Name)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestIngredientsHandler_GetIngredient_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	ingredientID := uuid.New()

	mock.ExpectQuery(`SELECT`).WithArgs(ingredientID.String()).WillReturnError(sql.ErrNoRows)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodGet, "/api/v1/ingredients/"+ingredientID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: ingredientID.String()}}

	handler.GetIngredient(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
	assert.Contains(t, w.Body.String(), "Ingredient not found")
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestIngredientsHandler_CreateIngredient_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	now := time.Now()

	mock.ExpectQuery(`INSERT INTO ingredients`).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "description", "unit", "current_stock",
			"minimum_stock", "maximum_stock", "unit_cost", "supplier",
			"created_at", "updated_at",
		}).AddRow(
			uuid.New(), "Salt", "Table salt", "kg", 0.0,
			10.0, 100.0, 5000.0, "Salt Supplier",
			now, now,
		))

	body := `{"name":"Salt","description":"Table salt","unit":"kg","minimum_stock":10,"maximum_stock":100,"unit_cost":5000,"supplier":"Salt Supplier"}`
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodPost, "/api/v1/ingredients", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.CreateIngredient(c)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response Ingredient
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Salt", response.Name)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestIngredientsHandler_CreateIngredient_MissingRequiredFields(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, _, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	// Missing name and unit
	body := `{"description":"Table salt"}`
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodPost, "/api/v1/ingredients", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.CreateIngredient(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestIngredientsHandler_CreateIngredient_DBError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	mock.ExpectQuery(`INSERT INTO ingredients`).WillReturnError(sql.ErrConnDone)

	body := `{"name":"Salt","unit":"kg"}`
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodPost, "/api/v1/ingredients", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.CreateIngredient(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Contains(t, w.Body.String(), "Failed to create ingredient")
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestIngredientsHandler_UpdateIngredient_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	now := time.Now()
	ingredientID := uuid.New()

	mock.ExpectQuery(`UPDATE ingredients`).WillReturnRows(
		sqlmock.NewRows([]string{
			"id", "name", "description", "unit", "current_stock",
			"minimum_stock", "maximum_stock", "unit_cost", "supplier",
			"is_active", "created_at", "updated_at",
		}).AddRow(
			ingredientID, "Salt Updated", "Table salt", "kg", 50.0,
			15.0, 100.0, 5500.0, "Salt Supplier",
			true, now, now,
		),
	)

	body := `{"name":"Salt Updated","minimum_stock":15,"unit_cost":5500}`
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodPut, "/api/v1/ingredients/"+ingredientID.String(), strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: ingredientID.String()}}

	handler.UpdateIngredient(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response Ingredient
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Salt Updated", response.Name)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestIngredientsHandler_UpdateIngredient_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	ingredientID := uuid.New()

	mock.ExpectQuery(`UPDATE ingredients`).WillReturnError(sql.ErrNoRows)

	body := `{"name":"Salt Updated"}`
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodPut, "/api/v1/ingredients/"+ingredientID.String(), strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: ingredientID.String()}}

	handler.UpdateIngredient(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
	assert.Contains(t, w.Body.String(), "Ingredient not found")
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestIngredientsHandler_DeleteIngredient_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	ingredientID := uuid.New()

	mock.ExpectExec(`UPDATE ingredients SET is_active = false`).
		WithArgs(ingredientID.String()).
		WillReturnResult(sqlmock.NewResult(0, 1))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodDelete, "/api/v1/ingredients/"+ingredientID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: ingredientID.String()}}

	handler.DeleteIngredient(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "Ingredient deleted successfully")
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestIngredientsHandler_DeleteIngredient_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	ingredientID := uuid.New()

	mock.ExpectExec(`UPDATE ingredients SET is_active = false`).
		WithArgs(ingredientID.String()).
		WillReturnResult(sqlmock.NewResult(0, 0))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodDelete, "/api/v1/ingredients/"+ingredientID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: ingredientID.String()}}

	handler.DeleteIngredient(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
	assert.Contains(t, w.Body.String(), "Ingredient not found")
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestIngredientsHandler_GetLowStockIngredients_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	now := time.Now()

	rows := sqlmock.NewRows([]string{
		"id", "name", "description", "unit",
		"current_stock", "minimum_stock", "maximum_stock", "unit_cost",
		"supplier", "last_restocked_at", "is_active",
		"created_at", "updated_at", "status", "total_value",
	}).AddRow(
		uuid.New(), "Salt", "Table salt", "kg",
		5.0, 10.0, 100.0, 5000.0,
		"Salt Supplier Co", now, true,
		now, now, "low", 25000.0,
	)

	mock.ExpectQuery(`SELECT`).WillReturnRows(rows)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodGet, "/api/v1/ingredients/low-stock", nil)

	handler.GetLowStockIngredients(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response []Ingredient
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Len(t, response, 1)
	assert.Equal(t, "low", response[0].Status)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestIngredientsHandler_GetIngredientHistory_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	handler := &IngredientsHandler{db: db}

	now := time.Now()
	ingredientID := uuid.New()

	rows := sqlmock.NewRows([]string{
		"id", "operation", "quantity", "previous_stock", "new_stock",
		"reason", "notes", "adjusted_by", "created_at",
	}).AddRow(
		uuid.New(), "restock", 50.0, 0.0, 50.0,
		"restock", "Initial stock", "admin", now,
	)

	mock.ExpectQuery(`SELECT`).WithArgs(ingredientID.String()).WillReturnRows(rows)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodGet, "/api/v1/ingredients/"+ingredientID.String()+"/history", nil)
	c.Params = gin.Params{{Key: "id", Value: ingredientID.String()}}

	handler.GetIngredientHistory(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.NoError(t, mock.ExpectationsWereMet())
}
