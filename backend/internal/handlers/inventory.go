package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"pos-public/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type InventoryHandler struct {
	db              *sql.DB
	notificationSvc *services.NotificationService
}

func NewInventoryHandler(db *sql.DB) *InventoryHandler {
	return &InventoryHandler{
		db:              db,
		notificationSvc: services.NewNotificationService(db),
	}
}

// InventoryItem represents combined product and inventory data
type InventoryItem struct {
	ProductID     uuid.UUID `json:"product_id"`
	ProductName   string    `json:"product_name"`
	CategoryName  string    `json:"category_name"`
	CurrentStock  int       `json:"current_stock"`
	MinStock      int       `json:"min_stock"`
	MaxStock      int       `json:"max_stock"`
	Unit          string    `json:"unit"`
	LastRestocked time.Time `json:"last_restocked"`
	Status        string    `json:"status"` // ok, low, out
	Price         float64   `json:"price"`
}

// GetInventory retrieves all inventory items with current stock levels
func (h *InventoryHandler) GetInventory(c *gin.Context) {
	query := `
		SELECT 
			p.id, p.name, c.name as category_name,
			COALESCE(i.current_stock, 0) as current_stock,
			COALESCE(i.minimum_stock, 10) as min_stock,
			COALESCE(i.maximum_stock, 100) as max_stock,
			'pcs' as unit,
			COALESCE(i.last_restocked_at, p.created_at) as last_restocked,
			p.price,
			CASE 
				WHEN COALESCE(i.current_stock, 0) = 0 THEN 'out'
				WHEN COALESCE(i.current_stock, 0) < COALESCE(i.minimum_stock, 10) THEN 'low'
				ELSE 'ok'
			END as status
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN inventory i ON p.id = i.product_id
		WHERE p.is_available = true
		ORDER BY status DESC, c.name, p.name
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
		return
	}
	defer rows.Close()

	var items []InventoryItem
	for rows.Next() {
		var item InventoryItem
		err := rows.Scan(
			&item.ProductID, &item.ProductName, &item.CategoryName,
			&item.CurrentStock, &item.MinStock, &item.MaxStock,
			&item.Unit, &item.LastRestocked, &item.Price, &item.Status,
		)
		if err != nil {
			continue
		}
		items = append(items, item)
	}

	if items == nil {
		items = []InventoryItem{}
	}

	c.JSON(http.StatusOK, items)
}

// GetProductInventory retrieves inventory for a specific product
func (h *InventoryHandler) GetProductInventory(c *gin.Context) {
	productID := c.Param("product_id")

	var item InventoryItem
	query := `
		SELECT 
			p.id, p.name, c.name as category_name,
			COALESCE(i.current_stock, 0) as current_stock,
			COALESCE(i.min_stock, 10) as min_stock,
			COALESCE(i.max_stock, 100) as max_stock,
			COALESCE(i.unit, 'pcs') as unit,
			COALESCE(i.last_restocked, p.created_at) as last_restocked,
			p.price,
			CASE 
				WHEN COALESCE(i.current_stock, 0) = 0 THEN 'out'
				WHEN COALESCE(i.current_stock, 0) < COALESCE(i.min_stock, 10) THEN 'low'
				ELSE 'ok'
			END as status
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN inventory i ON p.id = i.product_id
		WHERE p.id = $1
	`

	err := h.db.QueryRow(query, productID).Scan(
		&item.ProductID, &item.ProductName, &item.CategoryName,
		&item.CurrentStock, &item.MinStock, &item.MaxStock,
		&item.Unit, &item.LastRestocked, &item.Price, &item.Status,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, item)
}

// AdjustStockRequest represents a stock adjustment request
type AdjustStockRequest struct {
	ProductID uuid.UUID `json:"product_id" binding:"required"`
	Operation string    `json:"operation" binding:"required"` // "add" or "remove"
	Quantity  int       `json:"quantity" binding:"required,gt=0"`
	Reason    string    `json:"reason" binding:"required"`
	Notes     string    `json:"notes"`
}

// AdjustStock adjusts inventory stock levels with audit trail
func (h *InventoryHandler) AdjustStock(c *gin.Context) {
	var req AdjustStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate operation
	if req.Operation != "add" && req.Operation != "remove" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Operation must be 'add' or 'remove'"})
		return
	}

	// Validate reason
	validReasons := []string{"purchase", "sale", "spoilage", "manual_adjustment", "inventory_count", "return", "damage", "theft", "expired"}
	validReason := false
	for _, r := range validReasons {
		if req.Reason == r {
			validReason = true
			break
		}
	}
	if !validReason {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reason"})
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

	// Get or create inventory record
	var currentStock int
	var inventoryID uuid.UUID
	checkQuery := `SELECT id, current_stock FROM inventory WHERE product_id = $1`
	err = tx.QueryRow(checkQuery, req.ProductID).Scan(&inventoryID, &currentStock)

	if err == sql.ErrNoRows {
		// Create new inventory record
		inventoryID = uuid.New()
		currentStock = 0
		insertQuery := `
			INSERT INTO inventory (id, product_id, current_stock, minimum_stock, maximum_stock)
			VALUES ($1, $2, 0, 10, 100)
		`
		_, err = tx.Exec(insertQuery, inventoryID, req.ProductID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create inventory record"})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
		return
	}

	// Calculate new stock
	previousStock := currentStock
	var newStock int
	if req.Operation == "add" {
		newStock = currentStock + req.Quantity
	} else {
		newStock = currentStock - req.Quantity
		if newStock < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock"})
			return
		}
	}

	// Update inventory
	updateQuery := `
		UPDATE inventory 
		SET current_stock = $1, last_restocked_at = NOW(), updated_at = NOW()
		WHERE product_id = $2
	`
	_, err = tx.Exec(updateQuery, newStock, req.ProductID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update inventory"})
		return
	}

	// Create history record
	historyQuery := `
		INSERT INTO inventory_history (product_id, operation, quantity, previous_stock, new_stock, reason, notes, adjusted_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err = tx.Exec(historyQuery, req.ProductID, req.Operation, req.Quantity, previousStock, newStock, req.Reason, req.Notes, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create history record"})
		return
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Check for low stock and send notification
	var productName string
	var minStock int
	stockQuery := `
		SELECT p.name, COALESCE(i.minimum_stock, 10) 
		FROM products p 
		LEFT JOIN inventory i ON p.id = i.product_id 
		WHERE p.id = $1
	`
	h.db.QueryRow(stockQuery, req.ProductID).Scan(&productName, &minStock)

	if newStock < minStock {
		// Send low stock notification (ignore errors)
		go h.notificationSvc.NotifyLowStock(productName, newStock, minStock)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Stock adjusted successfully",
		"previous_stock": previousStock,
		"new_stock":      newStock,
	})
}

// GetLowStock retrieves items below minimum stock threshold
func (h *InventoryHandler) GetLowStock(c *gin.Context) {
	query := `
		SELECT 
			p.id, p.name, c.name as category_name,
			COALESCE(i.current_stock, 0) as current_stock,
			COALESCE(i.minimum_stock, 10) as min_stock,
			COALESCE(i.maximum_stock, 100) as max_stock,
			'pcs' as unit,
			COALESCE(i.last_restocked_at, p.created_at) as last_restocked,
			p.price,
			CASE 
				WHEN COALESCE(i.current_stock, 0) = 0 THEN 'out'
				ELSE 'low'
			END as status
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN inventory i ON p.id = i.product_id
		WHERE p.is_available = true 
		  AND COALESCE(i.current_stock, 0) < COALESCE(i.minimum_stock, 10)
		ORDER BY COALESCE(i.current_stock, 0) ASC, p.name
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch low stock items"})
		return
	}
	defer rows.Close()

	var items []InventoryItem
	for rows.Next() {
		var item InventoryItem
		err := rows.Scan(
			&item.ProductID, &item.ProductName, &item.CategoryName,
			&item.CurrentStock, &item.MinStock, &item.MaxStock,
			&item.Unit, &item.LastRestocked, &item.Price, &item.Status,
		)
		if err != nil {
			continue
		}
		items = append(items, item)
	}

	if items == nil {
		items = []InventoryItem{}
	}

	c.JSON(http.StatusOK, items)
}

// HistoryRecord represents a stock movement history entry
type HistoryRecord struct {
	ID            uuid.UUID `json:"id"`
	Operation     string    `json:"operation"`
	Quantity      int       `json:"quantity"`
	PreviousStock int       `json:"previous_stock"`
	NewStock      int       `json:"new_stock"`
	Reason        string    `json:"reason"`
	Notes         string    `json:"notes"`
	AdjustedBy    string    `json:"adjusted_by"` // username
	CreatedAt     time.Time `json:"created_at"`
}

// GetStockHistory retrieves stock movement history for a product
func (h *InventoryHandler) GetStockHistory(c *gin.Context) {
	productID := c.Param("product_id")

	query := `
		SELECT 
			ih.id, ih.operation, ih.quantity, ih.previous_stock, ih.new_stock,
			ih.reason, COALESCE(ih.notes, '') as notes, 
			COALESCE(u.username, 'System') as adjusted_by,
			ih.created_at
		FROM inventory_history ih
		LEFT JOIN users u ON ih.adjusted_by = u.id
		WHERE ih.product_id = $1
		ORDER BY ih.created_at DESC
		LIMIT 100
	`

	rows, err := h.db.Query(query, productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch history"})
		return
	}
	defer rows.Close()

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
