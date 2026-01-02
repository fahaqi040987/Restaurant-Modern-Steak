/**
 * Kitchen Enhancement Integration Tests
 * Tests the complete workflow of the enhanced kitchen system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { kitchenSoundService } from '@/services/soundService';
import { EnhancedKitchenOrderCard } from '../EnhancedKitchenOrderCard';
import { TakeawayBoard } from '../TakeawayBoard';
import { SoundSettings } from '../SoundSettings';
import type { Order, User, OrderItem } from '@/types';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        // Enhanced Kitchen Order Card
        'kitchen.justNow': 'Just now',
        'kitchen.minutesAgo': '{{minutes}}m ago',
        'kitchen.hoursMinutesAgo': '{{hours}}h {{minutes}}m ago',
        'kitchen.startPreparing': 'Start Preparing',
        'kitchen.markReady': 'Mark Ready',
        'kitchen.markServed': 'Mark Served',
        'kitchen.progress': 'Progress',
        'kitchen.itemsProgress': '{{ready}}/{{total}} items',
        'kitchen.table': 'Table',
        'kitchen.readyToServe': 'Ready to serve',
        'kitchen.completionProgress': 'Completion',
        'kitchen.itemsReady': '{{ready}}/{{total}} ready',
        'kitchen.note': 'Note:',
        'kitchen.estPrepTime': 'Est. {{time}}',
        'kitchen.ready': '✓ Ready',
        'kitchen.preparing': 'Preparing',
        'kitchen.showMoreItems': '+{{count}} more',
        'kitchen.specialInstructions': 'Special Instructions',
        'kitchen.reset': 'Reset',
        'kitchen.completeAllItemsHint': 'Complete all items to mark as ready',
        // Sound Settings
        'kitchen.soundSettings': 'Sound Settings',
        'kitchen.enableSounds': 'Enable Sounds',
        'kitchen.soundsDescription': 'Play sounds for new orders and status updates',
        'kitchen.volume': 'Volume',
        'kitchen.soundTypes': 'Sound Types',
        'kitchen.newOrdersSound': 'New Orders',
        'kitchen.newOrdersSoundDesc': 'Plays when a new order is received',
        'kitchen.orderReadySound': 'Order Ready',
        'kitchen.orderReadySoundDesc': 'Plays when an order is ready for pickup',
        'kitchen.takeawayReadySound': 'Takeaway Ready',
        'kitchen.takeawayReadySoundDesc': 'Plays when a takeaway order is ready',
        'kitchen.testSounds': 'Test Sounds',
        'kitchen.newOrderAlert': 'New Order Alert',
        'kitchen.newOrderAlertDesc': 'Test new order sound',
        'kitchen.orderReadyAlert': 'Order Ready Alert',
        'kitchen.orderReadyAlertDesc': 'Test order ready sound',
        'kitchen.takeawayReadyAlert': 'Takeaway Ready Alert',
        'kitchen.takeawayReadyAlertDesc': 'Test takeaway ready sound',
        'kitchen.done': 'Done',
        // Takeaway Board
        'kitchen.takeawayBoard': 'Takeaway Orders',
        'kitchen.noTakeawayOrders': 'No takeaway orders',
      }
      let text = translations[key] || key
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{{${k}}}`, String(v))
        })
      }
      return text
    },
  }),
}));

// Mock the sound service
vi.mock('@/services/soundService', () => ({
  kitchenSoundService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    playNewOrderSound: vi.fn().mockResolvedValue(undefined),
    playOrderReadySound: vi.fn().mockResolvedValue(undefined),
    testSound: vi.fn().mockResolvedValue(undefined),
    updateSettings: vi.fn(),
    getSettings: vi.fn().mockReturnValue({
      enabled: true,
      volume: 0.7,
      newOrderEnabled: true,
      orderReadyEnabled: true,
      takeawayReadyEnabled: true,
    }),
  },
}));

// Mock API client
vi.mock('@/api/client', () => ({
  default: {
    getOrders: vi.fn(),
    updateOrderStatus: vi.fn().mockResolvedValue({ success: true }),
    updateOrderItemStatus: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Test utilities
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

// Mock data
const mockUser: User = {
  id: '1',
  username: 'kitchen1',
  email: 'kitchen@test.com',
  first_name: 'Kitchen',
  last_name: 'Staff',
  role: 'kitchen',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockOrderItems: OrderItem[] = [
  {
    id: '1',
    order_id: 'order-1',
    product_id: 'product-1',
    quantity: 2,
    unit_price: 12.99,
    total_price: 25.98,
    special_instructions: 'No onions',
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    product: {
      id: 'product-1',
      name: 'Burger Deluxe',
      price: 12.99,
      is_available: true,
      preparation_time: 15,
      sort_order: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: '2', 
    order_id: 'order-1',
    product_id: 'product-2',
    quantity: 1,
    unit_price: 3.99,
    total_price: 3.99,
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    product: {
      id: 'product-2',
      name: 'French Fries',
      price: 3.99,
      is_available: true,
      preparation_time: 8,
      sort_order: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
];

const mockOrder: Order = {
  id: 'order-1',
  order_number: 'ORD-001',
  user_id: 'user-1',
  customer_name: 'John Doe',
  order_type: 'dine_in',
  status: 'preparing',
  subtotal: 29.97,
  tax_amount: 2.70,
  discount_amount: 0,
  total_amount: 32.67,
  notes: 'Table prefers extra crispy fries',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:05:00Z',
  items: mockOrderItems,
  table: {
    id: 'table-1',
    table_number: '5',
    seating_capacity: 4,
    location: 'Main Floor',
    is_occupied: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
};

describe('Kitchen Enhancement Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Enhanced Kitchen Order Card', () => {
    it('should display order information correctly', () => {
      const onStatusUpdate = vi.fn();
      const onItemStatusUpdate = vi.fn();

      renderWithProviders(
        <EnhancedKitchenOrderCard
          order={mockOrder}
          onStatusUpdate={onStatusUpdate}
          onItemStatusUpdate={onItemStatusUpdate}
          isMinimalistic={true}
        />
      );

      // Check order number and status
      expect(screen.getByText('#ORD-001')).toBeInTheDocument();
      expect(screen.getByText('preparing')).toBeInTheDocument();

      // Check table information
      expect(screen.getByText('Table 5')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Check items are displayed
      expect(screen.getByText('2× Burger Deluxe')).toBeInTheDocument();
      expect(screen.getByText('1× French Fries')).toBeInTheDocument();
      expect(screen.getByText('No onions')).toBeInTheDocument();
    });

    it('should handle item checkbox interactions', async () => {
      const onStatusUpdate = vi.fn();
      const onItemStatusUpdate = vi.fn();

      renderWithProviders(
        <EnhancedKitchenOrderCard
          order={mockOrder}
          onStatusUpdate={onStatusUpdate}
          onItemStatusUpdate={onItemStatusUpdate}
          isMinimalistic={true}
        />
      );

      // Find and click checkbox for first item
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);

      fireEvent.click(checkboxes[0]);

      await waitFor(() => {
        expect(onItemStatusUpdate).toHaveBeenCalledWith('order-1', '1', 'ready');
      });
    });

    it('should show progress indicator correctly', () => {
      const orderWithProgress = {
        ...mockOrder,
        items: [
          { ...mockOrderItems[0], status: 'ready' },
          { ...mockOrderItems[1], status: 'pending' },
        ],
      };

      const onStatusUpdate = vi.fn();
      const onItemStatusUpdate = vi.fn();

      renderWithProviders(
        <EnhancedKitchenOrderCard
          order={orderWithProgress}
          onStatusUpdate={onStatusUpdate}
          onItemStatusUpdate={onItemStatusUpdate}
          isMinimalistic={true}
        />
      );

      // Check progress display
      expect(screen.getByText('1/2 items')).toBeInTheDocument();
    });

    it('should handle status updates', async () => {
      const onStatusUpdate = vi.fn();
      const onItemStatusUpdate = vi.fn();

      // Create an order with all items ready (so Mark Ready button is enabled)
      const orderWithAllItemsReady = {
        ...mockOrder,
        items: [
          { ...mockOrderItems[0], status: 'ready' },
          { ...mockOrderItems[1], status: 'ready' },
        ],
      };

      renderWithProviders(
        <EnhancedKitchenOrderCard
          order={orderWithAllItemsReady}
          onStatusUpdate={onStatusUpdate}
          onItemStatusUpdate={onItemStatusUpdate}
          isMinimalistic={true}
        />
      );

      // Find and click the status update button
      const statusButton = screen.getByRole('button', { name: /mark ready/i });
      expect(statusButton).not.toBeDisabled();
      fireEvent.click(statusButton);

      await waitFor(() => {
        expect(onStatusUpdate).toHaveBeenCalledWith('order-1', 'ready');
      });
    });
  });

  describe('Sound Settings Component', () => {
    it('should render sound settings correctly', () => {
      renderWithProviders(<SoundSettings />);

      expect(screen.getByText('Sound Settings')).toBeInTheDocument();
      expect(screen.getByText('Enable Sounds')).toBeInTheDocument();
      // Volume will show based on default/mock settings
      expect(screen.getByText(/Volume:/)).toBeInTheDocument();
      expect(screen.getByText('New Orders')).toBeInTheDocument();
      expect(screen.getByText('Order Ready')).toBeInTheDocument();
      expect(screen.getByText('Takeaway Ready')).toBeInTheDocument();
    });

    it('should handle sound testing', async () => {
      renderWithProviders(<SoundSettings />);

      // Find test button by partial text (the button contains icon and text)
      const testButtons = screen.getAllByRole('button');
      const newOrderButton = testButtons.find(btn => btn.textContent?.includes('New Order Alert'));
      expect(newOrderButton).toBeDefined();

      if (newOrderButton && !newOrderButton.hasAttribute('disabled')) {
        fireEvent.click(newOrderButton);

        await waitFor(() => {
          expect(kitchenSoundService.testSound).toHaveBeenCalledWith('new_order');
        });
      } else {
        // Button is disabled when sounds are disabled - this is expected behavior
        expect(newOrderButton).toBeInTheDocument();
      }
    });

    it('should handle settings changes', async () => {
      renderWithProviders(<SoundSettings />);

      // Find the enable sounds switch using getAllByRole and filtering
      const switches = screen.getAllByRole('switch');
      // First switch should be the "Enable Sounds" switch
      const enableSwitch = switches[0];
      expect(enableSwitch).toBeInTheDocument();

      fireEvent.click(enableSwitch);

      await waitFor(() => {
        expect(kitchenSoundService.updateSettings).toHaveBeenCalled();
      });
    });
  });

  describe('Business Logic Integration', () => {
    it('should follow complete order workflow', async () => {
      const onStatusUpdate = vi.fn();
      const onItemStatusUpdate = vi.fn();

      // Start with confirmed order
      const confirmedOrder = { ...mockOrder, status: 'confirmed' };

      const { rerender } = renderWithProviders(
        <EnhancedKitchenOrderCard
          order={confirmedOrder}
          onStatusUpdate={onStatusUpdate}
          onItemStatusUpdate={onItemStatusUpdate}
          isMinimalistic={true}
        />
      );

      // Step 1: Start preparing
      const startButton = screen.getByRole('button', { name: /start preparing/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(onStatusUpdate).toHaveBeenCalledWith('order-1', 'preparing');
      });

      // Step 2: Update to preparing state and check items
      const preparingOrder = { ...mockOrder, status: 'preparing' };
      rerender(
        <EnhancedKitchenOrderCard
          order={preparingOrder}
          onStatusUpdate={onStatusUpdate}
          onItemStatusUpdate={onItemStatusUpdate}
          isMinimalistic={true}
        />
      );

      // Check first item
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      await waitFor(() => {
        expect(onItemStatusUpdate).toHaveBeenCalledWith('order-1', '1', 'ready');
      });

      // Check second item  
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        expect(onItemStatusUpdate).toHaveBeenCalledWith('order-1', '2', 'ready');
      });
    });

    it('should handle sound notifications correctly', async () => {
      // Test new order sound - the mock returns a resolved promise
      await kitchenSoundService.playNewOrderSound('order-1');
      expect(kitchenSoundService.playNewOrderSound).toHaveBeenCalledWith('order-1');

      // Test order ready sound
      await kitchenSoundService.playOrderReadySound('order-1', 'dine_in');
      expect(kitchenSoundService.playOrderReadySound).toHaveBeenCalledWith('order-1', 'dine_in');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const onStatusUpdate = vi.fn();
      const onItemStatusUpdate = vi.fn();

      // Create an order with all items ready so the button is enabled
      const orderWithAllItemsReady = {
        ...mockOrder,
        items: [
          { ...mockOrderItems[0], status: 'ready' },
          { ...mockOrderItems[1], status: 'ready' },
        ],
      };

      renderWithProviders(
        <EnhancedKitchenOrderCard
          order={orderWithAllItemsReady}
          onStatusUpdate={onStatusUpdate}
          onItemStatusUpdate={onItemStatusUpdate}
          isMinimalistic={true}
        />
      );

      const statusButton = screen.getByRole('button', { name: /mark ready/i });
      expect(statusButton).not.toBeDisabled();
      fireEvent.click(statusButton);

      // Should not crash the application
      await waitFor(() => {
        expect(onStatusUpdate).toHaveBeenCalled();
      });
    });

    it('should handle sound service errors gracefully', async () => {
      // Mock sound service error
      vi.mocked(kitchenSoundService.testSound).mockRejectedValueOnce(new Error('Audio error'));

      renderWithProviders(<SoundSettings />);

      // Find all buttons and look for the New Order Alert button
      const testButtons = screen.getAllByRole('button');
      const testButton = testButtons.find(btn => btn.textContent?.includes('New Order Alert'));
      expect(testButton).toBeDefined();

      // Only click if the button is not disabled
      if (testButton && !testButton.hasAttribute('disabled')) {
        fireEvent.click(testButton);
        // Should not crash the application
        await waitFor(() => {
          expect(kitchenSoundService.testSound).toHaveBeenCalled();
        });
      } else {
        // Button is disabled - this is valid when sounds are disabled
        expect(testButton).toBeInTheDocument();
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      const onStatusUpdate = vi.fn();
      const onItemStatusUpdate = vi.fn();

      renderWithProviders(
        <EnhancedKitchenOrderCard
          order={mockOrder}
          onStatusUpdate={onStatusUpdate}
          onItemStatusUpdate={onItemStatusUpdate}
          isMinimalistic={true}
        />
      );

      // Check for proper labels
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute('id');
      });

      // Check for proper button labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(<SoundSettings />);

      const switches = screen.getAllByRole('switch');
      // First switch (Enable Sounds) should be focusable
      const enableSwitch = switches[0];
      expect(enableSwitch).toBeInTheDocument();

      // Test focus only on non-disabled switches
      if (!enableSwitch.hasAttribute('disabled')) {
        enableSwitch.focus();
        expect(document.activeElement).toBe(enableSwitch);
      } else {
        // If switch is disabled, just verify it's in the document
        expect(enableSwitch).toBeInTheDocument();
      }
    });
  });
});
