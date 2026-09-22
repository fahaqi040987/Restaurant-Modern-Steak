import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CounterInterface } from '../CounterInterface';
import type { Order } from '@/types';

// Mock react-router hooks not used in component but imported transitively — keep no-op
vi.mock('@/lib/toast-helpers', () => ({
  toastHelpers: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
  showInfoToast: vi.fn(),
  showWarningToast: vi.fn(),
}));

// Identity i18n mock (same convention as Checkout.test.tsx)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Auth mock
vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Cashier', role: 'counter' },
    isAuthenticated: true,
  }),
}));

// API client mock
vi.mock('@/api/client', () => ({
  default: {
    getCategories: vi.fn(),
    getProducts: vi.fn(),
    getTables: vi.fn(),
    getOrders: vi.fn(),
    createCounterOrder: vi.fn(),
    processCounterPayment: vi.fn(),
    getActivePaymentMethods: vi.fn(),
  },
  apiClient: {
    getCategories: vi.fn(),
    getProducts: vi.fn(),
    getTables: vi.fn(),
    getOrders: vi.fn(),
    createCounterOrder: vi.fn(),
    processCounterPayment: vi.fn(),
    getActivePaymentMethods: vi.fn(),
  },
}));

import apiClient from '@/api/client';

const ok = <T,>(data: T) => ({ success: true, message: 'ok', data });

const paymentMethods = [
  { id: 'pm-1', code: 'cash', label: 'Tunai', is_active: true, sort_order: 1, created_at: '', updated_at: '' },
];

const orderWithTax: Order = {
  id: 'order-tax-1',
  order_number: 'ORD-TAX-0001',
  user_id: 'u1',
  customer_name: 'Budi Santoso',
  order_type: 'dine_in' as const,
  status: 'ready' as const,
  subtotal: 370000,
  tax_amount: 25900, // configured tax = 7% — NOT the hardcoded 11% (40700)
  discount_amount: 0,
  total_amount: 395900,
  notes: '',
  created_at: '2026-09-23T10:00:00Z',
  updated_at: '2026-09-23T10:00:00Z',
  items: [],
  table: undefined,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('Counter payment details tax breakdown (regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(apiClient.getActivePaymentMethods).mockResolvedValue(ok(paymentMethods));
    vi.mocked(apiClient.getCategories).mockResolvedValue(ok([]));
    vi.mocked(apiClient.getProducts).mockResolvedValue({
      success: true,
      message: 'ok',
      data: [],
      meta: { current_page: 1, per_page: 50, total: 0, total_pages: 0 },
    });
    vi.mocked(apiClient.getTables).mockResolvedValue(ok([]));
    vi.mocked(apiClient.getOrders).mockResolvedValue({
      success: true,
      message: 'ok',
      data: [orderWithTax],
      meta: { current_page: 1, per_page: 50, total: 1, total_pages: 1 },
    });
  });

  async function openPaymentDetails() {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <CounterInterface />
      </Wrapper>,
    );

    // Switch to the payment tab
    await screen.findByText('Counter / Checkout');
    fireEvent.click(screen.getByRole('button', { name: /Process Payment/i }));

    // Select the pending order
    await screen.findByText('Order #ORD-TAX-0001');
    fireEvent.click(screen.getByText('Order #ORD-TAX-0001').closest('.cursor-pointer') as HTMLElement);

    await screen.findByText('Payment Details');
  }

  it('itemizes subtotal, configured tax and total in payment details', async () => {
    await openPaymentDetails();

    // The order carries a 7% tax (25900) — the cashier must SEE it
    expect(screen.getByText(/Subtotal/i)).toBeInTheDocument();
    expect(screen.getByText('Rp.370.000,-')).toBeInTheDocument();

    expect(screen.getAllByText(/Pajak|Tax/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Rp.25.900,-')).toBeInTheDocument();

    expect(screen.getAllByText(/Total/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rp.395.900,-').length).toBeGreaterThan(0);
  });

  it('shows the effective tax percentage from the configured rate, not a hardcoded 11%', async () => {
    await openPaymentDetails();

    // 25900 / 370000 = 7% — label must reflect the order's own data
    expect(screen.getByText(/7%/)).toBeInTheDocument();
    expect(screen.queryByText(/11%/)).not.toBeInTheDocument();
  });
});
