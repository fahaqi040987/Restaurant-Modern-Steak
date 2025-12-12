package models

import (
	"time"

	"github.com/google/uuid"
)

// RestaurantInfo represents the singleton restaurant configuration
type RestaurantInfo struct {
	ID            uuid.UUID  `json:"id"`
	Name          string     `json:"name"`
	Tagline       *string    `json:"tagline"`
	Description   *string    `json:"description"`
	Address       string     `json:"address"`
	City          *string    `json:"city"`
	PostalCode    *string    `json:"postal_code"`
	Country       *string    `json:"country"`
	Phone         string     `json:"phone"`
	Email         string     `json:"email"`
	WhatsApp      *string    `json:"whatsapp"`
	MapLatitude   *float64   `json:"map_latitude"`
	MapLongitude  *float64   `json:"map_longitude"`
	GoogleMapsURL *string    `json:"google_maps_url"`
	InstagramURL  *string    `json:"instagram_url"`
	FacebookURL   *string    `json:"facebook_url"`
	TwitterURL    *string    `json:"twitter_url"`
	LogoURL       *string    `json:"logo_url"`
	HeroImageURL  *string    `json:"hero_image_url"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// OperatingHours represents the operating hours for a specific day of the week
type OperatingHours struct {
	ID               uuid.UUID `json:"id"`
	RestaurantInfoID uuid.UUID `json:"restaurant_info_id"`
	DayOfWeek        int       `json:"day_of_week"` // 0=Sunday, 1=Monday, ..., 6=Saturday
	OpenTime         string    `json:"open_time"`   // Format: HH:MM:SS
	CloseTime        string    `json:"close_time"`  // Format: HH:MM:SS
	IsClosed         bool      `json:"is_closed"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// ContactSubmission represents a contact form submission from the public website
type ContactSubmission struct {
	ID        uuid.UUID  `json:"id"`
	Name      string     `json:"name"`
	Email     string     `json:"email"`
	Phone     *string    `json:"phone"`
	Subject   string     `json:"subject"`
	Message   string     `json:"message"`
	IsRead    bool       `json:"is_read"`
	ReadAt    *time.Time `json:"read_at"`
	CreatedAt time.Time  `json:"created_at"`
}

// RestaurantInfoResponse is the DTO for public API response including operating hours
type RestaurantInfoResponse struct {
	ID             uuid.UUID        `json:"id"`
	Name           string           `json:"name"`
	Tagline        *string          `json:"tagline"`
	Description    *string          `json:"description"`
	Address        string           `json:"address"`
	City           *string          `json:"city"`
	PostalCode     *string          `json:"postal_code"`
	Country        *string          `json:"country"`
	Phone          string           `json:"phone"`
	Email          string           `json:"email"`
	WhatsApp       *string          `json:"whatsapp"`
	MapLatitude    *float64         `json:"map_latitude"`
	MapLongitude   *float64         `json:"map_longitude"`
	GoogleMapsURL  *string          `json:"google_maps_url"`
	InstagramURL   *string          `json:"instagram_url"`
	FacebookURL    *string          `json:"facebook_url"`
	TwitterURL     *string          `json:"twitter_url"`
	LogoURL        *string          `json:"logo_url"`
	HeroImageURL   *string          `json:"hero_image_url"`
	IsOpenNow      bool             `json:"is_open_now"`
	OperatingHours []OperatingHours `json:"operating_hours"`
}

// PublicMenuItem is the DTO for menu items displayed on the public website
type PublicMenuItem struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Description  *string   `json:"description"`
	Price        float64   `json:"price"`
	ImageURL     *string   `json:"image_url"`
	CategoryID   uuid.UUID `json:"category_id"`
	CategoryName string    `json:"category_name"`
}

// ContactFormRequest is the request DTO for contact form submissions
type ContactFormRequest struct {
	Name    string  `json:"name"`
	Email   string  `json:"email"`
	Phone   *string `json:"phone"`
	Subject string  `json:"subject"`
	Message string  `json:"message"`
}

// IsValidDayOfWeek validates that the day is between 0 (Sunday) and 6 (Saturday)
func IsValidDayOfWeek(day int) bool {
	return day >= 0 && day <= 6
}

// IsOpenAt checks if the restaurant is open at a specific time for this operating hours entry
func (oh *OperatingHours) IsOpenAt(t time.Time) bool {
	if oh.IsClosed {
		return false
	}

	// Parse open and close times
	openTime, err := time.Parse("15:04:05", oh.OpenTime)
	if err != nil {
		return false
	}

	closeTime, err := time.Parse("15:04:05", oh.CloseTime)
	if err != nil {
		return false
	}

	// Get the time portion of the check time
	checkHour := t.Hour()
	checkMin := t.Minute()
	checkSec := t.Second()

	openHour := openTime.Hour()
	openMin := openTime.Minute()
	openSec := openTime.Second()

	closeHour := closeTime.Hour()
	closeMin := closeTime.Minute()
	closeSec := closeTime.Second()

	// Convert to seconds for easier comparison
	checkSeconds := checkHour*3600 + checkMin*60 + checkSec
	openSeconds := openHour*3600 + openMin*60 + openSec
	closeSeconds := closeHour*3600 + closeMin*60 + closeSec

	return checkSeconds >= openSeconds && checkSeconds < closeSeconds
}

// CalculateIsOpenNow determines if the restaurant is currently open based on operating hours
func CalculateIsOpenNow(hours []OperatingHours, checkTime time.Time) bool {
	dayOfWeek := int(checkTime.Weekday())

	for _, h := range hours {
		if h.DayOfWeek == dayOfWeek {
			return h.IsOpenAt(checkTime)
		}
	}

	return false
}

// GetDayName returns the name of the day for a given day of week number
func GetDayName(day int) string {
	days := []string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}
	if day >= 0 && day < len(days) {
		return days[day]
	}
	return ""
}
