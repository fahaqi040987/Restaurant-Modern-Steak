import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  APIResponse,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  User,
  Product,
  Category,
  DiningTable,
  Order,
  OrderItem,
  Payment,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  ProcessPaymentRequest,
  PaymentSummary,
  DashboardStats,
  SalesReportItem,
  OrdersReportItem,
  KitchenOrder,
  TableStatus,
  OrderFilters,
  ProductFilters,
  TableFilters,
  OrderStatus,
  // Public API types (B2C Website)
  PublicMenuItem,
  PublicCategory,
  RestaurantInfo,
  ContactFormData,
  ContactFormResponse,
  CreateReservationRequest,
  ReservationResponse,
  UpdateRestaurantInfoRequest,
  UpdateOperatingHoursRequest,
  // Upload types
  UploadResponse,
  // T082-T083: QR ordering types
  CreatePaymentRequest,
  PaymentConfirmation,
  CreateSurveyRequest,
  SatisfactionSurvey,
  SurveyStatsResponse,
  OrderNotification,
  GetNotificationsResponse,
} from '@/types';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8080/api/v1';
    console.log('🔧 API Client baseURL:', apiUrl);
    console.log('🔧 Environment VITE_API_URL:', import.meta.env?.VITE_API_URL);

    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('pos_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('pos_token');
          localStorage.removeItem('pos_user');
          // Redirect to login page
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Helper method to handle API responses
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  }

  // Generic HTTP methods for backward compatibility
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<APIResponse<LoginResponse>> {
    return this.request({
      method: 'POST',
      url: '/auth/login',
      data: credentials,
    });
  }

  async logout(): Promise<APIResponse> {
    return this.request({
      method: 'POST',
      url: '/auth/logout',
    });
  }

  async getCurrentUser(): Promise<APIResponse<User>> {
    return this.request({
      method: 'GET',
      url: '/auth/me',
    });
  }

  // Product endpoints
  async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product[]>> {
    return this.request({
      method: 'GET',
      url: '/products',
      params: filters,
    });
  }

  async getProduct(id: string): Promise<APIResponse<Product>> {
    return this.request({
      method: 'GET',
      url: `/products/${id}`,
    });
  }

  async getCategories(activeOnly = true): Promise<APIResponse<Category[]>> {
    return this.request({
      method: 'GET',
      url: '/categories',
      params: { active_only: activeOnly },
    });
  }

  async getProductsByCategory(categoryId: string, availableOnly = true): Promise<APIResponse<Product[]>> {
    return this.request({
      method: 'GET',
      url: `/categories/${categoryId}/products`,
      params: { available_only: availableOnly },
    });
  }

  // Table endpoints
  async getTables(filters?: TableFilters): Promise<APIResponse<DiningTable[]>> {
    return this.request({
      method: 'GET',
      url: '/tables',
      params: filters,
    });
  }

  async getTable(id: string): Promise<APIResponse<DiningTable>> {
    return this.request({
      method: 'GET',
      url: `/tables/${id}`,
    });
  }

  async getTablesByLocation(): Promise<APIResponse<any[]>> {
    return this.request({
      method: 'GET',
      url: '/tables/by-location',
    });
  }

  async getTableStatus(): Promise<APIResponse<TableStatus>> {
    return this.request({
      method: 'GET',
      url: '/tables/status',
    });
  }

  // Order endpoints
  async getOrders(filters?: OrderFilters): Promise<PaginatedResponse<Order[]>> {
    return this.request({
      method: 'GET',
      url: '/orders',
      params: filters,
    });
  }

  async createOrder(order: CreateOrderRequest): Promise<APIResponse<Order>> {
    return this.request({
      method: 'POST',
      url: '/orders',
      data: order,
    });
  }

  async getOrder(id: string): Promise<APIResponse<Order>> {
    return this.request({
      method: 'GET',
      url: `/orders/${id}`,
    });
  }

  async updateOrderStatus(id: string, status: OrderStatus, notes?: string): Promise<APIResponse<Order>> {
    const statusUpdate: UpdateOrderStatusRequest = { status, notes };
    return this.request({
      method: 'PATCH',
      url: `/orders/${id}/status`,
      data: statusUpdate,
    });
  }

  // Payment endpoints
  async processPayment(orderId: string, payment: ProcessPaymentRequest): Promise<APIResponse<Payment>> {
    return this.request({
      method: 'POST',
      url: `/orders/${orderId}/payments`,
      data: payment,
    });
  }

  async getPayments(orderId: string): Promise<APIResponse<Payment[]>> {
    return this.request({
      method: 'GET',
      url: `/orders/${orderId}/payments`,
    });
  }

  async getPaymentSummary(orderId: string): Promise<APIResponse<PaymentSummary>> {
    return this.request({
      method: 'GET',
      url: `/orders/${orderId}/payment-summary`,
    });
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<APIResponse<DashboardStats>> {
    return this.request({
      method: 'GET',
      url: '/admin/dashboard/stats',
    });
  }

  async getSalesReport(period: 'today' | 'week' | 'month' = 'today'): Promise<APIResponse<SalesReportItem[]>> {
    return this.request({
      method: 'GET',
      url: '/admin/reports/sales',
      params: { period },
    });
  }

  async getOrdersReport(): Promise<APIResponse<OrdersReportItem[]>> {
    return this.request({
      method: 'GET',
      url: '/admin/reports/orders',
    });
  }

  async getIncomeReport(period: 'today' | 'week' | 'month' | 'year' = 'today'): Promise<APIResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/admin/reports/income',
      params: { period },
    });
  }

  // Kitchen endpoints
  async getKitchenOrders(status?: string): Promise<APIResponse<Order[]>> {
    return this.request({
      method: 'GET',
      url: '/kitchen/orders',
      params: status && status !== 'all' ? { status } : {},
    });
  }

  async updateOrderItemStatus(orderId: string, itemId: string, status: string): Promise<APIResponse> {
    return this.request({
      method: 'PATCH',
      url: `/kitchen/orders/${orderId}/items/${itemId}/status`,
      data: { status },
    });
  }

  // Role-specific order creation
  async createServerOrder(order: CreateOrderRequest): Promise<APIResponse<Order>> {
    return this.request({
      method: 'POST',
      url: '/server/orders',
      data: order,
    });
  }

  async createCounterOrder(order: CreateOrderRequest): Promise<APIResponse<Order>> {
    return this.request({
      method: 'POST',
      url: '/counter/orders',
      data: order,
    });
  }

  // Counter payment processing
  async processCounterPayment(orderId: string, payment: ProcessPaymentRequest): Promise<APIResponse<Payment>> {
    return this.request({
      method: 'POST',
      url: `/counter/orders/${orderId}/payments`,
      data: payment,
    });
  }

  // User management endpoints (Admin only)
  async getUsers(params?: { page?: number; limit?: number; search?: string }): Promise<APIResponse<User[]>> {
    return this.request({
      method: 'GET',
      url: '/admin/users',
      params,
    });
  }

  async createUser(userData: any): Promise<APIResponse<User>> {
    return this.request({
      method: 'POST',
      url: '/admin/users',
      data: userData,
    });
  }

  async updateUser(id: string, userData: any): Promise<APIResponse<User>> {
    return this.request({
      method: 'PUT',
      url: `/admin/users/${id}`,
      data: userData,
    });
  }

  async deleteUser(id: string): Promise<APIResponse> {
    return this.request({
      method: 'DELETE',
      url: `/admin/users/${id}`,
    });
  }

  // Admin-specific product management
  async createProduct(productData: {
    category_id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    barcode?: string;
    sku?: string;
    is_available?: boolean;
    preparation_time?: number;
    sort_order?: number;
  }): Promise<APIResponse<Product>> {
    return this.request({ method: 'POST', url: '/admin/products', data: productData });
  }

  async updateProduct(id: string, productData: {
    category_id?: string;
    name?: string;
    description?: string;
    price?: number;
    image_url?: string;
    barcode?: string;
    sku?: string;
    is_available?: boolean;
    preparation_time?: number;
    sort_order?: number;
  }): Promise<APIResponse<Product>> {
    return this.request({ method: 'PUT', url: `/admin/products/${id}`, data: productData });
  }

  async deleteProduct(id: string): Promise<APIResponse> {
    return this.request({ method: 'DELETE', url: `/admin/products/${id}` });
  }

  // Admin-specific category management  
  async createCategory(categoryData: any): Promise<APIResponse<Category>> {
    return this.request({ method: 'POST', url: '/admin/categories', data: categoryData });
  }

  async updateCategory(id: string, categoryData: any): Promise<APIResponse<Category>> {
    return this.request({ method: 'PUT', url: `/admin/categories/${id}`, data: categoryData });
  }

  async deleteCategory(id: string): Promise<APIResponse> {
    return this.request({ method: 'DELETE', url: `/admin/categories/${id}` });
  }

  // Admin products endpoint with pagination
  async getAdminProducts(params?: { page?: number, per_page?: number, limit?: number, search?: string, category_id?: string }): Promise<APIResponse<Product[]>> {
    // Normalize params (handle both per_page and limit)
    const normalizedParams = {
      page: params?.page,
      per_page: params?.per_page || params?.limit,
      search: params?.search,
      category_id: params?.category_id
    }

    return this.request({
      method: 'GET',
      url: '/admin/products',
      params: normalizedParams
    });
  }

  // Admin categories endpoint with pagination
  async getAdminCategories(params?: { page?: number, per_page?: number, limit?: number, search?: string, active_only?: boolean }): Promise<APIResponse<Category[]>> {
    // Normalize params (handle both per_page and limit)
    const normalizedParams = {
      page: params?.page,
      per_page: params?.per_page || params?.limit,
      search: params?.search,
      active_only: params?.active_only
    }

    return this.request({
      method: 'GET',
      url: '/admin/categories',
      params: normalizedParams
    });
  }

  // Admin tables endpoint with pagination
  async getAdminTables(params?: { page?: number, limit?: number, search?: string, status?: string }): Promise<APIResponse<DiningTable[]>> {
    return this.request({
      method: 'GET',
      url: '/admin/tables',
      params
    });
  }

  // Admin-specific table management
  async createTable(tableData: any): Promise<APIResponse<DiningTable>> {
    return this.request({ method: 'POST', url: '/admin/tables', data: tableData });
  }

  async updateTable(id: string, tableData: any): Promise<APIResponse<DiningTable>> {
    return this.request({ method: 'PUT', url: `/admin/tables/${id}`, data: tableData });
  }

  async deleteTable(id: string): Promise<APIResponse> {
    return this.request({ method: 'DELETE', url: `/admin/tables/${id}` });
  }

  // ===========================================
  // Profile endpoints (Protected - Auth Required)
  // ===========================================

  async getUserProfile(): Promise<APIResponse<User>> {
    return this.request({
      method: 'GET',
      url: '/profile',
    });
  }

  async updateUserProfile(profileData: {
    first_name?: string;
    last_name?: string;
    email?: string;
  }): Promise<APIResponse<User>> {
    return this.request({
      method: 'PUT',
      url: '/profile',
      data: profileData,
    });
  }

  async changePassword(passwordData: {
    current_password: string;
    new_password: string;
  }): Promise<APIResponse> {
    return this.request({
      method: 'PUT',
      url: '/profile/password',
      data: passwordData,
    });
  }

  // ===========================================
  // Notifications endpoints (Protected - Auth Required)
  // ===========================================

  async getUnreadCounts(): Promise<APIResponse<{
    notifications: number;
  }>> {
    return this.request({
      method: 'GET',
      url: '/notifications/counts/unread',
    });
  }

  async getNotifications(filters?: {
    type?: string;
    is_read?: boolean;
  }): Promise<APIResponse<any[]>> {
    return this.request({
      method: 'GET',
      url: '/notifications',
      params: filters,
    });
  }

  async markNotificationRead(id: string): Promise<APIResponse> {
    return this.request({
      method: 'PUT',
      url: `/notifications/${id}/read`,
    });
  }

  async deleteNotification(id: string): Promise<APIResponse> {
    return this.request({
      method: 'DELETE',
      url: `/notifications/${id}`,
    });
  }

  async getNotificationPreferences(): Promise<APIResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/notifications/preferences',
    });
  }

  async updateNotificationPreferences(preferences: {
    email_enabled?: boolean;
    notification_types?: string[];
    quiet_hours_start?: string;
    quiet_hours_end?: string;
  }): Promise<APIResponse<any>> {
    return this.request({
      method: 'PUT',
      url: '/notifications/preferences',
      data: preferences,
    });
  }

  // ===========================================
  // System Settings endpoints (Admin - Auth Required)
  // ===========================================

  async getSettings(): Promise<APIResponse<Record<string, any>>> {
    return this.request({
      method: 'GET',
      url: '/admin/settings',
    });
  }

  async updateSettings(settings: Record<string, any>): Promise<APIResponse> {
    return this.request({
      method: 'PUT',
      url: '/admin/settings',
      data: settings,
    });
  }

  async getSystemHealth(): Promise<APIResponse<{
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
  }>> {
    return this.request({
      method: 'GET',
      url: '/admin/health',
    });
  }

  // ===========================================
  // Public API endpoints (B2C Website - No Auth Required)
  // ===========================================

  /**
   * Get public menu items with optional filtering
   * @param categoryId - Filter by category ID
   * @param search - Search term for menu items
   * @returns Array of public menu items
   */
  async getPublicMenu(categoryId?: string, search?: string): Promise<PublicMenuItem[]> {
    const response = await this.request<APIResponse<PublicMenuItem[]>>({
      method: 'GET',
      url: '/public/menu',
      params: {
        ...(categoryId && { category_id: categoryId }),
        ...(search && { search }),
      },
    });
    return response.data || [];
  }

  /**
   * Get public categories
   * @returns Array of public categories
   */
  async getPublicCategories(): Promise<PublicCategory[]> {
    const response = await this.request<APIResponse<PublicCategory[]>>({
      method: 'GET',
      url: '/public/categories',
    });
    return response.data || [];
  }

  /**
   * Get restaurant information with operating hours
   * @returns Restaurant info including is_open_now computed field
   */
  async getRestaurantInfo(): Promise<RestaurantInfo> {
    const response = await this.request<APIResponse<RestaurantInfo>>({
      method: 'GET',
      url: '/public/restaurant',
    });
    if (!response.data) {
      throw new Error('Restaurant information not found');
    }
    return response.data;
  }

  /**
   * Update restaurant information (admin only)
   * @param data - Restaurant info data to update
   * @returns Success response
   */
  async updateRestaurantInfo(data: UpdateRestaurantInfoRequest): Promise<APIResponse> {
    return this.request<APIResponse>({
      method: 'PUT',
      url: '/admin/restaurant-info',
      data,
    });
  }

  /**
   * Update restaurant operating hours (admin only)
   * @param data - Operating hours for all 7 days
   * @returns Success response
   */
  async updateOperatingHours(data: UpdateOperatingHoursRequest): Promise<APIResponse> {
    return this.request<APIResponse>({
      method: 'PUT',
      url: '/admin/operating-hours',
      data,
    });
  }

  /**
   * Submit contact form
   * @param data - Contact form data (name, email, subject, message required; phone optional)
   * @returns Contact submission ID
   */
  async submitContactForm(data: ContactFormData): Promise<ContactFormResponse> {
    const response = await this.request<APIResponse<ContactFormResponse>>({
      method: 'POST',
      url: '/public/contact',
      data,
    });
    if (!response.data) {
      throw new Error('Failed to submit contact form');
    }
    return response.data;
  }

  /**
   * Submit reservation request
   * @param data - Reservation form data (customer_name, email, phone, party_size, reservation_date, reservation_time required)
   * @returns Reservation response with ID and status
   */
  async createReservation(data: CreateReservationRequest): Promise<ReservationResponse> {
    const response = await this.request<APIResponse<ReservationResponse>>({
      method: 'POST',
      url: '/public/reservations',
      data,
    });
    if (!response.data) {
      throw new Error('Failed to submit reservation');
    }
    return response.data;
  }

  // ===========================================
  // Customer Self-Ordering API (No Auth Required)
  // ===========================================

  /**
   * Get table info by QR code for customer self-ordering
   * @param qrCode - QR code scanned from table
   * @returns Table information
   */
  async getTableByQRCode(qrCode: string): Promise<{
    id: string;
    table_number: string;
    seating_capacity: number;
    location?: string;
  }> {
    const response = await this.request<APIResponse<{
      id: string;
      table_number: string;
      seating_capacity: number;
      location?: string;
    }>>({
      method: 'GET',
      url: `/customer/table/${encodeURIComponent(qrCode)}`,
    });
    if (!response.data) {
      throw new Error('Table not found');
    }
    return response.data;
  }

  /**
   * Create order from customer self-ordering (no auth required)
   * @param orderData - Order details including table_id and items
   * @returns Created order info
   */
  async createCustomerOrder(orderData: {
    table_id: string;
    customer_name?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      special_instructions?: string;
    }>;
    notes?: string;
  }): Promise<{
    order_id: string;
    order_number: string;
    table_number: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
  }> {
    const response = await this.request<APIResponse<{
      order_id: string;
      order_number: string;
      table_number: string;
      subtotal: number;
      tax_amount: number;
      total_amount: number;
    }>>({
      method: 'POST',
      url: '/customer/orders',
      data: orderData,
    });
    if (!response.data) {
      throw new Error('Failed to create order');
    }
    return response.data;
  }

  /**
   * T084: Create customer payment for QR-based order (no auth required)
   * @param orderId - UUID of the order
   * @param paymentData - Payment details (payment_method, amount, reference_number)
   * @returns Payment confirmation
   */
  async createCustomerPayment(orderId: string, paymentData: CreatePaymentRequest): Promise<PaymentConfirmation> {
    const response = await this.request<APIResponse<PaymentConfirmation>>({
      method: 'POST',
      url: `/customer/orders/${orderId}/payment`,
      data: paymentData,
    });
    if (!response.data) {
      throw new Error('Failed to process payment');
    }
    return response.data;
  }

  /**
   * T085: Submit satisfaction survey for completed order (no auth required)
   * @param orderId - UUID of the completed order
   * @param surveyData - Survey ratings and comments
   * @returns Survey submission confirmation
   */
  async createSurvey(orderId: string, surveyData: CreateSurveyRequest): Promise<SatisfactionSurvey> {
    const response = await this.request<APIResponse<SatisfactionSurvey>>({
      method: 'POST',
      url: `/customer/orders/${orderId}/survey`,
      data: surveyData,
    });
    if (!response.data) {
      throw new Error('Failed to submit survey');
    }
    return response.data;
  }

  /**
   * T085: Get survey statistics for admin dashboard (requires auth)
   * @returns Aggregated survey statistics
   */
  async getSurveyStats(): Promise<SurveyStatsResponse> {
    const response = await this.request<APIResponse<SurveyStatsResponse>>({
      method: 'GET',
      url: '/admin/surveys/stats',
    });
    if (!response.data) {
      throw new Error('Failed to fetch survey statistics');
    }
    return response.data;
  }

  /**
   * T077: Get order notifications for customer (no auth required)
   * @param orderId - UUID of the order
   * @returns List of notifications and unread count
   */
  async getOrderNotifications(orderId: string): Promise<GetNotificationsResponse> {
    const response = await this.request<APIResponse<GetNotificationsResponse>>({
      method: 'GET',
      url: `/customer/orders/${orderId}/notifications`,
    });
    if (!response.data) {
      throw new Error('Failed to fetch notifications');
    }
    return response.data;
  }

  /**
   * T077: Mark order notification as read (no auth required)
   * @param notificationId - UUID of the notification
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.request({
      method: 'PUT',
      url: `/customer/notifications/${notificationId}/read`,
    });
  }

  // ============================================
  // INGREDIENTS MANAGEMENT
  // ============================================

  /**
   * Get all ingredients with pagination
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 20)
   * @param search - Search query
   * @param lowStockOnly - Filter to show only low stock items
   * @returns Paginated list of ingredients
   */
  async getIngredients(params?: { page?: number; per_page?: number; search?: string; low_stock?: boolean }): Promise<PaginatedResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/admin/ingredients',
      params,
    });
  }

  /**
   * Create a new ingredient
   * @param ingredientData - Ingredient data
   * @returns Created ingredient
   */
  async createIngredient(ingredientData: any): Promise<APIResponse> {
    return this.request({
      method: 'POST',
      url: '/admin/ingredients',
      data: ingredientData,
    });
  }

  /**
   * Update an existing ingredient
   * @param id - Ingredient ID
   * @param ingredientData - Updated ingredient data
   * @returns Success response
   */
  async updateIngredient(id: string, ingredientData: any): Promise<APIResponse> {
    return this.request({
      method: 'PUT',
      url: `/admin/ingredients/${id}`,
      data: ingredientData,
    });
  }

  /**
   * Delete an ingredient
   * @param id - Ingredient ID
   * @returns Success response
   */
  async deleteIngredient(id: string): Promise<APIResponse> {
    return this.request({
      method: 'DELETE',
      url: `/admin/ingredients/${id}`,
    });
  }

  /**
   * Restock an ingredient
   * @param id - Ingredient ID
   * @param quantity - Quantity to add
   * @param notes - Optional notes
   * @returns Updated stock information
   */
  async restockIngredient(id: string, quantity: number, notes?: string): Promise<APIResponse> {
    return this.request({
      method: 'POST',
      url: `/admin/ingredients/${id}/restock`,
      data: { quantity, notes },
    });
  }

  /**
   * Get ingredient stock history
   * @param id - Ingredient ID
   * @returns Stock history records
   */
  async getIngredientHistory(id: string): Promise<APIResponse> {
    return this.request({
      method: 'GET',
      url: `/admin/ingredients/${id}/history`,
    });
  }

  /**
   * Get low stock ingredients
   * @returns List of ingredients below minimum stock
   */
  async getLowStockIngredients(): Promise<APIResponse> {
    return this.request({
      method: 'GET',
      url: '/admin/ingredients/low-stock',
    });
  }

  // ===========================================
  // Contact Submissions (Admin - Auth Required)
  // ===========================================

  /**
   * Get new contacts count for badge
   * @returns Count of new contact submissions
   */
  async getNewContactsCount(): Promise<APIResponse<{ new_contacts: number }>> {
    return this.request({
      method: 'GET',
      url: '/admin/contacts/counts/new',
    });
  }

  // ===========================================
  // Upload endpoints (Admin - Auth Required)
  // ===========================================

  /**
   * Upload an image file
   * @param file - The file to upload
   * @param onProgress - Optional progress callback (0-100)
   * @returns Promise with upload response containing filename and URL
   */
  async uploadImage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<APIResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('pos_token');
    const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8080/api/v1';

    const response = await axios.post<APIResponse<UploadResponse>>(
      `${apiUrl}/admin/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      }
    );

    return response.data;
  }

  /**
   * Delete an uploaded image
   * @param filename - The filename to delete
   */
  async deleteImage(filename: string): Promise<APIResponse> {
    return this.request({
      method: 'DELETE',
      url: `/admin/upload/${encodeURIComponent(filename)}`,
    });
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem('pos_token', token);
  }

  clearAuth(): void {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('pos_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

// Create and export a singleton instance
export const apiClient = new APIClient();
export default apiClient;

// Export specific methods for easier testing and direct imports
export const createReservation = (data: CreateReservationRequest) => apiClient.createReservation(data);

