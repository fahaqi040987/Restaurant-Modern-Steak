package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"pos-public/internal/models"
)

// IngredientService handles ingredient stock operations
type IngredientService struct {
	db                  *sql.DB
	notificationService *NotificationService
}

// NewIngredientService creates a new IngredientService
func NewIngredientService(db *sql.DB, notificationService *NotificationService) *IngredientService {
	return &IngredientService{
		db:                  db,
		notificationService: notificationService,
	}
}

// DeductIngredientsForOrder deducts ingredients based on order items when order is served
// Returns the number of ingredients deducted and any error
func (s *IngredientService) DeductIngredientsForOrder(orderID uuid.UUID, userID *uuid.UUID) (int, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return 0, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Get order items with their product IDs and quantities
	orderItemsQuery := `
		SELECT oi.product_id, oi.quantity
		FROM order_items oi
		WHERE oi.order_id = $1
	`
	rows, err := tx.Query(orderItemsQuery, orderID)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch order items: %w", err)
	}
	defer rows.Close()

	type orderItem struct {
		ProductID uuid.UUID
		Quantity  int
	}
	var items []orderItem
	for rows.Next() {
		var item orderItem
		if err := rows.Scan(&item.ProductID, &item.Quantity); err != nil {
			return 0, fmt.Errorf("failed to scan order item: %w", err)
		}
		items = append(items, item)
	}

	if len(items) == 0 {
		return 0, nil // No items to process
	}

	deductedCount := 0

	// For each order item, get the recipe and deduct ingredients
	for _, item := range items {
		// Get recipe ingredients for this product
		recipeQuery := `
			SELECT pi.ingredient_id, pi.quantity_required, i.current_stock, i.minimum_stock, i.name
			FROM product_ingredients pi
			JOIN ingredients i ON pi.ingredient_id = i.id
			WHERE pi.product_id = $1 AND i.is_active = true
		`
		recipeRows, err := tx.Query(recipeQuery, item.ProductID)
		if err != nil {
			return 0, fmt.Errorf("failed to fetch recipe for product %s: %w", item.ProductID, err)
		}

		type recipeIngredient struct {
			IngredientID     uuid.UUID
			QuantityRequired float64
			CurrentStock     float64
			MinimumStock     float64
			Name             string
		}
		var ingredients []recipeIngredient
		for recipeRows.Next() {
			var ing recipeIngredient
			if err := recipeRows.Scan(&ing.IngredientID, &ing.QuantityRequired, &ing.CurrentStock, &ing.MinimumStock, &ing.Name); err != nil {
				recipeRows.Close()
				return 0, fmt.Errorf("failed to scan recipe ingredient: %w", err)
			}
			ingredients = append(ingredients, ing)
		}
		recipeRows.Close()

		// Deduct each ingredient
		for _, ing := range ingredients {
			deductAmount := ing.QuantityRequired * float64(item.Quantity)
			newStock := ing.CurrentStock - deductAmount

			// Update ingredient stock
			updateQuery := `
				UPDATE ingredients
				SET current_stock = $1, updated_at = CURRENT_TIMESTAMP
				WHERE id = $2
			`
			if _, err := tx.Exec(updateQuery, newStock, ing.IngredientID); err != nil {
				return 0, fmt.Errorf("failed to update ingredient stock: %w", err)
			}

			// Record history
			historyQuery := `
				INSERT INTO ingredient_history
				(ingredient_id, order_id, operation, quantity, previous_stock, new_stock, reason, adjusted_by)
				VALUES ($1, $2, 'order_consumption', $3, $4, $5, 'Automatic deduction for order', $6)
			`
			if _, err := tx.Exec(historyQuery, ing.IngredientID, orderID, deductAmount, ing.CurrentStock, newStock, userID); err != nil {
				return 0, fmt.Errorf("failed to record ingredient history: %w", err)
			}

			deductedCount++

			// Check for low stock and generate notification
			if newStock < ing.MinimumStock && s.notificationService != nil {
				s.generateLowStockNotification(ing.IngredientID, ing.Name, newStock, ing.MinimumStock)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return deductedCount, nil
}

// RestoreIngredientsForOrder restores ingredients when an order is cancelled
// This reverses any previous deductions for this order
func (s *IngredientService) RestoreIngredientsForOrder(orderID uuid.UUID, userID *uuid.UUID) (int, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return 0, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Find all ingredient deductions for this order
	historyQuery := `
		SELECT ih.ingredient_id, ih.quantity, i.current_stock, i.name
		FROM ingredient_history ih
		JOIN ingredients i ON ih.ingredient_id = i.id
		WHERE ih.order_id = $1 AND ih.operation = 'order_consumption'
	`
	rows, err := tx.Query(historyQuery, orderID)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch ingredient history: %w", err)
	}
	defer rows.Close()

	type deduction struct {
		IngredientID uuid.UUID
		Quantity     float64
		CurrentStock float64
		Name         string
	}
	var deductions []deduction
	for rows.Next() {
		var d deduction
		if err := rows.Scan(&d.IngredientID, &d.Quantity, &d.CurrentStock, &d.Name); err != nil {
			return 0, fmt.Errorf("failed to scan deduction: %w", err)
		}
		deductions = append(deductions, d)
	}

	if len(deductions) == 0 {
		return 0, nil // No deductions to restore
	}

	restoredCount := 0

	// Restore each deducted ingredient
	for _, d := range deductions {
		newStock := d.CurrentStock + d.Quantity

		// Update ingredient stock
		updateQuery := `
			UPDATE ingredients
			SET current_stock = $1, updated_at = CURRENT_TIMESTAMP
			WHERE id = $2
		`
		if _, err := tx.Exec(updateQuery, newStock, d.IngredientID); err != nil {
			return 0, fmt.Errorf("failed to restore ingredient stock: %w", err)
		}

		// Record restoration history
		historyQuery := `
			INSERT INTO ingredient_history
			(ingredient_id, order_id, operation, quantity, previous_stock, new_stock, reason, adjusted_by)
			VALUES ($1, $2, 'order_cancellation', $3, $4, $5, 'Restored due to order cancellation', $6)
		`
		if _, err := tx.Exec(historyQuery, d.IngredientID, orderID, d.Quantity, d.CurrentStock, newStock, userID); err != nil {
			return 0, fmt.Errorf("failed to record restoration history: %w", err)
		}

		restoredCount++
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return restoredCount, nil
}

// CheckLowStock checks if an ingredient is below minimum stock
func (s *IngredientService) CheckLowStock(ingredientID uuid.UUID) (bool, error) {
	var currentStock, minimumStock float64
	query := `SELECT current_stock, minimum_stock FROM ingredients WHERE id = $1`
	err := s.db.QueryRow(query, ingredientID).Scan(&currentStock, &minimumStock)
	if err != nil {
		return false, err
	}
	return currentStock < minimumStock, nil
}

// GetIngredientUsageReport generates a usage report for a time period
func (s *IngredientService) GetIngredientUsageReport(startDate, endDate time.Time) (*models.IngredientUsageReport, error) {
	query := `
		SELECT
			i.id,
			i.name,
			i.unit,
			COALESCE(SUM(ih.quantity), 0) as total_used,
			COALESCE(SUM(ih.quantity * i.unit_cost), 0) as total_cost,
			COUNT(DISTINCT ih.order_id) as order_count
		FROM ingredients i
		LEFT JOIN ingredient_history ih ON i.id = ih.ingredient_id
			AND ih.operation = 'order_consumption'
			AND ih.created_at >= $1 AND ih.created_at <= $2
		WHERE i.is_active = true
		GROUP BY i.id, i.name, i.unit
		ORDER BY total_used DESC
	`

	rows, err := s.db.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch usage report: %w", err)
	}
	defer rows.Close()

	var items []models.IngredientUsageItem
	for rows.Next() {
		var item models.IngredientUsageItem
		if err := rows.Scan(&item.IngredientID, &item.IngredientName, &item.Unit, &item.TotalUsed, &item.TotalCost, &item.OrderCount); err != nil {
			return nil, fmt.Errorf("failed to scan usage item: %w", err)
		}
		items = append(items, item)
	}

	return &models.IngredientUsageReport{
		Period: models.UsageReportPeriod{
			StartDate: startDate.Format("2006-01-02"),
			EndDate:   endDate.Format("2006-01-02"),
		},
		Ingredients: items,
	}, nil
}

// generateLowStockNotification creates a low stock alert notification
func (s *IngredientService) generateLowStockNotification(ingredientID uuid.UUID, name string, currentStock, minimumStock float64) {
	if s.notificationService == nil {
		return
	}

	// Get admin and manager users to notify
	query := `SELECT id FROM users WHERE role IN ('admin', 'manager') AND is_active = true`
	rows, err := s.db.Query(query)
	if err != nil {
		return // Silently fail - don't block the main operation
	}
	defer rows.Close()

	var userIDs []uuid.UUID
	for rows.Next() {
		var userID uuid.UUID
		if err := rows.Scan(&userID); err != nil {
			continue
		}
		userIDs = append(userIDs, userID)
	}

	if len(userIDs) == 0 {
		return
	}

	title := "Low Stock Alert"
	message := fmt.Sprintf("Low stock: %s is below minimum level (%.2f < %.2f)", name, currentStock, minimumStock)

	// Create notification for admin/manager users
	s.notificationService.CreateNotification(userIDs, "inventory", title, message)
}
