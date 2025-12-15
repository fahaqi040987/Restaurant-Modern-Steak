package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"pos-public/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type IngredientsHandler struct {
	db              *sql.DB
	notificationSvc *services.NotificationService
}

func NewIngredientsHandler(db *sql.DB) *IngredientsHandler {
	return &IngredientsHandler{
		db:              db,
		notificationSvc: services.NewNotificationService(db),
	}
}

// Ingredient represents a raw ingredient/supply item
type Ingredient struct {
	ID            uuid.UUID `json:"id"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	Unit          string    `json:"unit"`
	CurrentStock  float64   `json:"current_stock"`
	MinimumStock  float64   `json:"minimum_stock"`
	MaximumStock  float64   `json:"maximum_stock"`
	UnitCost      float64   `json:"unit_cost"`
	Supplier      string    `json:"supplier"`
	LastRestocked time.Time `json:"last_restocked"`
	IsActive      bool      `json:"is_active"`
	Status        string    `json:"status"` // ok, low, out
	TotalValue    float64   `json:"total_value"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// GetIngredients retrieves all ingredients with stock status
func (h *IngredientsHandler) GetIngredients(c *gin.Context) {
	query := `
		SELECT 
			id, name, COALESCE(description, ''), unit,
			current_stock, minimum_stock, maximum_stock, unit_cost,
			COALESCE(supplier, ''), COALESCE(last_restocked_at, created_at),
			is_active, created_at, updated_at,
			CASE 
				WHEN current_stock = 0 THEN 'out'
				WHEN current_stock < minimum_stock THEN 'low'
				ELSE 'ok'
			END as status,
			current_stock * unit_cost as total_value
		FROM ingredients
		WHERE is_active = true
		ORDER BY status DESC, name ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredients"})
		return
	}
	defer rows.Close()

	var ingredients []Ingredient
	for rows.Next() {
		var ing Ingredient
		err := rows.Scan(
			&ing.ID, &ing.Name, &ing.Description, &ing.Unit,
			&ing.CurrentStock, &ing.MinimumStock, &ing.MaximumStock, &ing.UnitCost,
			&ing.Supplier, &ing.LastRestocked, &ing.IsActive,
			&ing.CreatedAt, &ing.UpdatedAt, &ing.Status, &ing.TotalValue,
		)
		if err != nil {
			continue
		}
		ingredients = append(ingredients, ing)
	}

	if ingredients == nil {
		ingredients = []Ingredient{}
	}

	c.JSON(http.StatusOK, ingredients)
}

// GetIngredient retrieves a single ingredient by ID
func (h *IngredientsHandler) GetIngredient(c *gin.Context) {
	id := c.Param("id")

	var ing Ingredient
	query := `
		SELECT 
			id, name, COALESCE(description, ''), unit,
			current_stock, minimum_stock, maximum_stock, unit_cost,
			COALESCE(supplier, ''), COALESCE(last_restocked_at, created_at),
			is_active, created_at, updated_at,
			CASE 
				WHEN current_stock = 0 THEN 'out'
				WHEN current_stock < minimum_stock THEN 'low'
				ELSE 'ok'
			END as status,
			current_stock * unit_cost as total_value
		FROM ingredients
		WHERE id = $1
	`

	err := h.db.QueryRow(query, id).Scan(
		&ing.ID, &ing.Name, &ing.Description, &ing.Unit,
		&ing.CurrentStock, &ing.MinimumStock, &ing.MaximumStock, &ing.UnitCost,
		&ing.Supplier, &ing.LastRestocked, &ing.IsActive,
		&ing.CreatedAt, &ing.UpdatedAt, &ing.Status, &ing.TotalValue,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ingredient not found"})
		return
	}

	c.JSON(http.StatusOK, ing)
}

// CreateIngredientRequest represents new ingredient creation
type CreateIngredientRequest struct {
	Name         string  `json:"name" binding:"required"`
	Description  string  `json:"description"`
	Unit         string  `json:"unit" binding:"required"`
	CurrentStock float64 `json:"current_stock"`
	MinimumStock float64 `json:"minimum_stock"`
	MaximumStock float64 `json:"maximum_stock"`
	UnitCost     float64 `json:"unit_cost"`
	Supplier     string  `json:"supplier"`
}

// CreateIngredient creates a new ingredient
func (h *IngredientsHandler) CreateIngredient(c *gin.Context) {
	var req CreateIngredientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id := uuid.New()
	query := `
		INSERT INTO ingredients (id, name, description, unit, current_stock, minimum_stock, maximum_stock, unit_cost, supplier)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, name, description, unit, current_stock, minimum_stock, maximum_stock, unit_cost, supplier, created_at, updated_at
	`

	var ing Ingredient
	err := h.db.QueryRow(query, id, req.Name, req.Description, req.Unit, req.CurrentStock,
		req.MinimumStock, req.MaximumStock, req.UnitCost, req.Supplier).Scan(
		&ing.ID, &ing.Name, &ing.Description, &ing.Unit, &ing.CurrentStock,
		&ing.MinimumStock, &ing.MaximumStock, &ing.UnitCost, &ing.Supplier,
		&ing.CreatedAt, &ing.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ingredient"})
		return
	}

	c.JSON(http.StatusCreated, ing)
}

// UpdateIngredientRequest represents ingredient update
type UpdateIngredientRequest struct {
	Name         string  `json:"name"`
	Description  string  `json:"description"`
	Unit         string  `json:"unit"`
	MinimumStock float64 `json:"minimum_stock"`
	MaximumStock float64 `json:"maximum_stock"`
	UnitCost     float64 `json:"unit_cost"`
	Supplier     string  `json:"supplier"`
	IsActive     *bool   `json:"is_active"`
}

// UpdateIngredient updates an ingredient
func (h *IngredientsHandler) UpdateIngredient(c *gin.Context) {
	id := c.Param("id")

	var req UpdateIngredientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `
		UPDATE ingredients 
		SET name = COALESCE(NULLIF($1, ''), name),
		    description = COALESCE(NULLIF($2, ''), description),
		    unit = COALESCE(NULLIF($3, ''), unit),
		    minimum_stock = COALESCE(NULLIF($4, 0), minimum_stock),
		    maximum_stock = COALESCE(NULLIF($5, 0), maximum_stock),
		    unit_cost = COALESCE(NULLIF($6, 0), unit_cost),
		    supplier = COALESCE(NULLIF($7, ''), supplier),
		    updated_at = NOW()
		WHERE id = $8
		RETURNING id, name, description, unit, current_stock, minimum_stock, maximum_stock, unit_cost, supplier, is_active, created_at, updated_at
	`

	var ing Ingredient
	err := h.db.QueryRow(query, req.Name, req.Description, req.Unit, req.MinimumStock,
		req.MaximumStock, req.UnitCost, req.Supplier, id).Scan(
		&ing.ID, &ing.Name, &ing.Description, &ing.Unit, &ing.CurrentStock,
		&ing.MinimumStock, &ing.MaximumStock, &ing.UnitCost, &ing.Supplier,
		&ing.IsActive, &ing.CreatedAt, &ing.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ingredient not found"})
		return
	}

	c.JSON(http.StatusOK, ing)
}

// DeleteIngredient soft-deletes an ingredient
func (h *IngredientsHandler) DeleteIngredient(c *gin.Context) {
	id := c.Param("id")

	query := `UPDATE ingredients SET is_active = false, updated_at = NOW() WHERE id = $1`
	result, err := h.db.Exec(query, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ingredient"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ingredient not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ingredient deleted successfully"})
}

// RestockIngredientRequest represents restock operation
type RestockIngredientRequest struct {
	IngredientID uuid.UUID `json:"ingredient_id" binding:"required"`
	Quantity     float64   `json:"quantity" binding:"required,gt=0"`
	Notes        string    `json:"notes"`
}

// RestockIngredient adds stock to an ingredient
func (h *IngredientsHandler) RestockIngredient(c *gin.Context) {
	var req RestockIngredientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Begin transaction
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Get current stock
	var currentStock float64
	var ingredientName string
	err = tx.QueryRow(`SELECT current_stock, name FROM ingredients WHERE id = $1`, req.IngredientID).Scan(&currentStock, &ingredientName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ingredient not found"})
		return
	}

	newStock := currentStock + req.Quantity

	// Update stock
	_, err = tx.Exec(`
		UPDATE ingredients 
		SET current_stock = $1, last_restocked_at = NOW(), updated_at = NOW()
		WHERE id = $2
	`, newStock, req.IngredientID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
		return
	}

	// Create history record
	_, err = tx.Exec(`
		INSERT INTO ingredient_history (ingredient_id, operation, quantity, previous_stock, new_stock, reason, notes, adjusted_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, req.IngredientID, "restock", req.Quantity, currentStock, newStock, "restock", req.Notes, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create history"})
		return
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Ingredient restocked successfully",
		"previous_stock": currentStock,
		"new_stock":      newStock,
	})
}

// GetLowStockIngredients retrieves ingredients below minimum threshold
func (h *IngredientsHandler) GetLowStockIngredients(c *gin.Context) {
	query := `
		SELECT 
			id, name, COALESCE(description, ''), unit,
			current_stock, minimum_stock, maximum_stock, unit_cost,
			COALESCE(supplier, ''), COALESCE(last_restocked_at, created_at),
			is_active, created_at, updated_at,
			CASE 
				WHEN current_stock = 0 THEN 'out'
				ELSE 'low'
			END as status,
			current_stock * unit_cost as total_value
		FROM ingredients
		WHERE is_active = true AND current_stock < minimum_stock
		ORDER BY current_stock ASC, name ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch low stock ingredients"})
		return
	}
	defer rows.Close()

	var ingredients []Ingredient
	for rows.Next() {
		var ing Ingredient
		err := rows.Scan(
			&ing.ID, &ing.Name, &ing.Description, &ing.Unit,
			&ing.CurrentStock, &ing.MinimumStock, &ing.MaximumStock, &ing.UnitCost,
			&ing.Supplier, &ing.LastRestocked, &ing.IsActive,
			&ing.CreatedAt, &ing.UpdatedAt, &ing.Status, &ing.TotalValue,
		)
		if err != nil {
			continue
		}
		ingredients = append(ingredients, ing)
	}

	if ingredients == nil {
		ingredients = []Ingredient{}
	}

	c.JSON(http.StatusOK, ingredients)
}

// GetIngredientHistory retrieves stock movement history for an ingredient
func (h *IngredientsHandler) GetIngredientHistory(c *gin.Context) {
	ingredientID := c.Param("id")

	query := `
		SELECT 
			ih.id, ih.operation, ih.quantity, ih.previous_stock, ih.new_stock,
			COALESCE(ih.reason, ''), COALESCE(ih.notes, ''),
			COALESCE(u.username, 'System') as adjusted_by,
			ih.created_at
		FROM ingredient_history ih
		LEFT JOIN users u ON ih.adjusted_by = u.id
		WHERE ih.ingredient_id = $1
		ORDER BY ih.created_at DESC
		LIMIT 100
	`

	rows, err := h.db.Query(query, ingredientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch history"})
		return
	}
	defer rows.Close()

	type HistoryRecord struct {
		ID            uuid.UUID `json:"id"`
		Operation     string    `json:"operation"`
		Quantity      float64   `json:"quantity"`
		PreviousStock float64   `json:"previous_stock"`
		NewStock      float64   `json:"new_stock"`
		Reason        string    `json:"reason"`
		Notes         string    `json:"notes"`
		AdjustedBy    string    `json:"adjusted_by"`
		CreatedAt     time.Time `json:"created_at"`
	}

	var history []HistoryRecord
	for rows.Next() {
		var record HistoryRecord
		err := rows.Scan(
			&record.ID, &record.Operation, &record.Quantity,
			&record.PreviousStock, &record.NewStock, &record.Reason,
			&record.Notes, &record.AdjustedBy, &record.CreatedAt,
		)
		if err != nil {
			continue
		}
		history = append(history, record)
	}

	if history == nil {
		history = []HistoryRecord{}
	}

	c.JSON(http.StatusOK, history)
}
