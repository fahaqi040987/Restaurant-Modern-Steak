package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProductHandler struct {
	db *sql.DB
}

func NewProductHandler(db *sql.DB) *ProductHandler {
	return &ProductHandler{db: db}
}

// GetProducts retrieves all products with pagination and filtering
func (h *ProductHandler) GetProducts(c *gin.Context) {
	// Parse query parameters
	page := 1
	perPage := 50
	categoryID := c.Query("category_id")
	available := c.Query("available")
	search := c.Query("search")

	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if perPageStr := c.Query("per_page"); perPageStr != "" {
		if pp, err := strconv.Atoi(perPageStr); err == nil && pp > 0 && pp <= 100 {
			perPage = pp
		}
	}

	offset := (page - 1) * perPage

	// Build query with filters
	queryBuilder := `
		SELECT p.id, p.category_id, p.name, p.description, p.price, p.image_url, 
		       p.barcode, p.sku, p.is_available, p.preparation_time, p.sort_order,
		       p.created_at, p.updated_at,
		       c.name as category_name, c.color as category_color
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE 1=1
	`

	var args []interface{}
	argIndex := 0

	if categoryID != "" {
		if _, err := uuid.Parse(categoryID); err == nil {
			argIndex++
			queryBuilder += ` AND p.category_id = $` + strconv.Itoa(argIndex)
			args = append(args, categoryID)
		}
	}

	if available == "true" {
		queryBuilder += ` AND p.is_available = true`
	} else if available == "false" {
		queryBuilder += ` AND p.is_available = false`
	}

	if search != "" {
		argIndex++
		queryBuilder += ` AND (p.name ILIKE $` + strconv.Itoa(argIndex) + ` OR p.description ILIKE $` + strconv.Itoa(argIndex) + `)`
		args = append(args, "%"+search+"%")
	}

	// Count total records
	countQuery := "SELECT COUNT(*) FROM (" + queryBuilder + ") as count_query"
	var total int
	if err := h.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to count products",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Add ordering and pagination
	queryBuilder += ` ORDER BY p.sort_order ASC, p.name ASC`
	argIndex++
	queryBuilder += ` LIMIT $` + strconv.Itoa(argIndex)
	args = append(args, perPage)

	argIndex++
	queryBuilder += ` OFFSET $` + strconv.Itoa(argIndex)
	args = append(args, offset)

	rows, err := h.db.Query(queryBuilder, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch products",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var product models.Product
		var categoryName, categoryColor sql.NullString

		err := rows.Scan(
			&product.ID, &product.CategoryID, &product.Name, &product.Description,
			&product.Price, &product.ImageURL, &product.Barcode, &product.SKU,
			&product.IsAvailable, &product.PreparationTime, &product.SortOrder,
			&product.CreatedAt, &product.UpdatedAt,
			&categoryName, &categoryColor,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan product",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		// Add category info if available
		if categoryName.Valid {
			product.Category = &models.Category{
				ID:    *product.CategoryID,
				Name:  categoryName.String,
				Color: &categoryColor.String,
			}
		}

		products = append(products, product)
	}

	totalPages := (total + perPage - 1) / perPage

	c.JSON(http.StatusOK, models.PaginatedResponse{
		Success: true,
		Message: "Products retrieved successfully",
		Data:    products,
		Meta: models.MetaData{
			CurrentPage: page,
			PerPage:     perPage,
			Total:       total,
			TotalPages:  totalPages,
		},
	})
}

// GetProduct retrieves a specific product by ID
func (h *ProductHandler) GetProduct(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid product ID",
			Error:   stringPtr("invalid_uuid"),
		})
		return
	}

	var product models.Product
	var categoryName, categoryColor sql.NullString

	query := `
		SELECT p.id, p.category_id, p.name, p.description, p.price, p.image_url, 
		       p.barcode, p.sku, p.is_available, p.preparation_time, p.sort_order,
		       p.created_at, p.updated_at,
		       c.name as category_name, c.color as category_color
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.id = $1
	`

	err = h.db.QueryRow(query, productID).Scan(
		&product.ID, &product.CategoryID, &product.Name, &product.Description,
		&product.Price, &product.ImageURL, &product.Barcode, &product.SKU,
		&product.IsAvailable, &product.PreparationTime, &product.SortOrder,
		&product.CreatedAt, &product.UpdatedAt,
		&categoryName, &categoryColor,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Product not found",
			Error:   stringPtr("product_not_found"),
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch product",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Add category info if available
	if categoryName.Valid {
		product.Category = &models.Category{
			ID:    *product.CategoryID,
			Name:  categoryName.String,
			Color: &categoryColor.String,
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Product retrieved successfully",
		Data:    product,
	})
}

// GetCategories retrieves all categories
func (h *ProductHandler) GetCategories(c *gin.Context) {
	activeOnly := c.Query("active_only") == "true"

	query := `
		SELECT id, name, description, color, sort_order, is_active, created_at, updated_at
		FROM categories
	`

	if activeOnly {
		query += ` WHERE is_active = true`
	}

	query += ` ORDER BY sort_order ASC, name ASC`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch categories",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var category models.Category

		err := rows.Scan(
			&category.ID, &category.Name, &category.Description, &category.Color,
			&category.SortOrder, &category.IsActive, &category.CreatedAt, &category.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan category",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		categories = append(categories, category)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Categories retrieved successfully",
		Data:    categories,
	})
}

// GetProductsByCategory retrieves all products in a specific category
func (h *ProductHandler) GetProductsByCategory(c *gin.Context) {
	categoryID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid category ID",
			Error:   stringPtr("invalid_uuid"),
		})
		return
	}

	availableOnly := c.Query("available_only") == "true"

	query := `
		SELECT p.id, p.category_id, p.name, p.description, p.price, p.image_url, 
		       p.barcode, p.sku, p.is_available, p.preparation_time, p.sort_order,
		       p.created_at, p.updated_at,
		       c.name as category_name, c.color as category_color
		FROM products p
		JOIN categories c ON p.category_id = c.id
		WHERE p.category_id = $1
	`

	if availableOnly {
		query += ` AND p.is_available = true`
	}

	query += ` ORDER BY p.sort_order ASC, p.name ASC`

	rows, err := h.db.Query(query, categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch products",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var product models.Product
		var categoryName, categoryColor sql.NullString

		err := rows.Scan(
			&product.ID, &product.CategoryID, &product.Name, &product.Description,
			&product.Price, &product.ImageURL, &product.Barcode, &product.SKU,
			&product.IsAvailable, &product.PreparationTime, &product.SortOrder,
			&product.CreatedAt, &product.UpdatedAt,
			&categoryName, &categoryColor,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan product",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		// Add category info
		if categoryName.Valid {
			product.Category = &models.Category{
				ID:    *product.CategoryID,
				Name:  categoryName.String,
				Color: &categoryColor.String,
			}
		}

		products = append(products, product)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Products retrieved successfully",
		Data:    products,
	})
}

// CreateProduct creates a new product (accessible by admin and manager)
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req models.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Validate required fields
	if req.Name == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Product name is required",
			Error:   stringPtr("missing_name"),
		})
		return
	}

	if req.CategoryID == uuid.Nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Category ID is required",
			Error:   stringPtr("missing_category_id"),
		})
		return
	}

	if req.Price <= 0 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Price must be greater than 0",
			Error:   stringPtr("invalid_price"),
		})
		return
	}

	// Verify category exists
	var categoryExists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1)", req.CategoryID).Scan(&categoryExists)
	if err != nil || !categoryExists {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Category not found",
			Error:   stringPtr("category_not_found"),
		})
		return
	}

	// Set default values
	if req.PreparationTime == nil {
		defaultPrepTime := 15
		req.PreparationTime = &defaultPrepTime
	}
	if req.IsAvailable == nil {
		defaultAvailable := true
		req.IsAvailable = &defaultAvailable
	}

	// Insert product
	productID := uuid.New()
	query := `
		INSERT INTO products (id, category_id, name, description, price, image_url, 
		                      barcode, sku, is_available, preparation_time, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at
	`

	var product models.Product
	err = h.db.QueryRow(
		query,
		productID,
		req.CategoryID,
		req.Name,
		req.Description,
		req.Price,
		req.ImageURL,
		req.Barcode,
		req.SKU,
		req.IsAvailable,
		req.PreparationTime,
		req.SortOrder,
	).Scan(&product.ID, &product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to create product",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Fetch complete product data with proper type conversion
	product.CategoryID = &req.CategoryID
	product.Name = req.Name
	product.Description = req.Description
	product.Price = req.Price
	product.ImageURL = req.ImageURL
	product.Barcode = req.Barcode
	product.SKU = req.SKU
	if req.IsAvailable != nil {
		product.IsAvailable = *req.IsAvailable
	}
	if req.PreparationTime != nil {
		product.PreparationTime = *req.PreparationTime
	}
	if req.SortOrder != nil {
		product.SortOrder = *req.SortOrder
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Product created successfully",
		Data:    product,
	})
}

// UpdateProduct updates an existing product (accessible by admin and manager)
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid product ID",
			Error:   stringPtr("invalid_uuid"),
		})
		return
	}

	var req models.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Verify product exists
	var exists bool
	err = h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE id = $1)", productID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Product not found",
			Error:   stringPtr("product_not_found"),
		})
		return
	}

	// Verify category exists if provided
	if req.CategoryID != nil && *req.CategoryID != uuid.Nil {
		var categoryExists bool
		err = h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1)", req.CategoryID).Scan(&categoryExists)
		if err != nil || !categoryExists {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Category not found",
				Error:   stringPtr("category_not_found"),
			})
			return
		}
	}

	// Validate price if provided
	if req.Price != nil && *req.Price <= 0 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Price must be greater than 0",
			Error:   stringPtr("invalid_price"),
		})
		return
	}

	// Build dynamic update query
	query := "UPDATE products SET updated_at = NOW()"
	var args []interface{}
	argIndex := 1

	if req.CategoryID != nil {
		argIndex++
		query += `, category_id = $` + strconv.Itoa(argIndex)
		args = append(args, req.CategoryID)
	}
	if req.Name != nil {
		argIndex++
		query += `, name = $` + strconv.Itoa(argIndex)
		args = append(args, req.Name)
	}
	if req.Description != nil {
		argIndex++
		query += `, description = $` + strconv.Itoa(argIndex)
		args = append(args, req.Description)
	}
	if req.Price != nil {
		argIndex++
		query += `, price = $` + strconv.Itoa(argIndex)
		args = append(args, req.Price)
	}
	if req.ImageURL != nil {
		argIndex++
		query += `, image_url = $` + strconv.Itoa(argIndex)
		args = append(args, req.ImageURL)
	}
	if req.Barcode != nil {
		argIndex++
		query += `, barcode = $` + strconv.Itoa(argIndex)
		args = append(args, req.Barcode)
	}
	if req.SKU != nil {
		argIndex++
		query += `, sku = $` + strconv.Itoa(argIndex)
		args = append(args, req.SKU)
	}
	if req.IsAvailable != nil {
		argIndex++
		query += `, is_available = $` + strconv.Itoa(argIndex)
		args = append(args, req.IsAvailable)
	}
	if req.PreparationTime != nil {
		argIndex++
		query += `, preparation_time = $` + strconv.Itoa(argIndex)
		args = append(args, req.PreparationTime)
	}
	if req.SortOrder != nil {
		argIndex++
		query += `, sort_order = $` + strconv.Itoa(argIndex)
		args = append(args, req.SortOrder)
	}

	argIndex++
	query += ` WHERE id = $` + strconv.Itoa(argIndex)
	args = append(args, productID)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to update product",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Fetch updated product
	var product models.Product
	var categoryName, categoryColor sql.NullString

	fetchQuery := `
		SELECT p.id, p.category_id, p.name, p.description, p.price, p.image_url, 
		       p.barcode, p.sku, p.is_available, p.preparation_time, p.sort_order,
		       p.created_at, p.updated_at,
		       c.name as category_name, c.color as category_color
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.id = $1
	`

	err = h.db.QueryRow(fetchQuery, productID).Scan(
		&product.ID, &product.CategoryID, &product.Name, &product.Description,
		&product.Price, &product.ImageURL, &product.Barcode, &product.SKU,
		&product.IsAvailable, &product.PreparationTime, &product.SortOrder,
		&product.CreatedAt, &product.UpdatedAt,
		&categoryName, &categoryColor,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch updated product",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Add category info
	if categoryName.Valid {
		product.Category = &models.Category{
			ID:    *product.CategoryID,
			Name:  categoryName.String,
			Color: &categoryColor.String,
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Product updated successfully",
		Data:    product,
	})
}

// DeleteProduct deletes a product (accessible by admin only)
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid product ID",
			Error:   stringPtr("invalid_uuid"),
		})
		return
	}

	// Check if product exists
	var exists bool
	err = h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE id = $1)", productID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Product not found",
			Error:   stringPtr("product_not_found"),
		})
		return
	}

	// Check if product is used in any orders
	var usedInOrders bool
	err = h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM order_items WHERE product_id = $1)", productID).Scan(&usedInOrders)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to check product usage",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	if usedInOrders {
		// Soft delete: mark as unavailable instead of deleting
		_, err = h.db.Exec("UPDATE products SET is_available = false, updated_at = NOW() WHERE id = $1", productID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to deactivate product",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		c.JSON(http.StatusOK, models.APIResponse{
			Success: true,
			Message: "Product deactivated (used in existing orders)",
			Data:    gin.H{"product_id": productID, "deactivated": true},
		})
		return
	}

	// Hard delete if not used in orders
	_, err = h.db.Exec("DELETE FROM products WHERE id = $1", productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to delete product",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Product deleted successfully",
		Data:    gin.H{"product_id": productID, "deleted": true},
	})
}
