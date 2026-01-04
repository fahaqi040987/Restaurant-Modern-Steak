import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboard } from '../AdminDashboard';

// ========================
// T190: Create test file frontend/src/components/admin/__tests__/Dashboard.test.tsx
// ========================

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'admin.dashboardTitle': 'Admin Dashboard',
        'admin.dashboardSubtitle': 'Manage your restaurant operations',
        'admin.welcomeBack': 'Welcome back!',
        'admin.settings': 'Settings',
        'admin.reports': 'Reports',
        'admin.todayOrders': "Today's Orders",
        'admin.todayRevenue': "Today's Revenue",
        'admin.activeOrders': 'Active Orders',
        'admin.occupiedTables': 'Occupied Tables',
        'admin.fromYesterday': 'from yesterday',
        'admin.currentlyProcessed': 'currently being processed',
        'admin.tablesInUse': 'tables in use',
        'admin.incomeReport': 'Income Report',
        'admin.incomeDescription': 'Detailed breakdown of revenue',
        'admin.today': 'Today',
        'admin.week': 'Week',
        'admin.month': 'Month',
        'admin.totalOrders': 'Total Orders',
        'admin.grossIncome': 'Gross Income',
        'admin.taxCollected': 'Tax Collected',
        'admin.netIncome': 'Net Income',
        'admin.period': 'Period',
        'admin.orders': 'Orders',
        'admin.gross': 'Gross',
        'admin.tax': 'Tax',
        'admin.net': 'Net',
        'admin.noIncomeData': 'No income data available',
        'admin.manageMenu': 'Manage Menu',
        'admin.manageMenuDesc': 'Add, edit, or remove menu items',
        'admin.manageTables': 'Manage Tables',
        'admin.manageTablesDesc': 'Configure dining tables and sections',
        'admin.manageStaff': 'Manage Staff',
        'admin.manageStaffDesc': 'Add, edit staff accounts and permissions',
        'admin.viewReports': 'View Reports',
        'admin.viewReportsDesc': 'Detailed analytics and sales reports',
      }
      return translations[key] || key
    },
    i18n: {
      language: 'en-US',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock the API client
vi.mock('@/api/client', () => ({
  default: {
    getDashboardStats: vi.fn(),
    getIncomeReport: vi.fn(),
  },
}));

// Mock react-router navigation
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

import apiClient from '@/api/client';

const mockDashboardStats = {
  today_orders: 25,
  today_revenue: 5250000,
  active_orders: 8,
  occupied_tables: 12,
};

const mockIncomeReport = {
  summary: {
    total_orders: 150,
    gross_income: 32500000,
    tax_collected: 3575000,
    net_income: 28925000,
  },
  breakdown: [
    { period: '2025-12-30', orders: 25, gross: 5250000, tax: 577500, net: 4672500 },
    { period: '2025-12-29', orders: 28, gross: 5850000, tax: 643500, net: 5206500 },
    { period: '2025-12-28', orders: 22, gross: 4600000, tax: 506000, net: 4094000 },
  ],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();

    (apiClient.getDashboardStats as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: mockDashboardStats,
    });

    (apiClient.getIncomeReport as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: mockIncomeReport,
    });
  });

  // ========================
  // T191: Dashboard_RendersDashboardMetrics
  // ========================

  describe('Dashboard_RendersDashboardMetrics', () => {
    it('renders all dashboard metric cards', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Today's Orders")).toBeInTheDocument();
      });

      expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
      expect(screen.getByText('Active Orders')).toBeInTheDocument();
      expect(screen.getByText('Occupied Tables')).toBeInTheDocument();
    });

    it('displays correct metric values', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Today's orders - may appear multiple times (stats card and income report)
        const elements25 = screen.getAllByText('25');
        expect(elements25.length).toBeGreaterThanOrEqual(1);
      });

      expect(screen.getByText('8')).toBeInTheDocument(); // Active orders
      expect(screen.getByText('12')).toBeInTheDocument(); // Occupied tables
      // Revenue is formatted as IDR currency - may appear in multiple places
      const revenueElements = screen.getAllByText(/5\.250\.000/);
      expect(revenueElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays dashboard title and description', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText(/Manage your restaurant operations/)).toBeInTheDocument();
    });

    it('displays income report section', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Income Report')).toBeInTheDocument();
      });

      expect(screen.getByText(/Detailed breakdown of revenue/)).toBeInTheDocument();
    });

    it('displays income summary values', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Total Orders
      });

      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('Gross Income')).toBeInTheDocument();
      expect(screen.getByText('Tax Collected')).toBeInTheDocument();
      expect(screen.getByText('Net Income')).toBeInTheDocument();
    });
  });

  // ========================
  // T192: Dashboard_ShowsLoadingState
  // ========================

  describe('Dashboard_ShowsLoadingState', () => {
    it('shows loading spinner while fetching data', () => {
      // Never resolve the promise to keep loading state
      (apiClient.getDashboardStats as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise(() => {})
      );

      render(<AdminDashboard />, { wrapper: createWrapper() });

      // Check for the animate-spin spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows loading state for income report while fetching', async () => {
      (apiClient.getDashboardStats as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDashboardStats,
      });

      // Keep income report loading
      (apiClient.getIncomeReport as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise(() => {})
      );

      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Income report section should show loading
      const loadingSpinners = document.querySelectorAll('.animate-spin');
      expect(loadingSpinners.length).toBeGreaterThan(0);
    });
  });

  // ========================
  // T193: Dashboard_ShowsErrorState
  // ========================

  describe('Dashboard_ShowsErrorState', () => {
    it('shows empty state when no income data available', async () => {
      (apiClient.getIncomeReport as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: null,
      });

      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No income data available')).toBeInTheDocument();
      });
    });

    it('displays zero values when stats are empty', async () => {
      (apiClient.getDashboardStats as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: null,
      });

      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Should show 0 values when data is null
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ========================
  // T194: Dashboard_RefreshesData
  // ========================

  describe('Dashboard_RefreshesData', () => {
    it('fetches data on initial render', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(apiClient.getDashboardStats).toHaveBeenCalledTimes(1);
      });

      expect(apiClient.getIncomeReport).toHaveBeenCalledWith('today');
    });

    it('changes period and fetches new income data', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Click on "Week" button to change period
      const weekButton = screen.getByRole('button', { name: /week/i });
      fireEvent.click(weekButton);

      await waitFor(() => {
        expect(apiClient.getIncomeReport).toHaveBeenCalledWith('week');
      });
    });

    it('changes to month period', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Click on "Month" button
      const monthButton = screen.getByRole('button', { name: /month/i });
      fireEvent.click(monthButton);

      await waitFor(() => {
        expect(apiClient.getIncomeReport).toHaveBeenCalledWith('month');
      });
    });

    it('navigates to settings page when settings button clicked', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/admin/settings' });
    });

    it('navigates to reports page when reports button clicked', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      const reportsButton = screen.getByRole('button', { name: /reports/i });
      fireEvent.click(reportsButton);

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/admin/reports' });
    });
  });

  // ========================
  // Additional tests for completeness
  // ========================

  describe('QuickActions', () => {
    it('displays all quick action cards', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Manage Menu')).toBeInTheDocument();
      });

      expect(screen.getByText('Manage Tables')).toBeInTheDocument();
      expect(screen.getByText('Manage Staff')).toBeInTheDocument();
      expect(screen.getByText('View Reports')).toBeInTheDocument();
    });

    it('displays quick action descriptions', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Add, edit, or remove menu items/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Configure dining tables/)).toBeInTheDocument();
      expect(screen.getByText(/Add, edit staff accounts/)).toBeInTheDocument();
      expect(screen.getByText(/Detailed analytics/)).toBeInTheDocument();
    });

    // ========================
    // T009: Quick Action Card Navigation Tests (US1)
    // ========================

    it('navigates to menu page when Manage Menu card is clicked', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Manage Menu')).toBeInTheDocument();
      });

      // Click the Manage Menu card
      const manageMenuCard = screen.getByText('Manage Menu').closest('[class*="cursor-pointer"]');
      expect(manageMenuCard).toBeInTheDocument();
      if (manageMenuCard) {
        fireEvent.click(manageMenuCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/admin/menu' });
    });

    it('navigates to tables page when Manage Tables card is clicked', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Manage Tables')).toBeInTheDocument();
      });

      // Click the Manage Tables card
      const manageTablesCard = screen.getByText('Manage Tables').closest('[class*="cursor-pointer"]');
      expect(manageTablesCard).toBeInTheDocument();
      if (manageTablesCard) {
        fireEvent.click(manageTablesCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/admin/tables' });
    });

    it('navigates to staff page when Manage Staff card is clicked', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Manage Staff')).toBeInTheDocument();
      });

      // Click the Manage Staff card
      const manageStaffCard = screen.getByText('Manage Staff').closest('[class*="cursor-pointer"]');
      expect(manageStaffCard).toBeInTheDocument();
      if (manageStaffCard) {
        fireEvent.click(manageStaffCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/admin/staff' });
    });

    it('navigates to reports page when View Reports card is clicked', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('View Reports')).toBeInTheDocument();
      });

      // Click the View Reports card
      const viewReportsCard = screen.getByText('View Reports').closest('[class*="cursor-pointer"]');
      expect(viewReportsCard).toBeInTheDocument();
      if (viewReportsCard) {
        fireEvent.click(viewReportsCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/admin/reports' });
    });
  });

  describe('IncomeBreakdown', () => {
    it('displays breakdown table headers', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Period')).toBeInTheDocument();
      });

      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Gross')).toBeInTheDocument();
      expect(screen.getByText('Tax')).toBeInTheDocument();
      expect(screen.getByText('Net')).toBeInTheDocument();
    });
  });
});
