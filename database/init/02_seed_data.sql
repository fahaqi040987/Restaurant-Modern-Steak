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

-- Insert categories
INSERT INTO categories (name, description, color, sort_order) VALUES
('Appetizers', 'Starter dishes and small plates', '#FF6B6B', 1),
('Main Courses', 'Primary dishes and entrees', '#4ECDC4', 2),
('Beverages', 'Drinks, sodas, and refreshments', '#45B7D1', 3),
('Desserts', 'Sweet treats and desserts', '#96CEB4', 4),
('Salads', 'Fresh salads and healthy options', '#FECA57', 5),
('Pizza', 'Various pizza options', '#FF9FF3', 6);

-- Insert products
INSERT INTO products (category_id, name, description, price, sku, preparation_time, sort_order) VALUES
-- Appetizers
((SELECT id FROM categories WHERE name = 'Appetizers'), 'Buffalo Wings', 'Crispy chicken wings with buffalo sauce', 12.99, 'APP001', 15, 1),
((SELECT id FROM categories WHERE name = 'Appetizers'), 'Mozzarella Sticks', 'Breaded mozzarella with marinara sauce', 8.99, 'APP002', 10, 2),
((SELECT id FROM categories WHERE name = 'Appetizers'), 'Nachos Supreme', 'Tortilla chips with cheese, jalapeños, and toppings', 11.49, 'APP003', 12, 3),
((SELECT id FROM categories WHERE name = 'Appetizers'), 'Onion Rings', 'Crispy beer-battered onion rings', 7.99, 'APP004', 8, 4),

-- Main Courses
((SELECT id FROM categories WHERE name = 'Main Courses'), 'Grilled Chicken Breast', 'Seasoned grilled chicken with vegetables', 18.99, 'MAIN001', 20, 1),
((SELECT id FROM categories WHERE name = 'Main Courses'), 'Beef Steak', 'Premium cut beef steak cooked to order', 26.99, 'MAIN002', 25, 2),
((SELECT id FROM categories WHERE name = 'Main Courses'), 'Fish & Chips', 'Beer battered fish with crispy fries', 16.99, 'MAIN003', 18, 3),
((SELECT id FROM categories WHERE name = 'Main Courses'), 'Pasta Carbonara', 'Creamy pasta with bacon and parmesan', 15.99, 'MAIN004', 15, 4),
((SELECT id FROM categories WHERE name = 'Main Courses'), 'BBQ Ribs', 'Slow-cooked ribs with BBQ sauce', 22.99, 'MAIN005', 30, 5),

-- Beverages
((SELECT id FROM categories WHERE name = 'Beverages'), 'Coca Cola', 'Classic cola soft drink', 2.99, 'BEV001', 0, 1),
((SELECT id FROM categories WHERE name = 'Beverages'), 'Fresh Orange Juice', 'Freshly squeezed orange juice', 4.99, 'BEV002', 2, 2),
((SELECT id FROM categories WHERE name = 'Beverages'), 'Coffee', 'Freshly brewed coffee', 3.49, 'BEV003', 3, 3),
((SELECT id FROM categories WHERE name = 'Beverages'), 'Iced Tea', 'Refreshing iced tea', 2.99, 'BEV004', 1, 4),
((SELECT id FROM categories WHERE name = 'Beverages'), 'Milkshake - Vanilla', 'Creamy vanilla milkshake', 5.99, 'BEV005', 4, 5),

-- Desserts
((SELECT id FROM categories WHERE name = 'Desserts'), 'Chocolate Cake', 'Rich chocolate cake with frosting', 6.99, 'DES001', 5, 1),
((SELECT id FROM categories WHERE name = 'Desserts'), 'Apple Pie', 'Classic apple pie with cinnamon', 5.99, 'DES002', 8, 2),
((SELECT id FROM categories WHERE name = 'Desserts'), 'Ice Cream Sundae', 'Vanilla ice cream with toppings', 4.99, 'DES003', 3, 3),
((SELECT id FROM categories WHERE name = 'Desserts'), 'Cheesecake', 'New York style cheesecake', 7.99, 'DES004', 5, 4),

-- Salads
((SELECT id FROM categories WHERE name = 'Salads'), 'Caesar Salad', 'Romaine lettuce with caesar dressing', 9.99, 'SAL001', 8, 1),
((SELECT id FROM categories WHERE name = 'Salads'), 'Greek Salad', 'Fresh vegetables with feta cheese', 11.99, 'SAL002', 10, 2),
((SELECT id FROM categories WHERE name = 'Salads'), 'Garden Salad', 'Mixed greens with vegetables', 8.99, 'SAL003', 6, 3),

-- Pizza
((SELECT id FROM categories WHERE name = 'Pizza'), 'Margherita Pizza', 'Classic pizza with tomato, mozzarella, basil', 14.99, 'PIZ001', 16, 1),
((SELECT id FROM categories WHERE name = 'Pizza'), 'Pepperoni Pizza', 'Pizza with pepperoni and cheese', 16.99, 'PIZ002', 16, 2),
((SELECT id FROM categories WHERE name = 'Pizza'), 'Supreme Pizza', 'Pizza loaded with multiple toppings', 19.99, 'PIZ003', 20, 3),
((SELECT id FROM categories WHERE name = 'Pizza'), 'Hawaiian Pizza', 'Pizza with ham and pineapple', 17.99, 'PIZ004', 16, 4);

-- Insert dining tables
INSERT INTO dining_tables (table_number, seating_capacity, location) VALUES
('T01', 2, 'Main Floor'),
('T02', 4, 'Main Floor'),
('T03', 4, 'Main Floor'),
('T04', 6, 'Main Floor'),
('T05', 2, 'Main Floor'),
('T06', 4, 'Window Side'),
('T07', 4, 'Window Side'),
('T08', 8, 'Private Room'),
('T09', 2, 'Patio'),
('T10', 4, 'Patio'),
('BAR01', 1, 'Bar Counter'),
('BAR02', 1, 'Bar Counter'),
('BAR03', 1, 'Bar Counter'),
('TAKEOUT', 1, 'Takeout Counter');

-- Insert initial inventory
INSERT INTO inventory (product_id, current_stock, minimum_stock, maximum_stock, unit_cost)
SELECT
    id as product_id,
    50 as current_stock,
    10 as minimum_stock,
    100 as maximum_stock,
    price * 0.4 as unit_cost
FROM products;

-- Create some sample orders for testing
INSERT INTO orders (order_number, table_id, user_id, order_type, status, subtotal, tax_amount, total_amount) VALUES
('ORD001', (SELECT id FROM dining_tables WHERE table_number = 'T02'), (SELECT id FROM users WHERE username = 'server1'), 'dine_in', 'pending', 25.98, 2.60, 28.58),
('ORD002', (SELECT id FROM dining_tables WHERE table_number = 'T05'), (SELECT id FROM users WHERE username = 'server2'), 'dine_in', 'preparing', 18.99, 1.90, 20.89),
('ORD003', (SELECT id FROM dining_tables WHERE table_number = 'TAKEOUT'), (SELECT id FROM users WHERE username = 'counter1'), 'takeout', 'ready', 14.99, 1.50, 16.49);

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
-- Order 1 items
((SELECT id FROM orders WHERE order_number = 'ORD001'), (SELECT id FROM products WHERE sku = 'APP001'), 1, 12.99, 12.99),
((SELECT id FROM orders WHERE order_number = 'ORD001'), (SELECT id FROM products WHERE sku = 'MAIN001'), 1, 18.99, 18.99),
((SELECT id FROM orders WHERE order_number = 'ORD001'), (SELECT id FROM products WHERE sku = 'BEV001'), 2, 2.99, 5.98),

-- Order 2 items
((SELECT id FROM orders WHERE order_number = 'ORD002'), (SELECT id FROM products WHERE sku = 'MAIN001'), 1, 18.99, 18.99),

-- Order 3 items
((SELECT id FROM orders WHERE order_number = 'ORD003'), (SELECT id FROM products WHERE sku = 'PIZ001'), 1, 14.99, 14.99);

-- Insert sample payment
INSERT INTO payments (order_id, payment_method, amount, status, processed_by, processed_at) VALUES
((SELECT id FROM orders WHERE order_number = 'ORD003'), 'cash', 16.49, 'completed', (SELECT id FROM users WHERE username = 'counter1'), CURRENT_TIMESTAMP);

-- Update order 3 status to completed since payment is done
UPDATE orders SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE order_number = 'ORD003';

-- Insert default restaurant configuration (Modern Steak branding)
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
    'Modern Steak',
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
