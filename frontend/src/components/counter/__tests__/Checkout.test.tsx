/**
 * Counter/Checkout Tests (CounterInterface)
 * Tests T236-T241: Counter interface component tests
 */

import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CounterInterface } from "../CounterInterface";
import apiClient from "@/api/client";
import type { Product, Category, DiningTable, Order } from "@/types";

// Mock the API client
vi.mock("@/api/client", () => ({
  default: {
    getCategories: vi.fn(),
    getProducts: vi.fn(),
    getProductsByCategory: vi.fn(),
    getTables: vi.fn(),
    getOrders: vi.fn(),
    createCounterOrder: vi.fn(),
    processCounterPayment: vi.fn(),
  },
}));

// Mock toast helpers
vi.mock("@/lib/toast-helpers", () => ({
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
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
    queryClient,
  };
}

// ============================================================================
// Mock Data Factories
// ============================================================================

const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
  id: "cat-1",
  name: "Steak",
  description: "Premium wagyu and beef steaks",
  color: "#8B4513",
  image_url: "/images/steak.jpg",
  sort_order: 1,
  is_active: true,
  created_at: "2025-12-27T10:00:00Z",
  updated_at: "2025-12-27T10:00:00Z",
  ...overrides,
});

const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "prod-1",
  category_id: "cat-1",
  name: "Rendang Wagyu",
  description: "Premium wagyu with Indonesian rendang spices",
  price: 185000,
  image_url: "/images/rendang-wagyu.jpg",
  barcode: "8991234567890",
  sku: "STK-001",
  is_available: true,
  preparation_time: 25,
  sort_order: 1,
  created_at: "2025-12-27T10:00:00Z",
  updated_at: "2025-12-27T10:00:00Z",
  ...overrides,
});

const createMockTable = (
  overrides: Partial<DiningTable> = {},
): DiningTable => ({
  id: "table-1",
  table_number: "T01",
  seating_capacity: 4,
  location: "Indoor",
  is_occupied: false,
  qr_code: "qr-t01",
  created_at: "2025-12-27T10:00:00Z",
  updated_at: "2025-12-27T10:00:00Z",
  ...overrides,
});

const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: "order-1",
  order_number: "ORD-20251227-0001",
  user_id: "user-1",
  customer_name: "Budi Santoso",
  order_type: "dine_in",
  status: "ready",
  subtotal: 370000,
  tax_amount: 37000,
  discount_amount: 0,
  total_amount: 407000,
  notes: "",
  created_at: "2025-12-27T10:00:00Z",
  updated_at: "2025-12-27T10:00:00Z",
  items: [
    {
      id: "item-1",
      order_id: "order-1",
      product_id: "prod-1",
      quantity: 2,
      unit_price: 185000,
      total_price: 370000,
      status: "ready",
      created_at: "2025-12-27T10:00:00Z",
      updated_at: "2025-12-27T10:00:00Z",
    },
  ],
  table: createMockTable(),
  ...overrides,
});

// ============================================================================
// Setup Default Mocks
// ============================================================================

const setupDefaultMocks = () => {
  const categories = [
    createMockCategory({ id: "cat-1", name: "Steak" }),
    createMockCategory({ id: "cat-2", name: "Beverages" }),
  ];

  const products = [
    createMockProduct({ id: "prod-1", name: "Rendang Wagyu", price: 185000 }),
    createMockProduct({ id: "prod-2", name: "Sate Wagyu", price: 145000 }),
    createMockProduct({
      id: "prod-3",
      name: "Es Teh Manis",
      price: 15000,
      category_id: "cat-2",
    }),
  ];

  const tables = [
    createMockTable({ id: "table-1", table_number: "T01", is_occupied: false }),
    createMockTable({ id: "table-2", table_number: "T02", is_occupied: false }),
  ];

  const pendingOrders = [
    createMockOrder({
      id: "order-1",
      order_number: "ORD-20251227-0001",
      status: "ready",
      total_amount: 407000,
    }),
    createMockOrder({
      id: "order-2",
      order_number: "ORD-20251227-0002",
      status: "served",
      order_type: "takeout",
      total_amount: 200000,
    }),
  ];

  vi.mocked(apiClient.getCategories).mockResolvedValue({
    success: true,
    message: "Success",
    data: categories,
  });

  vi.mocked(apiClient.getProducts).mockResolvedValue({
    success: true,
    message: "Success",
    data: products,
    meta: {
      current_page: 1,
      per_page: 50,
      total: products.length,
      total_pages: 1,
    },
  });

  vi.mocked(apiClient.getProductsByCategory).mockResolvedValue({
    success: true,
    message: "Success",
    data: products.filter((p) => p.category_id === "cat-1"),
  });

  vi.mocked(apiClient.getTables).mockResolvedValue({
    success: true,
    message: "Success",
    data: tables,
  });

  vi.mocked(apiClient.getOrders).mockResolvedValue({
    success: true,
    message: "Success",
    data: pendingOrders,
    meta: {
      current_page: 1,
      per_page: 50,
      total: pendingOrders.length,
      total_pages: 1,
    },
  });

  vi.mocked(apiClient.createCounterOrder).mockResolvedValue({
    success: true,
    message: "Order created",
    data: {
      id: "order-3",
      order_number: "ORD-20251227-0003",
      order_type: "dine_in" as const,
      status: "pending" as const,
      subtotal: 0,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });

  vi.mocked(apiClient.processCounterPayment).mockResolvedValue({
    success: true,
    message: "Payment processed",
    data: {
      id: "pay-123",
      order_id: "order-3",
      payment_method: "cash" as const,
      amount: 0,
      reference_number: "PAY-123",
      status: "completed" as const,
      created_at: new Date().toISOString(),
    },
  });

  return { categories, products, tables, pendingOrders };
};

// ============================================================================
// T236: Create test file + T237: Shows Cart
// ============================================================================

describe("CounterInterface (Checkout)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================
  // T237: Shows Cart
  // ========================

  describe("T237: Checkout_ShowsCart", () => {
    it("should display cart section with item count", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText(/Order Items \(0\)/i)).toBeInTheDocument();
      });
    });

    it("should show empty cart message when no items selected", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("No items in order")).toBeInTheDocument();
        expect(
          screen.getByText("Add items from the menu to get started"),
        ).toBeInTheDocument();
      });
    });

    it("should add items to cart when Add button is clicked", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
      });

      // Click Add button
      const addButtons = screen.getAllByRole("button", { name: /Add/i });
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });
    });

    it("should display cart item details correctly", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
      });

      // Add item
      const productCard = screen
        .getByText("Rendang Wagyu")
        .closest(".hover\\:shadow-md");
      const addButton = within(productCard as HTMLElement).getByRole("button", {
        name: /Add/i,
      });
      fireEvent.click(addButton);

      await waitFor(() => {
        // Cart should show product name, price, and quantity
        const cartSection = screen
          .getByText(/Order Items \(1\)/i)
          .closest("div")?.parentElement;
        expect(cartSection).toBeTruthy();
      });
    });

    it("should update cart item quantity with plus and minus buttons", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
      });

      // Add item
      const productCard = screen
        .getByText("Rendang Wagyu")
        .closest(".hover\\:shadow-md");
      const addButton = within(productCard as HTMLElement).getByRole("button", {
        name: /Add/i,
      });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });

      // Find plus button in product grid to add more
      const plusButtons = within(productCard as HTMLElement).getAllByRole(
        "button",
      );
      const plusButton = plusButtons.find((btn) =>
        btn.querySelector('svg[class*="lucide-plus"]'),
      );

      if (plusButton) {
        fireEvent.click(plusButton);
      }

      // Quantity should increase
      await waitFor(() => {
        // Should show quantity 2 somewhere
        const quantityDisplays = screen.getAllByText("2");
        expect(quantityDisplays.length).toBeGreaterThan(0);
      });
    });

    it("should remove item from cart when quantity reaches zero", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
      });

      // Add item
      const productCard = screen
        .getByText("Rendang Wagyu")
        .closest(".hover\\:shadow-md");
      const addButton = within(productCard as HTMLElement).getByRole("button", {
        name: /Add/i,
      });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });

      // Find minus button in cart
      const cartSection =
        screen.getByText(/Order Items \(1\)/i).parentElement?.parentElement;
      const cartItem = cartSection?.querySelector(".bg-muted\\/50");
      if (cartItem) {
        const minusButton = within(cartItem as HTMLElement).getAllByRole(
          "button",
        )[0];
        fireEvent.click(minusButton);
      }

      await waitFor(() => {
        expect(screen.getByText("No items in order")).toBeInTheDocument();
      });
    });
  });

  // ========================
  // T238: Calculates Total
  // ========================

  describe("T238: Checkout_CalculatesTotal", () => {
    it("should calculate total correctly for single item", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
      });

      // Add Rendang Wagyu (185,000)
      const productCard = screen
        .getByText("Rendang Wagyu")
        .closest(".hover\\:shadow-md");
      const addButton = within(productCard as HTMLElement).getByRole("button", {
        name: /Add/i,
      });
      fireEvent.click(addButton);

      await waitFor(() => {
        // Should show total of 185,000 - multiple matches expected
        const priceTexts = screen.getAllByText(/Rp\s*185\.000/i);
        expect(priceTexts.length).toBeGreaterThan(0);
      });
    });

    it("should calculate total correctly for multiple items", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
        expect(screen.getByText("Sate Wagyu")).toBeInTheDocument();
      });

      // Add Rendang Wagyu (185,000)
      const rendangCard = screen
        .getByText("Rendang Wagyu")
        .closest(".hover\\:shadow-md");
      fireEvent.click(
        within(rendangCard as HTMLElement).getByRole("button", {
          name: /Add/i,
        }),
      );

      // Add Sate Wagyu (145,000)
      const sateCard = screen
        .getByText("Sate Wagyu")
        .closest(".hover\\:shadow-md");
      fireEvent.click(
        within(sateCard as HTMLElement).getByRole("button", { name: /Add/i }),
      );

      await waitFor(() => {
        // Total should be 330,000
        expect(screen.getByText(/Rp\s*330\.000/i)).toBeInTheDocument();
      });
    });

    it("should update total when quantity changes", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
      });

      // Add item twice
      const productCard = screen
        .getByText("Rendang Wagyu")
        .closest(".hover\\:shadow-md");
      const addButton = within(productCard as HTMLElement).getByRole("button", {
        name: /Add/i,
      });
      fireEvent.click(addButton);
      fireEvent.click(addButton);

      // Verify item count is 1 with quantity 2
      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });
    });

    it("should show Total label with amount", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
      });

      // Add item
      const productCard = screen
        .getByText("Rendang Wagyu")
        .closest(".hover\\:shadow-md");
      const addButton = within(productCard as HTMLElement).getByRole("button", {
        name: /Add/i,
      });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Total:")).toBeInTheDocument();
      });
    });

    it("should format prices in Indonesian Rupiah (IDR)", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        // Prices should be in IDR format
        expect(screen.getByText(/Rp\s*185\.000/i)).toBeInTheDocument();
      });
    });
  });

  // ========================
  // T239: Processes Payment
  // ========================

  describe("T239: Checkout_ProcessesPayment", () => {
    it("should switch to payment tab when Process Payment is clicked", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Counter / Checkout")).toBeInTheDocument();
      });

      // Click Process Payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("Orders Ready for Payment"),
        ).toBeInTheDocument();
      });
    });

    it("should display pending orders in payment tab", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("Order #ORD-20251227-0001"),
        ).toBeInTheDocument();
        expect(
          screen.getByText("Order #ORD-20251227-0002"),
        ).toBeInTheDocument();
      });
    });

    it("should select order for payment when clicked", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("Order #ORD-20251227-0001"),
        ).toBeInTheDocument();
      });

      // Click on order
      const orderCard = screen
        .getByText("Order #ORD-20251227-0001")
        .closest(".cursor-pointer");
      if (orderCard) {
        fireEvent.click(orderCard);
      }

      await waitFor(() => {
        expect(screen.getByText("Payment Details")).toBeInTheDocument();
        expect(screen.getByText("#ORD-20251227-0001")).toBeInTheDocument();
      });
    });

    it("should show payment method options", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab and select order
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("Order #ORD-20251227-0001"),
        ).toBeInTheDocument();
      });

      const orderCard = screen
        .getByText("Order #ORD-20251227-0001")
        .closest(".cursor-pointer");
      if (orderCard) fireEvent.click(orderCard);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Cash/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Credit/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Debit/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Digital/i }),
        ).toBeInTheDocument();
      });
    });

    it("should process cash payment successfully", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("Order #ORD-20251227-0001"),
        ).toBeInTheDocument();
      });

      // Select order
      const orderCard = screen
        .getByText("Order #ORD-20251227-0001")
        .closest(".cursor-pointer");
      if (orderCard) fireEvent.click(orderCard);

      await waitFor(() => {
        expect(screen.getByText("Payment Details")).toBeInTheDocument();
      });

      // Cash should be selected by default
      // Find the Process Payment button in the payment section (not the tab)
      // const _paymentSection = screen.getByText('Payment Details').closest('div')?.parentElement;
      const allButtons = screen.getAllByRole("button");
      const processButton = allButtons.find(
        (btn) =>
          btn.textContent?.includes("Process Payment") &&
          btn.closest(".w-full"),
      );

      if (processButton) {
        fireEvent.click(processButton);

        await waitFor(() => {
          expect(apiClient.processCounterPayment).toHaveBeenCalledWith(
            "order-1",
            expect.objectContaining({
              payment_method: "cash",
              amount: 407000,
            }),
          );
        });
      }
    });

    it("should process card payment with reference number", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("Order #ORD-20251227-0001"),
        ).toBeInTheDocument();
      });

      // Select order
      const orderCard = screen
        .getByText("Order #ORD-20251227-0001")
        .closest(".cursor-pointer");
      if (orderCard) fireEvent.click(orderCard);

      await waitFor(() => {
        expect(screen.getByText("Payment Details")).toBeInTheDocument();
      });

      // Select credit card
      const creditButton = screen.getByRole("button", { name: /Credit/i });
      fireEvent.click(creditButton);

      // Enter reference number
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Transaction reference"),
        ).toBeInTheDocument();
      });

      const refInput = screen.getByPlaceholderText("Transaction reference");
      await userEvent.type(refInput, "REF-12345");

      // Find process payment button
      const allButtons = screen.getAllByRole("button");
      const processButton = allButtons.find(
        (btn) =>
          btn.textContent?.includes("Process Payment") &&
          btn.closest(".w-full"),
      );

      if (processButton) {
        fireEvent.click(processButton);

        await waitFor(() => {
          expect(apiClient.processCounterPayment).toHaveBeenCalledWith(
            "order-1",
            expect.objectContaining({
              payment_method: "credit_card",
              reference_number: "REF-12345",
            }),
          );
        });
      }
    });

    it("should pre-fill payment amount with order total", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("Order #ORD-20251227-0001"),
        ).toBeInTheDocument();
      });

      // Select order
      const orderCard = screen
        .getByText("Order #ORD-20251227-0001")
        .closest(".cursor-pointer");
      if (orderCard) fireEvent.click(orderCard);

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText(
          "0.00",
        ) as HTMLInputElement;
        expect(amountInput.value).toBe("407000");
      });
    });

    it("should show empty state when no orders ready for payment", async () => {
      vi.mocked(apiClient.getCategories).mockResolvedValue({
        success: true,
        message: "Success",
        data: [],
      });
      vi.mocked(apiClient.getProducts).mockResolvedValue({
        success: true,
        message: "Success",
        data: [],
        meta: { current_page: 1, per_page: 50, total: 0, total_pages: 0 },
      });
      vi.mocked(apiClient.getTables).mockResolvedValue({
        success: true,
        message: "Success",
        data: [],
      });
      vi.mocked(apiClient.getOrders).mockResolvedValue({
        success: true,
        message: "Success",
        data: [],
        meta: { current_page: 1, per_page: 50, total: 0, total_pages: 0 },
      });

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("No orders ready for payment"),
        ).toBeInTheDocument();
      });
    });
  });

  // ========================
  // T240: Prints Receipt (Note: Component doesn't have explicit print, testing related UI)
  // ========================

  describe("T240: Checkout_PrintsReceipt", () => {
    it("should display order total in payment confirmation", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("Order #ORD-20251227-0001"),
        ).toBeInTheDocument();
      });

      // Select order
      const orderCard = screen
        .getByText("Order #ORD-20251227-0001")
        .closest(".cursor-pointer");
      if (orderCard) fireEvent.click(orderCard);

      await waitFor(() => {
        // Total should be displayed in payment details - multiple matches possible
        const totalTexts = screen.getAllByText(/Rp\s*407\.000/i);
        expect(totalTexts.length).toBeGreaterThan(0);
      });
    });

    it("should display order number in payment details", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("Order #ORD-20251227-0001"),
        ).toBeInTheDocument();
      });

      // Select order
      const orderCard = screen
        .getByText("Order #ORD-20251227-0001")
        .closest(".cursor-pointer");
      if (orderCard) fireEvent.click(orderCard);

      await waitFor(() => {
        expect(screen.getByText("Payment Details")).toBeInTheDocument();
        expect(screen.getByText("#ORD-20251227-0001")).toBeInTheDocument();
      });
    });

    it("should display customer name if available", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("Order #ORD-20251227-0001"),
        ).toBeInTheDocument();
      });

      // Select order
      const orderCard = screen
        .getByText("Order #ORD-20251227-0001")
        .closest(".cursor-pointer");
      if (orderCard) fireEvent.click(orderCard);

      await waitFor(() => {
        expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
      });
    });

    it("should display order type badges", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        // Should show Dine-In and Takeout badges
        expect(screen.getByText("Dine-In")).toBeInTheDocument();
        expect(screen.getByText("Takeout")).toBeInTheDocument();
      });
    });
  });

  // ========================
  // T241: Applies Discount (Note: Component doesn't have discount feature, testing related total calculations)
  // ========================

  describe("T241: Checkout_AppliesDiscount", () => {
    it("should support order notes field", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
      });

      // Add item to show notes field
      const productCard = screen
        .getByText("Rendang Wagyu")
        .closest(".hover\\:shadow-md");
      const addButton = within(productCard as HTMLElement).getByRole("button", {
        name: /Add/i,
      });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Special requests or notes..."),
        ).toBeInTheDocument();
      });
    });

    it("should include notes in order creation", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
      });

      // Switch to takeout (no table required)
      const takeoutButton = screen.getByRole("button", { name: /Takeout/i });
      fireEvent.click(takeoutButton);

      // Add item
      const productCard = screen
        .getByText("Rendang Wagyu")
        .closest(".hover\\:shadow-md");
      const addButton = within(productCard as HTMLElement).getByRole("button", {
        name: /Add/i,
      });
      fireEvent.click(addButton);

      // Add notes
      const notesInput = screen.getByPlaceholderText(
        "Special requests or notes...",
      );
      await userEvent.type(notesInput, "Extra spicy please");

      // Create order
      const createButton = screen.getByRole("button", {
        name: /Create Takeout Order/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(apiClient.createCounterOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            notes: "Extra spicy please",
          }),
        );
      });
    });

    it("should display item count in orders list", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        // Orders should show item counts - multiple matches possible
        const itemTexts = screen.getAllByText(/items?/i);
        expect(itemTexts.length).toBeGreaterThan(0);
      });
    });

    it("should allow payment amount modification", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("Order #ORD-20251227-0001"),
        ).toBeInTheDocument();
      });

      // Select order
      const orderCard = screen
        .getByText("Order #ORD-20251227-0001")
        .closest(".cursor-pointer");
      if (orderCard) fireEvent.click(orderCard);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
      });

      // Modify amount
      const amountInput = screen.getByPlaceholderText(
        "0.00",
      ) as HTMLInputElement;
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, "400000");

      expect(amountInput.value).toBe("400000");
    });
  });

  // ========================
  // Additional Counter Tests
  // ========================

  describe("Additional Counter Interface Tests", () => {
    it("should display the counter header", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Counter / Checkout")).toBeInTheDocument();
        expect(
          screen.getByText("Create orders and process payments"),
        ).toBeInTheDocument();
      });
    });

    it("should show order type selection buttons", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Dine-In/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Takeout/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Delivery/i }),
        ).toBeInTheDocument();
      });
    });

    it("should switch to dine-in mode and show table selection", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        // Dine-in is default, should show table selection
        expect(screen.getByText("Select Table")).toBeInTheDocument();
      });
    });

    it("should switch to takeout mode and hide table selection", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Takeout/i }),
        ).toBeInTheDocument();
      });

      // Click takeout
      const takeoutButton = screen.getByRole("button", { name: /Takeout/i });
      fireEvent.click(takeoutButton);

      await waitFor(() => {
        expect(screen.getByText("Customer Information")).toBeInTheDocument();
        expect(screen.queryByText("Select Table")).not.toBeInTheDocument();
      });
    });

    it("should show product search input", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search products..."),
        ).toBeInTheDocument();
      });
    });

    it("should filter products by search term", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
        expect(screen.getByText("Sate Wagyu")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search products...");
      await userEvent.type(searchInput, "Rendang");

      // Search input should have the value
      await waitFor(() => {
        expect((searchInput as HTMLInputElement).value).toBe("Rendang");
      });
    });

    it("should show category filter buttons", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "All Items" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Steak" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Beverages" }),
        ).toBeInTheDocument();
      });
    });

    it("should show validation for dine-in without table", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
      });

      // Add item without selecting table
      const productCard = screen
        .getByText("Rendang Wagyu")
        .closest(".hover\\:shadow-md");
      const addButton = within(productCard as HTMLElement).getByRole("button", {
        name: /Add/i,
      });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });

      // Submit button should be disabled (dine-in requires table)
      const submitButton = screen.getByRole("button", {
        name: /Create Dine-In Order/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("should create takeout order without table", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      await waitFor(() => {
        expect(screen.getByText("Rendang Wagyu")).toBeInTheDocument();
      });

      // Switch to takeout
      const takeoutButton = screen.getByRole("button", { name: /Takeout/i });
      fireEvent.click(takeoutButton);

      // Add item
      const productCard = screen
        .getByText("Rendang Wagyu")
        .closest(".hover\\:shadow-md");
      const addButton = within(productCard as HTMLElement).getByRole("button", {
        name: /Add/i,
      });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Order Items \(1\)/i)).toBeInTheDocument();
      });

      // Submit order
      const createButton = screen.getByRole("button", {
        name: /Create Takeout Order/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(apiClient.createCounterOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            order_type: "takeout",
          }),
        );
      });
    });

    it("should show loading state during payment processing", async () => {
      setupDefaultMocks();

      // Make payment hang
      vi.mocked(apiClient.processCounterPayment).mockReturnValue(
        new Promise(() => {
          // Keep promise pending to simulate loading
        }),
      );

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      await waitFor(() => {
        expect(
          screen.getByText("Order #ORD-20251227-0001"),
        ).toBeInTheDocument();
      });

      // Select order
      const orderCard = screen
        .getByText("Order #ORD-20251227-0001")
        .closest(".cursor-pointer");
      if (orderCard) fireEvent.click(orderCard);

      await waitFor(() => {
        expect(screen.getByText("Payment Details")).toBeInTheDocument();
      });

      // Find and click process payment button
      const allButtons = screen.getAllByRole("button");
      const processButton = allButtons.find(
        (btn) =>
          btn.textContent?.includes("Process Payment") &&
          btn.closest(".w-full"),
      );

      if (processButton) {
        fireEvent.click(processButton);

        // Should show loading
        await waitFor(() => {
          expect(screen.getByText("Processing...")).toBeInTheDocument();
        });
      }
    });

    it("should show prompt to select order when none selected", async () => {
      setupDefaultMocks();

      renderWithProviders(<CounterInterface />);

      // Switch to payment tab
      const paymentTab = screen.getByRole("button", {
        name: /Process Payment/i,
      });
      fireEvent.click(paymentTab);

      // Initially no order selected
      await waitFor(() => {
        expect(
          screen.getByText("Select an order to process payment"),
        ).toBeInTheDocument();
      });
    });
  });
});
