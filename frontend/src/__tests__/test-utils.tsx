import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, Mock } from 'vitest';
import type {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  DiningTable,
  Payment,
  APIResponse,
  PaginatedResponse,
  MetaData,
  DashboardStats,
  KitchenOrder,
} from '@/types';

// ============================================================================
// Test Query Client
// ============================================================================

/**
 * Creates a query client configured for testing
 * - Disables retries to make tests faster and more predictable
 * - Disables refetch on window focus
 * - Sets stale time to 0 for fresh data on each test
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================================================
// Custom Render with Providers
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// ============================================================================
// Test IDs - Consistent IDs for fixtures
// ============================================================================

export const TEST_IDS = {
  USER_ADMIN: '11111111-aaaa-4444-8888-aaaaaaaaaaaa',
  USER_MANAGER: '22222222-bbbb-4444-8888-bbbbbbbbbbbb',
  USER_SERVER: '33333333-cccc-4444-8888-cccccccccccc',
  USER_COUNTER: '44444444-dddd-4444-8888-dddddddddddd',
  USER_KITCHEN: '55555555-eeee-4444-8888-eeeeeeeeeeee',
  PRODUCT_1: 'prod1111-1111-4444-8888-111111111111',
  PRODUCT_2: 'prod2222-2222-4444-8888-222222222222',
  CATEGORY_1: 'cat11111-1111-4444-8888-111111111111',
  CATEGORY_2: 'cat22222-2222-4444-8888-222222222222',
  ORDER_1: 'ordr1111-1111-4444-8888-111111111111',
  ORDER_2: 'ordr2222-2222-4444-8888-222222222222',
  TABLE_1: 'tabl1111-1111-4444-8888-111111111111',
  TABLE_2: 'tabl2222-2222-4444-8888-222222222222',
  PAYMENT_1: 'paym1111-1111-4444-8888-111111111111',
} as const;

// ============================================================================
// Mock Factories - User
// ============================================================================

export function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: TEST_IDS.USER_ADMIN,
    username: 'admin',
    email: 'admin@steakkenangan.com',
    first_name: 'System',
    last_name: 'Admin',
    role: 'admin',
    is_active: true,
    created_at: '2025-12-27T10:00:00Z',
    updated_at: '2025-12-27T10:00:00Z',
    ...overrides,
  };
}

export function mockManager(overrides: Partial<User> = {}): User {
  return mockUser({
    id: TEST_IDS.USER_MANAGER,
    username: 'manager1',
    email: 'manager@steakkenangan.com',
    first_name: 'Store',
    last_name: 'Manager',
    role: 'manager',
    ...overrides,
  });
}

export function mockServer(overrides: Partial<User> = {}): User {
  return mockUser({
    id: TEST_IDS.USER_SERVER,
    username: 'server1',
    email: 'server@steakkenangan.com',
    first_name: 'Server',
    last_name: 'Staff',
    role: 'cashier', // Note: API uses 'cashier' for server role
    ...overrides,
  });
}

export function mockKitchen(overrides: Partial<User> = {}): User {
  return mockUser({
    id: TEST_IDS.USER_KITCHEN,
    username: 'kitchen1',
    email: 'kitchen@steakkenangan.com',
    first_name: 'Kitchen',
    last_name: 'Staff',
    role: 'kitchen',
    ...overrides,
  });
}

// ============================================================================
// Mock Factories - Category
// ============================================================================

export function mockCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: TEST_IDS.CATEGORY_1,
    name: 'Steak',
    description: 'Premium wagyu and beef steaks',
    color: '#8B4513',
    image_url: '/images/steak.jpg',
    sort_order: 1,
    is_active: true,
    created_at: '2025-12-27T10:00:00Z',
    updated_at: '2025-12-27T10:00:00Z',
    ...overrides,
  };
}

export function mockCategories(): Category[] {
  return [
    mockCategory(),
    mockCategory({
      id: TEST_IDS.CATEGORY_2,
      name: 'Beverages',
      description: 'Drinks and refreshments',
      color: '#4169E1',
      image_url: '/images/beverages.jpg',
      sort_order: 2,
    }),
  ];
}

// ============================================================================
// Mock Factories - Product
// ============================================================================

export function mockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: TEST_IDS.PRODUCT_1,
    category_id: TEST_IDS.CATEGORY_1,
    name: 'Rendang Wagyu',
    description: 'Premium wagyu with Indonesian rendang spices',
    price: 185000,
    image_url: '/images/rendang-wagyu.jpg',
    barcode: '8991234567890',
    sku: 'STK-001',
    is_available: true,
    preparation_time: 25,
    sort_order: 1,
    created_at: '2025-12-27T10:00:00Z',
    updated_at: '2025-12-27T10:00:00Z',
    ...overrides,
  };
}

export function mockProducts(): Product[] {
  return [
    mockProduct(),
    mockProduct({
      id: TEST_IDS.PRODUCT_2,
      category_id: TEST_IDS.CATEGORY_2,
      name: 'Es Teh Manis',
      description: 'Sweet iced tea',
      price: 15000,
      image_url: '/images/es-teh.jpg',
      barcode: '8991234567891',
      sku: 'BEV-001',
      preparation_time: 5,
      sort_order: 1,
    }),
  ];
}

// ============================================================================
// Mock Factories - DiningTable
// ============================================================================

export function mockTable(overrides: Partial<DiningTable> = {}): DiningTable {
  return {
    id: TEST_IDS.TABLE_1,
    table_number: 'T01',
    seating_capacity: 4,
    location: 'Indoor',
    is_occupied: false,
    qr_code: 'qr-t01',
    created_at: '2025-12-27T10:00:00Z',
    updated_at: '2025-12-27T10:00:00Z',
    ...overrides,
  };
}

export function mockTables(): DiningTable[] {
  return [
    mockTable(),
    mockTable({
      id: TEST_IDS.TABLE_2,
      table_number: 'T02',
      seating_capacity: 6,
      location: 'Outdoor',
      is_occupied: true,
    }),
  ];
}

// ============================================================================
// Mock Factories - OrderItem
// ============================================================================

export function mockOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 'item1111-1111-4444-8888-111111111111',
    order_id: TEST_IDS.ORDER_1,
    product_id: TEST_IDS.PRODUCT_1,
    quantity: 1,
    unit_price: 185000,
    total_price: 185000,
    special_instructions: 'Medium well',
    status: 'pending',
    created_at: '2025-12-27T10:00:00Z',
    updated_at: '2025-12-27T10:00:00Z',
    product: mockProduct(),
    ...overrides,
  };
}

// ============================================================================
// Mock Factories - Order
// ============================================================================

export function mockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: TEST_IDS.ORDER_1,
    order_number: 'ORD-20251227-0001',
    table_id: TEST_IDS.TABLE_1,
    user_id: TEST_IDS.USER_SERVER,
    customer_name: 'Budi Santoso',
    order_type: 'dine_in',
    status: 'pending',
    subtotal: 200000,
    tax_amount: 22000,
    discount_amount: 0,
    total_amount: 222000,
    notes: 'No onions please',
    created_at: '2025-12-27T10:00:00Z',
    updated_at: '2025-12-27T10:00:00Z',
    items: [mockOrderItem()],
    ...overrides,
  };
}

export function mockTakeoutOrder(overrides: Partial<Order> = {}): Order {
  return mockOrder({
    id: TEST_IDS.ORDER_2,
    order_number: 'ORD-20251227-0002',
    table_id: undefined,
    customer_name: 'Siti Rahayu',
    order_type: 'takeout',
    status: 'completed',
    ...overrides,
  });
}

export function mockKitchenOrder(overrides: Partial<KitchenOrder> = {}): KitchenOrder {
  return {
    id: TEST_IDS.ORDER_1,
    order_number: 'ORD-20251227-0001',
    table_id: TEST_IDS.TABLE_1,
    table_number: 'T01',
    order_type: 'dine_in',
    status: 'preparing',
    customer_name: 'Budi Santoso',
    created_at: '2025-12-27T10:00:00Z',
    items: [mockOrderItem()],
    ...overrides,
  };
}

// ============================================================================
// Mock Factories - Payment
// ============================================================================

export function mockPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: TEST_IDS.PAYMENT_1,
    order_id: TEST_IDS.ORDER_1,
    payment_method: 'cash',
    amount: 222000,
    reference_number: 'PAY-20251227-0001',
    status: 'completed',
    processed_by: TEST_IDS.USER_COUNTER,
    processed_at: '2025-12-27T10:30:00Z',
    created_at: '2025-12-27T10:30:00Z',
    ...overrides,
  };
}

// ============================================================================
// Mock Factories - Dashboard Stats
// ============================================================================

export function mockDashboardStats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  return {
    today_orders: 25,
    today_revenue: 5250000,
    active_orders: 8,
    occupied_tables: 12,
    ...overrides,
  };
}

// ============================================================================
// API Mock Helpers
// ============================================================================

/**
 * Creates a successful API response wrapper
 */
export function mockApiSuccess<T>(data: T, message = 'Success'): APIResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Creates an error API response wrapper
 */
export function mockApiError(error: string, message = 'Error'): APIResponse<null> {
  return {
    success: false,
    message,
    error,
    data: undefined,
  };
}

/**
 * Creates a paginated API response wrapper
 */
export function mockPaginatedResponse<T>(
  data: T[],
  meta: Partial<MetaData> = {}
): PaginatedResponse<T[]> {
  const defaultMeta: MetaData = {
    current_page: 1,
    per_page: 10,
    total: data.length,
    total_pages: Math.ceil(data.length / 10),
    ...meta,
  };

  return {
    success: true,
    message: 'Success',
    data,
    meta: defaultMeta,
  };
}

// ============================================================================
// API Client Mock Helpers
// ============================================================================

type MockedFunction = Mock;

/**
 * Sets up a mock to resolve with success response
 */
export function mockResolveSuccess<T>(mockFn: MockedFunction, data: T): void {
  mockFn.mockResolvedValueOnce(mockApiSuccess(data));
}

/**
 * Sets up a mock to resolve with error response
 */
export function mockResolveError(mockFn: MockedFunction, error: string): void {
  mockFn.mockResolvedValueOnce(mockApiError(error));
}

/**
 * Sets up a mock to reject with network error
 */
export function mockRejectNetwork(mockFn: MockedFunction): void {
  mockFn.mockRejectedValueOnce(new Error('Network Error'));
}

/**
 * Sets up a mock to resolve with paginated response
 */
export function mockResolvePaginated<T>(
  mockFn: MockedFunction,
  data: T[],
  meta?: Partial<MetaData>
): void {
  mockFn.mockResolvedValueOnce(mockPaginatedResponse(data, meta));
}

// ============================================================================
// Fetch Mock Helpers
// ============================================================================

/**
 * Creates a mock Response object for fetch
 */
export function createMockResponse<T>(data: T, options: ResponseInit = {}): Response {
  const body = JSON.stringify(data);
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
}

/**
 * Sets up global fetch to return success response
 */
export function mockFetchSuccess<T>(data: T): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    createMockResponse(mockApiSuccess(data))
  );
}

/**
 * Sets up global fetch to return error response
 */
export function mockFetchError(error: string, status = 400): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    createMockResponse(mockApiError(error), { status })
  );
}

/**
 * Sets up global fetch to reject with network error
 */
export function mockFetchNetworkError(): void {
  vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network Error'));
}

// ============================================================================
// LocalStorage Mock Helpers
// ============================================================================

export function mockLocalStorage(): {
  getItem: Mock;
  setItem: Mock;
  removeItem: Mock;
  clear: Mock;
} {
  const store: Record<string, string> = {};

  const getItem = vi.fn((key: string) => store[key] ?? null);
  const setItem = vi.fn((key: string, value: string) => {
    store[key] = value;
  });
  const removeItem = vi.fn((key: string) => {
    delete store[key];
  });
  const clear = vi.fn(() => {
    Object.keys(store).forEach((key) => delete store[key]);
  });

  Object.defineProperty(window, 'localStorage', {
    value: { getItem, setItem, removeItem, clear },
    writable: true,
  });

  return { getItem, setItem, removeItem, clear };
}

/**
 * Sets up localStorage with auth token
 */
export function mockAuthToken(token = 'test-jwt-token'): void {
  const { setItem } = mockLocalStorage();
  setItem('token', token);
}

// ============================================================================
// Timer Helpers
// ============================================================================

/**
 * Waits for a specified number of milliseconds
 * Use with vi.useFakeTimers() and vi.advanceTimersByTime()
 */
export function waitForMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Flushes all pending promises
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// ============================================================================
// Currency Helpers (Indonesian Rupiah)
// ============================================================================

/**
 * Formats number as Indonesian Rupiah
 */
export function formatIDR(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Checks if string contains valid IDR format
 */
export function isValidIDRFormat(value: string): boolean {
  // Matches "Rp 1.000" or "Rp1.000" or "IDR 1,000"
  return /^(Rp\.?\s?|IDR\s?)[\d.,]+$/.test(value);
}

// ============================================================================
// Re-export testing utilities
// ============================================================================

export { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
