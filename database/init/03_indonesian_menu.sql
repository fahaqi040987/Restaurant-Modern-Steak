-- Indonesian Steakhouse Menu Data
-- This replaces the Western menu with authentic Indonesian steak specialties
-- All prices in Indonesian Rupiah (IDR)

BEGIN;

-- Clear existing demo data
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders);
DELETE FROM orders;
DELETE FROM products;
DELETE FROM categories;

-- Indonesian Steak Categories
INSERT INTO categories (name, description, sort_order, created_at, updated_at) VALUES
('Steak Nusantara', 'Steak premium dengan cita rasa khas Indonesia', 1, NOW(), NOW()),
('Steak Premium', 'Pilihan steak premium import berkualitas tinggi', 2, NOW(), NOW()),
('Makanan Pembuka', 'Hidangan pembuka untuk membangkitkan selera', 3, NOW(), NOW()),
('Makanan Pendamping', 'Pelengkap sempurna untuk hidangan utama', 4, NOW(), NOW()),
('Minuman', 'Minuman segar dan kopi pilihan', 5, NOW(), NOW()),
('Dessert', 'Penutup manis khas Indonesia', 6, NOW(), NOW());

-- Get category IDs for product insertion
DO $$
DECLARE
    cat_nusantara_id UUID;
    cat_premium_id UUID;
    cat_pembuka_id UUID;
    cat_pendamping_id UUID;
    cat_minuman_id UUID;
    cat_dessert_id UUID;
BEGIN
    SELECT id INTO cat_nusantara_id FROM categories WHERE name = 'Steak Nusantara';
    SELECT id INTO cat_premium_id FROM categories WHERE name = 'Steak Premium';
    SELECT id INTO cat_pembuka_id FROM categories WHERE name = 'Makanan Pembuka';
    SELECT id INTO cat_pendamping_id FROM categories WHERE name = 'Makanan Pendamping';
    SELECT id INTO cat_minuman_id FROM categories WHERE name = 'Minuman';
    SELECT id INTO cat_dessert_id FROM categories WHERE name = 'Dessert';

    -- STEAK NUSANTARA (Indonesian Fusion Steaks)
    INSERT INTO products (category_id, name, description, price, image_url, is_available, created_at, updated_at) VALUES
    (cat_nusantara_id, 'Rendang Wagyu Steak', 'Wagyu beef 250gr dengan saus rendang khas Padang, disajikan dengan nasi pulen dan sayuran', 285000, '/images/rendang-wagyu.jpg', true, NOW(), NOW()),
    (cat_nusantara_id, 'Sate Wagyu Special', 'Sate wagyu premium 200gr dengan bumbu kacang spesial dan lontong', 195000, '/images/sate-wagyu.jpg', true, NOW(), NOW()),
    (cat_nusantara_id, 'Beef Ribs Sambal Matah', 'Iga sapi bakar 300gr dengan sambal matah khas Bali dan nasi hangat', 225000, '/images/ribs-sambal-matah.jpg', true, NOW(), NOW()),
    (cat_nusantara_id, 'Sirloin Steak Bumbu Rujak', 'Sirloin 250gr dengan saus bumbu rujak manis pedas', 245000, '/images/sirloin-rujak.jpg', true, NOW(), NOW()),
    (cat_nusantara_id, 'Tenderloin Gulai Kambing', 'Tenderloin 200gr dengan saus gulai kambing rempah Aceh', 295000, '/images/tenderloin-gulai.jpg', true, NOW(), NOW()),

    -- STEAK PREMIUM (International Quality)
    (cat_premium_id, 'Wagyu A5 Sirloin', 'Wagyu A5 Japan 300gr dengan mushroom sauce', 750000, '/images/wagyu-a5.jpg', true, NOW(), NOW()),
    (cat_premium_id, 'Australian Angus Ribeye', 'Angus ribeye 350gr dengan black pepper sauce', 325000, '/images/angus-ribeye.jpg', true, NOW(), NOW()),
    (cat_premium_id, 'NZ Tenderloin Premium', 'New Zealand tenderloin 250gr dengan truffle sauce', 395000, '/images/nz-tenderloin.jpg', true, NOW(), NOW()),
    (cat_premium_id, 'T-Bone Steak Jumbo', 'T-Bone 500gr dengan pilihan 3 saus', 425000, '/images/tbone-jumbo.jpg', true, NOW(), NOW()),
    (cat_premium_id, 'Wagyu Beef Short Ribs', 'Wagyu short ribs 400gr slow cooked dengan BBQ sauce', 485000, '/images/wagyu-ribs.jpg', true, NOW(), NOW()),

    -- MAKANAN PEMBUKA (Appetizers)
    (cat_pembuka_id, 'Sop Buntut Sapi', 'Sup buntut sapi dengan kuah rempah kaya rasa', 85000, '/images/sop-buntut.jpg', true, NOW(), NOW()),
    (cat_pembuka_id, 'Beef Carpaccio Sambal Matah', 'Irisan tipis beef premium dengan sambal matah', 95000, '/images/carpaccio.jpg', true, NOW(), NOW()),
    (cat_pembuka_id, 'Lumpia Goreng Sayur', 'Lumpia isi sayuran segar dengan saus kacang', 45000, '/images/lumpia.jpg', true, NOW(), NOW()),
    (cat_pembuka_id, 'Salad Gado-Gado', 'Sayuran segar dengan bumbu kacang spesial dan kerupuk', 55000, '/images/gado-gado.jpg', true, NOW(), NOW()),
    (cat_pembuka_id, 'Perkedel Kentang Daging', 'Perkedel kentang isi daging sapi cincang (4 pcs)', 38000, '/images/perkedel.jpg', true, NOW(), NOW()),

    -- MAKANAN PENDAMPING (Side Dishes)
    (cat_pendamping_id, 'Nasi Goreng Kambing', 'Nasi goreng dengan daging kambing dan telur mata sapi', 65000, '/images/nasi-goreng-kambing.jpg', true, NOW(), NOW()),
    (cat_pendamping_id, 'Mie Goreng Jawa', 'Mie goreng khas Jawa dengan sayuran dan telur', 55000, '/images/mie-goreng.jpg', true, NOW(), NOW()),
    (cat_pendamping_id, 'Nasi Putih Premium', 'Nasi pulen berkualitas premium', 15000, '/images/nasi-putih.jpg', true, NOW(), NOW()),
    (cat_pendamping_id, 'French Fries', 'Kentang goreng renyah dengan mayonnaise', 35000, '/images/french-fries.jpg', true, NOW(), NOW()),
    (cat_pendamping_id, 'Tumis Kangkung Belacan', 'Kangkung tumis dengan belacan pedas', 28000, '/images/kangkung.jpg', true, NOW(), NOW()),
    (cat_pendamping_id, 'Capcay Goreng', 'Tumis sayuran dengan saus tiram', 42000, '/images/capcay.jpg', true, NOW(), NOW()),

    -- MINUMAN (Beverages)
    (cat_minuman_id, 'Es Teh Manis', 'Teh manis dingin segar', 15000, '/images/es-teh.jpg', true, NOW(), NOW()),
    (cat_minuman_id, 'Es Jeruk Peras', 'Jus jeruk segar tanpa gula', 25000, '/images/es-jeruk.jpg', true, NOW(), NOW()),
    (cat_minuman_id, 'Jus Alpukat', 'Jus alpukat segar dengan susu coklat', 35000, '/images/jus-alpukat.jpg', true, NOW(), NOW()),
    (cat_minuman_id, 'Es Kelapa Muda', 'Kelapa muda segar langsung dari buah', 28000, '/images/kelapa-muda.jpg', true, NOW(), NOW()),
    (cat_minuman_id, 'Kopi Susu Gula Aren', 'Kopi susu dengan gula aren asli', 32000, '/images/kopi-susu.jpg', true, NOW(), NOW()),
    (cat_minuman_id, 'Cappuccino', 'Kopi cappuccino premium', 38000, '/images/cappuccino.jpg', true, NOW(), NOW()),
    (cat_minuman_id, 'Teh Tarik', 'Teh tarik khas Malaysia', 22000, '/images/teh-tarik.jpg', true, NOW(), NOW()),
    (cat_minuman_id, 'Air Mineral', 'Air mineral botol 600ml', 8000, '/images/air-mineral.jpg', true, NOW(), NOW()),

    -- DESSERT (Indonesian Desserts)
    (cat_dessert_id, 'Pisang Goreng Keju', 'Pisang goreng dengan topping keju dan coklat', 35000, '/images/pisang-goreng.jpg', true, NOW(), NOW()),
    (cat_dessert_id, 'Es Krim Vanilla', 'Es krim vanilla premium (2 scoop)', 28000, '/images/es-krim-vanilla.jpg', true, NOW(), NOW()),
    (cat_dessert_id, 'Es Krim Coklat', 'Es krim coklat premium (2 scoop)', 28000, '/images/es-krim-coklat.jpg', true, NOW(), NOW()),
    (cat_dessert_id, 'Klepon', 'Kue klepon dengan gula merah dan kelapa (6 pcs)', 25000, '/images/klepon.jpg', true, NOW(), NOW()),
    (cat_dessert_id, 'Es Campur Jakarta', 'Es campur dengan buah-buahan, jelly, dan susu', 38000, '/images/es-campur.jpg', true, NOW(), NOW()),
    (cat_dessert_id, 'Martabak Manis Mini', 'Martabak manis coklat keju kacang', 45000, '/images/martabak.jpg', true, NOW(), NOW());

END $$;

COMMIT;

-- Verify inserted data
SELECT 
    c.name as category,
    COUNT(p.id) as product_count,
    MIN(p.price) as min_price,
    MAX(p.price) as max_price
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.name, c.sort_order
ORDER BY c.sort_order;
