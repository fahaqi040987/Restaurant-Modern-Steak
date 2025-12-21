-- Migration to add ingredients (raw materials) tables

-- Ingredients table (raw materials like french fries, tomatoes, beef, etc.)
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    unit VARCHAR(20) NOT NULL CHECK (unit IN ('kg', 'g', 'l', 'ml', 'pcs', 'pack', 'box')),
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10,2) DEFAULT 0,
    maximum_stock DECIMAL(10,2) DEFAULT 0,
    unit_cost DECIMAL(10,2),
    supplier VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product-Ingredient relationship (recipe/bill of materials)
CREATE TABLE IF NOT EXISTS product_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL, -- Amount of ingredient used per product
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, ingredient_id)
);

-- Ingredient Stock History (for tracking stock movements)
CREATE TABLE IF NOT EXISTS ingredient_stock_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('restock', 'usage', 'adjustment', 'wastage')),
    quantity DECIMAL(10,2) NOT NULL, -- Positive for restock, negative for usage/wastage
    previous_stock DECIMAL(10,2) NOT NULL,
    new_stock DECIMAL(10,2) NOT NULL,
    reference_id UUID, -- Order ID for usage, or purchase ID for restock
    notes TEXT,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ingredients_is_active ON ingredients(is_active);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product_id ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient_id ON product_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_stock_history_ingredient_id ON ingredient_stock_history(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_stock_history_created_at ON ingredient_stock_history(created_at DESC);

-- Create trigger for ingredients updated_at
CREATE TRIGGER update_ingredients_updated_at 
    BEFORE UPDATE ON ingredients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE ingredients IS 'Raw materials/ingredients used in products (e.g., french fries, tomatoes, beef)';
COMMENT ON TABLE product_ingredients IS 'Recipe/Bill of Materials - defines which ingredients are used in each product and their quantities';
COMMENT ON TABLE ingredient_stock_history IS 'Audit trail for all ingredient stock movements (restocks, usage, adjustments, wastage)';
