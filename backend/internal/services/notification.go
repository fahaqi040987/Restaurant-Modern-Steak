package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type NotificationService struct {
	db *sql.DB
}

func NewNotificationService(db *sql.DB) *NotificationService {
	return &NotificationService{db: db}
}

// CreateNotification creates a new notification for specified users
func (s *NotificationService) CreateNotification(userIDs []uuid.UUID, notifType, title, message string) error {
	if s.isQuietHours() {
		return nil
	}

	filteredUserIDs := s.filterUsersByPreferences(userIDs, notifType)
	if len(filteredUserIDs) == 0 {
		return nil
	}

	query := `INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES ($1, $2, $3, $4, false, NOW())`

	for _, userID := range filteredUserIDs {
		_, err := s.db.Exec(query, userID, notifType, title, message)
		if err != nil {
			return fmt.Errorf("failed to create notification for user %s: %v", userID, err)
		}
	}
	return nil
}

// CreateNotificationForRole creates notifications for all users with a specific role
func (s *NotificationService) CreateNotificationForRole(role, notifType, title, message string) error {
	query := `SELECT id FROM users WHERE role = $1 AND is_active = true`
	rows, err := s.db.Query(query, role)
	if err != nil {
		return fmt.Errorf("failed to fetch users by role: %v", err)
	}
	defer rows.Close()

	var userIDs []uuid.UUID
	for rows.Next() {
		var userID uuid.UUID
		if err := rows.Scan(&userID); err != nil {
			continue
		}
		userIDs = append(userIDs, userID)
	}

	if len(userIDs) == 0 {
		return nil
	}
	return s.CreateNotification(userIDs, notifType, title, message)
}

// isQuietHours checks if current time is within quiet hours
func (s *NotificationService) isQuietHours() bool {
	var quietHoursStart, quietHoursEnd string
	query := `SELECT COALESCE((SELECT setting_value FROM system_settings WHERE setting_key = 'quiet_hours_start'), '22:00'), COALESCE((SELECT setting_value FROM system_settings WHERE setting_key = 'quiet_hours_end'), '08:00')`
	err := s.db.QueryRow(query).Scan(&quietHoursStart, &quietHoursEnd)
	if err != nil {
		return false
	}

	now := time.Now()
	currentHour := now.Hour()

	startTime, err1 := time.Parse("15:04", quietHoursStart)
	endTime, err2 := time.Parse("15:04", quietHoursEnd)

	if err1 != nil || err2 != nil {
		return false
	}

	startHour := startTime.Hour()
	endHour := endTime.Hour()

	if startHour > endHour {
		return currentHour >= startHour || currentHour < endHour
	}
	return currentHour >= startHour && currentHour < endHour
}

// filterUsersByPreferences filters users based on their notification preferences
func (s *NotificationService) filterUsersByPreferences(userIDs []uuid.UUID, notifType string) []uuid.UUID {
	if len(userIDs) == 0 {
		return userIDs
	}

	prefColumn := "order_updates"
	switch notifType {
	case "order":
		prefColumn = "order_updates"
	case "inventory":
		prefColumn = "inventory_alerts"
	case "payment":
		prefColumn = "payment_notifications"
	case "system":
		prefColumn = "system_alerts"
	}

	query := fmt.Sprintf(`SELECT user_id FROM notification_preferences WHERE user_id = ANY($1) AND %s = true`, prefColumn)
	rows, err := s.db.Query(query, userIDs)
	if err != nil {
		return userIDs // Fail-open
	}
	defer rows.Close()

	var filteredIDs []uuid.UUID
	for rows.Next() {
		var userID uuid.UUID
		if err := rows.Scan(&userID); err != nil {
			continue
		}
		filteredIDs = append(filteredIDs, userID)
	}

	if len(filteredIDs) == 0 {
		return userIDs // Assume all want notifications if no preferences
	}
	return filteredIDs
}

// NotifyLowStock sends notification when stock is low
func (s *NotificationService) NotifyLowStock(productName string, currentStock, minStock int) error {
	title := "⚠️ Stok Menipis"
	message := fmt.Sprintf("%s tersisa %d (minimum: %d)", productName, currentStock, minStock)
	return s.CreateNotificationForRole("manager", "inventory", title, message)
}

// NotifyOrderCreated sends notification when a new order is created
func (s *NotificationService) NotifyOrderCreated(orderNumber, table string) error {
	title := fmt.Sprintf("Pesanan Baru #%s", orderNumber)
	message := fmt.Sprintf("Pesanan baru diterima untuk %s", table)
	return s.CreateNotificationForRole("kitchen", "order", title, message)
}

// NotifySystemAlert sends system-level notifications to admins
func (s *NotificationService) NotifySystemAlert(title, message string) error {
	return s.CreateNotificationForRole("admin", "system", title, message)
}
