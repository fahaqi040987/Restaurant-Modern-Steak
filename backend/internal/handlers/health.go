package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct {
	db *sql.DB
}

func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

type HealthResponse struct {
	Status    string                 `json:"status"`
	Timestamp time.Time              `json:"timestamp"`
	Version   string                 `json:"version"`
	Database  DatabaseHealth         `json:"database"`
	Services  map[string]interface{} `json:"services"`
}

type DatabaseHealth struct {
	Connected bool   `json:"connected"`
	Latency   string `json:"latency,omitempty"`
	Error     string `json:"error,omitempty"`
}

// GetSystemHealth returns the health status of the system
// GET /api/v1/health
func (h *HealthHandler) GetSystemHealth(c *gin.Context) {
	startTime := time.Now()

	// Check database connection
	dbHealth := h.checkDatabaseConnection()

	// Determine overall status
	status := "healthy"
	statusCode := http.StatusOK
	if !dbHealth.Connected {
		status = "unhealthy"
		statusCode = http.StatusServiceUnavailable
	}

	response := HealthResponse{
		Status:    status,
		Timestamp: time.Now(),
		Version:   "1.0.0",
		Database:  dbHealth,
		Services: map[string]interface{}{
			"api": map[string]interface{}{
				"status":      "operational",
				"uptime":      time.Since(startTime).String(),
				"environment": "production",
			},
		},
	}

	c.JSON(statusCode, response)
}

// checkDatabaseConnection verifies database connectivity
func (h *HealthHandler) checkDatabaseConnection() DatabaseHealth {
	// Handle nil database
	if h.db == nil {
		return DatabaseHealth{
			Connected: false,
			Error:     "database connection is nil",
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	startTime := time.Now()

	// Ping database
	if err := h.db.PingContext(ctx); err != nil {
		return DatabaseHealth{
			Connected: false,
			Error:     err.Error(),
		}
	}

	latency := time.Since(startTime)

	return DatabaseHealth{
		Connected: true,
		Latency:   latency.String(),
	}
}
