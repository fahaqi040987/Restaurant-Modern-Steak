-- Ingredients System for Raw Stock Management
-- This handles raw ingredients like French fries, tomato, sauce, etc.

-- Ingredients table for raw stock (not finished products)
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    unit VARCHAR(20) NOT NULL DEFAULT 'pcs', -- kg, liters, pcs, dozen, etc.
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10,2) NOT NULL DEFAULT 10,
    maximum_stock DECIMAL(10,2) NOT NULL DEFAULT 100,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0, -- cost per unit
    supplier VARCHAR(200),
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product-Ingredient linking table (recipe management)
CREATE TABLE IF NOT EXISTS product_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_required DECIMAL(10,2) NOT NULL, -- Amount of ingredient needed per product unit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, ingredient_id)
);

-- Ingredient stock history for audit trail
CREATE TABLE IF NOT EXISTS ingredient_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('add', 'remove', 'restock', 'usage', 'spoilage', 'adjustment')),
    quantity DECIMAL(10,2) NOT NULL,
    previous_stock DECIMAL(10,2) NOT NULL,
    new_stock DECIMAL(10,2) NOT NULL,
    reason VARCHAR(100),
    notes TEXT,
    adjusted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed some common Indonesian steakhouse ingredients
INSERT INTO ingredients (name, description, unit, current_stock, minimum_stock, maximum_stock, unit_cost) VALUES
('Kentang', 'French fries (kentang goreng)', 'kg', 50, 20, 100, 15000),
('Tomat', 'Fresh tomatoes', 'kg', 30, 10, 50, 12000),
('Selada', 'Lettuce / salad greens', 'kg', 20, 10, 40, 18000),
('Bawang Bombay', 'Onions', 'kg', 25, 10, 50, 20000),
('Bawang Putih', 'Garlic', 'kg', 15, 5, 30, 35000),
('Saus BBQ', 'BBQ sauce', 'liter', 10, 5, 20, 45000),
('Saus Sambal', 'Sambal sauce', 'liter', 12, 5, 25, 35000),
('Saus Teriyaki', 'Teriyaki sauce', 'liter', 8, 5, 15, 50000),
('Mentega', 'Butter', 'kg', 10, 5, 20, 65000),
('Olive Oil', 'Extra virgin olive oil', 'liter', 15, 10, 30, 120000),
('Garam', 'Salt', 'kg', 20, 10, 30, 8000),
('Merica', 'Black pepper', 'kg', 8, 5, 15, 150000),
('Keju Parmesan', 'Parmesan cheese', 'kg', 5, 3, 10, 250000),
('Jamur', 'Mushrooms', 'kg', 15, 10, 30, 85000),
('Jagung Manis', 'Sweet corn', 'kg', 20, 10, 40, 25000)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_active ON ingredients(is_active);
CREATE INDEX IF NOT EXISTS idx_ingredients_low_stock ON ingredients(current_stock, minimum_stock) WHERE current_stock < minimum_stock;
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient ON product_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_history_ingredient ON ingredient_history(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_history_created ON ingredient_history(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE ingredients IS 'Raw ingredients and supplies (not finished menu items)';
COMMENT ON TABLE product_ingredients IS 'Links products to required ingredients (recipe management)';
COMMENT ON TABLE ingredient_history IS 'Audit trail for all ingredient stock movements';
COMMENT ON COLUMN ingredients.unit IS 'kg, liter, pcs, dozen, box, etc.';
COMMENT ON COLUMN ingredients.unit_cost IS 'Cost per unit in IDR';
COMMENT ON COLUMN product_ingredients.quantity_required IS 'Amount of ingredient needed to make one unit of product';
