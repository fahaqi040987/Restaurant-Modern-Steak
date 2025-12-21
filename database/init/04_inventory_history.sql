-- Add inventory history table for stock movement audit trail
-- This tracks all stock adjustments with reasons and user attribution

CREATE TABLE IF NOT EXISTS inventory_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('add', 'remove')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('purchase', 'sale', 'spoilage', 'manual_adjustment', 'inventory_count', 'return', 'damage', 'theft', 'expired')),
    notes TEXT,
    adjusted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_inventory_history_product_id ON inventory_history(product_id);
CREATE INDEX idx_inventory_history_created_at ON inventory_history(created_at DESC);
CREATE INDEX idx_inventory_history_adjusted_by ON inventory_history(adjusted_by);
CREATE INDEX idx_inventory_history_operation ON inventory_history(operation);

-- Add comment for documentation
COMMENT ON TABLE inventory_history IS 'Audit trail for all inventory stock adjustments';
COMMENT ON COLUMN inventory_history.operation IS 'Type of operation: add (stock in) or remove (stock out)';
COMMENT ON COLUMN inventory_history.reason IS 'Reason for stock adjustment: purchase, sale, spoilage, manual_adjustment, inventory_count, return, damage, theft, expired';
COMMENT ON COLUMN inventory_history.adjusted_by IS 'User who performed the stock adjustment';
