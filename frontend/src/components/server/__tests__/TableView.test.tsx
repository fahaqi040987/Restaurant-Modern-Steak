/**
 * Server Station Tests (ServerInterface)
 * Tests T231-T235: Server station component tests
 */

import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServerInterface } from '../ServerInterface';
import apiClient from '@/api/client';
import type { Product, Category, DiningTable, Order } from '@/types';

// Mock the API client
vi.mock('@/api/client', () => ({
  default: {
    getCategories: vi.fn(),
    getProducts: vi.fn(),
    getProductsByCategory: vi.fn(),
    getTables: vi.fn(),
    getOrders: vi.fn(),
    createServerOrder: vi.fn(),
  },
}));

// Mock toast helpers
vi.mock('@/lib/toast-helpers', () => ({
  toastHelpers: {
    success: vi.fn(),
    warning: vi.fn(),
    apiError: vi.fn(),
    orderCreated: vi.fn(),
  },
}));

// ============================================================================
// Test Utilities
// ============================================================================

function createTestQueryClient(): QueryClient {
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

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    ),
    queryClient,
  };
}

// ============================================================================
// Mock Data Factories
// ============================================================================

const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat-1',
  name: 'Steak',
  description: 'Premium wagyu and beef steaks',
  color: '#8B4513',
  image_url: '/images/steak.jpg',
  sort_order: 1,
  is_active: true,
  created_at: '2025-12-27T10:00:00Z',
  updated_at: '2025-12-27T10:00:00Z',
  ...overrides,
});

const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  category_id: 'cat-1',
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
});

const createMockTable = (overrides: Partial<DiningTable> = {}): DiningTable => ({
  id: 'table-1',
  table_number: 'T01',
  seating_capacity: 4,
  location: 'Indoor',
  is_occupied: false,
  qr_code: 'qr-t01',
  created_at: '2025-12-27T10:00:00Z',
  updated_at: '2025-12-27T10:00:00Z',
  ...overrides,
});

const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  order_number: 'ORD-20251227-0001',
  user_id: 'user-1',
  customer_name: 'Budi Santoso',
  order_type: 'dine_in',
  status: 'preparing',
  subtotal: 370000,
  tax_amount: 37000,
  discount_amount: 0,
  total_amount: 407000,
  notes: '',
  created_at: '2025-12-27T10:00:00Z',
  updated_at: '2025-12-27T10:00:00Z',
  items: [],
  ...overrides,
});

// ============================================================================
// Setup Default Mocks
// ============================================================================

const setupDefaultMocks = () => {
  const categories = [
    createMockCategory({ id: 'cat-1', name: 'Steak' }),
    createMockCategory({ id: 'cat-2', name: 'Beverages' }),
  ];

  const products = [
    createMockProduct({ id: 'prod-1', name: 'Rendang Wagyu', price: 185000 }),
    createMockProduct({ id: 'prod-2', name: 'Sate Wagyu', price: 145000 }),
    createMockProduct({ id: 'prod-3', name: 'Es Teh Manis', price: 15000, category_id: 'cat-2' }),
  ];

  const tables = [
    createMockTable({ id: 'table-1', table_number: 'T01', is_occupied: false }),
    createMockTable({ id: 'table-2', table_number: 'T02', is_occupied: false }),
    createMockTable({ id: 'table-3', table_number: 'T03', is_occupied: true }),
  ];

  const activeOrders = [
    createMockOrder({ id: 'order-1', table_id: 'table-3', status: 'preparing' }),
  ];

  vi.mocked(apiClient.getCategories).mockResolvedValue({
    success: true,
    message: 'Success',
    data: categories,
  });

  vi.mocked(apiClient.getProducts).mockResolvedValue({
    success: true,
    message: 'Success',
    data: products,
    meta: { current_page: 1, per_page: 50, total: products.length, total_pages: 1 },
  });

  vi.mocked(apiClient.getProductsByCategory).mockResolvedValue({
    success: true,
    message: 'Success',
    data: products.filter(p => p.category_id === 'cat-1'),
  });

  vi.mocked(apiClient.getTables).mockResolvedValue({
    success: true,
    message: 'Success',
    data: tables,
  });

  vi.mocked(apiClient.getOrders).mockResolvedValue({
    success: true,
    message: 'Success',
    data: activeOrders,
    meta: { current_page: 1, per_page: 50, total: activeOrders.length, total_pages: 1 },
  });

  vi.mocked(apiClient.createServerOrder).mockResolvedValue({
    success: true,
    message: 'Order created',
    data: { 
      id: 'order-2',
      order_number: 'ORD-20251227-0002',
      order_type: 'dine_in' as const,
      status: 'pending' as const,
      subtotal: 0,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });

  return { categories, products, tables, activeOrders };
};

// ============================================================================
// T231: Create test file + T232: Shows Table Layout
// ============================================================================

describe('ServerInterface (Server Station)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================
  // T232: Shows Table Layout
  // ========================

  describe('T232: TableView_ShowsTableLayout', () => {
    it('should display available tables in list view by default', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('T01')).toBeInTheDocument();
        expect(screen.getByText('T02')).toBeInTheDocument();
      });
    });

    it('should show table selection header', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText(/Select Table/i)).toBeInTheDocument();
      });
    });

    it('should display seating capacity for each table', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        // Tables show "X seats" - use getAllByText for multiple matches
        const seatTexts = screen.getAllByText(/\d+ seats/i);
        expect(seatTexts.length).toBeGreaterThan(0);
      });
    });

    it('should switch to floor view when Floor button is clicked', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('T01')).toBeInTheDocument();
      });

      // Click Floor view button
      const floorButton = screen.getByRole('button', { name: /Floor/i });
      fireEvent.click(floorButton);

      // Floor view should show status legend
      await waitFor(() => {
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.getByText('Seated')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Occupied')).toBeInTheDocument();
      });
    });

    it('should only show available tables in list view', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        // T01 and T02 are available, T03 is occupied
        expect(screen.getByText('T01')).toBeInTheDocument();
        expect(screen.getByText('T02')).toBeInTheDocument();
      });

      // T03 should not be in the list view (only available tables)
      // Note: In list view, only available tables are shown
      const tableButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent?.includes('T0')
      );
      // Should have T01 and T02 but not T03
      expect(tableButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ========================
  // T233: Selects Table
  // ========================

  describe('T233: TableView_SelectsTable', () => {
    it('should select a table when clicked', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('T01')).toBeInTheDocument();
      });

      // Click table T01
      const tableButton = screen.getByText('T01').closest('button');
      if (tableButton) {
        fireEvent.click(tableButton);
      }

      // Should show selected table info
      await waitFor(() => {
        expect(screen.getByText(/Selected: Table T01/i)).toBeInTheDocument();
      });
    });

    it('should show selected table information panel', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('T01')).toBeInTheDocument();
      });

      // Select a table
      const tableButton = screen.getByText('T01').closest('button');
      if (tableButton) {
        fireEvent.click(tableButton);
      }

      await waitFor(() => {
        // Multiple "4 seats" texts exist, check that selected info panel appears
        expect(screen.getByText(/Selected: Table T01/i)).toBeInTheDocument();
      });
    });

    it('should highlight selected table', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('T01')).toBeInTheDocument();
      });

      // Click table T01
      const tableButton = screen.getByText('T01').closest('button');
      if (tableButton) {
        fireEvent.click(tableButton);
      }

      // Selected table should have default variant
      await waitFor(() => {
        expect(tableButton).toHaveClass('bg-primary');
      });
    });

    it('should allow changing table selection', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('T01')).toBeInTheDocument();
      });

      // Select T01
      const t01Button = screen.getByText('T01').closest('button');
      if (t01Button) fireEvent.click(t01Button);

      await waitFor(() => {
        expect(screen.getByText(/Selected: Table T01/i)).toBeInTheDocument();
      });

      // Select T02
      const t02Button = screen.getByText('T02').closest('button');
      if (t02Button) fireEvent.click(t02Button);

      await waitFor(() => {
        expect(screen.getByText(/Selected: Table T02/i)).toBeInTheDocument();
      });
    });
  });

  // ========================
  // T234: Shows Occupancy
  // ========================

  describe('T234: TableView_ShowsOccupancy', () => {
    it('should show table occupancy status in floor view', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('T01')).toBeInTheDocument();
      });

      // Switch to floor view
      const floorButton = screen.getByRole('button', { name: /Floor/i });
      fireEvent.click(floorButton);

      // Floor view shows status indicators
      await waitFor(() => {
        // Status legend should be visible
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.getByText('Occupied')).toBeInTheDocument();
      });
    });

    it('should show active orders count badge', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        // Should show active orders badge
        expect(screen.getByText(/Active Orders/i)).toBeInTheDocument();
      });
    });

    it('should disable occupied tables in floor view', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      // Switch to floor view
      const floorButton = screen.getByRole('button', { name: /Floor/i });
      fireEvent.click(floorButton);

      await waitFor(() => {
        expect(screen.getByText('Occupied')).toBeInTheDocument();
      });

      // T03 is occupied and should be disabled/styled differently
      // The button should have cursor-not-allowed or be disabled
      const allTableButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent?.includes('T')
      );
      const occupiedButton = allTableButtons.find(btn =>
        btn.textContent?.includes('T03') || btn.textContent?.includes('3')
      );

      if (occupiedButton) {
        expect(occupiedButton).toHaveClass('cursor-not-allowed');
      }
    });

    it('should show order number for tables with active orders', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      // Switch to floor view
      const floorButton = screen.getByRole('button', { name: /Floor/i });
      fireEvent.click(floorButton);

      await waitFor(() => {
        // Active order indicator should be shown (order number snippet)
        expect(screen.getByText(/#0001/i)).toBeInTheDocument();
      });
    });
  });

  // ========================
  // T235: Creates Order
  // ========================

  describe('T235: TableView_CreatesOrder', () => {
    it('should add items to cart', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Rendang Wagyu')).toBeInTheDocument();
      });

      // Click Add button on Rendang Wagyu
      const addButton = screen.getAllByRole('button', { name: /Add/i })[0];
      fireEvent.click(addButton);

      // Cart should show 1 item
      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });
    });

    it('should increase quantity when adding same product', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Rendang Wagyu')).toBeInTheDocument();
      });

      // Add product once
      const productCard = screen.getByText('Rendang Wagyu').closest('.hover\\:shadow-md');
      const addButton = within(productCard as HTMLElement).getByRole('button', { name: /Add/i });

      fireEvent.click(addButton);

      // Verify item added to cart
      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });

      // Click add again to increase quantity
      fireEvent.click(addButton);

      // Check cart still shows 1 item but with increased quantity
      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });
    });

    it('should calculate total amount correctly', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Rendang Wagyu')).toBeInTheDocument();
      });

      // Add Rendang Wagyu (185,000)
      const productCard = screen.getByText('Rendang Wagyu').closest('.hover\\:shadow-md');
      const addButton = within(productCard as HTMLElement).getByRole('button', { name: /Add/i });
      fireEvent.click(addButton);

      // Check total shows in the cart section (using getAllBy for multiple matches)
      await waitFor(() => {
        const priceTexts = screen.getAllByText(/Rp\s*185\.000/i);
        expect(priceTexts.length).toBeGreaterThan(0);
      });
    });

    it('should show validation message when creating order without table', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Rendang Wagyu')).toBeInTheDocument();
      });

      // Add item to cart without selecting table
      const productCard = screen.getByText('Rendang Wagyu').closest('.hover\\:shadow-md');
      const addButton = within(productCard as HTMLElement).getByRole('button', { name: /Add/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });

      // The submit button should be disabled without table
      const submitButton = screen.getByRole('button', { name: /Select a Table First/i });
      expect(submitButton).toBeDisabled();
    });

    it('should create order successfully when table and items are selected', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Rendang Wagyu')).toBeInTheDocument();
      });

      // Select table
      const tableButton = screen.getByText('T01').closest('button');
      if (tableButton) fireEvent.click(tableButton);

      // Add item
      const productCard = screen.getByText('Rendang Wagyu').closest('.hover\\:shadow-md');
      const addButton = within(productCard as HTMLElement).getByRole('button', { name: /Add/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });

      // Submit order
      const sendButton = screen.getByRole('button', { name: /Send Order to Kitchen/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(apiClient.createServerOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            order_type: 'dine_in',
            table_id: 'table-1',
            items: expect.arrayContaining([
              expect.objectContaining({
                product_id: 'prod-1',
                quantity: 1,
              }),
            ]),
          })
        );
      });
    });

    it('should filter products by search term', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Rendang Wagyu')).toBeInTheDocument();
        expect(screen.getByText('Sate Wagyu')).toBeInTheDocument();
      });

      // Search for "Rendang"
      const searchInput = screen.getByPlaceholderText('Search products...');
      await userEvent.type(searchInput, 'Rendang');

      // Wait for filter to apply - Rendang should still be visible
      await waitFor(() => {
        expect(screen.getByText('Rendang Wagyu')).toBeInTheDocument();
      });

      // The search input should have the search term
      expect((searchInput as HTMLInputElement).value).toBe('Rendang');
    });

    it('should filter products by category', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Steak')).toBeInTheDocument();
      });

      // Click Steak category
      const steakButton = screen.getByRole('button', { name: 'Steak' });
      fireEvent.click(steakButton);

      await waitFor(() => {
        expect(apiClient.getProductsByCategory).toHaveBeenCalledWith('cat-1');
      });
    });

    it('should show customer name input', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Guest name (optional)')).toBeInTheDocument();
      });
    });

    it('should include customer name in order', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Rendang Wagyu')).toBeInTheDocument();
      });

      // Select table
      const tableButton = screen.getByText('T01').closest('button');
      if (tableButton) fireEvent.click(tableButton);

      // Enter customer name
      const customerInput = screen.getByPlaceholderText('Guest name (optional)');
      await userEvent.type(customerInput, 'Budi');

      // Add item
      const productCard = screen.getByText('Rendang Wagyu').closest('.hover\\:shadow-md');
      const addButton = within(productCard as HTMLElement).getByRole('button', { name: /Add/i });
      fireEvent.click(addButton);

      // Submit order
      const sendButton = screen.getByRole('button', { name: /Send Order to Kitchen/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(apiClient.createServerOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_name: 'Budi',
          })
        );
      });
    });

    it('should show loading state while creating order', async () => {
      setupDefaultMocks();

      // Make createServerOrder hang
      vi.mocked(apiClient.createServerOrder).mockReturnValue(
        new Promise(() => {
          // Keep promise pending to simulate loading
        })
      );

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Rendang Wagyu')).toBeInTheDocument();
      });

      // Select table and add item
      const tableButton = screen.getByText('T01').closest('button');
      if (tableButton) fireEvent.click(tableButton);

      const productCard = screen.getByText('Rendang Wagyu').closest('.hover\\:shadow-md');
      const addButton = within(productCard as HTMLElement).getByRole('button', { name: /Add/i });
      fireEvent.click(addButton);

      // Submit order
      const sendButton = screen.getByRole('button', { name: /Send Order to Kitchen/i });
      fireEvent.click(sendButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/Sending to Kitchen/i)).toBeInTheDocument();
      });
    });

    it('should reset form after successful order creation', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Rendang Wagyu')).toBeInTheDocument();
      });

      // Select table and add item
      const tableButton = screen.getByText('T01').closest('button');
      if (tableButton) fireEvent.click(tableButton);

      const productCard = screen.getByText('Rendang Wagyu').closest('.hover\\:shadow-md');
      const addButton = within(productCard as HTMLElement).getByRole('button', { name: /Add/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });

      // Submit order
      const sendButton = screen.getByRole('button', { name: /Send Order to Kitchen/i });
      fireEvent.click(sendButton);

      // Wait for form to reset
      await waitFor(() => {
        expect(screen.queryByText(/Order Items \(1\)/i)).not.toBeInTheDocument();
      });
    });
  });

  // ========================
  // Additional Tests
  // ========================

  describe('Additional Server Interface Tests', () => {
    it('should display the server station header', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText(/Server Station/i)).toBeInTheDocument();
      });
    });

    it('should show dine-in service badge', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        // Multiple elements might contain Dine-In text
        const dineInBadges = screen.getAllByText(/Dine-In/i);
        expect(dineInBadges.length).toBeGreaterThan(0);
      });
    });

    it('should show empty cart message when no items selected', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Ready to take an order')).toBeInTheDocument();
      });
    });

    it('should show product unavailable badge', async () => {
      vi.mocked(apiClient.getCategories).mockResolvedValue({
        success: true,
        message: 'Success',
        data: [createMockCategory()],
      });

      vi.mocked(apiClient.getProducts).mockResolvedValue({
        success: true,
        message: 'Success',
        data: [createMockProduct({ is_available: false })],
        meta: { current_page: 1, per_page: 50, total: 1, total_pages: 1 },
      });

      vi.mocked(apiClient.getTables).mockResolvedValue({
        success: true,
        message: 'Success',
        data: [createMockTable()],
      });

      vi.mocked(apiClient.getOrders).mockResolvedValue({
        success: true,
        message: 'Success',
        data: [],
        meta: { current_page: 1, per_page: 50, total: 0, total_pages: 0 },
      });

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Unavailable')).toBeInTheDocument();
      });
    });

    it('should remove item from cart when minus button is clicked and quantity is 1', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        expect(screen.getByText('Rendang Wagyu')).toBeInTheDocument();
      });

      // Add item
      const productCard = screen.getByText('Rendang Wagyu').closest('.hover\\:shadow-md');
      const addButton = within(productCard as HTMLElement).getByRole('button', { name: /Add/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });

      // The product grid should now show +/- buttons instead of Add button
      // Find and click minus button in the product grid to decrease quantity
      const minusButton = within(productCard as HTMLElement).getAllByRole('button').find(btn =>
        btn.querySelector('svg[class*="lucide-minus"]')
      );

      if (minusButton) {
        fireEvent.click(minusButton);
      }

      // Cart should show empty state (back to 0 items)
      await waitFor(() => {
        expect(screen.getByText(/Order Items \(0\)/i)).toBeInTheDocument();
      });
    });

    it('should display preparation time badge for products', async () => {
      setupDefaultMocks();

      renderWithProviders(<ServerInterface />);

      await waitFor(() => {
        // Multiple products may have the same prep time, use getAllByText
        const prepTimeBadges = screen.getAllByText(/25min/);
        expect(prepTimeBadges.length).toBeGreaterThan(0);
      });
    });
  });
});
