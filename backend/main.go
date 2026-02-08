package main

import (
	"log"
	"os"
	"strings"
	"time"

	"pos-public/internal/api"
	"pos-public/internal/database"
	"pos-public/internal/handlers"
	"pos-public/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func init() {
	// T069: Set server timezone to Asia/Jakarta (UTC+7) for Indonesian localization
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		log.Printf("Warning: Failed to set Asia/Jakarta timezone: %v", err)
		log.Printf("Server will use system timezone")
	} else {
		time.Local = location
		log.Printf("Server timezone set to: %s (UTC%s)", location, time.Now().In(location).Format("-07:00"))
	}
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Database configuration
	dbConfig := database.Config{
		Host:     getEnv("DB_HOST", "postgres"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", "postgres123"),
		DBName:   getEnv("DB_NAME", "pos_system"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}

	// Initialize database connection
	db, err := database.Connect(dbConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Successfully connected to database")

	// Initialize Sentry error tracking (optional)
	if err := middleware.InitializeSentry(); err != nil {
		log.Printf("Warning: Sentry initialization failed: %v", err)
	}

	// Configure logging level based on environment
	logLevel := getEnv("LOG_LEVEL", "INFO")
	middleware.SetLogLevel(logLevel)
	log.Printf("Log level set to: %s", logLevel)

	// Initialize Gin router
	gin.SetMode(getEnv("GIN_MODE", "release"))
	router := gin.New()

	// Add middleware
	router.Use(middleware.RecoveryWithSentry())   // Custom recovery with Sentry
	router.Use(middleware.RequestIDMiddleware())  // Add request ID to all requests
	router.Use(middleware.StructuredLogger())     // Structured JSON logging with masking
	router.Use(middleware.SentryErrorReporting()) // Sentry error reporting
	router.Use(middleware.SecurityHeaders())

	// CORS configuration - load allowed origins from environment for production
	allowedOrigins := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:4000,http://localhost:3001,http://localhost:5173")
	origins := strings.Split(allowedOrigins, ",")

	router.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "accept", "origin", "Cache-Control", "X-Requested-With"},
		AllowCredentials: true,
		MaxAge:           12 * 3600, // 12 hours preflight cache
	}))

	// Add authentication middleware to protected routes
	authMiddleware := middleware.AuthMiddleware()

	// Initialize health handler for comprehensive health checks
	healthHandler := handlers.NewHealthHandler(db)

	// Health check endpoint at root level (for Docker health checks)
	router.GET("/health", healthHandler.GetSystemHealth)

	// Static file serving for uploaded images
	// Create uploads directory if it doesn't exist
	uploadsDir := getEnv("UPLOADS_DIR", "./uploads")
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		log.Printf("Warning: Failed to create uploads directory: %v", err)
	}
	router.Static("/uploads", uploadsDir)

	// Initialize API routes
	apiRoutes := router.Group("/api/v1")
	api.SetupRoutes(apiRoutes, db, authMiddleware)

	// Start server
	port := getEnv("PORT", "8080")
	log.Printf("Starting server on port %s", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
