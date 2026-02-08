import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// Printer error types for better error handling
export enum PrinterError {
  NO_PRINTER = 'NO_PRINTER',
  PRINT_FAILED = 'PRINT_FAILED',
  PRINT_CANCELLED = 'PRINT_CANCELLED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export class PrintError extends Error {
  constructor(public code: PrinterError, message: string) {
    super(message);
    this.name = 'PrintError';
  }
}

interface ReceiptSettings {
  printer_name?: string;
  print_copies?: number;
  restaurant_name?: string;
  receipt_header?: string;
  receipt_footer?: string;
  paper_size?: '58mm' | '80mm';
  show_logo?: boolean;
  tax_rate?: number;
  service_charge?: number;
  currency?: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
}

interface ReceiptData {
  order_number: string;
  order_date: string;
  order_type: string;
  table_number?: string;
  customer_name?: string;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  service_charge?: number;
  discount_amount?: number;
  total_amount: number;
  payment_method?: string;
  payment_amount?: number;
  change_amount?: number;
  cashier_name?: string;
}

class ReceiptPrinterService {
  private settings: ReceiptSettings = {
    restaurant_name: 'Steak Kenangan',
    paper_size: '80mm',
    currency: 'IDR',
    tax_rate: 11,
  };

  /**
   * Update printer settings
   */
  updateSettings(settings: Partial<ReceiptSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Format currency based on settings
   */
  private formatCurrency(amount: number): string {
    const currency = this.settings.currency || 'IDR';

    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Generate receipt HTML for thermal printer
   */
  private generateReceiptHTML(data: ReceiptData): string {
    const paperSize = this.settings.paper_size || '80mm';
    const width = paperSize === '58mm' ? '58mm' : '80mm';
    const fontSize = paperSize === '58mm' ? '10px' : '12px';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: ${width} auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: ${width};
      font-family: 'Courier New', monospace;
      font-size: ${fontSize};
      padding: 8px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
    }
    .header h1 {
      font-size: ${paperSize === '58mm' ? '14px' : '16px'};
      font-weight: bold;
      margin-bottom: 4px;
    }
    .header p {
      font-size: ${paperSize === '58mm' ? '9px' : '10px'};
      margin: 2px 0;
    }
    .section {
      margin: 10px 0;
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-size: ${fontSize};
    }
    .items {
      margin: 10px 0;
    }
    .item {
      margin: 5px 0;
    }
    .item-name {
      font-weight: bold;
    }
    .item-details {
      display: flex;
      justify-content: space-between;
      font-size: ${paperSize === '58mm' ? '9px' : '11px'};
      margin: 2px 0;
    }
    .item-instructions {
      font-size: ${paperSize === '58mm' ? '8px' : '10px'};
      font-style: italic;
      color: #666;
      margin: 2px 0 2px 10px;
    }
    .totals {
      margin: 10px 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }
    .total-row.grand {
      font-weight: bold;
      font-size: ${paperSize === '58mm' ? '12px' : '14px'};
      border-top: 2px solid #000;
      padding-top: 6px;
      margin-top: 6px;
    }
    .payment {
      margin: 10px 0;
      border-top: 1px dashed #000;
      padding-top: 8px;
    }
    .footer {
      text-align: center;
      margin-top: 10px;
      font-size: ${paperSize === '58mm' ? '9px' : '10px'};
      border-top: 1px dashed #000;
      padding-top: 8px;
    }
    .barcode {
      text-align: center;
      margin: 10px 0;
      font-family: 'Libre Barcode 128', monospace;
      font-size: 40px;
      letter-spacing: 0;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>${this.settings.restaurant_name || 'Restaurant'}</h1>
    ${this.settings.receipt_header ? `<p>${this.settings.receipt_header}</p>` : ''}
    <p>================================</p>
  </div>

  <!-- Order Info -->
  <div class="section">
    <div class="info-row">
      <span>No. Pesanan:</span>
      <span><strong>#${data.order_number}</strong></span>
    </div>
    <div class="info-row">
      <span>Tanggal:</span>
      <span>${format(new Date(data.order_date), 'dd MMM yyyy HH:mm', { locale: localeId })}</span>
    </div>
    <div class="info-row">
      <span>Jenis:</span>
      <span>${this.formatOrderType(data.order_type)}</span>
    </div>
    ${data.table_number ? `
    <div class="info-row">
      <span>Meja:</span>
      <span>${data.table_number}</span>
    </div>
    ` : ''}
    ${data.customer_name ? `
    <div class="info-row">
      <span>Nama:</span>
      <span>${data.customer_name}</span>
    </div>
    ` : ''}
    ${data.cashier_name ? `
    <div class="info-row">
      <span>Kasir:</span>
      <span>${data.cashier_name}</span>
    </div>
    ` : ''}
  </div>

  <!-- Items -->
  <div class="items">
    ${data.items.map(item => `
      <div class="item">
        <div class="item-name">${item.product_name}</div>
        <div class="item-details">
          <span>${item.quantity} x ${this.formatCurrency(item.unit_price)}</span>
          <span>${this.formatCurrency(item.total_price)}</span>
        </div>
        ${item.special_instructions ? `
        <div class="item-instructions">* ${item.special_instructions}</div>
        ` : ''}
      </div>
    `).join('')}
  </div>

  <!-- Totals -->
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${this.formatCurrency(data.subtotal)}</span>
    </div>
    ${data.service_charge && data.service_charge > 0 ? `
    <div class="total-row">
      <span>Biaya Layanan:</span>
      <span>${this.formatCurrency(data.service_charge)}</span>
    </div>
    ` : ''}
    <div class="total-row">
      <span>Pajak (${this.settings.tax_rate || 11}%):</span>
      <span>${this.formatCurrency(data.tax_amount)}</span>
    </div>
    ${data.discount_amount && data.discount_amount > 0 ? `
    <div class="total-row">
      <span>Diskon:</span>
      <span>-${this.formatCurrency(data.discount_amount)}</span>
    </div>
    ` : ''}
    <div class="total-row grand">
      <span>TOTAL:</span>
      <span>${this.formatCurrency(data.total_amount)}</span>
    </div>
  </div>

  <!-- Payment -->
  ${data.payment_method ? `
  <div class="payment">
    <div class="total-row">
      <span>Metode Bayar:</span>
      <span>${this.formatPaymentMethod(data.payment_method)}</span>
    </div>
    ${data.payment_amount ? `
    <div class="total-row">
      <span>Dibayar:</span>
      <span>${this.formatCurrency(data.payment_amount)}</span>
    </div>
    ` : ''}
    ${data.change_amount && data.change_amount > 0 ? `
    <div class="total-row">
      <span>Kembalian:</span>
      <span>${this.formatCurrency(data.change_amount)}</span>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- Barcode -->
  <div class="barcode">*${data.order_number}*</div>

  <!-- Footer -->
  <div class="footer">
    ${this.settings.receipt_footer || 'Terima kasih atas kunjungan Anda!'}
    <p style="margin-top: 8px;">================================</p>
    <p style="margin-top: 4px; font-size: ${paperSize === '58mm' ? '8px' : '9px'};">
      Powered by Modern POS System
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Format order type for display
   */
  private formatOrderType(type: string): string {
    const types: Record<string, string> = {
      dine_in: 'Makan di Tempat',
      takeaway: 'Bawa Pulang',
      delivery: 'Antar',
    };
    return types[type] || type;
  }

  /**
   * Format payment method for display
   */
  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      cash: 'Tunai',
      card: 'Kartu',
      digital_wallet: 'Dompet Digital',
      qris: 'QRIS',
    };
    return methods[method] || method;
  }

  /**
   * Print receipt using browser print dialog
   */
  async printReceipt(data: ReceiptData): Promise<boolean> {
    try {
      const html = this.generateReceiptHTML(data);

      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Failed to access iframe document');
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Trigger print
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Download receipt as PDF (fallback for when printing is not available)
   */
  async downloadReceiptAsPDF(data: ReceiptData): Promise<boolean> {
    try {
      const html = this.generateReceiptHTML(data);

      // Create a blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${data.order_number}_${format(new Date(), 'yyyyMMdd_HHmmss')}.html`;
      link.click();
      URL.revokeObjectURL(url);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Preview receipt in a new window
   */
  previewReceipt(data: ReceiptData): void {
    const html = this.generateReceiptHTML(data);
    const previewWindow = window.open('', '_blank', 'width=400,height=600');

    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  }

  /**
   * Check if thermal printer is available (via WebUSB or similar)
   */
  async isThermalPrinterAvailable(): Promise<boolean> {
    // Check for USB printer support
    if ('usb' in navigator) {
      try {
        const devices = await (navigator as Navigator & { usb: { getDevices: () => Promise<unknown[]> } }).usb.getDevices();
        return devices.length > 0;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Print receipt to thermal printer (requires WebUSB support)
   * This is a placeholder for actual thermal printer integration
   */
  async printToThermalPrinter(data: ReceiptData): Promise<boolean> {
    // This would require actual thermal printer SDK/driver
    // For now, fall back to browser print
    return this.printReceipt(data);
  }

  /**
   * Print multiple copies of a receipt
   * @param data Receipt data to print
   * @param copies Number of copies to print (default: uses settings or 1)
   */
  async printMultipleCopies(data: ReceiptData, copies?: number): Promise<boolean> {
    const numCopies = copies ?? this.settings.print_copies ?? 1;

    for (let i = 0; i < numCopies; i++) {
      const success = await this.printReceipt(data);
      if (!success) {
        throw new PrintError(
          PrinterError.PRINT_FAILED,
          `Gagal mencetak struk (copy ${i + 1} dari ${numCopies})`
        );
      }
      // Small delay between copies to prevent printer queue issues
      if (i < numCopies - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return true;
  }

  /**
   * Print a test receipt to verify printer configuration
   */
  async testPrint(): Promise<boolean> {
    const sampleData: ReceiptData = {
      order_number: 'TEST-001',
      order_date: new Date().toISOString(),
      order_type: 'dine_in',
      table_number: 'T1',
      customer_name: 'Test Customer',
      items: [
        {
          product_name: 'Rendang Wagyu Steak',
          quantity: 1,
          unit_price: 285000,
          total_price: 285000,
        },
        {
          product_name: 'Es Teh Manis',
          quantity: 2,
          unit_price: 15000,
          total_price: 30000,
        },
      ],
      subtotal: 315000,
      tax_amount: 34650,
      service_charge: 15750,
      total_amount: 365400,
      payment_method: 'cash',
      payment_amount: 400000,
      change_amount: 34600,
      cashier_name: 'System Test',
    };

    try {
      const success = await this.printReceipt(sampleData);
      if (!success) {
        throw new PrintError(
          PrinterError.PRINT_FAILED,
          'Test print gagal. Periksa koneksi printer.'
        );
      }
      return true;
    } catch {
      throw new PrintError(
        PrinterError.PRINT_FAILED,
        'Test print gagal. Periksa koneksi printer.'
      );
    }
  }

  /**
   * Get current printer settings
   */
  getSettings(): ReceiptSettings {
    return { ...this.settings };
  }
}

// Export singleton instance
export const receiptPrinter = new ReceiptPrinterService();
export default receiptPrinter;
