import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReservationsManagement from '../ReservationsManagement';

// Hoisted mocks so the vi.mock factory can reference them
const { mockGet, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}));

// Mock the API client (component uses the named export; keep default for safety)
vi.mock('@/api/client', () => ({
  default: { get: mockGet, patch: mockPatch, delete: mockDelete },
  apiClient: { get: mockGet, patch: mockPatch, delete: mockDelete },
}));

// Mock toast helpers
vi.mock('@/lib/toast-helpers', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

// Mock CSV utils to avoid download side effects
vi.mock('@/lib/csv-utils', () => ({
  jsonToCSV: vi.fn(() => 'name,email\nBudi,budi@example.com'),
  downloadCSV: vi.fn(),
}));

// Mock i18n — return keys (and interpolate the pagination key)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'admin.reservationsPageInfo' && params) {
        return `Page ${params.page} of ${params.total}`;
      }
      return key;
    },
  }),
}));

import { downloadCSV } from '@/lib/csv-utils';

const mockReservations = [
  {
    id: 'res-1',
    customer_name: 'Budi Santoso',
    email: 'budi@example.com',
    phone: '+628123456789',
    party_size: 4,
    reservation_date: '2026-10-01',
    reservation_time: '19:00',
    special_requests: 'Window seat please',
    status: 'pending',
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'res-2',
    customer_name: 'Siti Rahayu',
    email: 'siti@example.com',
    phone: '+628987654321',
    party_size: 2,
    reservation_date: '2026-10-02',
    reservation_time: '18:30',
    status: 'confirmed',
    confirmed_by: 'admin-user-id',
    confirmed_at: '2026-09-21T08:00:00Z',
    created_at: '2026-09-20T11:00:00Z',
    updated_at: '2026-09-21T08:00:00Z',
  },
];

const singlePageResponse = {
  success: true,
  data: mockReservations,
  pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
};

const emptyResponse = {
  success: true,
  data: [],
  pagination: { page: 1, limit: 20, total: 0, total_pages: 1 },
};

const twoPageResponse = {
  success: true,
  data: mockReservations,
  pagination: { page: 1, limit: 20, total: 25, total_pages: 2 },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function renderPage() {
  const Wrapper = createWrapper();
  return render(
    <Wrapper>
      <ReservationsManagement />
    </Wrapper>
  );
}

async function openDetailDialog(reservationName: string) {
  const user = userEvent.setup();
  const nameCell = await screen.findByText(reservationName);
  const row = nameCell.closest('tr');
  expect(row).not.toBeNull();
  await user.click(within(row as HTMLElement).getByRole('button'));
  await screen.findByRole('dialog');
  return user;
}

describe('ReservationsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(singlePageResponse);
    mockPatch.mockResolvedValue({ success: true, message: 'ok', data: mockReservations[0] });
    mockDelete.mockResolvedValue({ success: true, message: 'ok' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the page title and the list of reservations', async () => {
    renderPage();

    expect(screen.getByText('admin.reservationManagement')).toBeInTheDocument();

    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Siti Rahayu')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('budi@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin.statusPending')).toBeInTheDocument();
    expect(screen.getByText('admin.statusConfirmed')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/admin/reservations?')
      );
    });
  });

  it('shows the empty state when there are no reservations', async () => {
    mockGet.mockResolvedValue(emptyResponse);
    renderPage();

    expect(await screen.findByText('admin.noReservationsYet')).toBeInTheDocument();
    expect(screen.getByText('admin.noReservationsYetDesc')).toBeInTheDocument();
  });

  it('exports the reservation list to CSV', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Budi Santoso');

    const exportButton = screen.getByRole('button', { name: 'common.export CSV' });
    expect(exportButton).toBeEnabled();

    await user.click(exportButton);
    expect(downloadCSV).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('reservations-'));
  });

  it('passes the date filter to the API and resets it', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Budi Santoso');

    const dateInput = screen.getByLabelText('admin.reservationDate');
    fireEvent.change(dateInput, { target: { value: '2026-10-01' } });

    await waitFor(() => {
      const calls = mockGet.mock.calls.map((call) => call[0] as string);
      expect(calls.some((url) => url.includes('date=2026-10-01'))).toBe(true);
    });

    const resetButton = screen.getByRole('button', { name: 'admin.resetFilter' });
    await user.click(resetButton);

    await waitFor(() => {
      const lastCall = mockGet.mock.calls[mockGet.mock.calls.length - 1][0] as string;
      expect(lastCall).not.toContain('date=');
    });
  });

  it('opens the detail dialog with reservation information', async () => {
    renderPage();
    await openDetailDialog('Budi Santoso');

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('admin.reservationDetail')).toBeInTheDocument();
    expect(within(dialog).getByText('Window seat please')).toBeInTheDocument();
    expect(within(dialog).getByText('+628123456789')).toBeInTheDocument();
    expect(within(dialog).getByText('19:00')).toBeInTheDocument();
  });

  it('shows confirmed-by information for confirmed reservations', async () => {
    renderPage();
    await openDetailDialog('Siti Rahayu');

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/admin.reservationConfirmedBy/)).toBeInTheDocument();
  });

  it('updates the reservation status with notes', async () => {
    const user = userEvent.setup();
    renderPage();
    await openDetailDialog('Budi Santoso');

    const dialog = screen.getByRole('dialog');

    const notesArea = within(dialog).getByLabelText('admin.reservationNotes');
    await user.type(notesArea, 'Confirmed by phone');

    await user.click(within(dialog).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'admin.statusConfirmed' }));

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/admin/reservations/res-1/status', {
        status: 'confirmed',
        notes: 'Confirmed by phone',
      });
    });
  });

  it('deletes the reservation after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    renderPage();
    await openDetailDialog('Budi Santoso');

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'common.delete' }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/admin/reservations/res-1');
    });
  });

  it('does not delete when confirmation is dismissed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    renderPage();
    await openDetailDialog('Budi Santoso');

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'common.delete' }));

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('paginates to the next page', async () => {
    mockGet.mockResolvedValue(twoPageResponse);
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: 'common.next' });
    expect(screen.getByRole('button', { name: 'common.previous' })).toBeDisabled();

    await user.click(nextButton);

    await waitFor(() => {
      const calls = mockGet.mock.calls.map((call) => call[0] as string);
      expect(calls.some((url) => url.includes('page=2'))).toBe(true);
    });
  });
});
