CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(30) NOT NULL,
	"label" varchar(100) NOT NULL,
	"description" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"provider" varchar(50),
	"api_endpoint" varchar(500),
	"webhook_url" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payment_methods_code_unique" UNIQUE("code")
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dining_tables' AND column_name = 'status') THEN
		ALTER TABLE "dining_tables" ADD COLUMN "status" varchar(20) DEFAULT 'available' NOT NULL;
	END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dining_tables' AND column_name = 'status_note') THEN
		ALTER TABLE "dining_tables" ADD COLUMN "status_note" varchar(200);
	END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payment_methods_code" ON "payment_methods" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_payment_methods_active" ON "payment_methods" USING btree ("is_active");--> statement-breakpoint
INSERT INTO "payment_methods" ("code","label","description","is_active","provider","sort_order") VALUES
	('cash','Tunai','Bayar tunai di kasir',true,'manual',1),
	('qris','QRIS','Scan QRIS untuk membayar',true,'midtrans',2),
	('debit_card','Kartu Debit','Bayar dengan kartu debit (EDC)',true,'edc',3),
	('credit_card','Kartu Kredit','Bayar dengan kartu kredit (EDC)',true,'edc',4),
	('digital_wallet','Dompet Digital','GoPay/OVO/DANA/e-wallet lainnya',true,'midtrans',5)
ON CONFLICT ("code") DO NOTHING;
