-- ============================================================
-- 020: Allow configurable payment method codes on payments
--
-- Regression: payments was created (database/init/01_schema.sql) with
--   payment_method VARCHAR(20) CHECK (payment_method IN
--     ('cash','credit_card','debit_card','digital_wallet'))
-- so the configurable payment-methods codes (e.g. the 'qris' seed, or any
-- custom code an admin adds) were rejected on insert:
--   "new row for relation payments violates check constraint
--    payments_payment_method_check"
--
-- Validity is now enforced by the application against the payment_methods
-- table (active codes only), so the stale CHECK is dropped and the column is
-- widened to fit longer custom codes.
--
-- Idempotent: safe to re-run.
-- ============================================================

ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_payment_method_check";

DO $$ BEGIN
	IF (
		SELECT character_maximum_length FROM information_schema.columns
		WHERE table_name = 'payments' AND column_name = 'payment_method'
	) <> 50 THEN
		ALTER TABLE "payments" ALTER COLUMN "payment_method" TYPE varchar(50);
	END IF;
END $$;
