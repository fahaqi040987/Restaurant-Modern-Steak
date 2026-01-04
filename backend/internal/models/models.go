package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a system user/staff member
type User struct {
	ID           uuid.UUID `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"` // Don't expose password hash in JSON
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	Role         string    `json:"role"` // admin, manager, server, counter, kitchen
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Category represents a product category
type Category struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	Color       *string   `json:"color"`
	SortOrder   int       `json:"sort_order"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Product represents a menu item/product
type Product struct {
	ID              uuid.UUID  `json:"id"`
	CategoryID      *uuid.UUID `json:"category_id"`
	Name            string     `json:"name"`
	Description     *string    `json:"description"`
	Price           float64    `json:"price"`
	ImageURL        *string    `json:"image_url"`
	Barcode         *string    `json:"barcode"`
	SKU             *string    `json:"sku"`
	IsAvailable     bool       `json:"is_available"`
	PreparationTime int        `json:"preparation_time"` // in minutes
	SortOrder       int        `json:"sort_order"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	Category        *Category  `json:"category,omitempty"`
}

// DiningTable represents a table or dining area
type DiningTable struct {
	ID              uuid.UUID `json:"id"`
	TableNumber     string    `json:"table_number"`
	SeatingCapacity int       `json:"seating_capacity"`
	Location        *string   `json:"location"`
	IsOccupied      bool      `json:"is_occupied"`
	QRCode          *string   `json:"qr_code"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// Order represents a customer order
type Order struct {
	ID             uuid.UUID    `json:"id"`
	OrderNumber    string       `json:"order_number"`
	TableID        *uuid.UUID   `json:"table_id"`
	UserID         *uuid.UUID   `json:"user_id"`
	CustomerName   *string      `json:"customer_name"`
	OrderType      string       `json:"order_type"` // dine_in, takeout, delivery
	Status         string       `json:"status"`     // pending, confirmed, preparing, ready, served, completed, cancelled
	Subtotal       float64      `json:"subtotal"`
	TaxAmount      float64      `json:"tax_amount"`
	DiscountAmount float64      `json:"discount_amount"`
	TotalAmount    float64      `json:"total_amount"`
	Notes          *string      `json:"notes"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
	ServedAt       *time.Time   `json:"served_at"`
	CompletedAt    *time.Time   `json:"completed_at"`
	Table          *DiningTable `json:"table,omitempty"`
	User           *User        `json:"user,omitempty"`
	Items          []OrderItem  `json:"items,omitempty"`
	Payments       []Payment    `json:"payments,omitempty"`
}

// OrderItem represents an item within an order
type OrderItem struct {
	ID                  uuid.UUID `json:"id"`
	OrderID             uuid.UUID `json:"order_id"`
	ProductID           uuid.UUID `json:"product_id"`
	Quantity            int       `json:"quantity"`
	UnitPrice           float64   `json:"unit_price"`
	TotalPrice          float64   `json:"total_price"`
	SpecialInstructions *string   `json:"special_instructions"`
	Status              string    `json:"status"` // pending, preparing, ready, served
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
	Product             *Product  `json:"product,omitempty"`
}

// Payment represents a payment transaction
type Payment struct {
	ID              uuid.UUID  `json:"id"`
	OrderID         uuid.UUID  `json:"order_id"`
	PaymentMethod   string     `json:"payment_method"` // cash, credit_card, debit_card, digital_wallet
	Amount          float64    `json:"amount"`
	ReferenceNumber *string    `json:"reference_number"`
	Status          string     `json:"status"` // pending, completed, failed, refunded
	ProcessedBy     *uuid.UUID `json:"processed_by"`
	ProcessedAt     *time.Time `json:"processed_at"`
	CreatedAt       time.Time  `json:"created_at"`
	ProcessedByUser *User      `json:"processed_by_user,omitempty"`
}

// Inventory represents product inventory
type Inventory struct {
	ID              uuid.UUID  `json:"id"`
	ProductID       uuid.UUID  `json:"product_id"`
	CurrentStock    int        `json:"current_stock"`
	MinimumStock    int        `json:"minimum_stock"`
	MaximumStock    int        `json:"maximum_stock"`
	UnitCost        *float64   `json:"unit_cost"`
	LastRestockedAt *time.Time `json:"last_restocked_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	Product         *Product   `json:"product,omitempty"`
}

// OrderStatusHistory tracks order status changes
type OrderStatusHistory struct {
	ID             uuid.UUID  `json:"id"`
	OrderID        uuid.UUID  `json:"order_id"`
	PreviousStatus *string    `json:"previous_status"`
	NewStatus      string     `json:"new_status"`
	ChangedBy      *uuid.UUID `json:"changed_by"`
	Notes          *string    `json:"notes"`
	CreatedAt      time.Time  `json:"created_at"`
	ChangedByUser  *User      `json:"changed_by_user,omitempty"`
}

// Request/Response DTOs

// CreateOrderRequest represents the request to create a new order
type CreateOrderRequest struct {
	TableID      *uuid.UUID        `json:"table_id"`
	CustomerName *string           `json:"customer_name"`
	OrderType    string            `json:"order_type"`
	Items        []CreateOrderItem `json:"items"`
	Notes        *string           `json:"notes"`
}

// CreateOrderItem represents an item in the order creation request
type CreateOrderItem struct {
	ProductID           uuid.UUID `json:"product_id"`
	Quantity            int       `json:"quantity"`
	SpecialInstructions *string   `json:"special_instructions"`
}

// UpdateOrderStatusRequest represents the request to update order status
type UpdateOrderStatusRequest struct {
	Status string  `json:"status"`
	Notes  *string `json:"notes"`
}

// ProcessPaymentRequest represents the request to process a payment
type ProcessPaymentRequest struct {
	PaymentMethod   string  `json:"payment_method"`
	Amount          float64 `json:"amount"`
	ReferenceNumber *string `json:"reference_number"`
}

// CreateProductRequest represents the request to create a product
type CreateProductRequest struct {
	CategoryID      uuid.UUID `json:"category_id" binding:"required"`
	Name            string    `json:"name" binding:"required"`
	Description     *string   `json:"description"`
	Price           float64   `json:"price" binding:"required,gt=0"`
	ImageURL        *string   `json:"image_url"`
	Barcode         *string   `json:"barcode"`
	SKU             *string   `json:"sku"`
	IsAvailable     *bool     `json:"is_available"`
	PreparationTime *int      `json:"preparation_time"`
	SortOrder       *int      `json:"sort_order"`
}

// UpdateProductRequest represents the request to update a product
type UpdateProductRequest struct {
	CategoryID      *uuid.UUID `json:"category_id"`
	Name            *string    `json:"name"`
	Description     *string    `json:"description"`
	Price           *float64   `json:"price"`
	ImageURL        *string    `json:"image_url"`
	Barcode         *string    `json:"barcode"`
	SKU             *string    `json:"sku"`
	IsAvailable     *bool      `json:"is_available"`
	PreparationTime *int       `json:"preparation_time"`
	SortOrder       *int       `json:"sort_order"`
}

// LoginRequest represents the login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// APIResponse represents a generic API response
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   *string     `json:"error,omitempty"`
}

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Meta    MetaData    `json:"meta"`
}

// MetaData represents pagination metadata
type MetaData struct {
	CurrentPage int `json:"current_page"`
	PerPage     int `json:"per_page"`
	Total       int `json:"total"`
	TotalPages  int `json:"total_pages"`
}

// SystemSetting represents a system configuration setting
type SystemSetting struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	SettingKey   string     `json:"setting_key" db:"setting_key"`
	SettingValue string     `json:"setting_value" db:"setting_value"`
	SettingType  string     `json:"setting_type" db:"setting_type"`
	Description  *string    `json:"description,omitempty" db:"description"`
	Category     *string    `json:"category,omitempty" db:"category"`
	UpdatedBy    *uuid.UUID `json:"updated_by,omitempty" db:"updated_by"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
}

// SystemSettings is a map of setting keys to values
type SystemSettings map[string]interface{}

// UpdateSystemSettingRequest represents a request to update a setting
type UpdateSystemSettingRequest struct {
	SettingValue string `json:"setting_value" binding:"required"`
}

// BatchUpdateSettingsRequest represents a request to update multiple settings
type BatchUpdateSettingsRequest map[string]string

// Notification represents a user notification
type Notification struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	Type      string     `json:"type" db:"type"`
	Title     string     `json:"title" db:"title"`
	Message   string     `json:"message" db:"message"`
	IsRead    bool       `json:"is_read" db:"is_read"`
	ReadAt    *time.Time `json:"read_at,omitempty" db:"read_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}

// NotificationPreferences represents user notification preferences
type NotificationPreferences struct {
	ID                uuid.UUID `json:"id" db:"id"`
	UserID            uuid.UUID `json:"user_id" db:"user_id"`
	EmailEnabled      bool      `json:"email_enabled" db:"email_enabled"`
	TypesEnabled      string    `json:"types_enabled" db:"types_enabled"` // JSON string
	QuietHoursStart   *string   `json:"quiet_hours_start,omitempty" db:"quiet_hours_start"`
	QuietHoursEnd     *string   `json:"quiet_hours_end,omitempty" db:"quiet_hours_end"`
	NotificationEmail *string   `json:"notification_email,omitempty" db:"notification_email"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}

// CreateNotificationRequest represents a request to create a notification
type CreateNotificationRequest struct {
	UserID  uuid.UUID `json:"user_id" binding:"required"`
	Type    string    `json:"type" binding:"required"`
	Title   string    `json:"title" binding:"required"`
	Message string    `json:"message" binding:"required"`
}

// UpdateNotificationPreferencesRequest represents a request to update notification preferences
type UpdateNotificationPreferencesRequest struct {
	EmailEnabled      bool    `json:"email_enabled"`
	TypesEnabled      string  `json:"types_enabled"`
	QuietHoursStart   *string `json:"quiet_hours_start"`
	QuietHoursEnd     *string `json:"quiet_hours_end"`
	NotificationEmail *string `json:"notification_email"`
}

// ============================================
// Reservation Models (Feature: 004-restaurant-management)
// Public website table booking functionality
// ============================================

// ReservationStatus represents the possible states of a reservation
type ReservationStatus string

const (
	ReservationStatusPending   ReservationStatus = "pending"
	ReservationStatusConfirmed ReservationStatus = "confirmed"
	ReservationStatusCancelled ReservationStatus = "cancelled"
	ReservationStatusCompleted ReservationStatus = "completed"
	ReservationStatusNoShow    ReservationStatus = "no_show"
)

// Reservation represents a customer table booking
type Reservation struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	CustomerName    string     `json:"customer_name" db:"customer_name"`
	Email           string     `json:"email" db:"email"`
	Phone           string     `json:"phone" db:"phone"`
	PartySize       int        `json:"party_size" db:"party_size"`
	ReservationDate string     `json:"reservation_date" db:"reservation_date"` // YYYY-MM-DD
	ReservationTime string     `json:"reservation_time" db:"reservation_time"` // HH:MM
	SpecialRequests *string    `json:"special_requests,omitempty" db:"special_requests"`
	Status          string     `json:"status" db:"status"`
	Notes           *string    `json:"notes,omitempty" db:"notes"`
	ConfirmedBy     *uuid.UUID `json:"confirmed_by,omitempty" db:"confirmed_by"`
	ConfirmedAt     *time.Time `json:"confirmed_at,omitempty" db:"confirmed_at"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
	ConfirmedByUser *User      `json:"confirmed_by_user,omitempty"` // Populated via JOIN
}

// CreateReservationRequest is the DTO for public reservation submission
type CreateReservationRequest struct {
	CustomerName    string  `json:"customer_name" binding:"required,max=100"`
	Email           string  `json:"email" binding:"required,email"`
	Phone           string  `json:"phone" binding:"required,max=20"`
	PartySize       int     `json:"party_size" binding:"required,min=1,max=20"`
	ReservationDate string  `json:"reservation_date" binding:"required"` // YYYY-MM-DD
	ReservationTime string  `json:"reservation_time" binding:"required"` // HH:MM
	SpecialRequests *string `json:"special_requests,omitempty"`
}

// ReservationResponse is the DTO for public API responses (limited fields)
type ReservationResponse struct {
	ID              string `json:"id"`
	Status          string `json:"status"`
	ReservationDate string `json:"reservation_date"`
	ReservationTime string `json:"reservation_time"`
	PartySize       int    `json:"party_size"`
}

// UpdateReservationStatusRequest is for staff status updates
type UpdateReservationStatusRequest struct {
	Status string  `json:"status" binding:"required,oneof=confirmed cancelled completed no_show"`
	Notes  *string `json:"notes,omitempty"`
}

// ReservationListQuery represents query parameters for listing reservations
type ReservationListQuery struct {
	Status string `form:"status"`
	Date   string `form:"date"`
	Page   int    `form:"page,default=1"`
	Limit  int    `form:"limit,default=20"`
}

// ReservationListResponse is the paginated response for reservation list
type ReservationListResponse struct {
	Success    bool          `json:"success"`
	Message    string        `json:"message"`
	Data       []Reservation `json:"data"`
	Pagination *Pagination   `json:"pagination,omitempty"`
}

// Pagination represents pagination metadata
type Pagination struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

// SatisfactionSurvey represents customer feedback after order completion
// T074: Added for QR-based ordering satisfaction survey feature
type SatisfactionSurvey struct {
	ID             uuid.UUID `json:"id" db:"id"`
	OrderID        uuid.UUID `json:"order_id" db:"order_id"`
	OverallRating  int       `json:"overall_rating" db:"overall_rating"`
	FoodQuality    *int      `json:"food_quality,omitempty" db:"food_quality"`
	ServiceQuality *int      `json:"service_quality,omitempty" db:"service_quality"`
	Ambiance       *int      `json:"ambiance,omitempty" db:"ambiance"`
	ValueForMoney  *int      `json:"value_for_money,omitempty" db:"value_for_money"`
	Comments       *string   `json:"comments,omitempty" db:"comments"`
	WouldRecommend *bool     `json:"would_recommend,omitempty" db:"would_recommend"`
	CustomerName   *string   `json:"customer_name,omitempty" db:"customer_name"`
	CustomerEmail  *string   `json:"customer_email,omitempty" db:"customer_email"`
	SubmittedAt    time.Time `json:"submitted_at" db:"submitted_at"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

// CreateSurveyRequest is the DTO for survey submission
type CreateSurveyRequest struct {
	OverallRating  int     `json:"overall_rating" binding:"required,min=1,max=5"`
	FoodQuality    *int    `json:"food_quality,omitempty" binding:"omitempty,min=1,max=5"`
	ServiceQuality *int    `json:"service_quality,omitempty" binding:"omitempty,min=1,max=5"`
	Ambiance       *int    `json:"ambiance,omitempty" binding:"omitempty,min=1,max=5"`
	ValueForMoney  *int    `json:"value_for_money,omitempty" binding:"omitempty,min=1,max=5"`
	Comments       *string `json:"comments,omitempty"`
	WouldRecommend *bool   `json:"would_recommend,omitempty"`
	CustomerName   *string `json:"customer_name,omitempty" binding:"omitempty,max=100"`
	CustomerEmail  *string `json:"customer_email,omitempty" binding:"omitempty,email"`
}

// SurveyStatsResponse is the DTO for survey analytics
type SurveyStatsResponse struct {
	TotalSurveys          int         `json:"total_surveys"`
	AverageRating         float64     `json:"average_rating"`
	AverageFoodQuality    float64     `json:"average_food_quality"`
	AverageServiceQuality float64     `json:"average_service_quality"`
	AverageAmbiance       float64     `json:"average_ambiance"`
	AverageValueForMoney  float64     `json:"average_value_for_money"`
	RecommendationRate    float64     `json:"recommendation_rate"` // Percentage
	RatingDistribution    map[int]int `json:"rating_distribution"` // Count per rating
}

// CreatePaymentRequest is the DTO for customer payment submission
// T072: Added for QR-based ordering payment feature
type CreatePaymentRequest struct {
	PaymentMethod   string  `json:"payment_method" binding:"required,oneof=cash credit_card debit_card digital_wallet qris"`
	Amount          float64 `json:"amount" binding:"required,gt=0"`
	ReferenceNumber *string `json:"reference_number,omitempty"` // For digital payments
}

// OrderNotification represents a customer notification for order status changes
// T077: Order notification for QR-based ordering
type OrderNotification struct {
	ID        uuid.UUID `json:"id"`
	OrderID   uuid.UUID `json:"order_id"`
	Status    string    `json:"status"`  // Order status at notification time
	Message   string    `json:"message"` // Customer-facing message
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// GetNotificationsResponse is the DTO for fetching customer notifications
type GetNotificationsResponse struct {
	Notifications []OrderNotification `json:"notifications"`
	UnreadCount   int                 `json:"unread_count"`
}

// ============================================
// Ingredient & Recipe Models (Feature: 007-fix-order-inventory-system)
// Ingredient-based inventory with recipe management
// ============================================

// Ingredient represents a raw material used in food preparation
type Ingredient struct {
	ID             uuid.UUID  `json:"id"`
	Name           string     `json:"name"`
	Description    *string    `json:"description"`
	Unit           string     `json:"unit"` // kg, liter, pcs, dozen, box
	CurrentStock   float64    `json:"current_stock"`
	MinimumStock   float64    `json:"minimum_stock"`
	MaximumStock   float64    `json:"maximum_stock"`
	UnitCost       float64    `json:"unit_cost"` // Cost per unit in IDR
	Supplier       *string    `json:"supplier"`
	LastRestockedAt *time.Time `json:"last_restocked_at"`
	IsActive       bool       `json:"is_active"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// ProductIngredient represents the recipe relationship between a product and its ingredients
type ProductIngredient struct {
	ID               uuid.UUID  `json:"id"`
	ProductID        uuid.UUID  `json:"product_id"`
	IngredientID     uuid.UUID  `json:"ingredient_id"`
	QuantityRequired float64    `json:"quantity_required"` // Amount of ingredient per product unit
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	// Expanded fields (populated via JOIN)
	IngredientName   string     `json:"ingredient_name,omitempty"`
	IngredientUnit   string     `json:"ingredient_unit,omitempty"`
	CurrentStock     float64    `json:"current_stock,omitempty"`
}

// IngredientHistory represents an audit record of ingredient stock changes
type IngredientHistory struct {
	ID            uuid.UUID  `json:"id"`
	IngredientID  uuid.UUID  `json:"ingredient_id"`
	OrderID       *uuid.UUID `json:"order_id,omitempty"` // Reference to order for consumption/cancellation
	Operation     string     `json:"operation"`          // add, remove, restock, usage, spoilage, adjustment, order_consumption, order_cancellation
	Quantity      float64    `json:"quantity"`
	PreviousStock float64    `json:"previous_stock"`
	NewStock      float64    `json:"new_stock"`
	Reason        *string    `json:"reason"`
	Notes         *string    `json:"notes"`
	AdjustedBy    *uuid.UUID `json:"adjusted_by"`
	CreatedAt     time.Time  `json:"created_at"`
	// Expanded fields
	AdjustedByUser *User `json:"adjusted_by_user,omitempty"`
}

// Recipe DTOs

// AddRecipeIngredientRequest is the DTO for adding an ingredient to a product's recipe
type AddRecipeIngredientRequest struct {
	IngredientID     uuid.UUID `json:"ingredient_id" binding:"required"`
	QuantityRequired float64   `json:"quantity_required" binding:"required,gt=0"`
}

// UpdateRecipeIngredientRequest is the DTO for updating ingredient quantity in a recipe
type UpdateRecipeIngredientRequest struct {
	QuantityRequired float64 `json:"quantity_required" binding:"required,gt=0"`
}

// RecipeResponse is the DTO for returning a product's recipe
type RecipeResponse struct {
	ProductID   uuid.UUID           `json:"product_id"`
	ProductName string              `json:"product_name"`
	Ingredients []ProductIngredient `json:"ingredients"`
}

// BulkRecipeRequest is the DTO for bulk updating multiple product recipes
type BulkRecipeRequest struct {
	Recipes []BulkRecipeItem `json:"recipes" binding:"required"`
}

// BulkRecipeItem represents a single product's recipe in bulk update
type BulkRecipeItem struct {
	ProductID   uuid.UUID                    `json:"product_id" binding:"required"`
	Ingredients []AddRecipeIngredientRequest `json:"ingredients" binding:"required"`
}

// BulkRecipeResponse is the DTO for bulk recipe update results
type BulkRecipeResponse struct {
	UpdatedCount int                  `json:"updated_count"`
	FailedCount  int                  `json:"failed_count"`
	Errors       []BulkRecipeError    `json:"errors,omitempty"`
}

// BulkRecipeError represents an error in bulk recipe update
type BulkRecipeError struct {
	ProductID uuid.UUID `json:"product_id"`
	Error     string    `json:"error"`
}

// IngredientUsageReport is the DTO for ingredient usage analytics
type IngredientUsageReport struct {
	Period      UsageReportPeriod       `json:"period"`
	Ingredients []IngredientUsageItem   `json:"ingredients"`
}

// UsageReportPeriod represents the time period for usage reports
type UsageReportPeriod struct {
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
}

// IngredientUsageItem represents usage data for a single ingredient
type IngredientUsageItem struct {
	IngredientID   uuid.UUID `json:"ingredient_id"`
	IngredientName string    `json:"ingredient_name"`
	Unit           string    `json:"unit"`
	TotalUsed      float64   `json:"total_used"`
	TotalCost      float64   `json:"total_cost"` // in IDR
	OrderCount     int       `json:"order_count"`
}
