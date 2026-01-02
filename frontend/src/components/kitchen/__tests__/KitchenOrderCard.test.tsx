/**
 * KitchenOrderCard Component Tests
 * Tests the kitchen order card display and interactions
 */

import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KitchenOrderCard } from '../KitchenOrderCard';
import type { Order, OrderItem } from '@/types';

// Mock i18n translations
vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'kitchen.justNow': 'Just now',
    'kitchen.minutesAgo': '{{minutes}}m ago',
    'kitchen.hoursMinutesAgo': '{{hours}}h {{minutes}}m ago',
    'kitchen.itemsCount': '{{count}} items',
    'kitchen.estPrepTime': 'Est. {{time}} prep time',
    'kitchen.table': 'Table',
    'kitchen.startPreparing': 'Start Preparing',
    'kitchen.markReady': 'Mark Ready',
    'kitchen.markServed': 'Mark Served',
    'kitchen.reset': 'Reset',
    'kitchen.preparing': 'Preparing',
    'kitchen.ready': '✓ Ready',
    'kitchen.moreItems': '+{{count}} more items',
    'kitchen.specialInstructions': 'Special Instructions:',
    'kitchen.update': 'Update',
    'kitchen.note': 'Note:',
    'kitchen.prepTime': 'Prep time: {{time}} min',
    'kitchen.orderDetails': 'Order Details',
  };

  return {
    useTranslation: () => ({
      t: (key: string, params?: Record<string, unknown>) => {
        let text = translations[key] || key;
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{{${k}}}`, String(v));
          });
        }
        return text;
      },
    }),
  };
});

// Mock data factory
const createMockOrderItem = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: 'item-1',
  order_id: 'order-1',
  product_id: 'product-1',
  quantity: 2,
  unit_price: 185000,
  total_price: 370000,
  special_instructions: '',
  status: 'pending',
  created_at: '2025-12-27T10:00:00Z',
  updated_at: '2025-12-27T10:00:00Z',
  product: {
    id: 'product-1',
    name: 'Rendang Wagyu',
    price: 185000,
    is_available: true,
    preparation_time: 25,
    sort_order: 1,
    created_at: '2025-12-27T10:00:00Z',
    updated_at: '2025-12-27T10:00:00Z',
  },
  ...overrides,
});

const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  order_number: 'ORD-20251227-0001',
  user_id: 'user-1',
  customer_name: 'Budi Santoso',
  order_type: 'dine_in',
  status: 'confirmed',
  subtotal: 370000,
  tax_amount: 37000,
  discount_amount: 0,
  total_amount: 407000,
  notes: '',
  created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  updated_at: new Date().toISOString(),
  items: [createMockOrderItem()],
  table: {
    id: 'table-1',
    table_number: 'T01',
    seating_capacity: 4,
    location: 'Indoor',
    is_occupied: true,
    created_at: '2025-12-27T10:00:00Z',
    updated_at: '2025-12-27T10:00:00Z',
  },
  ...overrides,
});

describe('KitchenOrderCard', () => {
  const mockOnStatusUpdate = vi.fn();
  const mockOnItemStatusUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-27T10:10:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render order number correctly', () => {
      const order = createMockOrder();
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText('#ORD-20251227-0001')).toBeInTheDocument();
    });

    it('should render order status badge', () => {
      const order = createMockOrder({ status: 'confirmed' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText('confirmed')).toBeInTheDocument();
    });

    it('should render table number when available', () => {
      const order = createMockOrder();
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText(/Table T01/i)).toBeInTheDocument();
    });

    it('should render customer name when available', () => {
      const order = createMockOrder({ customer_name: 'Budi Santoso' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    });

    it('should render item count', () => {
      const order = createMockOrder({
        items: [createMockOrderItem(), createMockOrderItem({ id: 'item-2' })],
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText('2 items')).toBeInTheDocument();
    });

    it('should render product name with quantity', () => {
      const order = createMockOrder();
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText('Rendang Wagyu')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render estimated preparation time', () => {
      const order = createMockOrder();
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText(/Est. 25 min prep time/i)).toBeInTheDocument();
    });
  });

  describe('Time Elapsed', () => {
    it('should display "Just now" for orders less than 1 minute old', () => {
      vi.setSystemTime(new Date('2025-12-27T10:00:30Z'));
      const order = createMockOrder({
        created_at: '2025-12-27T10:00:00Z',
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('should display minutes for orders less than 1 hour old', () => {
      vi.setSystemTime(new Date('2025-12-27T10:30:00Z'));
      const order = createMockOrder({
        created_at: '2025-12-27T10:00:00Z',
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText('30m ago')).toBeInTheDocument();
    });

    it('should display hours and minutes for orders over 1 hour old', () => {
      vi.setSystemTime(new Date('2025-12-27T11:30:00Z'));
      const order = createMockOrder({
        created_at: '2025-12-27T10:00:00Z',
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText('1h 30m ago')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should show "Start Preparing" button for confirmed orders', () => {
      const order = createMockOrder({ status: 'confirmed' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByRole('button', { name: /Start Preparing/i })).toBeInTheDocument();
    });

    it('should show "Mark Ready" button for preparing orders', () => {
      const order = createMockOrder({ status: 'preparing' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByRole('button', { name: /Mark Ready/i })).toBeInTheDocument();
    });

    it('should show "Mark Served" button for ready orders', () => {
      const order = createMockOrder({ status: 'ready' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByRole('button', { name: /Mark Served/i })).toBeInTheDocument();
    });

    it('should show Reset button for non-confirmed orders', () => {
      const order = createMockOrder({ status: 'preparing' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
    });

    it('should not show Reset button for confirmed orders', () => {
      const order = createMockOrder({ status: 'confirmed' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.queryByRole('button', { name: /Reset/i })).not.toBeInTheDocument();
    });
  });

  describe('Status Updates', () => {
    it('should call onStatusUpdate with preparing status when Start Preparing is clicked', () => {
      const order = createMockOrder({ status: 'confirmed' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      const button = screen.getByRole('button', { name: /Start Preparing/i });
      fireEvent.click(button);

      expect(mockOnStatusUpdate).toHaveBeenCalledWith('order-1', 'preparing');
    });

    it('should call onStatusUpdate with ready status when Mark Ready is clicked', () => {
      const order = createMockOrder({ status: 'preparing' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      const button = screen.getByRole('button', { name: /Mark Ready/i });
      fireEvent.click(button);

      expect(mockOnStatusUpdate).toHaveBeenCalledWith('order-1', 'ready');
    });

    it('should call onStatusUpdate with served status when Mark Served is clicked', () => {
      const order = createMockOrder({ status: 'ready' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      const button = screen.getByRole('button', { name: /Mark Served/i });
      fireEvent.click(button);

      expect(mockOnStatusUpdate).toHaveBeenCalledWith('order-1', 'served');
    });

    it('should call onStatusUpdate with confirmed status when Reset is clicked', () => {
      const order = createMockOrder({ status: 'preparing' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      const button = screen.getByRole('button', { name: /Reset/i });
      fireEvent.click(button);

      expect(mockOnStatusUpdate).toHaveBeenCalledWith('order-1', 'confirmed');
    });
  });

  describe('Item Status Updates', () => {
    it('should show item status badges when order is preparing', () => {
      const order = createMockOrder({
        status: 'preparing',
        items: [createMockOrderItem({ status: 'pending' })],
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText('Preparing')).toBeInTheDocument();
    });

    it('should show ready badge for ready items', () => {
      const order = createMockOrder({
        status: 'preparing',
        items: [createMockOrderItem({ status: 'ready' })],
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      // The ready badge shows checkmark + Ready
      expect(screen.getByText(/✓ Ready/)).toBeInTheDocument();
    });

    it('should call onItemStatusUpdate when item badge is clicked', () => {
      const order = createMockOrder({
        status: 'preparing',
        items: [createMockOrderItem({ id: 'item-1', status: 'pending' })],
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      const badge = screen.getByText('Preparing');
      fireEvent.click(badge);

      expect(mockOnItemStatusUpdate).toHaveBeenCalledWith('order-1', 'item-1', 'ready');
    });

    it('should toggle item status back to pending when ready badge is clicked', () => {
      const order = createMockOrder({
        status: 'preparing',
        items: [createMockOrderItem({ id: 'item-1', status: 'ready' })],
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      // Use more specific selector for the ready badge (not the button)
      const badge = screen.getByText(/✓ Ready/);
      fireEvent.click(badge);

      expect(mockOnItemStatusUpdate).toHaveBeenCalledWith('order-1', 'item-1', 'pending');
    });
  });

  describe('Expandable Content', () => {
    it('should show expand button', () => {
      const order = createMockOrder();
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      // There should be a button/element to expand the card
      const expandButton = screen.getByRole('button', { name: '' });
      expect(expandButton).toBeInTheDocument();
    });

    it('should show "more items" indicator when there are more than 3 items', () => {
      const order = createMockOrder({
        items: [
          createMockOrderItem({ id: 'item-1' }),
          createMockOrderItem({ id: 'item-2' }),
          createMockOrderItem({ id: 'item-3' }),
          createMockOrderItem({ id: 'item-4' }),
        ],
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText('+1 more items')).toBeInTheDocument();
    });

    it('should show special instructions when expanded', () => {
      const order = createMockOrder({
        notes: 'Extra spicy please',
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      // Click expand button (the button with svg icon that's not the main action button)
      const buttons = screen.getAllByRole('button');
      const expandButton = buttons.find((btn) => btn.querySelector('svg') && !btn.textContent?.includes('Preparing'));
      if (expandButton) {
        fireEvent.click(expandButton);
      }

      expect(screen.getByText('Special Instructions:')).toBeInTheDocument();
      expect(screen.getByText('Extra spicy please')).toBeInTheDocument();
    });

    it('should show item special instructions when expanded', () => {
      const order = createMockOrder({
        items: [createMockOrderItem({ special_instructions: 'No onions' })],
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      // Click expand button
      const buttons = screen.getAllByRole('button');
      const expandButton = buttons.find((btn) => btn.querySelector('svg') && !btn.textContent?.includes('Preparing'));
      if (expandButton) {
        fireEvent.click(expandButton);
      }

      expect(screen.getByText(/Note: No onions/i)).toBeInTheDocument();
    });

    it('should show all items when expanded', () => {
      const order = createMockOrder({
        items: [
          createMockOrderItem({ id: 'item-1', product: { ...createMockOrderItem().product!, name: 'Item 1' } }),
          createMockOrderItem({ id: 'item-2', product: { ...createMockOrderItem().product!, name: 'Item 2' } }),
          createMockOrderItem({ id: 'item-3', product: { ...createMockOrderItem().product!, name: 'Item 3' } }),
          createMockOrderItem({ id: 'item-4', product: { ...createMockOrderItem().product!, name: 'Item 4' } }),
        ],
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      // Click expand button
      const buttons = screen.getAllByRole('button');
      const expandButton = buttons.find((btn) => btn.querySelector('svg') && !btn.textContent?.includes('Preparing'));
      if (expandButton) {
        fireEvent.click(expandButton);
      }

      expect(screen.queryByText('+1 more items')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle order without table', () => {
      const order = createMockOrder({ table: undefined, table_id: undefined });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.queryByText(/Table/i)).not.toBeInTheDocument();
    });

    it('should handle order without customer name', () => {
      const order = createMockOrder({ customer_name: '' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      // Component should render without customer name section
      expect(screen.getByText('#ORD-20251227-0001')).toBeInTheDocument();
    });

    it('should handle order with empty items array', () => {
      const order = createMockOrder({ items: [] });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.getByText('0 items')).toBeInTheDocument();
    });

    it('should handle order without notes', () => {
      const order = createMockOrder({ notes: '' });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      expect(screen.queryByText('Special Instructions:')).not.toBeInTheDocument();
    });

    it('should handle items without preparation time', () => {
      const order = createMockOrder({
        items: [
          createMockOrderItem({
            product: {
              ...createMockOrderItem().product!,
              preparation_time: 0,
            },
          }),
        ],
      });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      // Should not show estimated time
      expect(screen.queryByText(/Est./i)).not.toBeInTheDocument();
    });

    it('should handle unknown order status', () => {
      const order = createMockOrder({ status: 'unknown' as any });
      render(
        <KitchenOrderCard
          order={order}
          onStatusUpdate={mockOnStatusUpdate}
          onItemStatusUpdate={mockOnItemStatusUpdate}
        />
      );

      // Should still render with default styling
      expect(screen.getByRole('button', { name: /Update/i })).toBeInTheDocument();
    });
  });
});
