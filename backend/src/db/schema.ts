import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  time,
  date,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    username: varchar('username', { length: 50 }).unique().notNull(),
    email: varchar('email', { length: 100 }).unique().notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName: varchar('last_name', { length: 50 }).notNull(),
    role: varchar('role', { length: 20 }).notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    // No additional indexes beyond the unique constraints on username/email
  }),
);

// ---------------------------------------------------------------------------
// categories
// ---------------------------------------------------------------------------
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    color: varchar('color', { length: 7 }),
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
);

// ---------------------------------------------------------------------------
// products
// ---------------------------------------------------------------------------
export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    imageUrl: varchar('image_url', { length: 500 }),
    barcode: varchar('barcode', { length: 50 }),
    sku: varchar('sku', { length: 50 }).unique(),
    isAvailable: boolean('is_available').default(true),
    preparationTime: integer('preparation_time').default(0),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    categoryIdIdx: index('idx_products_category_id').on(table.categoryId),
    isAvailableIdx: index('idx_products_is_available').on(table.isAvailable),
  }),
);

// ---------------------------------------------------------------------------
// dining_tables
// ---------------------------------------------------------------------------
export const diningTables = pgTable(
  'dining_tables',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tableNumber: varchar('table_number', { length: 20 }).unique().notNull(),
    seatingCapacity: integer('seating_capacity').default(4),
    location: varchar('location', { length: 50 }),
    isOccupied: boolean('is_occupied').default(false),
    qrCode: varchar('qr_code', { length: 50 }).unique(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    qrCodeIdx: index('idx_dining_tables_qr_code').on(table.qrCode),
  }),
);

// ---------------------------------------------------------------------------
// orders
// ---------------------------------------------------------------------------
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: varchar('order_number', { length: 20 }).unique().notNull(),
    tableId: uuid('table_id').references(() => diningTables.id, { onDelete: 'set null' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    customerName: varchar('customer_name', { length: 100 }),
    orderType: varchar('order_type', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
    taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    servedAt: timestamp('served_at', { withTimezone: true, mode: 'string' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => ({
    statusIdx: index('idx_orders_status').on(table.status),
    createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
    tableIdIdx: index('idx_orders_table_id').on(table.tableId),
  }),
);

// ---------------------------------------------------------------------------
// order_items
// ---------------------------------------------------------------------------
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    specialInstructions: text('special_instructions'),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    orderIdIdx: index('idx_order_items_order_id').on(table.orderId),
    productIdIdx: index('idx_order_items_product_id').on(table.productId),
  }),
);

// ---------------------------------------------------------------------------
// payments
// ---------------------------------------------------------------------------
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    referenceNumber: varchar('reference_number', { length: 100 }),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    processedBy: uuid('processed_by').references(() => users.id, { onDelete: 'set null' }),
    processedAt: timestamp('processed_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    orderIdIdx: index('idx_payments_order_id').on(table.orderId),
  }),
);

// ---------------------------------------------------------------------------
// inventory
// ---------------------------------------------------------------------------
export const inventory = pgTable(
  'inventory',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
    currentStock: integer('current_stock').notNull().default(0),
    minimumStock: integer('minimum_stock').default(0),
    maximumStock: integer('maximum_stock').default(0),
    unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
    lastRestockedAt: timestamp('last_restocked_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    productIdIdx: index('idx_inventory_product_id').on(table.productId),
  }),
);

// ---------------------------------------------------------------------------
// order_status_history
// ---------------------------------------------------------------------------
export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    previousStatus: varchar('previous_status', { length: 20 }),
    newStatus: varchar('new_status', { length: 20 }).notNull(),
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
);

// ---------------------------------------------------------------------------
// restaurant_info
// ---------------------------------------------------------------------------
export const restaurantInfo = pgTable(
  'restaurant_info',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    tagline: varchar('tagline', { length: 200 }),
    description: text('description'),
    address: varchar('address', { length: 255 }).notNull(),
    city: varchar('city', { length: 100 }),
    postalCode: varchar('postal_code', { length: 20 }),
    country: varchar('country', { length: 100 }),
    phone: varchar('phone', { length: 50 }).notNull(),
    email: varchar('email', { length: 100 }).notNull(),
    whatsapp: varchar('whatsapp', { length: 50 }),
    mapLatitude: decimal('map_latitude', { precision: 10, scale: 8 }),
    mapLongitude: decimal('map_longitude', { precision: 11, scale: 8 }),
    googleMapsUrl: varchar('google_maps_url', { length: 500 }),
    instagramUrl: varchar('instagram_url', { length: 255 }),
    facebookUrl: varchar('facebook_url', { length: 255 }),
    twitterUrl: varchar('twitter_url', { length: 255 }),
    logoUrl: varchar('logo_url', { length: 500 }),
    heroImageUrl: varchar('hero_image_url', { length: 500 }),
    timezone: varchar('timezone', { length: 50 }).default('Asia/Jakarta'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    singletonIdx: uniqueIndex('idx_restaurant_info_singleton').on(sql`(true)`),
  }),
);

// ---------------------------------------------------------------------------
// operating_hours
// ---------------------------------------------------------------------------
export const operatingHours = pgTable(
  'operating_hours',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    restaurantInfoId: uuid('restaurant_info_id')
      .notNull()
      .references(() => restaurantInfo.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    openTime: time('open_time').notNull(),
    closeTime: time('close_time').notNull(),
    isClosed: boolean('is_closed').default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    dayUniqueIdx: uniqueIndex('idx_operating_hours_day_unique').on(
      table.restaurantInfoId,
      table.dayOfWeek,
    ),
    restaurantIdIdx: index('idx_operating_hours_restaurant_id').on(table.restaurantInfoId),
  }),
);

// ---------------------------------------------------------------------------
// contact_submissions
// ---------------------------------------------------------------------------
export const contactSubmissions = pgTable(
  'contact_submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    subject: varchar('subject', { length: 100 }).notNull(),
    message: text('message').notNull(),
    status: varchar('status', { length: 20 }).default('new'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    createdAtIdx: index('idx_contact_submissions_created_at').on(table.createdAt),
    statusIdx: index('idx_contact_submissions_status').on(table.status),
  }),
);

// ---------------------------------------------------------------------------
// ingredients
// ---------------------------------------------------------------------------
export const ingredients = pgTable(
  'ingredients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    unit: varchar('unit', { length: 20 }).notNull(),
    currentStock: decimal('current_stock', { precision: 10, scale: 2 }).notNull().default('0'),
    minimumStock: decimal('minimum_stock', { precision: 10, scale: 2 }).notNull().default('0'),
    maximumStock: decimal('maximum_stock', { precision: 10, scale: 2 }).notNull().default('0'),
    unitCost: decimal('unit_cost', { precision: 10, scale: 2 }).notNull().default('0'),
    supplier: varchar('supplier', { length: 200 }),
    lastRestockedAt: timestamp('last_restocked_at', { withTimezone: true, mode: 'string' }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    nameIdx: index('idx_ingredients_name').on(table.name),
    isActiveIdx: index('idx_ingredients_active').on(table.isActive),
  }),
);

// ---------------------------------------------------------------------------
// product_ingredients
// ---------------------------------------------------------------------------
export const productIngredients = pgTable(
  'product_ingredients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' }),
    ingredientId: uuid('ingredient_id')
      .references(() => ingredients.id, { onDelete: 'cascade' }),
    quantityRequired: decimal('quantity_required', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    productIdIdx: index('idx_product_ingredients_product').on(table.productId),
    ingredientIdIdx: index('idx_product_ingredients_ingredient').on(table.ingredientId),
    productIngredientUniqueIdx: uniqueIndex('product_ingredients_product_id_ingredient_id_key').on(
      table.productId,
      table.ingredientId,
    ),
  }),
);

// ---------------------------------------------------------------------------
// ingredient_history (ingredient stock history / audit trail)
// ---------------------------------------------------------------------------
export const ingredientHistory = pgTable(
  'ingredient_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ingredientId: uuid('ingredient_id').references(() => ingredients.id, { onDelete: 'cascade' }),
    operation: varchar('operation', { length: 30 }).notNull(),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    previousStock: decimal('previous_stock', { precision: 10, scale: 2 }).notNull(),
    newStock: decimal('new_stock', { precision: 10, scale: 2 }).notNull(),
    reason: varchar('reason', { length: 100 }),
    notes: text('notes'),
    adjustedBy: uuid('adjusted_by').references(() => users.id, { onDelete: 'set null' }),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    ingredientIdIdx: index('idx_ingredient_history_ingredient').on(table.ingredientId),
    createdAtIdx: index('idx_ingredient_history_created').on(table.createdAt),
    orderIdIdx: index('idx_ingredient_history_order').on(table.orderId),
  }),
);

// ---------------------------------------------------------------------------
// inventory_history (product stock adjustment audit trail)
// ---------------------------------------------------------------------------
export const inventoryHistory = pgTable(
  'inventory_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    operation: varchar('operation', { length: 20 }).notNull(),
    quantity: integer('quantity').notNull(),
    previousStock: integer('previous_stock').notNull(),
    newStock: integer('new_stock').notNull(),
    reason: varchar('reason', { length: 50 }).notNull(),
    notes: text('notes'),
    adjustedBy: uuid('adjusted_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    productIdIdx: index('idx_inventory_history_product_id').on(table.productId),
    createdAtIdx: index('idx_inventory_history_created_at').on(table.createdAt),
    adjustedByIdx: index('idx_inventory_history_adjusted_by').on(table.adjustedBy),
    operationIdx: index('idx_inventory_history_operation').on(table.operation),
  }),
);

// ---------------------------------------------------------------------------
// reservations
// ---------------------------------------------------------------------------
export const reservations = pgTable(
  'reservations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerName: varchar('customer_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    partySize: integer('party_size').notNull(),
    reservationDate: date('reservation_date').notNull(),
    reservationTime: time('reservation_time').notNull(),
    specialRequests: text('special_requests'),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    notes: text('notes'),
    confirmedBy: uuid('confirmed_by').references(() => users.id),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    dateIdx: index('idx_reservations_date').on(table.reservationDate),
    statusIdx: index('idx_reservations_status').on(table.status),
    emailIdx: index('idx_reservations_email').on(table.email),
    createdAtIdx: index('idx_reservations_created_at').on(table.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').default(false),
    readAt: timestamp('read_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_notifications_user_id').on(table.userId),
    isReadIdx: index('idx_notifications_is_read').on(table.isRead),
    createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// notification_preferences
// ---------------------------------------------------------------------------
export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    emailEnabled: boolean('email_enabled').default(true),
    typesEnabled: jsonb('types_enabled').default(
      '{"order_update": true, "low_stock": true, "payment": true, "system_alert": true, "daily_report": true}',
    ),
    quietHoursStart: time('quiet_hours_start'),
    quietHoursEnd: time('quiet_hours_end'),
    notificationEmail: varchar('notification_email', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_notification_preferences_user_id').on(table.userId),
  }),
);

// ---------------------------------------------------------------------------
// order_notifications
// ---------------------------------------------------------------------------
export const orderNotifications = pgTable(
  'order_notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    orderIdIdx: index('idx_order_notifications_order_id').on(table.orderId),
    statusIdx: index('idx_order_notifications_status').on(table.status),
    isReadIdx: index('idx_order_notifications_is_read').on(table.isRead),
    createdAtIdx: index('idx_order_notifications_created_at').on(table.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// satisfaction_surveys
// ---------------------------------------------------------------------------
export const satisfactionSurveys = pgTable(
  'satisfaction_surveys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .unique()
      .references(() => orders.id, { onDelete: 'cascade' }),
    overallRating: integer('overall_rating').notNull(),
    foodQuality: integer('food_quality'),
    serviceQuality: integer('service_quality'),
    ambiance: integer('ambiance'),
    valueForMoney: integer('value_for_money'),
    comments: text('comments'),
    wouldRecommend: boolean('would_recommend'),
    customerName: varchar('customer_name', { length: 100 }),
    customerEmail: varchar('customer_email', { length: 255 }),
    submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    orderIdIdx: index('idx_satisfaction_surveys_order_id').on(table.orderId),
    overallRatingIdx: index('idx_satisfaction_surveys_overall_rating').on(table.overallRating),
    submittedAtIdx: index('idx_satisfaction_surveys_submitted_at').on(table.submittedAt),
    wouldRecommendIdx: index('idx_satisfaction_surveys_would_recommend').on(table.wouldRecommend),
  }),
);

// ---------------------------------------------------------------------------
// system_settings
// ---------------------------------------------------------------------------
export const systemSettings = pgTable(
  'system_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    settingKey: varchar('setting_key', { length: 100 }).unique().notNull(),
    settingValue: text('setting_value').notNull(),
    settingType: varchar('setting_type', { length: 20 }).notNull().default('string'),
    description: text('description'),
    category: varchar('category', { length: 50 }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    settingKeyIdx: index('idx_system_settings_key').on(table.settingKey),
    categoryIdx: index('idx_system_settings_category').on(table.category),
  }),
);
