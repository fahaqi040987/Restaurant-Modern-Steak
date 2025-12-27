-- System Settings and Notifications Tables

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    category VARCHAR(50), -- 'restaurant', 'financial', 'receipt', 'system'
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('order_update', 'low_stock', 'payment', 'system_alert', 'daily_report')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    types_enabled JSONB DEFAULT '{"order_update": true, "low_stock": true, "payment": true, "system_alert": true, "daily_report": true}'::jsonb,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    notification_email VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category) VALUES
('restaurant_name', 'Steak Kenangan', 'string', 'Restaurant name displayed in POS', 'restaurant'),
('currency', 'IDR', 'string', 'Currency code for transactions', 'financial'),
('tax_rate', '11.00', 'number', 'Indonesian VAT (PPN) percentage', 'financial'),
('service_charge', '5.00', 'number', 'Service charge percentage', 'financial'),
('receipt_header', 'Thank you for dining with us!', 'string', 'Text displayed at top of receipt', 'receipt'),
('receipt_footer', 'Visit again soon!', 'string', 'Text displayed at bottom of receipt', 'receipt'),
('backup_frequency', 'daily', 'string', 'Backup frequency: hourly, daily, weekly', 'system'),
('session_timeout', '30', 'number', 'Session timeout in minutes', 'system')
ON CONFLICT (setting_key) DO NOTHING;
