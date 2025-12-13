# Loading States Enhancement Documentation

## Overview
This document describes the loading states implementation across the Restaurant Modern Steak application, including skeleton loaders, loading spinners, and optimistic UI updates.

## Components Created

### 1. Skeleton Loaders (`/frontend/src/components/ui/loading-skeletons.tsx`)

#### TableSkeleton
Animated skeleton loader for data tables with configurable columns and rows.

**Props:**
- `columns?: number` - Number of columns (default: 5)
- `rows?: number` - Number of rows (default: 5)
- `showHeader?: boolean` - Show table header (default: true)

**Usage:**
```tsx
import { TableSkeleton } from '@/components/ui/loading-skeletons'

{isLoading ? (
  <TableSkeleton columns={8} rows={10} showHeader={true} />
) : (
  <Table>...</Table>
)}
```

#### CardSkeleton
Grid of loading card placeholders for product/order displays.

**Props:**
- `count?: number` - Number of skeleton cards (default: 8)

**Usage:**
```tsx
import { CardSkeleton } from '@/components/ui/loading-skeletons'

{isLoading ? (
  <CardSkeleton count={6} />
) : (
  <div className="grid">...</div>
)}
```

#### FormSkeleton
Skeleton loader for form inputs with labels and buttons.

**Usage:**
```tsx
import { FormSkeleton } from '@/components/ui/loading-skeletons'

{isLoading ? <FormSkeleton /> : <Form>...</Form>}
```

### 2. Loading Spinners (`/frontend/src/components/ui/loading-spinner.tsx`)

#### LoadingSpinner
Main spinner component with optional text and configurable sizes.

**Props:**
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Spinner size
- `text?: string` - Loading text to display

**Usage:**
```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner'

<LoadingSpinner size="lg" text="Loading data..." />
```

#### PageLoading
Full-page loading indicator with minimum height.

**Props:**
- `text?: string` - Loading text

**Usage:**
```tsx
import { PageLoading } from '@/components/ui/loading-spinner'

{isLoading && <PageLoading text="Loading page..." />}
```

#### ButtonLoadingSpinner
Small spinner for buttons during mutation operations.

**Usage:**
```tsx
import { ButtonLoadingSpinner } from '@/components/ui/loading-spinner'

<Button disabled={mutation.isPending}>
  {mutation.isPending && <ButtonLoadingSpinner />}
  Save
</Button>
```

## Implementation Locations

### Admin Components

#### AdminOrderHistory
**File:** `/frontend/src/components/admin/AdminOrderHistory.tsx`

**Implementation:**
- TableSkeleton with 8 columns × 10 rows during data fetch
- Conditional rendering: skeleton → table → empty state

```tsx
{isLoading ? (
  <TableSkeleton columns={8} rows={10} showHeader={true} />
) : (
  <Table>...</Table>
)}
```

#### InventoryManagement
**File:** `/frontend/src/components/admin/InventoryManagement.tsx`

**Implementation:**
- TableSkeleton with 7 columns × 8 rows during data fetch
- ButtonLoadingSpinner on adjust stock mutation button
- Optimistic updates for stock adjustments

```tsx
// Table skeleton
{isLoading ? (
  <TableSkeleton columns={7} rows={8} showHeader={true} />
) : (
  <Table>...</Table>
)}

// Button spinner
<Button disabled={adjustStockMutation.isPending}>
  {adjustStockMutation.isPending && <ButtonLoadingSpinner />}
  Save
</Button>
```

### Kitchen Components

#### EnhancedKitchenLayout
**File:** `/frontend/src/components/kitchen/EnhancedKitchenLayout.tsx`

**Implementation:**
- Optimistic updates for order status changes
- Optimistic updates for order item status changes
- Automatic rollback on mutation failure

```tsx
const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
  // Save previous state
  const previousOrders = queryClient.getQueryData(['enhancedKitchenOrders']);
  
  // Optimistically update UI
  queryClient.setQueryData(['enhancedKitchenOrders'], (old: any) => {
    if (!old?.data) return old;
    return {
      ...old,
      data: old.data.map((order: Order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ),
    };
  });

  try {
    await apiClient.updateOrderStatus(orderId, newStatus);
    refetch();
  } catch (error) {
    // Rollback on error
    queryClient.setQueryData(['enhancedKitchenOrders'], previousOrders);
    console.error('Failed to update order status:', error);
  }
};
```

#### NewEnhancedKitchenLayout
**File:** `/frontend/src/components/kitchen/NewEnhancedKitchenLayout.tsx`

**Implementation:**
- CardSkeleton with 6 cards during data fetch
- Loading state for kitchen orders

```tsx
{isLoading ? (
  <div className="p-6">
    <CardSkeleton count={6} />
  </div>
) : (
  <OrdersList />
)}
```

### POS Components

#### ProductGrid
**File:** `/frontend/src/components/pos/ProductGrid.tsx`

**Implementation:**
- CardSkeleton with 10 product cards
- Optimized grid layout for different screen sizes

```tsx
{isLoading ? (
  <div className="p-6">
    <CardSkeleton count={10} />
  </div>
) : (
  <div className="grid">...</div>
)}
```

#### CategorySidebar
**File:** `/frontend/src/components/pos/CategorySidebar.tsx`

**Implementation:**
- Custom skeleton for category list with icons and badges
- 6 skeleton items during load

```tsx
{isLoading ? (
  <div className="p-4 space-y-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="w-12 h-5" />
      </div>
    ))}
  </div>
) : (
  <CategoryList />
)}
```

#### PaymentHistory
**File:** `/frontend/src/components/pos/PaymentHistory.tsx`

**Implementation:**
- CardSkeleton with 6 payment cards during data fetch

```tsx
{isLoading ? (
  <div className="p-6">
    <CardSkeleton count={6} />
  </div>
) : (
  <PaymentList />
)}
```

#### PaymentConfirmationModal
**File:** `/frontend/src/components/pos/PaymentConfirmationModal.tsx`

**Implementation:**
- ButtonLoadingSpinner during payment processing
- Optimistic updates invalidating orders and payments queries
- Success/error handling with proper rollback

```tsx
// Spinner during processing
{currentStep === 'processing' && (
  <Card className="bg-white">
    <CardContent className="p-8 text-center">
      <ButtonLoadingSpinner />
      <h3 className="text-lg font-semibold mb-2 mt-4">Processing Payment</h3>
      <p className="text-gray-600">
        {createOrderMutation.isPending && 'Creating order...'}
        {processPaymentMutation.isPending && 'Processing payment...'}
      </p>
    </CardContent>
  </Card>
)}

// Optimistic updates
const processPaymentMutation = useMutation({
  mutationFn: async ({ orderId, payment }) => {
    return await apiClient.processPayment(orderId, payment);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['payments'] });
  },
  onError: (error) => {
    console.error('Payment processing failed:', error);
  }
});
```

## Optimistic Updates Pattern

### Implementation Strategy

1. **Save Previous State**
   ```tsx
   const previousData = queryClient.getQueryData(['queryKey']);
   ```

2. **Update UI Immediately**
   ```tsx
   queryClient.setQueryData(['queryKey'], (old) => {
     // Transform data optimistically
     return newData;
   });
   ```

3. **Perform API Call**
   ```tsx
   try {
     await apiClient.performMutation(data);
     refetch(); // Sync with server
   } catch (error) {
     // Rollback on error
     queryClient.setQueryData(['queryKey'], previousData);
   }
   ```

### Use Cases

#### Order Status Updates
- **Location:** Kitchen components
- **Trigger:** Status button click (confirmed → preparing → ready)
- **Benefit:** Instant visual feedback for kitchen staff
- **Rollback:** On API error, revert to previous status

#### Payment Processing
- **Location:** POS payment modal
- **Trigger:** Payment method selection and confirmation
- **Benefit:** Immediate success indication
- **Rollback:** Query invalidation on success, error display on failure

#### Cart Operations
- **Location:** POS layout
- **Implementation:** Local state (already instantaneous)
- **Benefit:** No API calls needed for add/remove items
- **Sync:** Only on order creation

## Best Practices

### When to Use Skeleton Loaders
- ✅ Initial page/component load with data fetching
- ✅ Large data tables with pagination
- ✅ Product/card grids with images
- ✅ Complex forms with multiple fields
- ❌ Small inline updates
- ❌ Real-time data streams

### When to Use Loading Spinners
- ✅ Button mutations (save, submit, delete)
- ✅ Short API calls (< 2 seconds expected)
- ✅ Background refresh operations
- ✅ Inline status changes
- ❌ Initial page load (use skeletons instead)
- ❌ Large data sets (use skeletons instead)

### When to Use Optimistic Updates
- ✅ High-frequency operations (status changes, item checks)
- ✅ Operations with high success rate (> 95%)
- ✅ User-initiated actions with immediate feedback needs
- ✅ Local state changes that sync to server
- ❌ Critical operations (payments without confirmation)
- ❌ Operations with complex validation
- ❌ Multi-step workflows with dependencies

## Testing Checklist

### Skeleton Loaders
- [ ] AdminOrderHistory table skeleton (8 cols × 10 rows)
- [ ] InventoryManagement table skeleton (7 cols × 8 rows)
- [ ] ProductGrid card skeleton (10 cards)
- [ ] CategorySidebar list skeleton (6 items)
- [ ] PaymentHistory card skeleton (6 cards)
- [ ] NewEnhancedKitchenLayout card skeleton (6 cards)

### Loading Spinners
- [ ] InventoryManagement adjust stock button
- [ ] PaymentConfirmationModal processing step
- [ ] All mutation buttons show spinner during isPending

### Optimistic Updates
- [ ] Kitchen order status change (confirmed → preparing → ready)
- [ ] Kitchen order item status toggle (preparing ↔ ready)
- [ ] Order status updates immediately in UI
- [ ] Rollback occurs on API error
- [ ] Payment processing invalidates queries on success

### Edge Cases
- [ ] Skeleton shows on slow network
- [ ] Spinner shows during mutations
- [ ] Optimistic update rolls back on error
- [ ] Multiple rapid clicks handled gracefully
- [ ] Network offline handled with proper error state

## Performance Considerations

### Skeleton Loaders
- Minimal DOM elements using CSS animations
- No JavaScript animation overhead
- Tailwind's `animate-pulse` utility for efficiency

### Loading Spinners
- Single Loader2 icon component from lucide-react
- CSS-only `animate-spin` animation
- Reusable components to reduce bundle size

### Optimistic Updates
- Client-side state management with TanStack Query
- Automatic garbage collection of stale data
- Efficient DOM updates with React's reconciliation
- Rollback mechanism prevents UI inconsistencies

## Future Enhancements

1. **Progressive Loading**
   - Implement virtual scrolling for large lists
   - Load above-the-fold content first
   - Lazy load images and heavy components

2. **Predictive Prefetching**
   - Prefetch next page of paginated data
   - Prefetch product details on hover
   - Cache frequently accessed data

3. **Offline Support**
   - Queue mutations when offline
   - Sync when connection restored
   - Show offline indicator to users

4. **Enhanced Feedback**
   - Toast notifications for background operations
   - Progress bars for long-running tasks
   - Success animations for completed actions

5. **Error Recovery**
   - Automatic retry with exponential backoff
   - Manual retry buttons on error states
   - Detailed error messages for debugging

## Dependencies

- `@tanstack/react-query` - Data fetching and caching
- `lucide-react` - Loading spinner icon (Loader2)
- `tailwindcss` - Animation utilities (animate-pulse, animate-spin)
- `zustand` - Optimistic update store (optional, for complex scenarios)

## Related Files

- `/frontend/src/components/ui/skeleton.tsx` - Base skeleton component
- `/frontend/src/components/ui/loading-skeletons.tsx` - Skeleton variants
- `/frontend/src/components/ui/loading-spinner.tsx` - Spinner components
- `/frontend/src/hooks/useOptimisticUpdates.ts` - Optimistic update helpers
- `/frontend/src/api/client.ts` - API client for mutations

## Maintenance Notes

- Keep skeleton dimensions close to actual content for smooth transitions
- Monitor mutation success rates to validate optimistic update usage
- Update loading states when adding new data-heavy components
- Test loading states on throttled connections (Chrome DevTools Network tab)
- Ensure all mutations have proper error handling and rollback logic
