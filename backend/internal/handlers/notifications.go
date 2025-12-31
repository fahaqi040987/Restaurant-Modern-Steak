package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetUnreadCounts returns the count of unread notifications for the current user
func GetUnreadCounts(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized",
			})
			return
		}

		// Count unread notifications
		var notificationCount int
		err := db.QueryRow(`
			SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false
		`, userID).Scan(&notificationCount)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to fetch notification count",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"notifications": notificationCount,
			},
		})
	}
}

// GetNotifications returns all notifications for the current user
func GetNotifications(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized",
			})
			return
		}

		// Optional filter by type
		notifType := c.Query("type")

		// Optional filter by read status
		isRead := c.Query("is_read")

		query := `
			SELECT id, user_id, type, title, message, is_read, read_at, created_at
			FROM notifications
			WHERE user_id = $1
		`
		args := []interface{}{userID}
		argIndex := 2

		if notifType != "" {
			query += " AND type = $" + string(rune(argIndex))
			args = append(args, notifType)
			argIndex++
		}

		if isRead == "true" {
			query += " AND is_read = true"
		} else if isRead == "false" {
			query += " AND is_read = false"
		}

		query += " ORDER BY created_at DESC LIMIT 100"

		rows, err := db.Query(query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to fetch notifications",
				"error":   err.Error(),
			})
			return
		}
		defer rows.Close()

		notifications := []models.Notification{}
		for rows.Next() {
			var notif models.Notification
			err := rows.Scan(
				&notif.ID,
				&notif.UserID,
				&notif.Type,
				&notif.Title,
				&notif.Message,
				&notif.IsRead,
				&notif.ReadAt,
				&notif.CreatedAt,
			)
			if err != nil {
				continue
			}
			notifications = append(notifications, notif)
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Notifications retrieved successfully",
			"data":    notifications,
		})
	}
}

// MarkNotificationRead marks a notification as read
func MarkNotificationRead(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized",
			})
			return
		}

		notificationID := c.Param("id")
		notifUUID, err := uuid.Parse(notificationID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid notification ID",
			})
			return
		}

		now := time.Now()
		result, err := db.Exec(`
			UPDATE notifications
			SET is_read = true, read_at = $1
			WHERE id = $2 AND user_id = $3
		`, now, notifUUID, userID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to update notification",
				"error":   err.Error(),
			})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Notification not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Notification marked as read",
		})
	}
}

// DeleteNotification deletes a notification
func DeleteNotification(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized",
			})
			return
		}

		notificationID := c.Param("id")
		notifUUID, err := uuid.Parse(notificationID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid notification ID",
			})
			return
		}

		result, err := db.Exec(`
			DELETE FROM notifications
			WHERE id = $1 AND user_id = $2
		`, notifUUID, userID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to delete notification",
				"error":   err.Error(),
			})
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Notification not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Notification deleted successfully",
		})
	}
}

// GetNotificationPreferences returns user notification preferences
func GetNotificationPreferences(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized",
			})
			return
		}

		var prefs models.NotificationPreferences
		err := db.QueryRow(`
			SELECT id, user_id, email_enabled, types_enabled, quiet_hours_start, quiet_hours_end, notification_email, created_at, updated_at
			FROM notification_preferences
			WHERE user_id = $1
		`, userID).Scan(
			&prefs.ID,
			&prefs.UserID,
			&prefs.EmailEnabled,
			&prefs.TypesEnabled,
			&prefs.QuietHoursStart,
			&prefs.QuietHoursEnd,
			&prefs.NotificationEmail,
			&prefs.CreatedAt,
			&prefs.UpdatedAt,
		)

		if err == sql.ErrNoRows {
			// Create default preferences if none exist
			userUUID, _ := uuid.Parse(userID.(string))
			newID := uuid.New()
			defaultTypes := `{"order_update": true, "low_stock": true, "payment": true, "system_alert": true, "daily_report": true}`

			err = db.QueryRow(`
				INSERT INTO notification_preferences (id, user_id, email_enabled, types_enabled)
				VALUES ($1, $2, true, $3)
				RETURNING id, user_id, email_enabled, types_enabled, quiet_hours_start, quiet_hours_end, notification_email, created_at, updated_at
			`, newID, userUUID, defaultTypes).Scan(
				&prefs.ID,
				&prefs.UserID,
				&prefs.EmailEnabled,
				&prefs.TypesEnabled,
				&prefs.QuietHoursStart,
				&prefs.QuietHoursEnd,
				&prefs.NotificationEmail,
				&prefs.CreatedAt,
				&prefs.UpdatedAt,
			)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to create default preferences",
					"error":   err.Error(),
				})
				return
			}
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to fetch preferences",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Preferences retrieved successfully",
			"data":    prefs,
		})
	}
}

// UpdateNotificationPreferences updates user notification preferences
func UpdateNotificationPreferences(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized",
			})
			return
		}

		var request models.UpdateNotificationPreferencesRequest
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request format",
				"error":   err.Error(),
			})
			return
		}

		_, err := db.Exec(`
			UPDATE notification_preferences
			SET email_enabled = $1, types_enabled = $2, quiet_hours_start = $3, 
			    quiet_hours_end = $4, notification_email = $5, updated_at = $6
			WHERE user_id = $7
		`, request.EmailEnabled, request.TypesEnabled, request.QuietHoursStart,
			request.QuietHoursEnd, request.NotificationEmail, time.Now(), userID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to update preferences",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Preferences updated successfully",
		})
	}
}

// T077: Customer order notification handlers for QR-based ordering

// GetOrderNotifications retrieves notifications for a specific order (customer-facing)
// GET /customer/orders/:id/notifications
func GetOrderNotifications(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Invalid order ID",
				Error:   stringPtr("invalid_uuid"),
			})
			return
		}

		// Verify order exists
		var orderExists bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM orders WHERE id = $1)", orderID).Scan(&orderExists)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to verify order",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		if !orderExists {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Success: false,
				Message: "Order not found",
				Error:   stringPtr("order_not_found"),
			})
			return
		}

		// Fetch notifications for this order
		query := `
			SELECT id, order_id, status, message, is_read, created_at
			FROM order_notifications
			WHERE order_id = $1
			ORDER BY created_at DESC
		`

		rows, err := db.Query(query, orderID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to fetch notifications",
				Error:   stringPtr(err.Error()),
			})
			return
		}
		defer rows.Close()

		var notifications []models.OrderNotification
		unreadCount := 0

		for rows.Next() {
			var notification models.OrderNotification
			err := rows.Scan(
				&notification.ID,
				&notification.OrderID,
				&notification.Status,
				&notification.Message,
				&notification.IsRead,
				&notification.CreatedAt,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, models.APIResponse{
					Success: false,
					Message: "Failed to parse notification",
					Error:   stringPtr(err.Error()),
				})
				return
			}

			if !notification.IsRead {
				unreadCount++
			}

			notifications = append(notifications, notification)
		}

		if err = rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to read notifications",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		// Return empty array if no notifications
		if notifications == nil {
			notifications = []models.OrderNotification{}
		}

		response := models.GetNotificationsResponse{
			Notifications: notifications,
			UnreadCount:   unreadCount,
		}

		c.JSON(http.StatusOK, models.APIResponse{
			Success: true,
			Message: "Notifications retrieved successfully",
			Data:    response,
		})
	}
}

// MarkOrderNotificationAsRead marks a customer order notification as read
// PUT /customer/notifications/:id/read
func MarkOrderNotificationAsRead(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		notificationID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Invalid notification ID",
				Error:   stringPtr("invalid_uuid"),
			})
			return
		}

		// Update notification to mark as read
		result, err := db.Exec(`
			UPDATE order_notifications
			SET is_read = true
			WHERE id = $1
		`, notificationID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to update notification",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to check update result",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		if rowsAffected == 0 {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Success: false,
				Message: "Notification not found",
				Error:   stringPtr("notification_not_found"),
			})
			return
		}

		c.JSON(http.StatusOK, models.APIResponse{
			Success: true,
			Message: "Notification marked as read",
			Data:    nil,
		})
	}
}

// CreateOrderNotification creates a notification for order status change
// Internal helper method called when order status changes
func CreateOrderNotification(db *sql.DB, orderID uuid.UUID, status, message string) error {
	_, err := db.Exec(`
		INSERT INTO order_notifications (order_id, status, message, is_read)
		VALUES ($1, $2, $3, false)
	`, orderID, status, message)

	return err
}
