package models

import (
	"testing"
	"time"
)

// TestRestaurantInfoCreation tests RestaurantInfo model with required fields
func TestRestaurantInfoCreation(t *testing.T) {
	info := RestaurantInfo{
		Name:    "Modern Steak",
		Address: "123 Main Street",
		Phone:   "+62 21 1234 5678",
		Email:   "info@modernsteak.com",
	}

	if info.Name != "Modern Steak" {
		t.Errorf("expected name 'Modern Steak', got '%s'", info.Name)
	}
	if info.Address != "123 Main Street" {
		t.Errorf("expected address '123 Main Street', got '%s'", info.Address)
	}
	if info.Phone != "+62 21 1234 5678" {
		t.Errorf("expected phone '+62 21 1234 5678', got '%s'", info.Phone)
	}
	if info.Email != "info@modernsteak.com" {
		t.Errorf("expected email 'info@modernsteak.com', got '%s'", info.Email)
	}
}

// TestOperatingHoursDayOfWeekValidation tests OperatingHours day-of-week validation
func TestOperatingHoursDayOfWeekValidation(t *testing.T) {
	validDays := []int{0, 1, 2, 3, 4, 5, 6}

	for _, day := range validDays {
		if !IsValidDayOfWeek(day) {
			t.Errorf("day %d should be valid", day)
		}
	}

	invalidDays := []int{-1, 7, 8, 100}
	for _, day := range invalidDays {
		if IsValidDayOfWeek(day) {
			t.Errorf("day %d should be invalid", day)
		}
	}
}

// TestContactSubmissionCreation tests ContactSubmission model for storing contact form data
func TestContactSubmissionCreation(t *testing.T) {
	submission := ContactSubmission{
		Name:    "John Doe",
		Email:   "john@example.com",
		Subject: "General Inquiry",
		Message: "I have a question about your restaurant.",
		IsRead:  false,
	}

	if submission.Name != "John Doe" {
		t.Errorf("expected name 'John Doe', got '%s'", submission.Name)
	}
	if submission.Email != "john@example.com" {
		t.Errorf("expected email 'john@example.com', got '%s'", submission.Email)
	}
	if submission.Subject != "General Inquiry" {
		t.Errorf("expected subject 'General Inquiry', got '%s'", submission.Subject)
	}
	if submission.IsRead != false {
		t.Errorf("expected is_read to be false")
	}
}

// TestIsOpenNowCalculation tests "Open Now" calculation logic based on current time and operating hours
func TestIsOpenNowCalculation(t *testing.T) {
	tests := []struct {
		name        string
		hours       OperatingHours
		checkTime   time.Time
		expected    bool
	}{
		{
			name: "Open during business hours",
			hours: OperatingHours{
				DayOfWeek: 1, // Monday
				OpenTime:  "09:00:00",
				CloseTime: "22:00:00",
				IsClosed:  false,
			},
			checkTime: time.Date(2024, 1, 1, 14, 0, 0, 0, time.UTC), // Monday 2pm
			expected:  true,
		},
		{
			name: "Closed before opening",
			hours: OperatingHours{
				DayOfWeek: 1,
				OpenTime:  "09:00:00",
				CloseTime: "22:00:00",
				IsClosed:  false,
			},
			checkTime: time.Date(2024, 1, 1, 8, 0, 0, 0, time.UTC), // Monday 8am
			expected:  false,
		},
		{
			name: "Closed after closing time",
			hours: OperatingHours{
				DayOfWeek: 1,
				OpenTime:  "09:00:00",
				CloseTime: "22:00:00",
				IsClosed:  false,
			},
			checkTime: time.Date(2024, 1, 1, 23, 0, 0, 0, time.UTC), // Monday 11pm
			expected:  false,
		},
		{
			name: "Closed on closed day",
			hours: OperatingHours{
				DayOfWeek: 0, // Sunday
				OpenTime:  "09:00:00",
				CloseTime: "22:00:00",
				IsClosed:  true,
			},
			checkTime: time.Date(2024, 1, 7, 14, 0, 0, 0, time.UTC), // Sunday 2pm
			expected:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.hours.IsOpenAt(tt.checkTime)
			if result != tt.expected {
				t.Errorf("expected %v, got %v", tt.expected, result)
			}
		})
	}
}

// TestCalculateIsOpenNow tests the function that determines if restaurant is currently open
func TestCalculateIsOpenNow(t *testing.T) {
	hours := []OperatingHours{
		{DayOfWeek: 0, OpenTime: "10:00:00", CloseTime: "20:00:00", IsClosed: true},  // Sunday - closed
		{DayOfWeek: 1, OpenTime: "11:00:00", CloseTime: "22:00:00", IsClosed: false}, // Monday
		{DayOfWeek: 2, OpenTime: "11:00:00", CloseTime: "22:00:00", IsClosed: false}, // Tuesday
		{DayOfWeek: 3, OpenTime: "11:00:00", CloseTime: "22:00:00", IsClosed: false}, // Wednesday
		{DayOfWeek: 4, OpenTime: "11:00:00", CloseTime: "22:00:00", IsClosed: false}, // Thursday
		{DayOfWeek: 5, OpenTime: "11:00:00", CloseTime: "23:00:00", IsClosed: false}, // Friday
		{DayOfWeek: 6, OpenTime: "10:00:00", CloseTime: "23:00:00", IsClosed: false}, // Saturday
	}

	// Test Monday at 12pm (should be open)
	mondayNoon := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
	if !CalculateIsOpenNow(hours, mondayNoon) {
		t.Errorf("expected open on Monday at 12pm")
	}

	// Test Sunday at 2pm (should be closed)
	sundayAfternoon := time.Date(2024, 1, 7, 14, 0, 0, 0, time.UTC)
	if CalculateIsOpenNow(hours, sundayAfternoon) {
		t.Errorf("expected closed on Sunday")
	}
}
