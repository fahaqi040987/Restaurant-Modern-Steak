package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetSettings returns all system settings as a key-value map
func GetSettings(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.Query(`
			SELECT setting_key, setting_value, setting_type
			FROM system_settings
			ORDER BY category, setting_key
		`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to fetch settings",
				"error":   err.Error(),
			})
			return
		}
		defer rows.Close()

		settings := make(models.SystemSettings)
		for rows.Next() {
			var key, value, settingType string
			if err := rows.Scan(&key, &value, &settingType); err != nil {
				continue
			}

			// Convert value based on type
			switch settingType {
			case "number":
				if num, err := strconv.ParseFloat(value, 64); err == nil {
					settings[key] = num
				} else {
					settings[key] = value
				}
			case "boolean":
				settings[key] = value == "true"
			case "json":
				settings[key] = value // Frontend will parse JSON
			default:
				settings[key] = value
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Settings retrieved successfully",
			"data":    settings,
		})
	}
}

// UpdateSettings updates multiple system settings
func UpdateSettings(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request models.BatchUpdateSettingsRequest
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request format",
				"error":   err.Error(),
			})
			return
		}

		// Get user ID from context (set by auth middleware)
		userIDValue, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized",
			})
			return
		}

		// Handle both string and uuid.UUID types from middleware
		var userUUID uuid.UUID
		switch v := userIDValue.(type) {
		case string:
			var err error
			userUUID, err = uuid.Parse(v)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid user ID format",
				})
				return
			}
		case uuid.UUID:
			userUUID = v
		default:
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid user ID type",
			})
			return
		}

		// Update or insert each setting using UPSERT
		for key, value := range request {
			// Determine setting type based on value
			settingType := determineSettingType(value)
			// Determine category based on key prefix
			category := determineCategoryFromKey(key)

			// Use INSERT ON CONFLICT (UPSERT) to handle both new and existing settings
			_, err := db.Exec(`
				INSERT INTO system_settings (setting_key, setting_value, setting_type, category, updated_by, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6)
				ON CONFLICT (setting_key) DO UPDATE SET
					setting_value = EXCLUDED.setting_value,
					updated_by = EXCLUDED.updated_by,
					updated_at = EXCLUDED.updated_at
			`, key, value, settingType, category, userUUID, time.Now())

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to update setting: " + key,
					"error":   err.Error(),
				})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Settings updated successfully",
		})
	}
}

// determineSettingType infers the setting type from the value
func determineSettingType(value string) string {
	// Check if it's a boolean
	if value == "true" || value == "false" {
		return "boolean"
	}
	// Check if it's a number
	if _, err := strconv.ParseFloat(value, 64); err == nil {
		return "number"
	}
	// Default to string
	return "string"
}

// determineCategoryFromKey determines the category based on the setting key
func determineCategoryFromKey(key string) string {
	switch {
	case key == "restaurant_name" || key == "default_language" || key == "currency":
		return "restaurant"
	case key == "tax_rate" || key == "service_charge" || key == "tax_calculation_method" || key == "enable_rounding":
		return "financial"
	case key == "receipt_header" || key == "receipt_footer" || key == "paper_size" ||
		key == "show_logo" || key == "auto_print_customer_copy" || key == "printer_name" || key == "print_copies":
		return "receipt"
	case key == "kitchen_paper_size" || key == "auto_print_kitchen" || key == "show_prices_kitchen" ||
		key == "kitchen_print_categories" || key == "kitchen_urgent_time":
		return "kitchen"
	case key == "backup_frequency" || key == "session_timeout" || key == "data_retention_days" ||
		key == "low_stock_threshold" || key == "enable_audit_logging":
		return "system"
	default:
		return "general"
	}
}

// GetSystemHealth returns system health status
func GetSystemHealth(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		// Check database connection
		err := db.Ping()
		dbStatus := "connected"
		if err != nil {
			dbStatus = "disconnected"
		}
		dbLatency := time.Since(startTime).Milliseconds()

		// Get last backup info (if backup system is implemented)
		// For now, return mock data
		lastBackup := time.Now().Add(-2 * time.Hour)
		nextBackup := time.Now().Add(22 * time.Hour)

		health := gin.H{
			"database": gin.H{
				"status":     dbStatus,
				"latency_ms": dbLatency,
				"last_check": time.Now().Format(time.RFC3339),
			},
			"api": gin.H{
				"status":  "online",
				"version": "1.0.0",
			},
			"backup": gin.H{
				"status":      "up_to_date",
				"last_backup": lastBackup.Format(time.RFC3339),
				"next_backup": nextBackup.Format(time.RFC3339),
			},
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Health status retrieved successfully",
			"data":    health,
		})
	}
}
