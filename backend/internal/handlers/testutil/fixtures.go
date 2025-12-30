package testutil

import (
	"time"

	"github.com/google/uuid"
)

// Test UUIDs - consistent for reproducible tests
// Note: UUIDs must contain only valid hex digits (0-9, a-f)
var (
	TestUserID1      = "11111111-1111-1111-1111-111111111111"
	TestUserID2      = "22222222-2222-2222-2222-222222222222"
	TestAdminID      = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	TestManagerID    = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
	TestServerID     = "cccccccc-cccc-cccc-cccc-cccccccccccc"
	TestCounterID    = "dddddddd-dddd-dddd-dddd-dddddddddddd"
	TestKitchenID    = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"
	TestProductID1   = "11111111-2222-3333-4444-555555555555"
	TestProductID2   = "22222222-3333-4444-5555-666666666666"
	TestCategoryID1  = "aaaa1111-2222-3333-4444-555555555555"
	TestCategoryID2  = "bbbb1111-2222-3333-4444-555555555555"
	TestOrderID1     = "00001111-2222-3333-4444-555555555555"
	TestOrderID2     = "00002222-3333-4444-5555-666666666666"
	TestTableID1     = "11110000-2222-3333-4444-555555555555"
	TestTableID2     = "22220000-3333-4444-5555-666666666666"
	TestPaymentID1   = "99991111-2222-3333-4444-555555555555"
	TestContactID1   = "c0001111-2222-3333-4444-555555555555"
	TestInventoryID1 = "11111111-2222-3333-4444-111111111111"
)

// NewUUID generates a new UUID string
func NewUUID() string {
	return uuid.New().String()
}

// User represents a test user fixture
type User struct {
	ID        string
	Username  string
	Email     string
	FirstName string
	LastName  string
	Role      string
	IsActive  bool
	Password  string // bcrypt hashed
	CreatedAt time.Time
	UpdatedAt time.Time
}

// DefaultUsers returns a set of test users for each role
func DefaultUsers() map[string]User {
	now := TimeNow()
	// bcrypt hash of "admin123" (cost 10)
	hashedPassword := "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

	return map[string]User{
		"admin": {
			ID:        TestAdminID,
			Username:  "admin",
			Email:     "admin@steakkenangan.com",
			FirstName: "System",
			LastName:  "Admin",
			Role:      "admin",
			IsActive:  true,
			Password:  hashedPassword,
			CreatedAt: now,
			UpdatedAt: now,
		},
		"manager": {
			ID:        TestManagerID,
			Username:  "manager1",
			Email:     "manager@steakkenangan.com",
			FirstName: "Store",
			LastName:  "Manager",
			Role:      "manager",
			IsActive:  true,
			Password:  hashedPassword,
			CreatedAt: now,
			UpdatedAt: now,
		},
		"server": {
			ID:        TestServerID,
			Username:  "server1",
			Email:     "server@steakkenangan.com",
			FirstName: "Server",
			LastName:  "Staff",
			Role:      "server",
			IsActive:  true,
			Password:  hashedPassword,
			CreatedAt: now,
			UpdatedAt: now,
		},
		"counter": {
			ID:        TestCounterID,
			Username:  "counter1",
			Email:     "counter@steakkenangan.com",
			FirstName: "Counter",
			LastName:  "Staff",
			Role:      "counter",
			IsActive:  true,
			Password:  hashedPassword,
			CreatedAt: now,
			UpdatedAt: now,
		},
		"kitchen": {
			ID:        TestKitchenID,
			Username:  "kitchen1",
			Email:     "kitchen@steakkenangan.com",
			FirstName: "Kitchen",
			LastName:  "Staff",
			Role:      "kitchen",
			IsActive:  true,
			Password:  hashedPassword,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}
}

// Category represents a test category fixture
type Category struct {
	ID          string
	Name        string
	Description string
	Color       string
	ImageURL    string
	SortOrder   int
	IsActive    bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// DefaultCategories returns test category fixtures
func DefaultCategories() []Category {
	now := TimeNow()
	return []Category{
		{
			ID:          TestCategoryID1,
			Name:        "Steak",
			Description: "Premium wagyu and beef steaks",
			Color:       "#8B4513",
			ImageURL:    "/images/steak.jpg",
			SortOrder:   1,
			IsActive:    true,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
		{
			ID:          TestCategoryID2,
			Name:        "Beverages",
			Description: "Drinks and refreshments",
			Color:       "#4169E1",
			ImageURL:    "/images/beverages.jpg",
			SortOrder:   2,
			IsActive:    true,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
	}
}

// Product represents a test product fixture
type Product struct {
	ID              string
	CategoryID      string
	Name            string
	Description     string
	Price           float64
	ImageURL        string
	Barcode         string
	SKU             string
	IsAvailable     bool
	PreparationTime int
	SortOrder       int
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// DefaultProducts returns test product fixtures
func DefaultProducts() []Product {
	now := TimeNow()
	return []Product{
		{
			ID:              TestProductID1,
			CategoryID:      TestCategoryID1,
			Name:            "Rendang Wagyu",
			Description:     "Premium wagyu with Indonesian rendang spices",
			Price:           185000,
			ImageURL:        "/images/rendang-wagyu.jpg",
			Barcode:         "8991234567890",
			SKU:             "STK-001",
			IsAvailable:     true,
			PreparationTime: 25,
			SortOrder:       1,
			CreatedAt:       now,
			UpdatedAt:       now,
		},
		{
			ID:              TestProductID2,
			CategoryID:      TestCategoryID2,
			Name:            "Es Teh Manis",
			Description:     "Sweet iced tea",
			Price:           15000,
			ImageURL:        "/images/es-teh.jpg",
			Barcode:         "8991234567891",
			SKU:             "BEV-001",
			IsAvailable:     true,
			PreparationTime: 5,
			SortOrder:       1,
			CreatedAt:       now,
			UpdatedAt:       now,
		},
	}
}

// DiningTable represents a test table fixture
type DiningTable struct {
	ID              string
	TableNumber     string
	SeatingCapacity int
	Location        string
	IsOccupied      bool
	QRCode          string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// DefaultTables returns test table fixtures
func DefaultTables() []DiningTable {
	now := TimeNow()
	return []DiningTable{
		{
			ID:              TestTableID1,
			TableNumber:     "T01",
			SeatingCapacity: 4,
			Location:        "Indoor",
			IsOccupied:      false,
			QRCode:          "qr-t01",
			CreatedAt:       now,
			UpdatedAt:       now,
		},
		{
			ID:              TestTableID2,
			TableNumber:     "T02",
			SeatingCapacity: 6,
			Location:        "Outdoor",
			IsOccupied:      true,
			QRCode:          "qr-t02",
			CreatedAt:       now,
			UpdatedAt:       now,
		},
	}
}

// Order represents a test order fixture
type Order struct {
	ID             string
	OrderNumber    string
	TableID        *string
	UserID         *string
	CustomerName   string
	OrderType      string
	Status         string
	Subtotal       float64
	TaxAmount      float64
	DiscountAmount float64
	TotalAmount    float64
	Notes          string
	CreatedAt      time.Time
	UpdatedAt      time.Time
	ServedAt       *time.Time
	CompletedAt    *time.Time
}

// DefaultOrders returns test order fixtures
func DefaultOrders() []Order {
	now := TimeNow()
	tableID := TestTableID1
	userID := TestServerID

	return []Order{
		{
			ID:             TestOrderID1,
			OrderNumber:    "ORD-20251227-0001",
			TableID:        &tableID,
			UserID:         &userID,
			CustomerName:   "Budi Santoso",
			OrderType:      "dine_in",
			Status:         "pending",
			Subtotal:       200000,
			TaxAmount:      22000,
			DiscountAmount: 0,
			TotalAmount:    222000,
			Notes:          "No onions please",
			CreatedAt:      now,
			UpdatedAt:      now,
		},
		{
			ID:             TestOrderID2,
			OrderNumber:    "ORD-20251227-0002",
			TableID:        nil,
			UserID:         &userID,
			CustomerName:   "Siti Rahayu",
			OrderType:      "takeout",
			Status:         "completed",
			Subtotal:       185000,
			TaxAmount:      20350,
			DiscountAmount: 0,
			TotalAmount:    205350,
			Notes:          "",
			CreatedAt:      now,
			UpdatedAt:      now,
		},
	}
}

// OrderItem represents a test order item fixture
type OrderItem struct {
	ID                  string
	OrderID             string
	ProductID           string
	Quantity            int
	UnitPrice           float64
	TotalPrice          float64
	SpecialInstructions string
	Status              string
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

// DefaultOrderItems returns test order item fixtures
func DefaultOrderItems() []OrderItem {
	now := TimeNow()
	return []OrderItem{
		{
			ID:                  NewUUID(),
			OrderID:             TestOrderID1,
			ProductID:           TestProductID1,
			Quantity:            1,
			UnitPrice:           185000,
			TotalPrice:          185000,
			SpecialInstructions: "Medium well",
			Status:              "pending",
			CreatedAt:           now,
			UpdatedAt:           now,
		},
		{
			ID:                  NewUUID(),
			OrderID:             TestOrderID1,
			ProductID:           TestProductID2,
			Quantity:            2,
			UnitPrice:           15000,
			TotalPrice:          30000,
			SpecialInstructions: "",
			Status:              "pending",
			CreatedAt:           now,
			UpdatedAt:           now,
		},
	}
}

// Payment represents a test payment fixture
type Payment struct {
	ID            string
	OrderID       string
	Amount        float64
	PaymentMethod string
	Status        string
	ReferenceNo   string
	PaidAt        *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// DefaultPayments returns test payment fixtures
func DefaultPayments() []Payment {
	now := TimeNow()
	return []Payment{
		{
			ID:            TestPaymentID1,
			OrderID:       TestOrderID2,
			Amount:        205350,
			PaymentMethod: "cash",
			Status:        "completed",
			ReferenceNo:   "PAY-20251227-0001",
			PaidAt:        &now,
			CreatedAt:     now,
			UpdatedAt:     now,
		},
	}
}

// Contact represents a test contact form submission fixture
type Contact struct {
	ID        string
	Name      string
	Email     string
	Phone     string
	Subject   string
	Message   string
	Status    string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// DefaultContacts returns test contact fixtures
func DefaultContacts() []Contact {
	now := TimeNow()
	return []Contact{
		{
			ID:        TestContactID1,
			Name:      "Test Customer",
			Email:     "customer@example.com",
			Phone:     "+6281234567890",
			Subject:   "Inquiry about reservation",
			Message:   "I would like to make a reservation for 10 people.",
			Status:    "pending",
			CreatedAt: now,
			UpdatedAt: now,
		},
	}
}

// LoginRequest represents a test login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// CreateOrderRequest represents a test order creation request
type CreateOrderRequest struct {
	TableID      *string           `json:"table_id,omitempty"`
	CustomerName string            `json:"customer_name,omitempty"`
	OrderType    string            `json:"order_type"`
	Items        []CreateOrderItem `json:"items"`
	Notes        string            `json:"notes,omitempty"`
}

// CreateOrderItem represents an item in order creation request
type CreateOrderItem struct {
	ProductID           string `json:"product_id"`
	Quantity            int    `json:"quantity"`
	SpecialInstructions string `json:"special_instructions,omitempty"`
}

// DefaultLoginRequest returns a valid login request
func DefaultLoginRequest() LoginRequest {
	return LoginRequest{
		Username: "admin",
		Password: "admin123",
	}
}

// DefaultCreateOrderRequest returns a valid order creation request
func DefaultCreateOrderRequest() CreateOrderRequest {
	tableID := TestTableID1
	return CreateOrderRequest{
		TableID:      &tableID,
		CustomerName: "Test Customer",
		OrderType:    "dine_in",
		Items: []CreateOrderItem{
			{
				ProductID:           TestProductID1,
				Quantity:            2,
				SpecialInstructions: "Medium rare",
			},
		},
		Notes: "Birthday celebration",
	}
}

// DefaultTakeoutOrderRequest returns a valid takeout order request
func DefaultTakeoutOrderRequest() CreateOrderRequest {
	return CreateOrderRequest{
		TableID:      nil,
		CustomerName: "Takeout Customer",
		OrderType:    "takeout",
		Items: []CreateOrderItem{
			{
				ProductID:           TestProductID1,
				Quantity:            1,
				SpecialInstructions: "",
			},
		},
		Notes: "",
	}
}
