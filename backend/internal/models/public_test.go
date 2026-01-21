package models

import (
	"testing"
	"time"
)

// TestRestaurantInfoCreation tests RestaurantInfo model with required fields
func TestRestaurantInfoCreation(t *testing.T) {
	info := RestaurantInfo{
		Name:    "Steak Kenangan",
		Address: "Jl. Jenderal Sudirman No. 123",
		Phone:   "+62 21 1234 5678",
		Email:   "customercare@steakkenangan.com",
	}

	if info.Name != "Steak Kenangan" {
		t.Errorf("expected name 'Steak Kenangan', got '%s'", info.Name)
	}
	if info.Address != "Jl. Jenderal Sudirman No. 123" {
		t.Errorf("expected address 'Jl. Jenderal Sudirman No. 123', got '%s'", info.Address)
	}
	if info.Phone != "+62 21 1234 5678" {
		t.Errorf("expected phone '+62 21 1234 5678', got '%s'", info.Phone)
	}
	if info.Email != "customercare@steakkenangan.com" {
		t.Errorf("expected email 'customercare@steakkenangan.com', got '%s'", info.Email)
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
		name      string
		hours     OperatingHours
		checkTime time.Time
		expected  bool
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

// TestCalculateIsOpenNowWithTimezone tests timezone-aware open/closed calculation
func TestCalculateIsOpenNowWithTimezone(t *testing.T) {
	hours := []OperatingHours{
		{DayOfWeek: 1, OpenTime: "11:00:00", CloseTime: "22:00:00", IsClosed: false}, // Monday
	}

	// Test timezone conversion: UTC 04:00 = 11:00 WIB (Asia/Jakarta, UTC+7)
	// Restaurant opens at 11:00 WIB, so it should be open at 04:00 UTC
	jakartaLocation, _ := time.LoadLocation("Asia/Jakarta")
	utcTime := time.Date(2024, 1, 1, 4, 0, 0, 0, time.UTC)
	jakartaTime := utcTime.In(jakartaLocation)

	// At 04:00 UTC it's 11:00 in Jakarta (should be open)
	if !CalculateIsOpenNow(hours, jakartaTime) {
		t.Errorf("expected open at 11:00 WIB (04:00 UTC)")
	}

	// Test timezone conversion: UTC 03:00 = 10:00 WIB (Asia/Jakarta, UTC+7)
	// Restaurant opens at 11:00 WIB, so it should be closed at 03:00 UTC
	utcTime2 := time.Date(2024, 1, 1, 3, 0, 0, 0, time.UTC)
	jakartaTime2 := utcTime2.In(jakartaLocation)

	if CalculateIsOpenNow(hours, jakartaTime2) {
		t.Errorf("expected closed at 10:00 WIB (03:00 UTC)")
	}
}

// TestCalculateIsOpenNowEdgeCases tests edge cases for opening hours calculation
func TestCalculateIsOpenNowEdgeCases(t *testing.T) {
	// Test Wednesday hours: 11:00 - 22:00
	hours := []OperatingHours{
		{DayOfWeek: 0, OpenTime: "10:00:00", CloseTime: "20:00:00", IsClosed: true},  // Sunday - closed
		{DayOfWeek: 1, OpenTime: "11:00:00", CloseTime: "22:00:00", IsClosed: false}, // Monday
		{DayOfWeek: 2, OpenTime: "11:00:00", CloseTime: "22:00:00", IsClosed: false}, // Tuesday
		{DayOfWeek: 3, OpenTime: "11:00:00", CloseTime: "22:00:00", IsClosed: false}, // Wednesday
		{DayOfWeek: 4, OpenTime: "11:00:00", CloseTime: "22:00:00", IsClosed: false}, // Thursday
		{DayOfWeek: 5, OpenTime: "11:00:00", CloseTime: "23:00:00", IsClosed: false}, // Friday
		{DayOfWeek: 6, OpenTime: "10:00:00", CloseTime: "23:00:00", IsClosed: false}, // Saturday
	}

	jakartaLocation, _ := time.LoadLocation("Asia/Jakarta")

	tests := []struct {
		name          string
		year          int
		month         time.Month
		day           int
		hour          int
		minute        int
		second        int
		expectedOpen  bool
		description   string
	}{
		{
			name:         "Wednesday 22:31 WIB - after close",
			year:         2026, month: time.January, day: 21,
			hour: 22, minute: 31, second: 6,
			expectedOpen: false,
			description:  "Production issue: Wednesday 22:31 WIB should be CLOSED (closes at 22:00)",
		},
		{
			name:         "Wednesday 22:00:00 WIB - exactly close time",
			year:         2026, month: time.January, day: 21,
			hour: 22, minute: 0, second: 0,
			expectedOpen: false,
			description:  "At close time (22:00:00) should be CLOSED",
		},
		{
			name:         "Wednesday 21:59:59 WIB - one second before close",
			year:         2026, month: time.January, day: 21,
			hour: 21, minute: 59, second: 59,
			expectedOpen: true,
			description:  "One second before close should be OPEN",
		},
		{
			name:         "Wednesday 11:00:00 WIB - exactly open time",
			year:         2026, month: time.January, day: 21,
			hour: 11, minute: 0, second: 0,
			expectedOpen: true,
			description:  "At open time (11:00:00) should be OPEN",
		},
		{
			name:         "Wednesday 10:59:59 WIB - one second before open",
			year:         2026, month: time.January, day: 21,
			hour: 10, minute: 59, second: 59,
			expectedOpen: false,
			description:  "One second before open should be CLOSED",
		},
		{
			name:         "Wednesday 15:00:00 WIB - midday",
			year:         2026, month: time.January, day: 21,
			hour: 15, minute: 0, second: 0,
			expectedOpen: true,
			description:  "Midday Wednesday should be OPEN",
		},
		{
			name:         "Sunday 14:00:00 WIB - closed day",
			year:         2026, month: time.January, day: 18,
			hour: 14, minute: 0, second: 0,
			expectedOpen: false,
			description:  "Sunday should be CLOSED regardless of time",
		},
		{
			name:         "Friday 22:30:00 WIB - before extended close",
			year:         2026, month: time.January, day: 23,
			hour: 22, minute: 30, second: 0,
			expectedOpen: true,
			description:  "Friday 22:30 should be OPEN (closes at 23:00)",
		},
		{
			name:         "Friday 23:00:00 WIB - Friday extended close",
			year:         2026, month: time.January, day: 23,
			hour: 23, minute: 0, second: 0,
			expectedOpen: false,
			description:  "Friday 23:00 should be CLOSED",
		},
		{
			name:         "Saturday 09:59:59 WIB - before early opening",
			year:         2026, month: time.January, day: 24,
			hour: 9, minute: 59, second: 59,
			expectedOpen: false,
			description:  "Saturday before 10:00 should be CLOSED",
		},
		{
			name:         "Saturday 10:00:00 WIB - early opening",
			year:         2026, month: time.January, day: 24,
			hour: 10, minute: 0, second: 0,
			expectedOpen: true,
			description:  "Saturday 10:00 should be OPEN (opens early at 10:00)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			testTime := time.Date(tt.year, tt.month, tt.day, tt.hour, tt.minute, tt.second, 0, jakartaLocation)
			result := CalculateIsOpenNow(hours, testTime)

			if result != tt.expectedOpen {
				t.Errorf("%s: got %v, want %v. %s",
					tt.name,
					result,
					tt.expectedOpen,
					tt.description)
			}
		})
	}
}
