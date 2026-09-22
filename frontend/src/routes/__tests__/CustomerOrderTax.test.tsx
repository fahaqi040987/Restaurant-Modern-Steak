import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Router hooks — the route component reads the table code from the URL
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({}),
  useParams: () => ({ tableCode: 'qr-t01' }),
  useNavigate: () => mockNavigate,
}));

vi.mock('@/lib/toast-helpers', () => ({
  toastHelpers: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
  showInfoToast: vi.fn(),
  showWarningToast: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  default: {
    getTableByQRCode: vi.fn(),
    getPublicMenu: vi.fn(),
    getPublicCategories: vi.fn(),
    createCustomerOrder: vi.fn(),
    createCustomerPayment: vi.fn(),
    getPublicPaymentMethods: vi.fn(),
  },
  apiClient: {
    getTableByQRCode: vi.fn(),
    getPublicMenu: vi.fn(),
    getPublicCategories: vi.fn(),
    createCustomerOrder: vi.fn(),
    createCustomerPayment: vi.fn(),
    getPublicPaymentMethods: vi.fn(),
  },
}));

import apiClient from '@/api/client';
import { CustomerOrderPage } from '../order.$tableCode';

const ok = <T,>(data: T) => ({ success: true, message: 'ok', data });

const product = {
  id: 'prod-1',
  name: 'Rendang Wagyu',
  description: 'Premium wagyu',
  price: 370000,
  image_url: '',
  category_id: 'cat-1',
  category_name: 'Steak',
  is_available: true,
};

const serverOrderResponse = {
  order_id: 'order-tax-1',
  order_number: 'QR260923-0001',
  table_number: 'T01',
  subtotal: 370000,
  tax_amount: 25900, // 7% of 370000, computed server-side with the configured rate
  total_amount: 395900,
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

describe('Customer QR order flow — configured tax (regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(apiClient.getTableByQRCode).mockResolvedValue({
      id: 'table-1',
      table_number: 'T01',
      seating_capacity: 4,
    });
    vi.mocked(apiClient.getPublicMenu).mockResolvedValue([product]);
    vi.mocked(apiClient.getPublicCategories).mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Steak',
        description: 'Steak menu',
        color: '#8B4513',
        sort_order: 1,
      },
    ]);
    vi.mocked(apiClient.createCustomerOrder).mockResolvedValue(
      serverOrderResponse,
    );
    vi.mocked(apiClient.createCustomerPayment).mockResolvedValue({
      order_id: 'order-tax-1',
      payment_id: 'pay-1',
      amount: 395900,
      payment_method: 'qris',
      status: 'completed',
      created_at: new Date().toISOString(),
    });
    vi.mocked(apiClient.getPublicPaymentMethods).mockResolvedValue(
      ok([{ id: 'pm-1', code: 'qris', label: 'QRIS', sort_order: 1 }]),
    );
  });

  it('cart shows the pre-tax subtotal; tax is only applied server-side after ordering', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <CustomerOrderPage />
      </Wrapper>,
    );

    // Add the product to the cart
    await screen.findByText('Rendang Wagyu');
    const addButtons = screen.getAllByRole('button', { name: /Add to Order/i });
    await user.click(addButtons[0]);

    // Cart shows the subtotal (370000) — NOT an 11% estimate (410700).
    // The tax-inclusive total (395900 at the configured 7%) only exists
    // after the server creates the order, shown on the payment step.
    await waitFor(() => {
      expect(screen.getAllByText(/Rp\.370\.000,-/).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/Rp\.410\.700,-/)).not.toBeInTheDocument();
  });

  it('payment step itemizes the server-computed subtotal, tax and total', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <CustomerOrderPage />
      </Wrapper>,
    );

    await screen.findByText('Rendang Wagyu');
    const addButtons = screen.getAllByRole('button', { name: /Add to Order/i });
    await user.click(addButtons[0]);

    const placeButton = await screen.findByRole('button', { name: /Place Order/i });
    await user.click(placeButton);

    // Payment step: the tax shown must be the server's tax_amount (25900), not 11% (40700)
    await screen.findByText(/Total Pembayaran/i);
    expect(screen.getByText(/Subtotal/i)).toBeInTheDocument();
    expect(screen.getByText('Rp.370.000,-')).toBeInTheDocument();
    expect(screen.getByText(/Pajak|Tax/i)).toBeInTheDocument();
    expect(screen.getByText('Rp.25.900,-')).toBeInTheDocument();
    expect(screen.getByText('Rp.395.900,-')).toBeInTheDocument();
  });
});
