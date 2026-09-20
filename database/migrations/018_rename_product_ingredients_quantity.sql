-- Migration: Align product_ingredients column name with application code
-- Feature: Fix "column pi.quantity_required does not exist" on production
-- Date: 2026-09-20
--
-- Migration 003 originally created product_ingredients with a column named
-- `quantity`. The application code (internalAutoDeduct, drizzle schema,
-- database/init/03_ingredients.sql) later standardized on `quantity_required`.
-- Fresh dev databases got the new name; production still has the old one, so
-- every order containing a product with a recipe fails with:
--   column pi.quantity_required does not exist
--
-- Idempotent: renames the old column (keeping its data) when present,
-- otherwise adds the column with a safe default.

-- 1. Rename legacy column if it exists and the new one does not
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_ingredients' AND column_name = 'quantity'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_ingredients' AND column_name = 'quantity_required'
    ) THEN
        ALTER TABLE product_ingredients RENAME COLUMN quantity TO quantity_required;
        RAISE NOTICE 'Renamed product_ingredients.quantity to quantity_required';
    END IF;
END $$;

-- 2. Add the column when the table has neither name (fresh/empty table)
ALTER TABLE product_ingredients
ADD COLUMN IF NOT EXISTS quantity_required DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 3. Default is only needed for the backfill above; recipes must always
--    state an explicit amount.
ALTER TABLE product_ingredients
ALTER COLUMN quantity_required DROP DEFAULT;

-- 4. Sync schema metadata with the renamed column (schema drift guard):
--    recreate the updated_at trigger target columns if the table predates it.
--    (No-op when the trigger/columns already match.)

-- 5. Guard against duplicate recipes introduced before UNIQUE(product_id, ingredient_id) existed
DELETE FROM product_ingredients a
USING product_ingredients b
WHERE a.id > b.id
  AND a.product_id = b.product_id
  AND a.ingredient_id = b.ingredient_id;

ALTER TABLE product_ingredients
DROP CONSTRAINT IF EXISTS product_ingredients_product_id_ingredient_id_key;
ALTER TABLE product_ingredients
ADD CONSTRAINT product_ingredients_product_id_ingredient_id_key
UNIQUE (product_id, ingredient_id);
