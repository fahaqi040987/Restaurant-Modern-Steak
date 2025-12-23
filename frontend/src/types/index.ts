// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = any> {
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
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'digital_wallet';
  amount: number;
  reference_number?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  processed_by_user?: User;
}

export interface ProcessPaymentRequest {
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'digital_wallet';
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

