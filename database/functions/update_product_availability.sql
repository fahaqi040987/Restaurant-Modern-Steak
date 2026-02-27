-- Product Availability Sync Trigger
-- Feature: Raw Material Supply Chain Control
-- Description: Automatically disables products when required ingredients are out of stock
--              and re-enables them when all ingredients are available.

-- ── Function: Update Product Availability for Ingredient ─────────────────────
-- This function updates the is_available flag for all products that use a specific ingredient.

CREATE OR REPLACE FUNCTION update_product_availability_for_ingredient(ingredient_id UUID)
RETURNS void AS $$
BEGIN
  -- Mark products UNAVAILABLE if the ingredient is out of stock
  UPDATE products p
  SET is_available = false,
      updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT DISTINCT pi.product_id
    FROM product_ingredients pi
    WHERE pi.ingredient_id = $1
      AND EXISTS (
        SELECT 1 FROM ingredients i
        WHERE i.id = $1 AND i.current_stock <= 0
      )
  )
  AND p.is_available = true; -- Only update if currently available

  -- Mark products AVAILABLE again if ALL ingredients are in stock
  UPDATE products p
  SET is_available = true,
      updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT DISTINCT pi.product_id
    FROM product_ingredients pi
    WHERE pi.ingredient_id = $1
      AND NOT EXISTS (
        -- Check that NO ingredient for this product is out of stock
        SELECT 1 FROM product_ingredients pi2
        JOIN ingredients i ON i.id = pi2.ingredient_id
        WHERE pi2.product_id = p.product_id
          AND i.current_stock <= 0
      )
  )
  AND p.is_available = false; -- Only update if currently unavailable
END;
$$ LANGUAGE plpgsql;

-- ── Trigger: Sync Product Availability on Ingredient Stock Change ─────────────

DROP TRIGGER IF EXISTS trigger_sync_product_availability ON ingredients;

CREATE TRIGGER trigger_sync_product_availability
AFTER UPDATE OF current_stock ON ingredients
FOR EACH ROW
WHEN (OLD.current_stock IS DISTINCT FROM NEW.current_stock)
EXECUTE FUNCTION update_product_availability_for_ingredient(NEW.id);

-- ── Function: Update All Product Availability ───────────────────────────────────
-- Manually sync all products with their ingredient availability (for admin use)

CREATE OR REPLACE FUNCTION update_all_product_availability()
RETURNS TABLE(
  product_id UUID,
  product_name VARCHAR,
  was_available BOOLEAN,
  now_available BOOLEAN
) AS $$
DECLARE
  product_record RECORD;
BEGIN
  -- Reset all products to available first
  UPDATE products SET is_available = true;

  -- Then mark products unavailable if any ingredient is out of stock
  FOR product_record IN
    SELECT DISTINCT p.id, p.name
    FROM products p
    JOIN product_ingredients pi ON p.id = pi.product_id
    JOIN ingredients i ON pi.ingredient_id = i.id
    WHERE i.current_stock <= 0
  LOOP
    UPDATE products
    SET is_available = false,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = product_record.id;

    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ── Comments for documentation ───────────────────────────────────────────────────

COMMENT ON FUNCTION update_product_availability_for_ingredient IS
'Automatically updates product availability based on ingredient stock levels. Called by trigger when ingredient.current_stock changes.';

COMMENT ON FUNCTION update_all_product_availability IS
'Manually syncs all products with their ingredient availability. Useful for one-time sync or after bulk imports.';

COMMENT ON TRIGGER trigger_sync_product_availability ON ingredients IS
'Triggers product availability update when ingredient stock changes, auto-disabling products with out-of-stock ingredients.';
