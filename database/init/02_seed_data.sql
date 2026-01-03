-- Seed data for POS System

-- Insert default users
INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'Admin', 'User', 'admin'),
('manager1', 'manager@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'John', 'Manager', 'manager'),
('server1', 'server1@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'Sarah', 'Smith', 'server'),
('server2', 'server2@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'Mike', 'Johnson', 'server'),
('counter1', 'counter1@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'Lisa', 'Davis', 'counter'),
('counter2', 'counter2@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'Tom', 'Wilson', 'counter'),
('kitchen1', 'kitchen@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'Chef', 'Williams', 'kitchen');

-- NOTE: Categories and products are now defined in 03_indonesian_menu.sql
-- This file only contains users, tables, restaurant info, and operating hours

-- Insert dining tables
INSERT INTO dining_tables (table_number, seating_capacity, location, qr_code) VALUES
('T01', 2, 'Main Floor', 'table-t01'),
('T02', 4, 'Main Floor', 'table-t02'),
('T03', 4, 'Main Floor', 'table-t03'),
('T04', 6, 'Main Floor', 'table-t04'),
('T05', 2, 'Main Floor', 'table-t05'),
('T06', 4, 'Window Side', 'table-t06'),
('T07', 4, 'Window Side', 'table-t07'),
('T08', 8, 'Private Room', 'table-t08'),
('T09', 2, 'Patio', 'table-t09'),
('T10', 4, 'Patio', 'table-t10'),
('BAR01', 1, 'Bar Counter', 'table-bar01'),
('BAR02', 1, 'Bar Counter', 'table-bar02'),
('BAR03', 1, 'Bar Counter', 'table-bar03'),
('TAKEOUT', 1, 'Takeout Counter', 'table-takeout');

-- NOTE: Inventory is initialized after products are created in 03_indonesian_menu.sql
-- Sample orders can be created via the admin interface or test scripts

-- Insert default restaurant configuration (Steak Kenangan branding)
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
    'info@steakkenangan.com',
    '+62 812 3456 7890',
    -6.2088,
    106.8456,
    'https://maps.google.com/?q=-6.2088,106.8456',
    'https://instagram.com/steakkenangan',
    'https://facebook.com/steakkenangan',
    'https://twitter.com/steakkenangan',
    '/assets/restoran/images/LogoSteakKenangan.png',
    '/assets/restoran/images/banner_landing_page.jpg'
);

-- Insert operating hours for all 7 days
-- Sunday (0) - Closed
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 0, '10:00:00', '20:00:00', true FROM restaurant_info LIMIT 1;

-- Monday (1)
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 1, '11:00:00', '22:00:00', false FROM restaurant_info LIMIT 1;

-- Tuesday (2)
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 2, '11:00:00', '22:00:00', false FROM restaurant_info LIMIT 1;

-- Wednesday (3)
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 3, '11:00:00', '22:00:00', false FROM restaurant_info LIMIT 1;

-- Thursday (4)
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 4, '11:00:00', '22:00:00', false FROM restaurant_info LIMIT 1;

-- Friday (5) - Extended hours
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 5, '11:00:00', '23:00:00', false FROM restaurant_info LIMIT 1;

-- Saturday (6) - Extended hours, earlier opening
INSERT INTO operating_hours (restaurant_info_id, day_of_week, open_time, close_time, is_closed)
SELECT id, 6, '10:00:00', '23:00:00', false FROM restaurant_info LIMIT 1;
