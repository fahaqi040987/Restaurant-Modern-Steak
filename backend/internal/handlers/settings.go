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
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized",
			})
			return
		}

		userUUID, err := uuid.Parse(userID.(string))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid user ID",
			})
			return
		}

		// Update each setting
		for key, value := range request {
			_, err := db.Exec(`
				UPDATE system_settings
				SET setting_value = $1, updated_by = $2, updated_at = $3
				WHERE setting_key = $4
			`, value, userUUID, time.Now(), key)

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
