-- Migration: Add missing system settings
-- This migration adds all settings required by the admin settings UI

-- Restaurant settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('default_language', 'id-ID', 'string', 'Default interface language', 'restaurant')
ON CONFLICT (setting_key) DO NOTHING;

-- Financial settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('tax_calculation_method', 'exclusive', 'string', 'Tax calculation method: exclusive or inclusive', 'financial')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('enable_rounding', 'false', 'boolean', 'Round total to nearest value', 'financial')
ON CONFLICT (setting_key) DO NOTHING;

-- Receipt settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('paper_size', '80mm', 'string', 'Receipt paper size: 58mm or 80mm', 'receipt')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('show_logo', 'true', 'boolean', 'Show logo on receipt', 'receipt')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('auto_print_customer_copy', 'false', 'boolean', 'Auto print customer copy', 'receipt')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('printer_name', '', 'string', 'System printer name', 'receipt')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('print_copies', '1', 'number', 'Number of receipt copies', 'receipt')
ON CONFLICT (setting_key) DO NOTHING;

-- Kitchen printer settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('kitchen_paper_size', '80mm', 'string', 'Kitchen ticket paper size', 'kitchen')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('auto_print_kitchen', 'true', 'boolean', 'Auto print to kitchen on new order', 'kitchen')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('show_prices_kitchen', 'false', 'boolean', 'Show prices on kitchen tickets', 'kitchen')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('kitchen_print_categories', 'false', 'boolean', 'Print separate tickets by category', 'kitchen')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('kitchen_urgent_time', '20', 'number', 'Minutes before order is marked urgent', 'kitchen')
ON CONFLICT (setting_key) DO NOTHING;

-- System settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('data_retention_days', '365', 'number', 'Days to retain data before auto cleanup', 'system')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('low_stock_threshold', '10', 'number', 'Low stock notification threshold', 'system')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category)
VALUES ('enable_audit_logging', 'true', 'boolean', 'Enable audit logging for all actions', 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- Update currency category to restaurant (was incorrectly set to financial)
UPDATE system_settings SET category = 'restaurant' WHERE setting_key = 'currency' AND category = 'financial';
