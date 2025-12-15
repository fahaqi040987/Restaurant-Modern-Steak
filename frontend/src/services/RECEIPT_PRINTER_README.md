# Receipt Printer Integration

Complete thermal receipt printing system for the Modern POS application.

## Features

### ✅ Thermal Receipt Printing
- **58mm and 80mm paper support** - Configurable paper size
- **Professional receipt template** - Clean, readable layout optimized for thermal printers
- **Multilingual support** - Indonesian and English via i18n
- **Customizable branding** - Restaurant name, header, footer from settings
- **Order details** - Complete order breakdown with items, taxes, and totals
- **Payment information** - Payment method, amount paid, change
- **Barcode generation** - Order number as barcode for scanning

### 📱 Print Options
1. **Direct Print** - Browser print dialog for connected printers
2. **Download HTML** - Save receipt as HTML file (PDF-ready)
3. **Preview** - Open receipt in new window for review

### 🎨 Receipt Template Includes
- Restaurant name and custom header
- Order number, date, time
- Order type (Dine-in, Takeaway, Delivery)
- Table number and customer name (if applicable)
- Complete item list with quantities and prices
- Special instructions per item
- Subtotal, service charge, tax breakdown
- Discount (if applicable)
- Grand total (highlighted)
- Payment details (method, amount, change)
- Order barcode
- Custom footer message
- Timestamp and system branding

## Usage

### Basic Integration

```tsx
import { ReceiptPrintButton } from '@/components/payment/ReceiptPrintButton';

// In your component
<ReceiptPrintButton
  orderData={{
    order_number: "ORD-001",
    order_date: new Date().toISOString(),
    order_type: "dine_in",
    table_number: "A1",
    customer_name: "John Doe",
    items: [
      {
        product_name: "Wagyu Steak",
        quantity: 2,
        unit_price: 250000,
        total_price: 500000,
        special_instructions: "Medium rare"
      }
    ],
    subtotal: 500000,
    tax_amount: 55000,
    service_charge: 25000,
    total_amount: 580000,
    payment_method: "cash",
    payment_amount: 600000,
    change_amount: 20000,
    cashier_name: "Admin"
  }}
  settings={{
    restaurant_name: "Steak Kenangan",
    receipt_header: "Thank you for dining with us!",
    receipt_footer: "Visit us again soon!",
    paper_size: "80mm",
    tax_rate: 11,
    currency: "IDR"
  }}
  variant="default"
  showText={true}
  autoPrint={false}
  onPrintSuccess={() => console.log('Printed!')}
/>
```

### Service API

```tsx
import receiptPrinter from '@/services/receiptPrinter';

// Update settings
receiptPrinter.updateSettings({
  restaurant_name: "My Restaurant",
  paper_size: "58mm",
  currency: "IDR"
});

// Print receipt
await receiptPrinter.printReceipt(orderData);

// Download as HTML
await receiptPrinter.downloadReceiptAsPDF(orderData);

// Preview in new window
receiptPrinter.previewReceipt(orderData);

// Check thermal printer availability
const hasPrinter = await receiptPrinter.isThermalPrinterAvailable();
```

## Configuration

### System Settings Integration

Receipt settings are automatically pulled from AdminSettings:

```tsx
// From settings table
{
  restaurant_name: "Steak Kenangan",
  receipt_header: "Terima kasih sudah makan di sini!",
  receipt_footer: "Kunjungi kami lagi!",
  paper_size: "80mm",
  show_logo: true,
  tax_rate: 11,
  currency: "IDR"
}
```

### Paper Sizes

**58mm (Small)**
- Compact receipts for space-constrained environments
- Smaller font sizes (10px base)
- Perfect for takeaway receipts

**80mm (Standard)**
- Full-featured receipts with comfortable reading
- Standard font sizes (12px base)
- Best for dine-in receipts

## Styling

The receipt template uses:
- **Monospace font** (`Courier New`) for authentic thermal printer look
- **Dashed borders** (─────) for section separation
- **Responsive layout** adapts to paper width
- **Print-optimized CSS** with `@page` rules
- **High contrast** for thermal printer clarity

## Browser Compatibility

- ✅ Chrome 90+ (full support)
- ✅ Firefox 88+ (full support)
- ✅ Safari 14+ (full support)
- ✅ Edge 90+ (full support)

## Future Enhancements

### Planned Features
- [ ] **WebUSB Integration** - Direct communication with USB thermal printers
- [ ] **ESC/POS Commands** - Native thermal printer command support
- [ ] **Network Printer Support** - Print to IP-based thermal printers
- [ ] **QR Code Generation** - Add QR codes for digital receipts
- [ ] **Logo Image Support** - Print restaurant logo on receipts
- [ ] **Multiple Receipt Formats** - Kitchen copy, customer copy variants
- [ ] **Bluetooth Printer Support** - Mobile thermal printer integration
- [ ] **Receipt Email** - Send digital copy via email

### Thermal Printer SDKs
For production deployment with actual thermal printers, consider:

1. **Epson ePOS SDK** - For Epson thermal printers
2. **Star Micronics SDK** - For Star printers
3. **WebUSB API** - For direct USB printer communication
4. **ESCPOS Library** - Universal ESC/POS command library

## Integration Points

### 1. Payment Success Screen
```tsx
// After successful payment
<ReceiptPrintButton
  orderData={completedOrder}
  settings={systemSettings}
  autoPrint={settings.auto_print_customer_copy}
/>
```

### 2. Order History
```tsx
// Print past receipts
<ReceiptPrintButton
  orderData={historicalOrder}
  settings={systemSettings}
  variant="outline"
  size="sm"
  showText={false}
/>
```

### 3. Counter Interface
```tsx
// Counter staff quick print
<ReceiptPrintButton
  orderData={order}
  settings={systemSettings}
  variant="default"
  showText={true}
/>
```

## Files

- `frontend/src/services/receiptPrinter.ts` - Core receipt printing service
- `frontend/src/components/payment/ReceiptPrintButton.tsx` - React component
- Receipt template embedded in service with full HTML/CSS

## Testing

### Manual Testing
1. Open payment success screen
2. Click "Print Receipt" button
3. Verify receipt preview opens
4. Test browser print dialog
5. Test HTML download
6. Verify all order details appear correctly
7. Check formatting on both 58mm and 80mm settings

### Print Testing Checklist
- [ ] Restaurant name displays correctly
- [ ] Order number formatted properly
- [ ] All items listed with correct prices
- [ ] Special instructions show up
- [ ] Tax calculation matches
- [ ] Payment details accurate
- [ ] Barcode renders correctly
- [ ] Header/footer messages appear
- [ ] Date/time formatted correctly
- [ ] Currency symbols correct

## Troubleshooting

**Print dialog doesn't open?**
- Check browser popup blocker
- Verify print permissions
- Try preview mode first

**Receipt formatting looks wrong?**
- Verify paper size setting matches actual printer
- Check browser print settings (margins, scale)
- Try downloading HTML to inspect

**Missing order details?**
- Ensure orderData has all required fields
- Check console for data validation errors
- Verify settings are passed correctly

## License

Part of Modern POS System - Restaurant Management Software
