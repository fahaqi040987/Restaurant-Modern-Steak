// API Response Types
export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta: MetaData;
}

export interface MetaData {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'cashier' | 'kitchen';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product Types
export interface Product {
  id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  barcode?: string;
  sku?: string;
  is_available: boolean;
  preparation_time: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

// Table Types
export interface DiningTable {
  id: string;
  table_number: string;
  seating_capacity: number;
  location?: string;
  is_occupied: boolean;
  qr_code?: string;
  created_at: string;
  updated_at: string;
}

// Order Types
export interface Order {
  id: string;
  order_number: string;
  table_id?: string;
  user_id?: string;
  customer_name?: string;
  order_type: 'dine_in' | 'takeout' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  served_at?: string;
  completed_at?: string;
  table?: DiningTable;
  user?: User;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  created_at: string;
  updated_at: string;
  product?: Product;
  notes?: string; // Alternative field name for special instructions
  // Fields added by backend API when fetching orders with product details
  product_name?: string;
  product_description?: string;
}

export interface CreateOrderRequest {
  table_id?: string;
  customer_name?: string;
  order_type: 'dine_in' | 'takeout' | 'delivery';
  items: CreateOrderItem[];
  notes?: string;
}

export interface CreateOrderItem {
  product_id: string;
  quantity: number;
  special_instructions?: string;
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  notes?: string;
}

// Order status type
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

// Payment Types
export interface Payment {
  id: string;
  order_id: string;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'digital_wallet' | 'qris';
  amount: number;
  reference_number?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  processed_by_user?: User;
}

export interface ProcessPaymentRequest {
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'digital_wallet' | 'qris';
  amount: number;
  reference_number?: string;
}

export interface PaymentSummary {
  order_id: string;
  total_amount: number;
  total_paid: number;
  pending_amount: number;
  remaining_amount: number;
  is_fully_paid: boolean;
  payment_count: number;
}

// Cart Types (Frontend Only)
export interface CartItem {
  product: Product;
  quantity: number;
  special_instructions?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
}

// Dashboard Types
export interface DashboardStats {
  today_orders: number;
  today_revenue: number;
  active_orders: number;
  occupied_tables: number;
}

export interface SalesReportItem {
  date: string;
  order_count: number;
  revenue: number;
}

export interface OrdersReportItem {
  status: string;
  count: number;
  avg_amount: number;
}

// Kitchen Types
export interface KitchenOrder {
  id: string;
  order_number: string;
  table_id?: string;
  table_number?: string;
  order_type: string;
  status: string;
  customer_name?: string;
  created_at: string;
  items?: OrderItem[];
}

// Table Status Types
export interface TableStatus {
  total_tables: number;
  occupied_tables: number;
  available_tables: number;
  occupancy_rate: number;
  by_location: LocationStats[];
}

export interface LocationStats {
  location: string;
  total_tables: number;
  occupied_tables: number;
  available_tables: number;
  occupancy_rate: number;
}

// Filter and Query Types
export interface OrderFilters {
  status?: string | string[];
  order_type?: string;
  page?: number;
  per_page?: number;
  limit?: number;
  offset?: number;
}

export interface ProductFilters {
  category_id?: string;
  available?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface TableFilters {
  location?: string;
  occupied_only?: boolean;
  available_only?: boolean;
}

// ===========================================
// Public API Types (B2C Website)
// ===========================================

/**
 * Public menu item returned by GET /api/v1/public/menu
 * Includes category_name for display purposes
 */
export interface PublicMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  category_name: string;
}

/**
 * Public category returned by GET /api/v1/public/categories
 */
export interface PublicCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sort_order: number;
}

/**
 * Operating hours for a restaurant
 * Part of RestaurantInfo response
 */
export interface OperatingHours {
  id: string;
  restaurant_info_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  open_time: string;   // HH:MM:SS format
  close_time: string;  // HH:MM:SS format
  is_closed: boolean;
}

/**
 * Restaurant information returned by GET /api/v1/public/restaurant
 * Includes operating_hours array and computed is_open_now flag
 */
export interface RestaurantInfo {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  address: string;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string;
  email: string;
  whatsapp: string | null;
  map_latitude: number | null;
  map_longitude: number | null;
  google_maps_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  timezone: string;
  is_open_now: boolean;
  operating_hours: OperatingHours[];
}

/**
 * Contact form submission data for POST /api/v1/public/contact
 */
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/**
 * Response from contact form submission
 */
export interface ContactFormResponse {
  id: string;
}

/**
 * Update restaurant info request (admin only)
 */
export interface UpdateRestaurantInfoRequest {
  name: string;
  tagline?: string | null;
  description?: string | null;
  address?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  whatsapp?: string | null;
  map_latitude?: number | null;
  map_longitude?: number | null;
  google_maps_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
  timezone?: string | null;
}

/**
 * Operating hour update for a single day
 */
export interface OperatingHourUpdate {
  day_of_week: number; // 0-6 (Sunday-Saturday)
  open_time: string; // HH:MM format
  close_time: string; // HH:MM format
  is_closed: boolean;
}

/**
 * Update operating hours request (admin only)
 */
export interface UpdateOperatingHoursRequest {
  hours: OperatingHourUpdate[];
}

// ===========================================
// Upload Types
// ===========================================

/**
 * Response from image upload endpoint POST /api/v1/admin/upload
 */
export interface UploadResponse {
  filename: string;
  url: string;
  size: number;
  mime_type: string;
}

// ===========================================
// Reservation Types (Feature: 004-restaurant-management)
// Public website table booking functionality
// ===========================================

/**
 * Reservation status enum
 */
export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

/**
 * Full reservation data (for admin/staff views)
 */
export interface Reservation {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  party_size: number;
  reservation_date: string; // YYYY-MM-DD
  reservation_time: string; // HH:MM
  special_requests?: string;
  status: ReservationStatus;
  notes?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Request payload for creating a reservation (public form)
 */
export interface CreateReservationRequest {
  customer_name: string;
  email: string;
  phone: string;
  party_size: number;
  reservation_date: string; // YYYY-MM-DD
  reservation_time: string; // HH:MM
  special_requests?: string;
}

/**
 * Response from public reservation creation (limited fields)
 */
export interface ReservationResponse {
  id: string;
  status: ReservationStatus;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
}

/**
 * Request payload for updating reservation status (admin)
 */
export interface UpdateReservationStatusRequest {
  status: ReservationStatus;
  notes?: string;
}

/**
 * Query parameters for listing reservations
 */
export interface ReservationListQuery {
  status?: ReservationStatus;
  date?: string;
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata for reservation lists
 */
export interface ReservationPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// T082: Payment types for QR-based customer ordering
export interface CreatePaymentRequest {
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'digital_wallet' | 'qris';
  amount: number;
  reference_number?: string;
}

export interface PaymentConfirmation {
  order_id: string;
  payment_id: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

// T083: Satisfaction survey types for QR-based ordering
export interface CreateSurveyRequest {
  overall_rating: number; // 1-5 required
  food_quality?: number; // 1-5 optional
  service_quality?: number; // 1-5 optional
  ambiance?: number; // 1-5 optional
  value_for_money?: number; // 1-5 optional
  comments?: string;
  would_recommend?: boolean;
  customer_name?: string;
  customer_email?: string;
}

export interface SatisfactionSurvey {
  id: string;
  order_id: string;
  overall_rating: number;
  food_quality?: number;
  service_quality?: number;
  ambiance?: number;
  value_for_money?: number;
  comments?: string;
  would_recommend?: boolean;
  customer_name?: string;
  customer_email?: string;
  created_at: string;
}

export interface SurveyStatsResponse {
  total_surveys: number;
  average_rating: number;
  average_food_quality: number;
  average_service_quality: number;
  average_ambiance: number;
  average_value_for_money: number;
  recommendation_rate: number; // Percentage
  rating_distribution: Record<number, number>; // Count per rating (1-5)
}

// Order notification types for customer updates
export interface OrderNotification {
  id: string;
  order_id: string;
  status: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface GetNotificationsResponse {
  notifications: OrderNotification[];
  unread_count: number;
}

// ===========================================
// Ingredient & Recipe Types (Feature: 007-fix-order-inventory-system)
// Ingredient-based inventory with recipe management
// ===========================================

/**
 * Ingredient represents a raw material used in food preparation
 */
export interface Ingredient {
  id: string;
  name: string;
  description?: string;
  unit: string; // kg, liter, pcs, dozen, box
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit_cost: number; // Cost per unit in IDR
  supplier?: string;
  last_restocked_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * ProductIngredient represents the recipe relationship between a product and its ingredients
 */
export interface ProductIngredient {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity_required: number; // Amount of ingredient per product unit
  created_at: string;
  updated_at: string;
  // Expanded fields (populated via JOIN)
  ingredient_name?: string;
  ingredient_unit?: string;
  current_stock?: number;
}

/**
 * IngredientHistory represents an audit record of ingredient stock changes
 */
export interface IngredientHistory {
  id: string;
  ingredient_id: string;
  order_id?: string; // Reference to order for consumption/cancellation
  operation: 'add' | 'remove' | 'restock' | 'usage' | 'spoilage' | 'adjustment' | 'order_consumption' | 'order_cancellation';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  notes?: string;
  adjusted_by?: string;
  created_at: string;
  adjusted_by_user?: User;
}

// Recipe Request/Response Types

/**
 * Request payload for adding an ingredient to a product's recipe
 */
export interface AddRecipeIngredientRequest {
  ingredient_id: string;
  quantity_required: number;
}

/**
 * Request payload for updating ingredient quantity in a recipe
 */
export interface UpdateRecipeIngredientRequest {
  quantity_required: number;
}

/**
 * Response containing a product's recipe (list of ingredients)
 */
export interface RecipeResponse {
  product_id: string;
  product_name: string;
  ingredients: ProductIngredient[];
}

/**
 * Request payload for bulk updating multiple product recipes
 */
export interface BulkRecipeRequest {
  recipes: BulkRecipeItem[];
}

/**
 * Single product's recipe in bulk update
 */
export interface BulkRecipeItem {
  product_id: string;
  ingredients: AddRecipeIngredientRequest[];
}

/**
 * Response from bulk recipe update
 */
export interface BulkRecipeResponse {
  updated_count: number;
  failed_count: number;
  errors?: BulkRecipeError[];
}

/**
 * Error in bulk recipe update
 */
export interface BulkRecipeError {
  product_id: string;
  error: string;
}

/**
 * Ingredient usage report for analytics
 */
export interface IngredientUsageReport {
  period: UsageReportPeriod;
  ingredients: IngredientUsageItem[];
}

/**
 * Time period for usage reports
 */
export interface UsageReportPeriod {
  start_date: string;
  end_date: string;
}

/**
 * Usage data for a single ingredient
 */
export interface IngredientUsageItem {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  total_used: number;
  total_cost: number; // in IDR
  order_count: number;
}

// ===========================================
// Admin Management Types
// ===========================================

/**
 * Table grouped by location for getTablesByLocation endpoint
 */
export interface TableByLocation {
  location: string;
  tables: DiningTable[];
}

/**
 * Income report summary
 */
export interface IncomeReportSummary {
  total_orders: number;
  gross_income: number;
  tax_collected: number;
  net_income: number;
}

/**
 * Income breakdown item
 */
export interface IncomeBreakdownItem {
  period: string;
  orders: number;
  gross: number;
  tax: number;
  net: number;
}

/**
 * Income report response from admin reports
 */
export interface IncomeReportResponse {
  period: string;
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  data: IncomeReportItem[];
  summary: IncomeReportSummary;
  breakdown: IncomeBreakdownItem[];
}

export interface IncomeReportItem {
  date: string;
  revenue: number;
  order_count: number;
}

/**
 * User creation payload
 */
export interface CreateUserData {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'cashier' | 'kitchen' | 'server' | 'counter';
  is_active?: boolean;
}

/**
 * User update payload
 */
export interface UpdateUserData {
  username?: string;
  password?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'manager' | 'cashier' | 'kitchen' | 'server' | 'counter';
  is_active?: boolean;
}

/**
 * Category creation payload
 */
export interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * Category update payload
 */
export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * Table creation payload
 */
export interface CreateTableData {
  table_number: string;
  seating_capacity: number;
  location?: string;
  is_occupied?: boolean;
  qr_code?: string;
}

/**
 * Table update payload
 */
export interface UpdateTableData {
  table_number?: string;
  seating_capacity?: number;
  location?: string;
  is_occupied?: boolean;
  qr_code?: string;
}

// ===========================================
// Notification Types
// ===========================================

/**
 * User notification
 */
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Notification preferences for a user
 */
export interface NotificationPreferences {
  email_enabled: boolean;
  notification_types: string[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

// ===========================================
// System Settings Types
// ===========================================

/**
 * System settings key-value store
 */
export type SystemSettings = Record<string, string | number | boolean>;

/**
 * System health response
 */
export interface SystemHealth {
  database: {
    status: string;
    latency_ms: number;
    last_check: string;
  };
  api: {
    status: string;
    version: string;
  };
  backup: {
    status: string;
    last_backup: string;
    next_backup: string;
  };
}

// ===========================================
// Ingredient Management Types
// ===========================================

/**
 * Ingredient creation payload
 */
export interface CreateIngredientData {
  name: string;
  description?: string;
  unit: string;
  current_stock?: number;
  minimum_stock?: number;
  maximum_stock?: number;
  unit_cost?: number;
  supplier?: string;
  is_active?: boolean;
}

/**
 * Ingredient update payload
 */
export interface UpdateIngredientData {
  name?: string;
  description?: string;
  unit?: string;
  current_stock?: number;
  minimum_stock?: number;
  maximum_stock?: number;
  unit_cost?: number;
  supplier?: string;
  is_active?: boolean;
}

/**
 * Restock response
 */
export interface RestockResponse {
  ingredient_id: string;
  previous_stock: number;
  added_quantity: number;
  new_stock: number;
}
