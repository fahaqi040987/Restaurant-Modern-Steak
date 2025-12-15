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
