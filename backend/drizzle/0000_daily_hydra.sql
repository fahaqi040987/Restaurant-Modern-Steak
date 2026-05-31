CREATE TABLE "bio_link_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"referrer" varchar(500),
	"clicked_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bio_link_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_name" varchar(100) NOT NULL,
	"bio_text" text,
	"avatar_url" varchar(500),
	"background_url" varchar(500),
	"theme_color" varchar(7) DEFAULT '#e5612f',
	"noindex" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bio_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(100) NOT NULL,
	"url" varchar(500) NOT NULL,
	"icon" varchar(50),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"click_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"phone" varchar(50),
	"subject" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(20) DEFAULT 'new',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dining_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_number" varchar(20) NOT NULL,
	"seating_capacity" integer DEFAULT 4,
	"location" varchar(50),
	"is_occupied" boolean DEFAULT false,
	"qr_code" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "dining_tables_table_number_unique" UNIQUE("table_number"),
	CONSTRAINT "dining_tables_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "franchise_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section" varchar(50) NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "franchise_content_section_unique" UNIQUE("section")
);
--> statement-breakpoint
CREATE TABLE "ingredient_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingredient_id" uuid,
	"operation" varchar(30) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"previous_stock" numeric(10, 2) NOT NULL,
	"new_stock" numeric(10, 2) NOT NULL,
	"reason" varchar(100),
	"notes" text,
	"adjusted_by" uuid,
	"order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"unit" varchar(20) NOT NULL,
	"current_stock" numeric(10, 2) DEFAULT '0' NOT NULL,
	"minimum_stock" numeric(10, 2) DEFAULT '0' NOT NULL,
	"maximum_stock" numeric(10, 2) DEFAULT '0' NOT NULL,
	"unit_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"supplier" varchar(200),
	"last_restocked_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ingredients_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"minimum_stock" integer DEFAULT 0,
	"maximum_stock" integer DEFAULT 0,
	"unit_cost" numeric(10, 2),
	"last_restocked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"operation" varchar(20) NOT NULL,
	"quantity" integer NOT NULL,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"reason" varchar(50) NOT NULL,
	"notes" text,
	"adjusted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email_enabled" boolean DEFAULT true,
	"types_enabled" jsonb DEFAULT '{"order_update": true, "low_stock": true, "payment": true, "system_alert": true, "daily_report": true}',
	"quiet_hours_start" time,
	"quiet_hours_end" time,
	"notification_email" varchar(100),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "operating_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_info_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"open_time" time NOT NULL,
	"close_time" time NOT NULL,
	"is_closed" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"product_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"special_instructions" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"previous_status" varchar(20),
	"new_status" varchar(20) NOT NULL,
	"changed_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"table_id" uuid,
	"user_id" uuid,
	"customer_name" varchar(100),
	"order_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"served_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"payment_method" varchar(20) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reference_number" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"processed_by" uuid,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"ingredient_id" uuid,
	"quantity_required" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"name" varchar(100) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"image_url" varchar(500),
	"barcode" varchar(50),
	"sku" varchar(50),
	"is_available" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"preparation_time" integer DEFAULT 0,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"party_size" integer NOT NULL,
	"reservation_date" date NOT NULL,
	"reservation_time" time NOT NULL,
	"special_requests" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"confirmed_by" uuid,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurant_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"tagline" varchar(200),
	"description" text,
	"address" varchar(255) NOT NULL,
	"city" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(100),
	"phone" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	"whatsapp" varchar(50),
	"map_latitude" numeric(10, 8),
	"map_longitude" numeric(11, 8),
	"google_maps_url" varchar(500),
	"instagram_url" varchar(255),
	"facebook_url" varchar(255),
	"twitter_url" varchar(255),
	"logo_url" varchar(500),
	"hero_image_url" varchar(500),
	"timezone" varchar(50) DEFAULT 'Asia/Jakarta',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "satisfaction_surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"overall_rating" integer NOT NULL,
	"food_quality" integer,
	"service_quality" integer,
	"ambiance" integer,
	"value_for_money" integer,
	"comments" text,
	"would_recommend" boolean,
	"customer_name" varchar(100),
	"customer_email" varchar(255),
	"submitted_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "satisfaction_surveys_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" varchar(100) NOT NULL,
	"setting_value" text NOT NULL,
	"setting_type" varchar(20) DEFAULT 'string' NOT NULL,
	"description" text,
	"category" varchar(50),
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "system_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"role" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"google_id" uuid,
	"approval_status" text DEFAULT 'pending',
	"rejection_count" integer DEFAULT 0,
	"last_rejection_at" timestamp with time zone,
	"google_linked_at" timestamp with time zone,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bio_link_clicks" ADD CONSTRAINT "bio_link_clicks_link_id_bio_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."bio_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "franchise_content" ADD CONSTRAINT "franchise_content_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredient_history" ADD CONSTRAINT "ingredient_history_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredient_history" ADD CONSTRAINT "ingredient_history_adjusted_by_users_id_fk" FOREIGN KEY ("adjusted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredient_history" ADD CONSTRAINT "ingredient_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_history" ADD CONSTRAINT "inventory_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_history" ADD CONSTRAINT "inventory_history_adjusted_by_users_id_fk" FOREIGN KEY ("adjusted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operating_hours" ADD CONSTRAINT "operating_hours_restaurant_info_id_restaurant_info_id_fk" FOREIGN KEY ("restaurant_info_id") REFERENCES "public"."restaurant_info"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_notifications" ADD CONSTRAINT "order_notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_dining_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."dining_tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "satisfaction_surveys" ADD CONSTRAINT "satisfaction_surveys_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bio_link_clicks_link_id" ON "bio_link_clicks" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "idx_bio_link_clicks_clicked_at" ON "bio_link_clicks" USING btree ("clicked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bio_link_profile_singleton" ON "bio_link_profile" USING btree ((true));--> statement-breakpoint
CREATE INDEX "idx_bio_links_is_active" ON "bio_links" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_bio_links_sort_order" ON "bio_links" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_contact_submissions_created_at" ON "contact_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_contact_submissions_status" ON "contact_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_dining_tables_qr_code" ON "dining_tables" USING btree ("qr_code");--> statement-breakpoint
CREATE INDEX "idx_franchise_content_section" ON "franchise_content" USING btree ("section");--> statement-breakpoint
CREATE INDEX "idx_ingredient_history_ingredient" ON "ingredient_history" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX "idx_ingredient_history_created" ON "ingredient_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ingredient_history_order" ON "ingredient_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_ingredients_name" ON "ingredients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_ingredients_active" ON "ingredients" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_inventory_product_id" ON "inventory" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_history_product_id" ON "inventory_history" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_history_created_at" ON "inventory_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_inventory_history_adjusted_by" ON "inventory_history" USING btree ("adjusted_by");--> statement-breakpoint
CREATE INDEX "idx_inventory_history_operation" ON "inventory_history" USING btree ("operation");--> statement-breakpoint
CREATE INDEX "idx_notification_preferences_user_id" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_operating_hours_day_unique" ON "operating_hours" USING btree ("restaurant_info_id","day_of_week");--> statement-breakpoint
CREATE INDEX "idx_operating_hours_restaurant_id" ON "operating_hours" USING btree ("restaurant_info_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_product_id" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_order_notifications_order_id" ON "order_notifications" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_notifications_status" ON "order_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_order_notifications_is_read" ON "order_notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_order_notifications_created_at" ON "order_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_created_at" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_table_id" ON "orders" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "idx_payments_order_id" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_product_ingredients_product" ON "product_ingredients" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_ingredients_ingredient" ON "product_ingredients" USING btree ("ingredient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_ingredients_product_id_ingredient_id_key" ON "product_ingredients" USING btree ("product_id","ingredient_id");--> statement-breakpoint
CREATE INDEX "idx_products_category_id" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_products_is_available" ON "products" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "idx_products_is_deleted" ON "products" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX "idx_reservations_date" ON "reservations" USING btree ("reservation_date");--> statement-breakpoint
CREATE INDEX "idx_reservations_status" ON "reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reservations_email" ON "reservations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_reservations_created_at" ON "reservations" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_restaurant_info_singleton" ON "restaurant_info" USING btree ((true));--> statement-breakpoint
CREATE INDEX "idx_satisfaction_surveys_order_id" ON "satisfaction_surveys" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_satisfaction_surveys_overall_rating" ON "satisfaction_surveys" USING btree ("overall_rating");--> statement-breakpoint
CREATE INDEX "idx_satisfaction_surveys_submitted_at" ON "satisfaction_surveys" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "idx_satisfaction_surveys_would_recommend" ON "satisfaction_surveys" USING btree ("would_recommend");--> statement-breakpoint
CREATE INDEX "idx_system_settings_key" ON "system_settings" USING btree ("setting_key");--> statement-breakpoint
CREATE INDEX "idx_system_settings_category" ON "system_settings" USING btree ("category");