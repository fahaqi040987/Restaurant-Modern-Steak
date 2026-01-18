package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"pos-public/internal/models"
)

type RecipeHandler struct {
	DB *sql.DB
}

func NewRecipeHandler(db *sql.DB) *RecipeHandler {
	return &RecipeHandler{DB: db}
}

// GetProductIngredients retrieves all ingredients for a specific product
func (h *RecipeHandler) GetProductIngredients(c *gin.Context) {
	productIDStr := c.Param("id")
	productID, err := uuid.Parse(productIDStr)
	if err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid product ID",
			Error:   &errMsg,
		})
		return
	}

	query := `
		SELECT
			pi.id,
			pi.product_id,
			pi.ingredient_id,
			pi.quantity_required,
			i.name as ingredient_name,
			i.current_stock,
			i.unit as ingredient_unit
		FROM product_ingredients pi
		JOIN ingredients i ON pi.ingredient_id = i.id
		WHERE pi.product_id = $1
		ORDER BY i.name
	`

	rows, err := h.DB.Query(query, productID)
	if err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to retrieve product ingredients",
			Error:   &errMsg,
		})
		return
	}
	defer rows.Close()

	var ingredients []models.ProductIngredient
	for rows.Next() {
		var pi models.ProductIngredient
		err := rows.Scan(
			&pi.ID,
			&pi.ProductID,
			&pi.IngredientID,
			&pi.QuantityRequired,
			&pi.IngredientName,
			&pi.CurrentStock,
			&pi.IngredientUnit,
		)
		if err != nil {
			errMsg := err.Error()
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan ingredient data",
				Error:   &errMsg,
			})
			return
		}
		ingredients = append(ingredients, pi)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Product ingredients retrieved successfully",
		Data:    ingredients,
	})
}

// AddProductIngredient adds an ingredient to a product recipe
func (h *RecipeHandler) AddProductIngredient(c *gin.Context) {
	productIDStr := c.Param("id")
	productID, err := uuid.Parse(productIDStr)
	if err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid product ID",
			Error:   &errMsg,
		})
		return
	}

	var req models.AddRecipeIngredientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   &errMsg,
		})
		return
	}

	// Verify product exists
	var productExists bool
	err = h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE id = $1)", productID).Scan(&productExists)
	if err != nil || !productExists {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Product not found",
		})
		return
	}

	// Verify ingredient exists
	var ingredientExists bool
	err = h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM ingredients WHERE id = $1)", req.IngredientID).Scan(&ingredientExists)
	if err != nil || !ingredientExists {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Ingredient not found",
		})
		return
	}

	// Check if ingredient already exists in recipe
	var exists bool
	err = h.DB.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM product_ingredients WHERE product_id = $1 AND ingredient_id = $2)",
		productID, req.IngredientID,
	).Scan(&exists)
	if err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to check ingredient existence",
			Error:   &errMsg,
		})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, models.APIResponse{
			Success: false,
			Message: "Ingredient already exists in this product recipe",
		})
		return
	}

	// Insert product ingredient
	var newID uuid.UUID
	query := `
		INSERT INTO product_ingredients (product_id, ingredient_id, quantity_required)
		VALUES ($1, $2, $3)
		RETURNING id
	`
	err = h.DB.QueryRow(query, productID, req.IngredientID, req.QuantityRequired).Scan(&newID)
	if err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to add ingredient to product",
			Error:   &errMsg,
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Ingredient added to product successfully",
		Data:    map[string]string{"id": newID.String()},
	})
}

// UpdateProductIngredient updates the quantity required for a product ingredient
func (h *RecipeHandler) UpdateProductIngredient(c *gin.Context) {
	productIDStr := c.Param("id")
	productID, err := uuid.Parse(productIDStr)
	if err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid product ID",
			Error:   &errMsg,
		})
		return
	}

	ingredientIDStr := c.Param("ingredient_id")
	ingredientID, err := uuid.Parse(ingredientIDStr)
	if err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid ingredient ID",
			Error:   &errMsg,
		})
		return
	}

	var req models.UpdateRecipeIngredientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   &errMsg,
		})
		return
	}

	query := `
		UPDATE product_ingredients
		SET quantity_required = $1, updated_at = CURRENT_TIMESTAMP
		WHERE product_id = $2 AND ingredient_id = $3
	`
	result, err := h.DB.Exec(query, req.QuantityRequired, productID, ingredientID)
	if err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to update product ingredient",
			Error:   &errMsg,
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Product ingredient not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Product ingredient updated successfully",
	})
}

// DeleteProductIngredient removes an ingredient from a product recipe
func (h *RecipeHandler) DeleteProductIngredient(c *gin.Context) {
	productIDStr := c.Param("id")
	productID, err := uuid.Parse(productIDStr)
	if err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid product ID",
			Error:   &errMsg,
		})
		return
	}

	ingredientIDStr := c.Param("ingredient_id")
	ingredientID, err := uuid.Parse(ingredientIDStr)
	if err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid ingredient ID",
			Error:   &errMsg,
		})
		return
	}

	query := "DELETE FROM product_ingredients WHERE product_id = $1 AND ingredient_id = $2"
	result, err := h.DB.Exec(query, productID, ingredientID)
	if err != nil {
		errMsg := err.Error()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to delete product ingredient",
			Error:   &errMsg,
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Product ingredient not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Ingredient removed from product successfully",
	})
}
