-- Seed default menu configuration for public website header
-- All menu items are enabled by default with empty maintenance text

INSERT INTO system_settings (setting_key, setting_value, setting_type, category, updated_by, updated_at)
VALUES (
  'public_menu_config',
  '[
    {"id":"home","enabled":true,"maintenanceText":""},
    {"id":"menu","enabled":true,"maintenanceText":""},
    {"id":"about","enabled":true,"maintenanceText":""},
    {"id":"reservation","enabled":true,"maintenanceText":""},
    {"id":"contact","enabled":true,"maintenanceText":""},
    {"id":"franchise","enabled":true,"maintenanceText":""}
  ]',
  'json',
  'general',
  'system',
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;
