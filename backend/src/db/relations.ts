import { relations } from 'drizzle-orm';
import {
  users,
  categories,
  products,
  diningTables,
  orders,
  orderItems,
  payments,
  inventory,
  orderStatusHistory,
  restaurantInfo,
  operatingHours,
  contactSubmissions,
  ingredients,
  productIngredients,
  ingredientHistory,
  reservations,
  notifications,
  notificationPreferences,
  orderNotifications,
  satisfactionSurveys,
  systemSettings,
} from './schema.js';

// ---------------------------------------------------------------------------
// users relations
// ---------------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  notifications: many(notifications),
  notificationPreferences: many(notificationPreferences),
}));

// ---------------------------------------------------------------------------
// categories relations
// ---------------------------------------------------------------------------
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

// ---------------------------------------------------------------------------
// products relations
// ---------------------------------------------------------------------------
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  inventory: one(inventory, {
    fields: [products.id],
    references: [inventory.productId],
  }),
  orderItems: many(orderItems),
  productIngredients: many(productIngredients),
}));

// ---------------------------------------------------------------------------
// dining_tables relations
// ---------------------------------------------------------------------------
export const diningTablesRelations = relations(diningTables, ({ many }) => ({
  orders: many(orders),
}));

// ---------------------------------------------------------------------------
// orders relations
// ---------------------------------------------------------------------------
export const ordersRelations = relations(orders, ({ one, many }) => ({
  diningTable: one(diningTables, {
    fields: [orders.tableId],
    references: [diningTables.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
  payments: many(payments),
  orderStatusHistory: many(orderStatusHistory),
  orderNotifications: many(orderNotifications),
}));

// ---------------------------------------------------------------------------
// order_items relations
// ---------------------------------------------------------------------------
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// ---------------------------------------------------------------------------
// payments relations
// ---------------------------------------------------------------------------
export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  processedByUser: one(users, {
    fields: [payments.processedBy],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// inventory relations
// ---------------------------------------------------------------------------
export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
}));

// ---------------------------------------------------------------------------
// order_status_history relations
// ---------------------------------------------------------------------------
export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  changedByUser: one(users, {
    fields: [orderStatusHistory.changedBy],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// restaurant_info relations
// ---------------------------------------------------------------------------
export const restaurantInfoRelations = relations(restaurantInfo, ({ many }) => ({
  operatingHours: many(operatingHours),
}));

// ---------------------------------------------------------------------------
// operating_hours relations
// ---------------------------------------------------------------------------
export const operatingHoursRelations = relations(operatingHours, ({ one }) => ({
  restaurantInfo: one(restaurantInfo, {
    fields: [operatingHours.restaurantInfoId],
    references: [restaurantInfo.id],
  }),
}));

// ---------------------------------------------------------------------------
// ingredients relations
// ---------------------------------------------------------------------------
export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  productIngredients: many(productIngredients),
  ingredientHistory: many(ingredientHistory),
}));

// ---------------------------------------------------------------------------
// product_ingredients relations
// ---------------------------------------------------------------------------
export const productIngredientsRelations = relations(productIngredients, ({ one }) => ({
  product: one(products, {
    fields: [productIngredients.productId],
    references: [products.id],
  }),
  ingredient: one(ingredients, {
    fields: [productIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

// ---------------------------------------------------------------------------
// ingredient_history relations
// ---------------------------------------------------------------------------
export const ingredientHistoryRelations = relations(ingredientHistory, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [ingredientHistory.ingredientId],
    references: [ingredients.id],
  }),
  adjustedByUser: one(users, {
    fields: [ingredientHistory.adjustedBy],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [ingredientHistory.orderId],
    references: [orders.id],
  }),
}));

// ---------------------------------------------------------------------------
// reservations relations
// ---------------------------------------------------------------------------
export const reservationsRelations = relations(reservations, ({ one }) => ({
  confirmedByUser: one(users, {
    fields: [reservations.confirmedBy],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// notifications relations
// ---------------------------------------------------------------------------
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// notification_preferences relations
// ---------------------------------------------------------------------------
export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// order_notifications relations
// ---------------------------------------------------------------------------
export const orderNotificationsRelations = relations(orderNotifications, ({ one }) => ({
  order: one(orders, {
    fields: [orderNotifications.orderId],
    references: [orders.id],
  }),
}));

// ---------------------------------------------------------------------------
// satisfaction_surveys relations
// ---------------------------------------------------------------------------
export const satisfactionSurveysRelations = relations(satisfactionSurveys, ({ one }) => ({
  order: one(orders, {
    fields: [satisfactionSurveys.orderId],
    references: [orders.id],
  }),
}));

// ---------------------------------------------------------------------------
// system_settings relations
// ---------------------------------------------------------------------------
export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [systemSettings.updatedBy],
    references: [users.id],
  }),
}));
