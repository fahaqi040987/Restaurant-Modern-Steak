-- Migration: Seed restaurant_info and operating_hours data
-- Description: Default restaurant configuration with Steak Kenangan branding

-- Insert default restaurant configuration
INSERT INTO restaurant_info (
    name,
    tagline,
    description,
    address,
    city,
    postal_code,
    country,
    phone,
    email,
    whatsapp,
    map_latitude,
    map_longitude,
    google_maps_url,
    instagram_url,
    facebook_url,
    twitter_url,
    logo_url,
    hero_image_url
) VALUES (
    'Steak Kenangan',
    'Where Tradition Meets Innovation',
    'Experience the finest cuts of premium steak prepared with modern culinary techniques. Our chefs combine time-honored traditions with innovative cooking methods to deliver an unforgettable dining experience. From dry-aged ribeyes to wagyu specialties, every dish is crafted with passion and precision.',
    'Jl. Sudirman No. 123, Senayan',
    'Jakarta Selatan',
    '12190',
    'Indonesia',
    '+62 21 1234 5678',
    'info@modernsteak.com',
    '+62 812 3456 7890',
    -6.2088,
    106.8456,
    'https://maps.google.com/?q=-6.2088,106.8456',
    'https://instagram.com/modernsteak',
    'https://facebook.com/modernsteak',
    'https://twitter.com/modernsteak',
    '/images/logo.png',
    '/images/hero-steak.jpg'
) ON CONFLICT DO NOTHING;

-- Insert operating hours for all 7 days (11:00 AM - 10:00 PM)
-- Sunday (0)
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 0, '11:00:00', '22:00:00', false
FROM restaurant_info
LIMIT 1
ON CONFLICT (restaurant_info_id, day_of_week) DO UPDATE SET open_time = '11:00:00', close_time = '22:00:00', is_closed = false;

-- Monday (1)
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 1, '11:00:00', '22:00:00', false
FROM restaurant_info
LIMIT 1
ON CONFLICT (restaurant_info_id, day_of_week) DO UPDATE SET open_time = '11:00:00', close_time = '22:00:00', is_closed = false;

-- Tuesday (2)
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 2, '11:00:00', '22:00:00', false
FROM restaurant_info
LIMIT 1
ON CONFLICT (restaurant_info_id, day_of_week) DO UPDATE SET open_time = '11:00:00', close_time = '22:00:00', is_closed = false;

-- Wednesday (3)
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 3, '11:00:00', '22:00:00', false
FROM restaurant_info
LIMIT 1
ON CONFLICT (restaurant_info_id, day_of_week) DO UPDATE SET open_time = '11:00:00', close_time = '22:00:00', is_closed = false;

-- Thursday (4)
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 4, '11:00:00', '22:00:00', false
FROM restaurant_info
LIMIT 1
ON CONFLICT (restaurant_info_id, day_of_week) DO UPDATE SET open_time = '11:00:00', close_time = '22:00:00', is_closed = false;

-- Friday (5)
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 5, '11:00:00', '22:00:00', false
FROM restaurant_info
LIMIT 1
ON CONFLICT (restaurant_info_id, day_of_week) DO UPDATE SET open_time = '11:00:00', close_time = '22:00:00', is_closed = false;

-- Saturday (6)
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 6, '11:00:00', '22:00:00', false
FROM restaurant_info
LIMIT 1
ON CONFLICT (restaurant_info_id, day_of_week) DO UPDATE SET open_time = '11:00:00', close_time = '22:00:00', is_closed = false;

-- Down Migration (for rollback)
-- DELETE FROM operating_hours WHERE restaurant_info_id = (SELECT id FROM restaurant_info LIMIT 1);
-- DELETE FROM restaurant_info;
