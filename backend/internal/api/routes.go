package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"pos-public/internal/handlers"
	"pos-public/internal/middleware"
	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// SetupRoutes configures all API routes
func SetupRoutes(router *gin.RouterGroup, db *sql.DB, authMiddleware gin.HandlerFunc) {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db)
	profileHandler := handlers.NewProfileHandler(db)
	orderHandler := handlers.NewOrderHandler(db)
	productHandler := handlers.NewProductHandler(db)
	paymentHandler := handlers.NewPaymentHandler(db)
	tableHandler := handlers.NewTableHandler(db)
	publicHandler := handlers.NewPublicHandler(db)
	inventoryHandler := handlers.NewInventoryHandler(db)
	ingredientsHandler := handlers.NewIngredientsHandler(db)

	// Public routes (no authentication required)
	public := router.Group("/")
	{
		// Authentication routes
		public.POST("/auth/login", authHandler.Login)
		public.POST("/auth/logout", authHandler.Logout)
	}

	// Public website API routes (no authentication required)
	publicAPI := router.Group("/public")
	{
		publicAPI.GET("/menu", publicHandler.GetPublicMenu)
		publicAPI.GET("/categories", publicHandler.GetPublicCategories)
		publicAPI.GET("/restaurant", publicHandler.GetRestaurantInfo)
		publicAPI.POST("/contact", publicHandler.SubmitContactForm)
	}

	// Customer self-ordering API routes (no authentication required)
	customerAPI := router.Group("/customer")
	{
		customerAPI.GET("/table/:qr_code", publicHandler.GetTableByQRCode)
		customerAPI.POST("/orders", publicHandler.CreateCustomerOrder)
	}

	// Protected routes (authentication required)
	protected := router.Group("/")
	protected.Use(authMiddleware)
	{
		// Authentication routes
		protected.GET("/auth/me", authHandler.GetCurrentUser)

		// Profile routes
		protected.GET("/profile", profileHandler.GetProfile)
		protected.PUT("/profile", authHandler.UpdateUserProfile)
		protected.PUT("/profile/password", authHandler.ChangePassword)

		// Notification routes
		protected.GET("/notifications", handlers.GetNotifications(db))
		protected.GET("/notifications/counts/unread", handlers.GetUnreadCounts(db)) // Badge counter
		protected.PUT("/notifications/:id/read", handlers.MarkNotificationRead(db))
		protected.DELETE("/notifications/:id", handlers.DeleteNotification(db))
		protected.GET("/notifications/preferences", handlers.GetNotificationPreferences(db))
		protected.PUT("/notifications/preferences", handlers.UpdateNotificationPreferences(db))

		// Product routes
		protected.GET("/products", productHandler.GetProducts)
		protected.GET("/products/:id", productHandler.GetProduct)
		protected.GET("/categories", productHandler.GetCategories)
		protected.GET("/categories/:id/products", productHandler.GetProductsByCategory)

		// Table routes
		protected.GET("/tables", tableHandler.GetTables)
		protected.GET("/tables/:id", tableHandler.GetTable)
		protected.GET("/tables/by-location", tableHandler.GetTablesByLocation)
		protected.GET("/tables/status", tableHandler.GetTableStatus)

		// Order routes (general view for all roles)
		protected.GET("/orders", orderHandler.GetOrders)
		protected.GET("/orders/:id", orderHandler.GetOrder)
		protected.GET("/orders/:id/status-history", orderHandler.GetOrderStatusHistory)
		protected.PATCH("/orders/:id/status", orderHandler.UpdateOrderStatus)

		// Payment routes (counter/admin only)
		protected.GET("/orders/:id/payments", paymentHandler.GetPayments)
		protected.GET("/orders/:id/payment-summary", paymentHandler.GetPaymentSummary)
	}

	// Server routes (server role - dine-in orders only)
	server := router.Group("/server")
	server.Use(authMiddleware)
	server.Use(middleware.RequireRole("server"))
	{
		server.POST("/orders", createDineInOrder(db)) // Only dine-in orders
	}

	// Counter routes (counter role - all order types and payments)
	counter := router.Group("/counter")
	counter.Use(authMiddleware)
	counter.Use(middleware.RequireRole("counter"))
	{
		counter.POST("/orders", orderHandler.CreateOrder)                   // All order types
		counter.POST("/orders/:id/payments", paymentHandler.ProcessPayment) // Process payments
	}

	// Admin routes (admin/manager only)
	admin := router.Group("/admin")
	admin.Use(authMiddleware)
	admin.Use(middleware.RequireRoles([]string{"admin", "manager"}))
	{
		// Dashboard and monitoring
		admin.GET("/dashboard/stats", getDashboardStats(db))
		admin.GET("/reports/sales", getSalesReport(db))
		admin.GET("/reports/orders", getOrdersReport(db))
		admin.GET("/reports/income", getIncomeReport(db))

		// System settings (admin only)
		admin.GET("/settings", handlers.GetSettings(db))
		admin.PUT("/settings", handlers.UpdateSettings(db))
		admin.GET("/health", handlers.GetSystemHealth(db))

		// Contact submissions management
		contactHandler := handlers.NewHandler(db)
		admin.GET("/contacts", contactHandler.GetContactSubmissions)
		admin.GET("/contacts/:id", contactHandler.GetContactSubmission)
		admin.GET("/contacts/counts/new", contactHandler.GetNewContactsCount) // Badge counter
		admin.PUT("/contacts/:id/status", contactHandler.UpdateContactStatus)
		admin.DELETE("/contacts/:id", contactHandler.DeleteContactSubmission)

		// Inventory management
		admin.GET("/inventory", inventoryHandler.GetInventory)
		admin.GET("/inventory/low-stock", inventoryHandler.GetLowStock)
		admin.GET("/inventory/:product_id", inventoryHandler.GetProductInventory)
		admin.POST("/inventory/adjust", inventoryHandler.AdjustStock)
		admin.GET("/inventory/history/:product_id", inventoryHandler.GetStockHistory)

		// Ingredients management (raw materials)
		admin.GET("/ingredients", ingredientsHandler.GetIngredients)
		admin.GET("/ingredients/low-stock", ingredientsHandler.GetLowStockIngredients)
		admin.GET("/ingredients/:id", ingredientsHandler.GetIngredient)
		admin.POST("/ingredients", ingredientsHandler.CreateIngredient)
		admin.PUT("/ingredients/:id", ingredientsHandler.UpdateIngredient)
		admin.DELETE("/ingredients/:id", ingredientsHandler.DeleteIngredient)
		admin.POST("/ingredients/restock", ingredientsHandler.RestockIngredient)
		admin.GET("/ingredients/:id/history", ingredientsHandler.GetIngredientHistory)

		// Menu management with pagination
		admin.GET("/products", productHandler.GetProducts) // Use existing paginated handler
		admin.GET("/categories", getAdminCategories(db))   // Add pagination
		admin.POST("/categories", createCategory(db))
		admin.PUT("/categories/:id", updateCategory(db))
		admin.DELETE("/categories/:id", deleteCategory(db))
		admin.POST("/products", productHandler.CreateProduct)
		admin.PUT("/products/:id", productHandler.UpdateProduct)
		admin.DELETE("/products/:id", productHandler.DeleteProduct)

		// Table management with pagination
		admin.GET("/tables", getAdminTables(db)) // Add pagination
		admin.POST("/tables", createTable(db))
		admin.PUT("/tables/:id", updateTable(db))
		admin.DELETE("/tables/:id", deleteTable(db))

		// User management with pagination
		admin.GET("/users", getAdminUsers(db)) // Update with pagination
		admin.POST("/users", createUser(db))
		admin.PUT("/users/:id", updateUser(db))
		admin.DELETE("/users/:id", deleteUser(db))

		// Advanced order management
		admin.POST("/orders", orderHandler.CreateOrder)                   // Admins can create any type of order
		admin.POST("/orders/:id/payments", paymentHandler.ProcessPayment) // Admins can process payments
	}

	// Server with product management (server role can manage products)
	serverWithProducts := router.Group("/server")
	serverWithProducts.Use(authMiddleware)
	serverWithProducts.Use(middleware.RequireRoles([]string{"server", "admin", "manager"}))
	{
		serverWithProducts.POST("/products", productHandler.CreateProduct)
		serverWithProducts.PUT("/products/:id", productHandler.UpdateProduct)
	}

	// Kitchen routes (kitchen staff access)
	kitchen := router.Group("/kitchen")
	kitchen.Use(authMiddleware)
	kitchen.Use(middleware.RequireRoles([]string{"kitchen", "admin", "manager"}))
	{
		kitchen.GET("/orders", getKitchenOrders(db))
		kitchen.PATCH("/orders/:id/items/:item_id/status", updateOrderItemStatus(db))
	}
}

// Dashboard stats handler
func getDashboardStats(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get basic stats for dashboard
		stats := make(map[string]interface{})

		// Today's orders
		var todayOrders int
		db.QueryRow(`
			SELECT COUNT(*)
			FROM orders
			WHERE DATE(created_at) = CURRENT_DATE
		`).Scan(&todayOrders)

		// Today's revenue
		var todayRevenue float64
		db.QueryRow(`
			SELECT COALESCE(SUM(total_amount), 0)
			FROM orders
			WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed'
		`).Scan(&todayRevenue)

		// Active orders
		var activeOrders int
		db.QueryRow(`
			SELECT COUNT(*)
			FROM orders
			WHERE status NOT IN ('completed', 'cancelled')
		`).Scan(&activeOrders)

		// Occupied tables
		var occupiedTables int
		db.QueryRow(`
			SELECT COUNT(*)
			FROM dining_tables
			WHERE is_occupied = true
		`).Scan(&occupiedTables)

		stats["today_orders"] = todayOrders
		stats["today_revenue"] = todayRevenue
		stats["active_orders"] = activeOrders
		stats["occupied_tables"] = occupiedTables

		c.JSON(200, gin.H{
			"success": true,
			"message": "Dashboard stats retrieved successfully",
			"data":    stats,
		})
	}
}

// Sales report handler
func getSalesReport(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		period := c.DefaultQuery("period", "today") // today, week, month

		var query string
		switch period {
		case "week":
			query = `
				SELECT DATE(created_at) as date, COUNT(*) as order_count, SUM(total_amount) as revenue
				FROM orders
				WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND status = 'completed'
				GROUP BY DATE(created_at)
				ORDER BY date DESC
			`
		case "month":
			query = `
				SELECT DATE(created_at) as date, COUNT(*) as order_count, SUM(total_amount) as revenue
				FROM orders
				WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND status = 'completed'
				GROUP BY DATE(created_at)
				ORDER BY date DESC
			`
		default: // today
			query = `
				SELECT DATE_TRUNC('hour', created_at) as hour, COUNT(*) as order_count, SUM(total_amount) as revenue
				FROM orders
				WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed'
				GROUP BY DATE_TRUNC('hour', created_at)
				ORDER BY hour DESC
			`
		}

		rows, err := db.Query(query)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to fetch sales report",
				"error":   err.Error(),
			})
			return
		}
		defer rows.Close()

		var report []map[string]interface{}
		for rows.Next() {
			var date interface{}
			var orderCount int
			var revenue float64

			err := rows.Scan(&date, &orderCount, &revenue)
			if err != nil {
				c.JSON(500, gin.H{
					"success": false,
					"message": "Failed to scan sales data",
					"error":   err.Error(),
				})
				return
			}

			report = append(report, map[string]interface{}{
				"date":        date,
				"order_count": orderCount,
				"revenue":     revenue,
			})
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Sales report retrieved successfully",
			"data":    report,
		})
	}
}

// Orders report handler
func getOrdersReport(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get order statistics
		query := `
			SELECT
				status,
				COUNT(*) as count,
				AVG(total_amount) as avg_amount
			FROM orders
			WHERE DATE(created_at) = CURRENT_DATE
			GROUP BY status
		`

		rows, err := db.Query(query)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to fetch orders report",
				"error":   err.Error(),
			})
			return
		}
		defer rows.Close()

		var report []map[string]interface{}
		for rows.Next() {
			var status string
			var count int
			var avgAmount float64

			err := rows.Scan(&status, &count, &avgAmount)
			if err != nil {
				c.JSON(500, gin.H{
					"success": false,
					"message": "Failed to scan orders data",
					"error":   err.Error(),
				})
				return
			}

			report = append(report, map[string]interface{}{
				"status":     status,
				"count":      count,
				"avg_amount": avgAmount,
			})
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Orders report retrieved successfully",
			"data":    report,
		})
	}
}

// Kitchen orders handler
func getKitchenOrders(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		status := c.DefaultQuery("status", "all")

		query := `
			SELECT DISTINCT o.id, o.order_number, o.table_id, o.order_type, o.status,
			       o.created_at, o.customer_name,
			       t.table_number
			FROM orders o
			LEFT JOIN dining_tables t ON o.table_id = t.id
			WHERE o.status IN ('confirmed', 'preparing', 'ready')
		`

		if status != "all" {
			query += ` AND o.status = '` + status + `'`
		}

		query += ` ORDER BY o.created_at ASC`

		rows, err := db.Query(query)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to fetch kitchen orders",
				"error":   err.Error(),
			})
			return
		}
		defer rows.Close()

		var orders []map[string]interface{}
		for rows.Next() {
			var orderID, tableID interface{}
			var orderNumber, orderType, orderStatus, customerName, tableNumber sql.NullString
			var createdAt interface{}

			err := rows.Scan(&orderID, &orderNumber, &tableID, &orderType, &orderStatus,
				&createdAt, &customerName, &tableNumber)
			if err != nil {
				c.JSON(500, gin.H{
					"success": false,
					"message": "Failed to scan kitchen order",
					"error":   err.Error(),
				})
				return
			}

			order := map[string]interface{}{
				"id":            orderID,
				"order_number":  orderNumber.String,
				"table_id":      tableID,
				"table_number":  tableNumber.String,
				"order_type":    orderType.String,
				"status":        orderStatus.String,
				"customer_name": customerName.String,
				"created_at":    createdAt,
			}

			orders = append(orders, order)
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Kitchen orders retrieved successfully",
			"data":    orders,
		})
	}
}

// Update order item status handler
func updateOrderItemStatus(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID := c.Param("id")
		itemID := c.Param("item_id")

		var req struct {
			Status string `json:"status"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request body",
				"error":   err.Error(),
			})
			return
		}

		// Update order item status
		_, err := db.Exec(`
			UPDATE order_items
			SET status = $1, updated_at = CURRENT_TIMESTAMP
			WHERE id = $2 AND order_id = $3
		`, req.Status, itemID, orderID)

		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to update order item status",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Order item status updated successfully",
		})
	}
}

// Server role handler - only allows dine-in orders
func createDineInOrder(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			TableID      *string `json:"table_id"`
			CustomerName *string `json:"customer_name"`
			Items        []struct {
				ProductID           string  `json:"product_id"`
				Quantity            int     `json:"quantity"`
				SpecialInstructions *string `json:"special_instructions"`
			} `json:"items"`
			Notes *string `json:"notes"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request body",
				"error":   err.Error(),
			})
			return
		}

		// Force order type to dine_in for servers
		orderHandler := handlers.NewOrderHandler(db)

		// Create order request with forced dine_in type
		createOrderReq := map[string]interface{}{
			"table_id":      req.TableID,
			"customer_name": req.CustomerName,
			"order_type":    "dine_in", // Force dine-in for servers
			"items":         req.Items,
			"notes":         req.Notes,
		}

		// Convert to JSON and back to simulate the request
		reqBytes, _ := json.Marshal(createOrderReq)
		c.Request.Body = io.NopCloser(strings.NewReader(string(reqBytes)))

		orderHandler.CreateOrder(c)
	}
}

// Admin handler - Income report
func getIncomeReport(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		period := c.DefaultQuery("period", "today") // today, week, month, year

		var query string
		switch period {
		case "week":
			query = `
				SELECT
					DATE_TRUNC('day', created_at) as period,
					COUNT(*) as total_orders,
					SUM(total_amount) as gross_income,
					SUM(tax_amount) as tax_collected,
					SUM(total_amount - tax_amount) as net_income
				FROM orders
				WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
					AND status = 'completed'
				GROUP BY DATE_TRUNC('day', created_at)
				ORDER BY period DESC
			`
		case "month":
			query = `
				SELECT
					DATE_TRUNC('day', created_at) as period,
					COUNT(*) as total_orders,
					SUM(total_amount) as gross_income,
					SUM(tax_amount) as tax_collected,
					SUM(total_amount - tax_amount) as net_income
				FROM orders
				WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
					AND status = 'completed'
				GROUP BY DATE_TRUNC('day', created_at)
				ORDER BY period DESC
			`
		case "year":
			query = `
				SELECT
					DATE_TRUNC('month', created_at) as period,
					COUNT(*) as total_orders,
					SUM(total_amount) as gross_income,
					SUM(tax_amount) as tax_collected,
					SUM(total_amount - tax_amount) as net_income
				FROM orders
				WHERE created_at >= CURRENT_DATE - INTERVAL '1 year'
					AND status = 'completed'
				GROUP BY DATE_TRUNC('month', created_at)
				ORDER BY period DESC
			`
		default: // today
			query = `
				SELECT
					DATE_TRUNC('hour', created_at) as period,
					COUNT(*) as total_orders,
					SUM(total_amount) as gross_income,
					SUM(tax_amount) as tax_collected,
					SUM(total_amount - tax_amount) as net_income
				FROM orders
				WHERE DATE(created_at) = CURRENT_DATE
					AND status = 'completed'
				GROUP BY DATE_TRUNC('hour', created_at)
				ORDER BY period DESC
			`
		}

		rows, err := db.Query(query)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to fetch income report",
				"error":   err.Error(),
			})
			return
		}
		defer rows.Close()

		var report []map[string]interface{}
		var totalGross, totalTax, totalNet float64
		var totalOrders int

		for rows.Next() {
			var period interface{}
			var orders int
			var gross, tax, net float64

			err := rows.Scan(&period, &orders, &gross, &tax, &net)
			if err != nil {
				c.JSON(500, gin.H{
					"success": false,
					"message": "Failed to scan income data",
					"error":   err.Error(),
				})
				return
			}

			totalOrders += orders
			totalGross += gross
			totalTax += tax
			totalNet += net

			report = append(report, map[string]interface{}{
				"period": period,
				"orders": orders,
				"gross":  gross,
				"tax":    tax,
				"net":    net,
			})
		}

		result := map[string]interface{}{
			"summary": map[string]interface{}{
				"total_orders":  totalOrders,
				"gross_income":  totalGross,
				"tax_collected": totalTax,
				"net_income":    totalNet,
			},
			"breakdown": report,
			"period":    period,
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Income report retrieved successfully",
			"data":    result,
		})
	}
}

// Admin handler - Create category
func createCategory(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Name        string  `json:"name" binding:"required"`
			Description *string `json:"description"`
			Color       *string `json:"color"`
			SortOrder   int     `json:"sort_order"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request body",
				"error":   err.Error(),
			})
			return
		}

		var categoryID string
		err := db.QueryRow(`
			INSERT INTO categories (name, description, color, sort_order)
			VALUES ($1, $2, $3, $4)
			RETURNING id
		`, req.Name, req.Description, req.Color, req.SortOrder).Scan(&categoryID)

		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to create category",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(201, gin.H{
			"success": true,
			"message": "Category created successfully",
			"data":    map[string]interface{}{"id": categoryID},
		})
	}
}

// Admin handler - Update category
func updateCategory(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		categoryID := c.Param("id")

		var req struct {
			Name        *string `json:"name"`
			Description *string `json:"description"`
			Color       *string `json:"color"`
			SortOrder   *int    `json:"sort_order"`
			IsActive    *bool   `json:"is_active"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request body",
				"error":   err.Error(),
			})
			return
		}

		// Build dynamic update query
		updates := []string{}
		args := []interface{}{}
		argCount := 1

		if req.Name != nil {
			updates = append(updates, fmt.Sprintf("name = $%d", argCount))
			args = append(args, *req.Name)
			argCount++
		}
		if req.Description != nil {
			updates = append(updates, fmt.Sprintf("description = $%d", argCount))
			args = append(args, req.Description)
			argCount++
		}
		if req.Color != nil {
			updates = append(updates, fmt.Sprintf("color = $%d", argCount))
			args = append(args, req.Color)
			argCount++
		}
		if req.SortOrder != nil {
			updates = append(updates, fmt.Sprintf("sort_order = $%d", argCount))
			args = append(args, *req.SortOrder)
			argCount++
		}
		if req.IsActive != nil {
			updates = append(updates, fmt.Sprintf("is_active = $%d", argCount))
			args = append(args, *req.IsActive)
			argCount++
		}

		if len(updates) == 0 {
			c.JSON(400, gin.H{
				"success": false,
				"message": "No fields to update",
			})
			return
		}

		updates = append(updates, "updated_at = CURRENT_TIMESTAMP")
		args = append(args, categoryID)

		query := fmt.Sprintf(`
			UPDATE categories
			SET %s
			WHERE id = $%d
		`, strings.Join(updates, ", "), argCount)

		result, err := db.Exec(query, args...)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to update category",
				"error":   err.Error(),
			})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{
				"success": false,
				"message": "Category not found",
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Category updated successfully",
		})
	}
}

// Admin handler - Delete category
func deleteCategory(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		categoryID := c.Param("id")

		// Check if category has products
		var productCount int
		db.QueryRow("SELECT COUNT(*) FROM products WHERE category_id = $1", categoryID).Scan(&productCount)

		if productCount > 0 {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Cannot delete category with existing products",
				"error":   "category_has_products",
			})
			return
		}

		result, err := db.Exec("DELETE FROM categories WHERE id = $1", categoryID)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to delete category",
				"error":   err.Error(),
			})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{
				"success": false,
				"message": "Category not found",
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Category deleted successfully",
		})
	}
}

// Admin handler - Create product
func createProduct(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			CategoryID      *string `json:"category_id"`
			Name            string  `json:"name" binding:"required"`
			Description     *string `json:"description"`
			Price           float64 `json:"price" binding:"required"`
			ImageURL        *string `json:"image_url"`
			Barcode         *string `json:"barcode"`
			SKU             *string `json:"sku"`
			PreparationTime int     `json:"preparation_time"`
			SortOrder       int     `json:"sort_order"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request body",
				"error":   err.Error(),
			})
			return
		}

		var productID string
		err := db.QueryRow(`
			INSERT INTO products (category_id, name, description, price, image_url, barcode, sku, preparation_time, sort_order)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING id
		`, req.CategoryID, req.Name, req.Description, req.Price, req.ImageURL, req.Barcode, req.SKU, req.PreparationTime, req.SortOrder).Scan(&productID)

		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to create product",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(201, gin.H{
			"success": true,
			"message": "Product created successfully",
			"data":    map[string]interface{}{"id": productID},
		})
	}
}

// Admin handler - Update product
func updateProduct(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		productID := c.Param("id")

		var req struct {
			CategoryID      *string  `json:"category_id"`
			Name            *string  `json:"name"`
			Description     *string  `json:"description"`
			Price           *float64 `json:"price"`
			ImageURL        *string  `json:"image_url"`
			Barcode         *string  `json:"barcode"`
			SKU             *string  `json:"sku"`
			IsAvailable     *bool    `json:"is_available"`
			PreparationTime *int     `json:"preparation_time"`
			SortOrder       *int     `json:"sort_order"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request body",
				"error":   err.Error(),
			})
			return
		}

		// Build dynamic update query
		updates := []string{}
		args := []interface{}{}
		argCount := 1

		if req.CategoryID != nil {
			updates = append(updates, fmt.Sprintf("category_id = $%d", argCount))
			args = append(args, req.CategoryID)
			argCount++
		}
		if req.Name != nil {
			updates = append(updates, fmt.Sprintf("name = $%d", argCount))
			args = append(args, *req.Name)
			argCount++
		}
		if req.Description != nil {
			updates = append(updates, fmt.Sprintf("description = $%d", argCount))
			args = append(args, req.Description)
			argCount++
		}
		if req.Price != nil {
			updates = append(updates, fmt.Sprintf("price = $%d", argCount))
			args = append(args, *req.Price)
			argCount++
		}
		if req.ImageURL != nil {
			updates = append(updates, fmt.Sprintf("image_url = $%d", argCount))
			args = append(args, req.ImageURL)
			argCount++
		}
		if req.Barcode != nil {
			updates = append(updates, fmt.Sprintf("barcode = $%d", argCount))
			args = append(args, req.Barcode)
			argCount++
		}
		if req.SKU != nil {
			updates = append(updates, fmt.Sprintf("sku = $%d", argCount))
			args = append(args, req.SKU)
			argCount++
		}
		if req.IsAvailable != nil {
			updates = append(updates, fmt.Sprintf("is_available = $%d", argCount))
			args = append(args, *req.IsAvailable)
			argCount++
		}
		if req.PreparationTime != nil {
			updates = append(updates, fmt.Sprintf("preparation_time = $%d", argCount))
			args = append(args, *req.PreparationTime)
			argCount++
		}
		if req.SortOrder != nil {
			updates = append(updates, fmt.Sprintf("sort_order = $%d", argCount))
			args = append(args, *req.SortOrder)
			argCount++
		}

		if len(updates) == 0 {
			c.JSON(400, gin.H{
				"success": false,
				"message": "No fields to update",
			})
			return
		}

		updates = append(updates, "updated_at = CURRENT_TIMESTAMP")
		args = append(args, productID)

		query := fmt.Sprintf(`
			UPDATE products
			SET %s
			WHERE id = $%d
		`, strings.Join(updates, ", "), argCount)

		result, err := db.Exec(query, args...)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to update product",
				"error":   err.Error(),
			})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{
				"success": false,
				"message": "Product not found",
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Product updated successfully",
		})
	}
}

// Admin handler - Delete product
func deleteProduct(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		productID := c.Param("id")

		// Check if product is used in any active orders
		var orderCount int
		db.QueryRow(`
			SELECT COUNT(*)
			FROM order_items oi
			JOIN orders o ON oi.order_id = o.id
			WHERE oi.product_id = $1 AND o.status NOT IN ('completed', 'cancelled')
		`, productID).Scan(&orderCount)

		if orderCount > 0 {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Cannot delete product with active orders",
				"error":   "product_has_active_orders",
			})
			return
		}

		result, err := db.Exec("DELETE FROM products WHERE id = $1", productID)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to delete product",
				"error":   err.Error(),
			})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{
				"success": false,
				"message": "Product not found",
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Product deleted successfully",
		})
	}
}

// Admin handler - Create table
func createTable(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			TableNumber     string  `json:"table_number" binding:"required"`
			SeatingCapacity int     `json:"seating_capacity"`
			Location        *string `json:"location"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request body",
				"error":   err.Error(),
			})
			return
		}

		var tableID string
		err := db.QueryRow(`
			INSERT INTO dining_tables (table_number, seating_capacity, location)
			VALUES ($1, $2, $3)
			RETURNING id
		`, req.TableNumber, req.SeatingCapacity, req.Location).Scan(&tableID)

		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to create table",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(201, gin.H{
			"success": true,
			"message": "Table created successfully",
			"data":    map[string]interface{}{"id": tableID},
		})
	}
}

// Admin handler - Update table
func updateTable(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		tableID := c.Param("id")

		var req struct {
			TableNumber     *string `json:"table_number"`
			SeatingCapacity *int    `json:"seating_capacity"`
			Location        *string `json:"location"`
			IsOccupied      *bool   `json:"is_occupied"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request body",
				"error":   err.Error(),
			})
			return
		}

		// Build dynamic update query
		updates := []string{}
		args := []interface{}{}
		argCount := 1

		if req.TableNumber != nil {
			updates = append(updates, fmt.Sprintf("table_number = $%d", argCount))
			args = append(args, *req.TableNumber)
			argCount++
		}
		if req.SeatingCapacity != nil {
			updates = append(updates, fmt.Sprintf("seating_capacity = $%d", argCount))
			args = append(args, *req.SeatingCapacity)
			argCount++
		}
		if req.Location != nil {
			updates = append(updates, fmt.Sprintf("location = $%d", argCount))
			args = append(args, req.Location)
			argCount++
		}
		if req.IsOccupied != nil {
			updates = append(updates, fmt.Sprintf("is_occupied = $%d", argCount))
			args = append(args, *req.IsOccupied)
			argCount++
		}

		if len(updates) == 0 {
			c.JSON(400, gin.H{
				"success": false,
				"message": "No fields to update",
			})
			return
		}

		updates = append(updates, "updated_at = CURRENT_TIMESTAMP")
		args = append(args, tableID)

		query := fmt.Sprintf(`
			UPDATE dining_tables
			SET %s
			WHERE id = $%d
		`, strings.Join(updates, ", "), argCount)

		result, err := db.Exec(query, args...)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to update table",
				"error":   err.Error(),
			})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{
				"success": false,
				"message": "Table not found",
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Table updated successfully",
		})
	}
}

// Admin handler - Delete table
func deleteTable(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		tableID := c.Param("id")

		// Check if table has active orders
		var orderCount int
		db.QueryRow(`
			SELECT COUNT(*)
			FROM orders
			WHERE table_id = $1 AND status NOT IN ('completed', 'cancelled')
		`, tableID).Scan(&orderCount)

		if orderCount > 0 {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Cannot delete table with active orders",
				"error":   "table_has_active_orders",
			})
			return
		}

		result, err := db.Exec("DELETE FROM dining_tables WHERE id = $1", tableID)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to delete table",
				"error":   err.Error(),
			})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{
				"success": false,
				"message": "Table not found",
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Table deleted successfully",
		})
	}
}

// Admin handler - Create user
func createUser(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Username  string `json:"username" binding:"required"`
			Email     string `json:"email" binding:"required"`
			Password  string `json:"password" binding:"required"`
			FirstName string `json:"first_name" binding:"required"`
			LastName  string `json:"last_name" binding:"required"`
			Role      string `json:"role" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request body",
				"error":   err.Error(),
			})
			return
		}

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to hash password",
				"error":   err.Error(),
			})
			return
		}

		var userID string
		err = db.QueryRow(`
			INSERT INTO users (username, email, password_hash, first_name, last_name, role)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id
		`, req.Username, req.Email, string(hashedPassword), req.FirstName, req.LastName, req.Role).Scan(&userID)

		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to create user",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(201, gin.H{
			"success": true,
			"message": "User created successfully",
			"data":    map[string]interface{}{"id": userID},
		})
	}
}

// Admin handler - Update user
func updateUser(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Param("id")

		var req struct {
			Username  *string `json:"username"`
			Email     *string `json:"email"`
			Password  *string `json:"password"`
			FirstName *string `json:"first_name"`
			LastName  *string `json:"last_name"`
			Role      *string `json:"role"`
			IsActive  *bool   `json:"is_active"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request body",
				"error":   err.Error(),
			})
			return
		}

		// Build dynamic update query
		updates := []string{}
		args := []interface{}{}
		argCount := 1

		if req.Username != nil {
			updates = append(updates, fmt.Sprintf("username = $%d", argCount))
			args = append(args, *req.Username)
			argCount++
		}
		if req.Email != nil {
			updates = append(updates, fmt.Sprintf("email = $%d", argCount))
			args = append(args, *req.Email)
			argCount++
		}
		if req.Password != nil {
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
			if err != nil {
				c.JSON(500, gin.H{
					"success": false,
					"message": "Failed to hash password",
					"error":   err.Error(),
				})
				return
			}
			updates = append(updates, fmt.Sprintf("password_hash = $%d", argCount))
			args = append(args, string(hashedPassword))
			argCount++
		}
		if req.FirstName != nil {
			updates = append(updates, fmt.Sprintf("first_name = $%d", argCount))
			args = append(args, *req.FirstName)
			argCount++
		}
		if req.LastName != nil {
			updates = append(updates, fmt.Sprintf("last_name = $%d", argCount))
			args = append(args, *req.LastName)
			argCount++
		}
		if req.Role != nil {
			updates = append(updates, fmt.Sprintf("role = $%d", argCount))
			args = append(args, *req.Role)
			argCount++
		}
		if req.IsActive != nil {
			updates = append(updates, fmt.Sprintf("is_active = $%d", argCount))
			args = append(args, *req.IsActive)
			argCount++
		}

		if len(updates) == 0 {
			c.JSON(400, gin.H{
				"success": false,
				"message": "No fields to update",
			})
			return
		}

		updates = append(updates, "updated_at = CURRENT_TIMESTAMP")
		args = append(args, userID)

		query := fmt.Sprintf(`
			UPDATE users
			SET %s
			WHERE id = $%d
		`, strings.Join(updates, ", "), argCount)

		result, err := db.Exec(query, args...)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to update user",
				"error":   err.Error(),
			})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{
				"success": false,
				"message": "User not found",
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "User updated successfully",
		})
	}
}

// Admin handler - Delete user
func deleteUser(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Param("id")

		// Prevent deletion if user has associated orders
		var orderCount int
		db.QueryRow("SELECT COUNT(*) FROM orders WHERE user_id = $1", userID).Scan(&orderCount)

		if orderCount > 0 {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Cannot delete user with existing orders",
				"error":   "user_has_orders",
			})
			return
		}

		result, err := db.Exec("DELETE FROM users WHERE id = $1", userID)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to delete user",
				"error":   err.Error(),
			})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{
				"success": false,
				"message": "User not found",
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "User deleted successfully",
		})
	}
}

// Admin handler - Get users with pagination
func getAdminUsers(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse pagination parameters
		page := 1
		perPage := 20
		role := c.Query("role")
		isActive := c.Query("active")
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
		queryBuilder := "SELECT id, username, email, first_name, last_name, role, is_active, created_at FROM users WHERE 1=1"
		args := []interface{}{}
		argCount := 0

		if role != "" {
			argCount++
			queryBuilder += fmt.Sprintf(" AND role = $%d", argCount)
			args = append(args, role)
		}

		if isActive != "" {
			argCount++
			queryBuilder += fmt.Sprintf(" AND is_active = $%d", argCount)
			args = append(args, isActive == "true")
		}

		if search != "" {
			argCount++
			queryBuilder += fmt.Sprintf(" AND (first_name ILIKE $%d OR last_name ILIKE $%d OR username ILIKE $%d OR email ILIKE $%d)", argCount, argCount, argCount, argCount)
			args = append(args, "%"+search+"%")
		}

		// Count total records
		countQuery := "SELECT COUNT(*) FROM (" + queryBuilder + ") as count_query"
		var total int
		if err := db.QueryRow(countQuery, args...).Scan(&total); err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to count users",
				"error":   err.Error(),
			})
			return
		}

		// Add ordering and pagination
		queryBuilder += " ORDER BY created_at DESC"
		argCount++
		queryBuilder += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, perPage)

		argCount++
		queryBuilder += fmt.Sprintf(" OFFSET $%d", argCount)
		args = append(args, offset)

		rows, err := db.Query(queryBuilder, args...)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to fetch users",
				"error":   err.Error(),
			})
			return
		}
		defer rows.Close()

		var users []map[string]interface{}
		for rows.Next() {
			var user map[string]interface{} = make(map[string]interface{})
			var id, username, email, firstName, lastName, userRole string
			var isActive bool
			var createdAt time.Time

			err := rows.Scan(&id, &username, &email, &firstName, &lastName, &userRole, &isActive, &createdAt)
			if err != nil {
				c.JSON(500, gin.H{
					"success": false,
					"message": "Failed to scan user data",
					"error":   err.Error(),
				})
				return
			}

			user["id"] = id
			user["username"] = username
			user["email"] = email
			user["first_name"] = firstName
			user["last_name"] = lastName
			user["role"] = userRole
			user["is_active"] = isActive
			user["created_at"] = createdAt

			users = append(users, user)
		}

		totalPages := (total + perPage - 1) / perPage

		c.JSON(200, gin.H{
			"success": true,
			"message": "Users retrieved successfully",
			"data":    users,
			"meta": gin.H{
				"current_page": page,
				"per_page":     perPage,
				"total":        total,
				"total_pages":  totalPages,
			},
		})
	}
}

// Admin handler - Get categories with pagination
func getAdminCategories(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse pagination parameters
		page := 1
		perPage := 20
		activeOnly := c.Query("active_only") == "true"
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
		queryBuilder := "SELECT id, name, description, color, sort_order, is_active, created_at, updated_at FROM categories WHERE 1=1"
		args := []interface{}{}
		argCount := 0

		if activeOnly {
			queryBuilder += " AND is_active = true"
		}

		if search != "" {
			argCount++
			queryBuilder += fmt.Sprintf(" AND (name ILIKE $%d OR description ILIKE $%d)", argCount, argCount)
			args = append(args, "%"+search+"%")
		}

		// Count total records
		countQuery := "SELECT COUNT(*) FROM (" + queryBuilder + ") as count_query"
		var total int
		if err := db.QueryRow(countQuery, args...).Scan(&total); err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to count categories",
				"error":   err.Error(),
			})
			return
		}

		// Add ordering and pagination
		queryBuilder += " ORDER BY sort_order ASC, name ASC"
		argCount++
		queryBuilder += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, perPage)

		argCount++
		queryBuilder += fmt.Sprintf(" OFFSET $%d", argCount)
		args = append(args, offset)

		rows, err := db.Query(queryBuilder, args...)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to fetch categories",
				"error":   err.Error(),
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
				c.JSON(500, gin.H{
					"success": false,
					"message": "Failed to scan category",
					"error":   err.Error(),
				})
				return
			}

			categories = append(categories, category)
		}

		totalPages := (total + perPage - 1) / perPage

		c.JSON(200, gin.H{
			"success": true,
			"message": "Categories retrieved successfully",
			"data":    categories,
			"meta": gin.H{
				"current_page": page,
				"per_page":     perPage,
				"total":        total,
				"total_pages":  totalPages,
			},
		})
	}
}

// Admin handler - Get tables with pagination
func getAdminTables(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse pagination parameters
		page := 1
		perPage := 20
		location := c.Query("location")
		status := c.Query("status") // "occupied", "available", or empty for all
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
			SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied,
			       t.created_at, t.updated_at,
			       o.id as order_id, o.order_number, o.customer_name, o.status as order_status,
			       o.created_at as order_created_at, o.total_amount
			FROM dining_tables t
			LEFT JOIN orders o ON t.id = o.table_id AND o.status NOT IN ('completed', 'cancelled')
			WHERE 1=1
		`

		args := []interface{}{}
		argCount := 0

		if location != "" {
			argCount++
			queryBuilder += fmt.Sprintf(" AND t.location ILIKE $%d", argCount)
			args = append(args, "%"+location+"%")
		}

		if status == "occupied" {
			queryBuilder += " AND t.is_occupied = true"
		} else if status == "available" {
			queryBuilder += " AND t.is_occupied = false"
		}

		if search != "" {
			argCount++
			queryBuilder += fmt.Sprintf(" AND (t.table_number ILIKE $%d OR t.location ILIKE $%d)", argCount, argCount)
			args = append(args, "%"+search+"%")
		}

		// Count total records
		countQuery := "SELECT COUNT(*) FROM (" + queryBuilder + ") as count_query"
		var total int
		if err := db.QueryRow(countQuery, args...).Scan(&total); err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to count tables",
				"error":   err.Error(),
			})
			return
		}

		// Add ordering and pagination
		queryBuilder += " ORDER BY t.table_number ASC"
		argCount++
		queryBuilder += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, perPage)

		argCount++
		queryBuilder += fmt.Sprintf(" OFFSET $%d", argCount)
		args = append(args, offset)

		rows, err := db.Query(queryBuilder, args...)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to fetch tables",
				"error":   err.Error(),
			})
			return
		}
		defer rows.Close()

		var tables []map[string]interface{}
		for rows.Next() {
			var table models.DiningTable
			var orderID, orderNumber, customerName, orderStatus sql.NullString
			var orderCreatedAt sql.NullTime
			var totalAmount sql.NullFloat64

			err := rows.Scan(
				&table.ID, &table.TableNumber, &table.SeatingCapacity, &table.Location, &table.IsOccupied,
				&table.CreatedAt, &table.UpdatedAt,
				&orderID, &orderNumber, &customerName, &orderStatus, &orderCreatedAt, &totalAmount,
			)
			if err != nil {
				c.JSON(500, gin.H{
					"success": false,
					"message": "Failed to scan table",
					"error":   err.Error(),
				})
				return
			}

			// Create table data with current order info
			tableData := map[string]interface{}{
				"id":               table.ID,
				"table_number":     table.TableNumber,
				"seating_capacity": table.SeatingCapacity,
				"location":         table.Location,
				"is_occupied":      table.IsOccupied,
				"created_at":       table.CreatedAt,
				"updated_at":       table.UpdatedAt,
				"current_order":    nil,
			}

			// Add current order info if available
			if orderID.Valid {
				tableData["current_order"] = map[string]interface{}{
					"id":            orderID.String,
					"order_number":  orderNumber.String,
					"customer_name": customerName.String,
					"status":        orderStatus.String,
					"created_at":    orderCreatedAt.Time,
					"total_amount":  totalAmount.Float64,
				}
			}

			tables = append(tables, tableData)
		}

		totalPages := (total + perPage - 1) / perPage

		c.JSON(200, gin.H{
			"success": true,
			"message": "Tables retrieved successfully",
			"data":    tables,
			"meta": gin.H{
				"current_page": page,
				"per_page":     perPage,
				"total":        total,
				"total_pages":  totalPages,
			},
		})
	}
}

// Ingredients Management Handlers

// Get all ingredients with pagination
func getIngredients(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
		search := c.Query("search")
		lowStockOnly := c.Query("low_stock") == "true"

		if page < 1 {
			page = 1
		}
		if perPage < 1 || perPage > 100 {
			perPage = 20
		}

		offset := (page - 1) * perPage

		// Build query
		queryBuilder := "SELECT id, name, description, unit, current_stock, minimum_stock, maximum_stock, unit_cost, supplier, is_active, last_restocked_at, created_at FROM ingredients WHERE 1=1"
		countQuery := "SELECT COUNT(*) FROM ingredients WHERE 1=1"
		args := []interface{}{}
		argCount := 0

		if search != "" {
			argCount++
			queryBuilder += fmt.Sprintf(" AND (name ILIKE $%d OR description ILIKE $%d)", argCount, argCount)
			countQuery += fmt.Sprintf(" AND (name ILIKE $%d OR description ILIKE $%d)", argCount, argCount)
			args = append(args, "%"+search+"%")
		}

		if lowStockOnly {
			queryBuilder += " AND current_stock <= minimum_stock"
			countQuery += " AND current_stock <= minimum_stock"
		}

		// Get total count
		var total int
		err := db.QueryRow(countQuery, args...).Scan(&total)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to count ingredients",
				"error":   err.Error(),
			})
			return
		}

		// Get paginated results
		queryBuilder += fmt.Sprintf(" ORDER BY name LIMIT $%d OFFSET $%d", argCount+1, argCount+2)
		args = append(args, perPage, offset)

		rows, err := db.Query(queryBuilder, args...)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to fetch ingredients",
				"error":   err.Error(),
			})
			return
		}
		defer rows.Close()

		var ingredients []map[string]interface{}
		for rows.Next() {
			var id, name, unit string
			var description, supplier sql.NullString
			var currentStock, minimumStock, maximumStock, unitCost sql.NullFloat64
			var isActive bool
			var lastRestockedAt sql.NullTime
			var createdAt time.Time

			err := rows.Scan(&id, &name, &description, &unit, &currentStock, &minimumStock, &maximumStock, &unitCost, &supplier, &isActive, &lastRestockedAt, &createdAt)
			if err != nil {
				continue
			}

			ingredient := map[string]interface{}{
				"id":            id,
				"name":          name,
				"description":   description.String,
				"unit":          unit,
				"current_stock": currentStock.Float64,
				"minimum_stock": minimumStock.Float64,
				"maximum_stock": maximumStock.Float64,
				"unit_cost":     unitCost.Float64,
				"supplier":      supplier.String,
				"is_active":     isActive,
				"created_at":    createdAt,
			}

			if lastRestockedAt.Valid {
				ingredient["last_restocked_at"] = lastRestockedAt.Time
			}

			ingredients = append(ingredients, ingredient)
		}

		totalPages := (total + perPage - 1) / perPage

		c.JSON(200, gin.H{
			"success": true,
			"message": "Ingredients retrieved successfully",
			"data":    ingredients,
			"meta": gin.H{
				"current_page": page,
				"per_page":     perPage,
				"total":        total,
				"total_pages":  totalPages,
			},
		})
	}
}

// Create a new ingredient
func createIngredient(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req map[string]interface{}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request format",
				"error":   err.Error(),
			})
			return
		}

		// Required fields
		name, _ := req["name"].(string)
		unit, _ := req["unit"].(string)

		if name == "" || unit == "" {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Name and unit are required",
			})
			return
		}

		// Optional fields
		description, _ := req["description"].(string)
		supplier, _ := req["supplier"].(string)
		currentStock, _ := req["current_stock"].(float64)
		minimumStock, _ := req["minimum_stock"].(float64)
		maximumStock, _ := req["maximum_stock"].(float64)
		unitCost, _ := req["unit_cost"].(float64)

		var id string
		err := db.QueryRow(`
			INSERT INTO ingredients (name, description, unit, current_stock, minimum_stock, maximum_stock, unit_cost, supplier)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING id
		`, name, description, unit, currentStock, minimumStock, maximumStock, unitCost, supplier).Scan(&id)

		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to create ingredient",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(201, gin.H{
			"success": true,
			"message": "Ingredient created successfully",
			"data":    gin.H{"id": id},
		})
	}
}

// Update an existing ingredient
func updateIngredient(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var req map[string]interface{}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request format",
				"error":   err.Error(),
			})
			return
		}

		// Build dynamic update query
		updates := []string{}
		args := []interface{}{}
		argCount := 0

		if name, ok := req["name"].(string); ok && name != "" {
			argCount++
			updates = append(updates, fmt.Sprintf("name = $%d", argCount))
			args = append(args, name)
		}

		if description, ok := req["description"].(string); ok {
			argCount++
			updates = append(updates, fmt.Sprintf("description = $%d", argCount))
			args = append(args, description)
		}

		if unit, ok := req["unit"].(string); ok && unit != "" {
			argCount++
			updates = append(updates, fmt.Sprintf("unit = $%d", argCount))
			args = append(args, unit)
		}

		if minimumStock, ok := req["minimum_stock"].(float64); ok {
			argCount++
			updates = append(updates, fmt.Sprintf("minimum_stock = $%d", argCount))
			args = append(args, minimumStock)
		}

		if maximumStock, ok := req["maximum_stock"].(float64); ok {
			argCount++
			updates = append(updates, fmt.Sprintf("maximum_stock = $%d", argCount))
			args = append(args, maximumStock)
		}

		if unitCost, ok := req["unit_cost"].(float64); ok {
			argCount++
			updates = append(updates, fmt.Sprintf("unit_cost = $%d", argCount))
			args = append(args, unitCost)
		}

		if supplier, ok := req["supplier"].(string); ok {
			argCount++
			updates = append(updates, fmt.Sprintf("supplier = $%d", argCount))
			args = append(args, supplier)
		}

		if isActive, ok := req["is_active"].(bool); ok {
			argCount++
			updates = append(updates, fmt.Sprintf("is_active = $%d", argCount))
			args = append(args, isActive)
		}

		if len(updates) == 0 {
			c.JSON(400, gin.H{
				"success": false,
				"message": "No fields to update",
			})
			return
		}

		argCount++
		args = append(args, id)
		query := fmt.Sprintf("UPDATE ingredients SET %s WHERE id = $%d", strings.Join(updates, ", "), argCount)

		result, err := db.Exec(query, args...)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to update ingredient",
				"error":   err.Error(),
			})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{
				"success": false,
				"message": "Ingredient not found",
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Ingredient updated successfully",
		})
	}
}

// Delete an ingredient
func deleteIngredient(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		result, err := db.Exec("DELETE FROM ingredients WHERE id = $1", id)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to delete ingredient",
				"error":   err.Error(),
			})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{
				"success": false,
				"message": "Ingredient not found",
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Ingredient deleted successfully",
		})
	}
}

// Restock an ingredient
func restockIngredient(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var req map[string]interface{}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request format",
				"error":   err.Error(),
			})
			return
		}

		quantity, ok := req["quantity"].(float64)
		if !ok || quantity <= 0 {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Valid quantity is required",
			})
			return
		}

		notes, _ := req["notes"].(string)
		userID := c.GetString("user_id")

		// Start transaction
		tx, err := db.Begin()
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to start transaction",
			})
			return
		}
		defer tx.Rollback()

		// Get current stock
		var currentStock float64
		err = tx.QueryRow("SELECT current_stock FROM ingredients WHERE id = $1", id).Scan(&currentStock)
		if err != nil {
			c.JSON(404, gin.H{
				"success": false,
				"message": "Ingredient not found",
			})
			return
		}

		newStock := currentStock + quantity

		// Update stock
		_, err = tx.Exec(`
			UPDATE ingredients 
			SET current_stock = $1, last_restocked_at = CURRENT_TIMESTAMP 
			WHERE id = $2
		`, newStock, id)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to update stock",
			})
			return
		}

		// Record history
		_, err = tx.Exec(`
			INSERT INTO ingredient_stock_history (ingredient_id, type, quantity, previous_stock, new_stock, notes, performed_by)
			VALUES ($1, 'restock', $2, $3, $4, $5, $6)
		`, id, quantity, currentStock, newStock, notes, userID)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to record history",
			})
			return
		}

		tx.Commit()

		c.JSON(200, gin.H{
			"success": true,
			"message": "Ingredient restocked successfully",
			"data": gin.H{
				"previous_stock": currentStock,
				"new_stock":      newStock,
				"quantity_added": quantity,
			},
		})
	}
}

// Get ingredient stock history
func getIngredientHistory(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		rows, err := db.Query(`
			SELECT h.id, h.type, h.quantity, h.previous_stock, h.new_stock, h.notes, h.created_at,
				u.first_name, u.last_name
			FROM ingredient_stock_history h
			LEFT JOIN users u ON h.performed_by = u.id
			WHERE h.ingredient_id = $1
			ORDER BY h.created_at DESC
			LIMIT 100
		`, id)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to fetch history",
			})
			return
		}
		defer rows.Close()

		var history []map[string]interface{}
		for rows.Next() {
			var historyID, historyType string
			var quantity, previousStock, newStock float64
			var notes sql.NullString
			var createdAt time.Time
			var firstName, lastName sql.NullString

			err := rows.Scan(&historyID, &historyType, &quantity, &previousStock, &newStock, &notes, &createdAt, &firstName, &lastName)
			if err != nil {
				continue
			}

			record := map[string]interface{}{
				"id":             historyID,
				"type":           historyType,
				"quantity":       quantity,
				"previous_stock": previousStock,
				"new_stock":      newStock,
				"notes":          notes.String,
				"created_at":     createdAt,
			}

			if firstName.Valid && lastName.Valid {
				record["performed_by"] = firstName.String + " " + lastName.String
			}

			history = append(history, record)
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "History retrieved successfully",
			"data":    history,
		})
	}
}

// Get low stock ingredients
func getLowStockIngredients(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query(`
			SELECT id, name, unit, current_stock, minimum_stock
			FROM ingredients
			WHERE current_stock <= minimum_stock AND is_active = true
			ORDER BY (current_stock / NULLIF(minimum_stock, 0)) ASC
		`)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to fetch low stock ingredients",
			})
			return
		}
		defer rows.Close()

		var ingredients []map[string]interface{}
		for rows.Next() {
			var id, name, unit string
			var currentStock, minimumStock float64

			err := rows.Scan(&id, &name, &unit, &currentStock, &minimumStock)
			if err != nil {
				continue
			}

			ingredients = append(ingredients, map[string]interface{}{
				"id":            id,
				"name":          name,
				"unit":          unit,
				"current_stock": currentStock,
				"minimum_stock": minimumStock,
				"deficit":       minimumStock - currentStock,
			})
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Low stock ingredients retrieved successfully",
			"data":    ingredients,
		})
	}
}
