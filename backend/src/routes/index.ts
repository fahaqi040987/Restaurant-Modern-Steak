import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import { publicRateLimiter, strictRateLimiter, contactFormRateLimiter } from '../middleware/ratelimit.js';
import { csrfProtection } from '../middleware/security.js';

// Handlers
import { login, getCurrentUser, logout } from '../handlers/auth.js';
import { getProfile, updateProfile, changePassword } from '../handlers/profile.js';
import { getProducts, getProduct, getCategories, getProductsByCategory, createProduct, updateProduct, deleteProduct } from '../handlers/products.js';
import { getTables, getTable, getTablesByLocation, getTableStatus } from '../handlers/tables.js';
import { getOrders, getOrder, createOrder, updateOrderStatus, getOrderStatusHistory } from '../handlers/orders.js';
import { processPayment, getPayments, getPaymentSummary, createCustomerPayment } from '../handlers/payments.js';
import { getKitchenOrders, updateOrderItemStatus } from '../handlers/kitchen.js';
import { getInventory, getProductInventory, adjustStock, getLowStock, getStockHistory } from '../handlers/inventory.js';
import { getIngredients, getIngredient, createIngredient, updateIngredient, deleteIngredient, restockIngredient, getLowStockIngredients, getIngredientHistory } from '../handlers/ingredients.js';
import { getProductIngredients, addProductIngredient, updateProductIngredient, deleteProductIngredient } from '../handlers/recipes.js';
import { getNotifications, getUnreadCounts, markNotificationRead, deleteNotification, getNotificationPreferences, updateNotificationPreferences, getOrderNotifications, markOrderNotificationAsRead } from '../handlers/notifications.js';
import { createReservation, getReservations, getReservation, updateReservationStatus, deleteReservation, getPendingReservationsCount } from '../handlers/reservations.js';
import { getContactSubmissions, getContactSubmission, getNewContactsCount, updateContactStatus, deleteContactSubmission } from '../handlers/contact.js';
import { updateRestaurantInfo, updateOperatingHours } from '../handlers/restaurant-info.js';
import { getSettings, updateSettings, getSystemHealth as getAdminSystemHealth } from '../handlers/settings.js';
import { createSurvey, getSurveyStats } from '../handlers/surveys.js';
import { uploadImage, deleteImage } from '../handlers/upload.js';
import { getDashboardStats, getSalesReport, getOrdersReport, getIncomeReport } from '../handlers/dashboard.js';
import { getPublicMenu, getPublicCategories, getRestaurantInfo, submitContactForm, getCSRFToken, getTableByQRCode, createCustomerOrder } from '../handlers/public.js';
import { getAdminCategories, createCategory, updateCategory, deleteCategory, getAdminTables, createTable, updateTable, deleteTable, getAdminUsers, createUser, updateUser, deleteUser } from '../handlers/admin.js';
import { getSystemHealth } from '../handlers/health.js';

// Middleware that sets force_order_type so createOrder forces dine_in
import { createMiddleware } from 'hono/factory';
const forceDineIn = createMiddleware(async (c, next) => {
  c.set('force_order_type' as never, 'dine_in' as never);
  await next();
});

export function setupRoutes(app: Hono) {
  const api = new Hono();

  // ── Public routes (no authentication) ───────────────────────────────────────

  api.post('/auth/login', strictRateLimiter(), login);
  api.post('/auth/logout', logout);

  // ── Public website API (/public/*) ──────────────────────────────────────────

  const publicAPI = new Hono();
  publicAPI.use('*', publicRateLimiter());

  publicAPI.get('/menu', getPublicMenu);
  publicAPI.get('/categories', getPublicCategories);
  publicAPI.get('/restaurant', getRestaurantInfo);
  publicAPI.get('/health/open-status', getRestaurantInfo); // Debug endpoint
  publicAPI.post('/contact', contactFormRateLimiter(), submitContactForm);
  publicAPI.post('/reservations', contactFormRateLimiter(), csrfProtection, createReservation);

  api.route('/public', publicAPI);

  // ── Customer self-ordering API (/customer/*) ────────────────────────────────

  const customerAPI = new Hono();
  customerAPI.use('*', publicRateLimiter());

  customerAPI.get('/csrf-token', getCSRFToken);
  customerAPI.get('/table/:qr_code', getTableByQRCode);
  customerAPI.post('/orders', csrfProtection, createCustomerOrder);
  customerAPI.post('/orders/:id/payment', csrfProtection, createCustomerPayment);
  customerAPI.post('/orders/:id/survey', csrfProtection, createSurvey);
  customerAPI.get('/orders/:id/notifications', getOrderNotifications);
  customerAPI.put('/notifications/:id/read', markOrderNotificationAsRead);

  api.route('/customer', customerAPI);

  // ── Health check (no auth, no prefix) ───────────────────────────────────────
  api.get('/health', getSystemHealth);

  // ── Protected routes (authentication required) ──────────────────────────────

  const protectedRoutes = new Hono();
  protectedRoutes.use('*', authMiddleware);

  // Auth
  protectedRoutes.get('/auth/me', getCurrentUser);

  // Profile
  protectedRoutes.get('/profile', getProfile);
  protectedRoutes.put('/profile', updateProfile);
  protectedRoutes.put('/profile/password', changePassword);

  // Notifications
  protectedRoutes.get('/notifications', getNotifications);
  protectedRoutes.get('/notifications/counts/unread', getUnreadCounts);
  protectedRoutes.put('/notifications/:id/read', markNotificationRead);
  protectedRoutes.delete('/notifications/:id', deleteNotification);
  protectedRoutes.get('/notifications/preferences', getNotificationPreferences);
  protectedRoutes.put('/notifications/preferences', updateNotificationPreferences);

  // Products & Categories (read-only for all authenticated users)
  protectedRoutes.get('/products', getProducts);
  protectedRoutes.get('/products/:id', getProduct);
  protectedRoutes.get('/categories', getCategories);
  protectedRoutes.get('/categories/:id/products', getProductsByCategory);

  // Tables (read-only for all authenticated users)
  protectedRoutes.get('/tables', getTables);
  protectedRoutes.get('/tables/:id', getTable);
  protectedRoutes.get('/tables/by-location', getTablesByLocation);
  protectedRoutes.get('/tables/status', getTableStatus);

  // Orders (general view for all authenticated users)
  protectedRoutes.get('/orders', getOrders);
  protectedRoutes.get('/orders/:id', getOrder);
  protectedRoutes.get('/orders/:id/status-history', getOrderStatusHistory);
  protectedRoutes.patch('/orders/:id/status', updateOrderStatus);

  // Payments (read-only for all authenticated users)
  protectedRoutes.get('/orders/:id/payments', getPayments);
  protectedRoutes.get('/orders/:id/payment-summary', getPaymentSummary);

  api.route('/', protectedRoutes);

  // ── Server routes (server/admin/manager) ────────────────────────────────────

  const serverRoutes = new Hono();
  serverRoutes.use('*', authMiddleware);
  serverRoutes.use('*', requireRoles(['server', 'admin', 'manager']));

  serverRoutes.post('/orders', forceDineIn, createOrder);
  serverRoutes.post('/products', createProduct);
  serverRoutes.put('/products/:id', updateProduct);

  api.route('/server', serverRoutes);

  // ── Counter routes (counter/admin/manager) ──────────────────────────────────

  const counterRoutes = new Hono();
  counterRoutes.use('*', authMiddleware);
  counterRoutes.use('*', requireRoles(['counter', 'admin', 'manager']));

  counterRoutes.post('/orders', createOrder);
  counterRoutes.post('/orders/:id/payments', processPayment);

  api.route('/counter', counterRoutes);

  // ── Admin routes (admin/manager) ────────────────────────────────────────────

  const adminRoutes = new Hono();
  adminRoutes.use('*', authMiddleware);
  adminRoutes.use('*', requireRoles(['admin', 'manager']));

  // Dashboard & Reports
  adminRoutes.get('/dashboard/stats', getDashboardStats);
  adminRoutes.get('/reports/sales', getSalesReport);
  adminRoutes.get('/reports/orders', getOrdersReport);
  adminRoutes.get('/reports/income', getIncomeReport);
  adminRoutes.get('/surveys/stats', getSurveyStats);

  // System settings & health
  adminRoutes.get('/settings', getSettings);
  adminRoutes.put('/settings', updateSettings);
  adminRoutes.get('/health', getAdminSystemHealth);

  // Restaurant info & hours
  adminRoutes.put('/restaurant-info', updateRestaurantInfo);
  adminRoutes.put('/operating-hours', updateOperatingHours);

  // Contact management
  adminRoutes.get('/contacts', getContactSubmissions);
  adminRoutes.get('/contacts/:id', getContactSubmission);
  adminRoutes.get('/contacts/counts/new', getNewContactsCount);
  adminRoutes.put('/contacts/:id/status', updateContactStatus);
  adminRoutes.delete('/contacts/:id', deleteContactSubmission);

  // Reservation management
  adminRoutes.get('/reservations', getReservations);
  adminRoutes.get('/reservations/:id', getReservation);
  adminRoutes.get('/reservations/counts/pending', getPendingReservationsCount);
  adminRoutes.patch('/reservations/:id/status', updateReservationStatus);
  adminRoutes.delete('/reservations/:id', deleteReservation);

  // Inventory management
  adminRoutes.get('/inventory', getInventory);
  adminRoutes.get('/inventory/low-stock', getLowStock);
  adminRoutes.get('/inventory/:product_id', getProductInventory);
  adminRoutes.post('/inventory/adjust', adjustStock);
  adminRoutes.get('/inventory/history/:product_id', getStockHistory);

  // Ingredients management
  adminRoutes.get('/ingredients', getIngredients);
  adminRoutes.get('/ingredients/low-stock', getLowStockIngredients);
  adminRoutes.get('/ingredients/:id', getIngredient);
  adminRoutes.post('/ingredients', createIngredient);
  adminRoutes.put('/ingredients/:id', updateIngredient);
  adminRoutes.delete('/ingredients/:id', deleteIngredient);
  adminRoutes.post('/ingredients/restock', restockIngredient);
  adminRoutes.get('/ingredients/:id/history', getIngredientHistory);

  // Menu management (admin paginated versions)
  adminRoutes.get('/products', getProducts);
  adminRoutes.get('/categories', getAdminCategories);
  adminRoutes.post('/categories', createCategory);
  adminRoutes.put('/categories/:id', updateCategory);
  adminRoutes.delete('/categories/:id', deleteCategory);
  adminRoutes.post('/products', createProduct);
  adminRoutes.put('/products/:id', updateProduct);
  adminRoutes.delete('/products/:id', deleteProduct);

  // Recipe/Ingredient configuration for products
  adminRoutes.get('/products/:id/ingredients', getProductIngredients);
  adminRoutes.post('/products/:id/ingredients', addProductIngredient);
  adminRoutes.put('/products/:id/ingredients/:ingredient_id', updateProductIngredient);
  adminRoutes.delete('/products/:id/ingredients/:ingredient_id', deleteProductIngredient);

  // Table management (admin paginated version)
  adminRoutes.get('/tables', getAdminTables);
  adminRoutes.post('/tables', createTable);
  adminRoutes.put('/tables/:id', updateTable);
  adminRoutes.delete('/tables/:id', deleteTable);

  // User management
  adminRoutes.get('/users', getAdminUsers);
  adminRoutes.post('/users', createUser);
  adminRoutes.put('/users/:id', updateUser);
  adminRoutes.delete('/users/:id', deleteUser);

  // Advanced order management (admins can create any order + process payments)
  adminRoutes.post('/orders', createOrder);
  adminRoutes.post('/orders/:id/payments', processPayment);

  // File upload
  adminRoutes.post('/upload', uploadImage);
  adminRoutes.delete('/upload/:filename', deleteImage);

  api.route('/admin', adminRoutes);

  // ── Kitchen routes (kitchen/admin/manager) ──────────────────────────────────

  const kitchenRoutes = new Hono();
  kitchenRoutes.use('*', authMiddleware);
  kitchenRoutes.use('*', requireRoles(['kitchen', 'admin', 'manager']));

  kitchenRoutes.get('/orders', getKitchenOrders);
  kitchenRoutes.patch('/orders/:id/items/:item_id/status', updateOrderItemStatus);

  api.route('/kitchen', kitchenRoutes);

  // Mount all API routes under /api/v1
  app.route('/api/v1', api);
}
