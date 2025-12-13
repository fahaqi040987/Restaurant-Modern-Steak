# Kitchen Printer Service

Complete kitchen ticket printing solution for restaurant POS system.

## Features

### Kitchen Ticket Printing
- **Thermal printer optimized** - Templates designed for 58mm and 80mm thermal printers
- **Order information** - Order number, date, time, type (dine-in/takeaway/delivery)
- **Table & customer details** - Table number, customer name, server name
- **Item display** - Large fonts for easy reading from distance
- **Quantity indicators** - Bold quantity badges for each item
- **Special instructions** - Prominently highlighted preparation notes
- **Priority markers** - Visual indicators for urgent orders
- **Category labels** - Optional category display for each item
- **Auto-print** - Automatic printing on new order creation

### Print Options
- **Browser print dialog** - Standard print using system printer
- **HTML download** - Save ticket as HTML for archive or troubleshooting
- **Preview mode** - View ticket in new window before printing

### Template Features
- **Responsive design** - Adapts to 58mm or 80mm paper width
- **Urgent styling** - Special border and badge for urgent orders
- **Item grouping** - Clear separation between items
- **Instruction highlighting** - Yellow background with warning icon for special instructions
- **Order notes** - Dedicated section for general order notes
- **Timestamp** - Print time for reference

## Usage

### Basic Integration

```tsx
import { KitchenPrintButton } from '@/components/kitchen/KitchenPrintButton';

function OrderComponent({ order }) {
  const kitchenTicketData = {
    order_number: order.orderNumber,
    order_date: order.createdAt,
    order_type: order.orderType, // 'dine_in', 'takeaway', 'delivery'
    table_number: order.tableNumber,
    customer_name: order.customerName,
    server_name: order.serverName,
    items: order.items.map(item => ({
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice, // Optional
      special_instructions: item.specialInstructions,
      category_name: item.categoryName,
    })),
    notes: order.notes,
    priority: order.priority || 'normal', // 'normal' or 'urgent'
  };

  return (
    <KitchenPrintButton
      orderData={kitchenTicketData}
      settings={{
        restaurant_name: 'Modern Steak Restaurant',
        paper_size: '80mm',
        show_prices: false,
        auto_print_kitchen: true,
      }}
      autoPrint={false}
      showText={true}
    />
  );
}
```

### Service API

```typescript
import kitchenPrinter from '@/services/kitchenPrinter';

// Update settings
kitchenPrinter.updateSettings({
  restaurant_name: 'Modern Steak Restaurant',
  paper_size: '80mm',
  show_prices: false,
  auto_print_kitchen: true,
});

// Print ticket
const success = await kitchenPrinter.printKitchenTicket(ticketData);

// Download as HTML
await kitchenPrinter.downloadKitchenTicket(ticketData);

// Preview in new window
kitchenPrinter.previewKitchenTicket(ticketData);

// Auto-print if enabled
await kitchenPrinter.autoPrintIfEnabled(ticketData);

// Check if auto-print is enabled
const isEnabled = kitchenPrinter.isAutoPrintEnabled();
```

## Configuration

### System Settings (AdminSettings)

Kitchen printer settings can be configured in Admin Settings:

1. **Paper Size** - Choose 58mm (small) or 80mm (standard)
2. **Auto Print Kitchen** - Enable/disable automatic printing on new orders
3. **Show Prices** - Display item prices on kitchen tickets (usually disabled)
4. **Print by Category** - Print separate tickets for each category
5. **Urgent Order Time** - Minutes before order is marked urgent (default: 20)

### Ticket Data Structure

```typescript
interface KitchenTicketData {
  order_number: string;          // Order number for identification
  order_date: string;             // ISO date string
  order_type: string;             // 'dine_in', 'takeaway', 'delivery'
  table_number?: string;          // Table number (if dine-in)
  customer_name?: string;         // Customer name
  items: KitchenOrderItem[];      // Array of ordered items
  notes?: string;                 // General order notes
  server_name?: string;           // Server/waiter name
  priority?: 'normal' | 'urgent'; // Order priority
}

interface KitchenOrderItem {
  product_name: string;           // Item name
  quantity: number;               // Quantity ordered
  unit_price?: number;            // Price (optional)
  special_instructions?: string;  // Preparation instructions
  category_name?: string;         // Category label
}
```

## Styling

### Paper Sizes
- **58mm**: Smaller width (58mm), 11px font, compact layout
- **80mm**: Standard width (80mm), 13px font, spacious layout

### Color Coding
- **Urgent orders**: Yellow background with black border
- **Special instructions**: Light yellow background with warning icon
- **Quantity badges**: Black background with white text
- **Order notes**: Yellow background with border

### Fonts
- Monospace font (`Courier New`) for consistent spacing
- Bold text for important information
- Large fonts for quantity and order numbers

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Print | ✅ | ✅ | ✅ | ✅ |
| Download | ✅ | ✅ | ✅ | ✅ |
| Preview | ✅ | ✅ | ✅ | ✅ |

## Kitchen Workflow Integration

### 1. Order Creation
```typescript
// In order handler
const createOrder = async (orderData) => {
  const order = await apiClient.createOrder(orderData);
  
  // Auto-print kitchen ticket if enabled
  if (order.success) {
    await kitchenPrinter.autoPrintIfEnabled({
      order_number: order.data.order_number,
      order_date: order.data.created_at,
      order_type: order.data.order_type,
      table_number: order.data.table_number,
      items: order.data.items,
      priority: 'normal',
    });
  }
};
```

### 2. Kitchen Display
```tsx
// In kitchen display component
function KitchenOrderCard({ order }) {
  return (
    <div>
      <h3>Order #{order.orderNumber}</h3>
      {/* ... order details ... */}
      
      <KitchenPrintButton
        orderData={order}
        showText={false}
        size="sm"
        variant="outline"
      />
    </div>
  );
}
```

### 3. Reprint Capability
```tsx
// In order history
function OrderHistoryRow({ order }) {
  return (
    <tr>
      <td>{order.orderNumber}</td>
      {/* ... other columns ... */}
      <td>
        <KitchenPrintButton
          orderData={order}
          showText={true}
          variant="ghost"
        />
      </td>
    </tr>
  );
}
```

## Future Enhancements

- [ ] **Network printer support** - Direct printing to network thermal printers
- [ ] **ESC/POS commands** - Native thermal printer command support
- [ ] **WebUSB integration** - Direct USB printer communication
- [ ] **Queue management** - Print queue with retry mechanism
- [ ] **Category separation** - Print separate tickets per category
- [ ] **Station routing** - Route items to specific kitchen stations
- [ ] **Audio notifications** - Sound alerts on new ticket print
- [ ] **Printer status monitoring** - Check printer connectivity and paper status
- [ ] **Multi-language tickets** - Support for multiple kitchen languages
- [ ] **QR codes** - Add QR code for order tracking

## Testing

### Manual Testing Checklist

- [ ] Print to thermal printer (58mm)
- [ ] Print to thermal printer (80mm)
- [ ] Download ticket as HTML
- [ ] Preview in new window
- [ ] Auto-print on new order
- [ ] Urgent order styling
- [ ] Special instructions display
- [ ] Long item names wrap correctly
- [ ] Multiple items per order
- [ ] Order notes display
- [ ] Table number display (dine-in)
- [ ] Customer name display (takeaway)
- [ ] Category labels display
- [ ] Settings persistence

### Test Data

```typescript
const testTicket = {
  order_number: 'ORD-001',
  order_date: new Date().toISOString(),
  order_type: 'dine_in',
  table_number: '5',
  customer_name: 'John Doe',
  server_name: 'Sarah',
  items: [
    {
      product_name: 'Ribeye Steak',
      quantity: 2,
      special_instructions: 'Medium rare, no salt',
      category_name: 'Main Course',
    },
    {
      product_name: 'French Fries',
      quantity: 1,
      special_instructions: 'Extra crispy',
      category_name: 'Sides',
    },
  ],
  notes: 'Customer has nut allergy',
  priority: 'urgent',
};
```

## Troubleshooting

### Print doesn't work
- Ensure printer is connected and set as default
- Check browser print permissions
- Try preview to verify HTML generation
- Check browser console for errors

### Layout issues
- Verify paper_size setting matches printer
- Check CSS @page rules in generated HTML
- Test with preview mode first

### Auto-print not working
- Verify `auto_print_kitchen` setting is enabled
- Check settings synchronization with backend
- Ensure component receives correct settings prop

### Text too small/large
- Adjust paper_size setting (58mm vs 80mm)
- CSS automatically adapts font sizes
- Custom fonts may require manual adjustment

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Test with preview mode to isolate print issues
4. Verify printer settings in Admin Settings
