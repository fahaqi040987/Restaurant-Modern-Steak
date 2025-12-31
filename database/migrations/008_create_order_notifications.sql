-- Migration: Create order notifications table for customer QR ordering
-- T077: Order notification system
-- Feature: 004-restaurant-management (Phase 11)
-- Purpose: Notify customers when their order status changes (especially when ready for pickup)

-- Create order_notifications table
CREATE TABLE IF NOT EXISTS order_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for efficient querying
    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_order_notifications_order_id ON order_notifications(order_id);
CREATE INDEX idx_order_notifications_status ON order_notifications(status);
CREATE INDEX idx_order_notifications_is_read ON order_notifications(is_read);
CREATE INDEX idx_order_notifications_created_at ON order_notifications(created_at DESC);

-- Comment on table and columns
COMMENT ON TABLE order_notifications IS 'Customer notifications for order status changes';
COMMENT ON COLUMN order_notifications.order_id IS 'Reference to the order';
COMMENT ON COLUMN order_notifications.status IS 'Order status at the time of notification (preparing, ready, completed)';
COMMENT ON COLUMN order_notifications.message IS 'Customer-facing notification message';
COMMENT ON COLUMN order_notifications.is_read IS 'Whether customer has acknowledged the notification';
