import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface KitchenTicketSettings {
  restaurant_name?: string;
  paper_size?: '58mm' | '80mm';
  show_prices?: boolean;
  show_logo?: boolean;
  auto_print_kitchen?: boolean;
  kitchen_printer_name?: string;
}

interface KitchenOrderItem {
  product_name: string;
  quantity: number;
  unit_price?: number;
  special_instructions?: string;
  category_name?: string;
}

interface KitchenTicketData {
  order_number: string;
  order_date: string;
  order_type: string;
  table_number?: string;
  customer_name?: string;
  items: KitchenOrderItem[];
  notes?: string;
  server_name?: string;
  priority?: 'normal' | 'urgent';
}

class KitchenPrinterService {
  private settings: KitchenTicketSettings = {
    restaurant_name: 'Modern Steak Restaurant',
    paper_size: '80mm',
    show_prices: false,
    auto_print_kitchen: false,
  };

  /**
   * Update printer settings
   */
  updateSettings(settings: Partial<KitchenTicketSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Format currency (only if show_prices is enabled)
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Generate kitchen ticket HTML for thermal printer
   */
  private generateKitchenTicketHTML(data: KitchenTicketData): string {
    const paperSize = this.settings.paper_size || '80mm';
    const width = paperSize === '58mm' ? '58mm' : '80mm';
    const fontSize = paperSize === '58mm' ? '11px' : '13px';

    // Determine urgency styling
    const isUrgent = data.priority === 'urgent';
    const urgentStyle = isUrgent ? 'border: 3px solid #000; background: #ffeb3b;' : '';

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
      padding: 10px;
      background: white;
      ${urgentStyle}
    }
    .header {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .header h1 {
      font-size: ${paperSize === '58mm' ? '18px' : '22px'};
      font-weight: bold;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .header .order-number {
      font-size: ${paperSize === '58mm' ? '24px' : '32px'};
      font-weight: bold;
      letter-spacing: 2px;
      margin: 8px 0;
    }
    .urgent-badge {
      font-size: ${paperSize === '58mm' ? '16px' : '20px'};
      font-weight: bold;
      background: #ff0000;
      color: white;
      padding: 4px 12px;
      margin: 8px 0;
      display: inline-block;
      border: 2px solid #000;
    }
    .info-section {
      margin: 12px 0;
      border-bottom: 1px dashed #000;
      padding-bottom: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      font-size: ${fontSize};
      font-weight: bold;
    }
    .info-label {
      text-transform: uppercase;
    }
    .items-section {
      margin: 12px 0;
    }
    .section-title {
      font-size: ${paperSize === '58mm' ? '14px' : '16px'};
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }
    .item {
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px dotted #666;
    }
    .item:last-child {
      border-bottom: none;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .item-quantity {
      font-size: ${paperSize === '58mm' ? '20px' : '24px'};
      font-weight: bold;
      background: #000;
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      min-width: 40px;
      text-align: center;
    }
    .item-name {
      font-size: ${paperSize === '58mm' ? '14px' : '16px'};
      font-weight: bold;
      flex: 1;
      margin: 0 10px;
      text-transform: uppercase;
    }
    .item-category {
      font-size: ${paperSize === '58mm' ? '9px' : '10px'};
      color: #666;
      text-transform: uppercase;
    }
    .item-instructions {
      font-size: ${paperSize === '58mm' ? '11px' : '13px'};
      background: #f0f0f0;
      padding: 6px 8px;
      margin-top: 6px;
      border-left: 3px solid #000;
      font-weight: bold;
    }
    .item-instructions::before {
      content: "⚠ ";
      font-size: ${paperSize === '58mm' ? '14px' : '16px'};
    }
    .notes-section {
      margin: 12px 0;
      padding: 10px;
      background: #fffacd;
      border: 2px solid #000;
    }
    .notes-title {
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 6px;
      font-size: ${paperSize === '58mm' ? '12px' : '14px'};
    }
    .notes-content {
      font-size: ${fontSize};
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 2px solid #000;
      font-size: ${paperSize === '58mm' ? '10px' : '12px'};
    }
    .timestamp {
      font-size: ${paperSize === '58mm' ? '11px' : '13px'};
      font-weight: bold;
      margin: 6px 0;
    }
    .separator {
      text-align: center;
      margin: 10px 0;
      font-size: ${paperSize === '58mm' ? '10px' : '12px'};
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
    <h1>🍳 DAPUR</h1>
    ${isUrgent ? '<div class="urgent-badge">⚠ MENDESAK ⚠</div>' : ''}
    <div class="order-number">#${data.order_number}</div>
    <div class="separator">================================</div>
  </div>

  <!-- Order Info -->
  <div class="info-section">
    <div class="info-row">
      <span class="info-label">Jenis:</span>
      <span>${this.formatOrderType(data.order_type)}</span>
    </div>
    ${data.table_number ? `
    <div class="info-row">
      <span class="info-label">Meja:</span>
      <span style="font-size: ${paperSize === '58mm' ? '16px' : '20px'};">${data.table_number}</span>
    </div>
    ` : ''}
    ${data.customer_name ? `
    <div class="info-row">
      <span class="info-label">Nama:</span>
      <span>${data.customer_name}</span>
    </div>
    ` : ''}
    ${data.server_name ? `
    <div class="info-row">
      <span class="info-label">Pelayan:</span>
      <span>${data.server_name}</span>
    </div>
    ` : ''}
    <div class="info-row">
      <span class="info-label">Waktu:</span>
      <span class="timestamp">${format(new Date(data.order_date), 'HH:mm', { locale: localeId })}</span>
    </div>
  </div>

  <!-- Items -->
  <div class="items-section">
    <div class="section-title">📋 Item Pesanan (${data.items.length})</div>
    ${data.items.map((item, index) => `
      <div class="item">
        <div class="item-header">
          <div class="item-quantity">${item.quantity}x</div>
          <div class="item-name">
            ${item.product_name}
            ${item.category_name ? `<div class="item-category">${item.category_name}</div>` : ''}
          </div>
          ${this.settings.show_prices && item.unit_price ? `
          <div style="font-size: ${paperSize === '58mm' ? '10px' : '11px'};">
            ${this.formatCurrency(item.unit_price)}
          </div>
          ` : ''}
        </div>
        ${item.special_instructions ? `
        <div class="item-instructions">
          ${item.special_instructions}
        </div>
        ` : ''}
      </div>
    `).join('')}
  </div>

  <!-- Order Notes -->
  ${data.notes ? `
  <div class="notes-section">
    <div class="notes-title">💬 Catatan Pesanan:</div>
    <div class="notes-content">${data.notes}</div>
  </div>
  ` : ''}

  <!-- Footer -->
  <div class="footer">
    <div class="separator">================================</div>
    <div class="timestamp">
      Dicetak: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: localeId })}
    </div>
    <div style="margin-top: 8px;">
      ${isUrgent ? '⚠ PRIORITAS TINGGI ⚠' : 'Harap segera diproses'}
    </div>
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
      dine_in: '🪑 MAKAN DI TEMPAT',
      takeaway: '📦 BAWA PULANG',
      delivery: '🚗 ANTAR',
    };
    return types[type] || type.toUpperCase();
  }

  /**
   * Print kitchen ticket using browser print dialog
   */
  async printKitchenTicket(data: KitchenTicketData): Promise<boolean> {
    try {
      const html = this.generateKitchenTicketHTML(data);
      
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
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  /**
   * Download kitchen ticket as HTML
   */
  async downloadKitchenTicket(data: KitchenTicketData): Promise<boolean> {
    try {
      const html = this.generateKitchenTicketHTML(data);
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kitchen_ticket_${data.order_number}_${format(new Date(), 'yyyyMMdd_HHmmss')}.html`;
      link.click();
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Download kitchen ticket error:', error);
      return false;
    }
  }

  /**
   * Preview kitchen ticket in a new window
   */
  previewKitchenTicket(data: KitchenTicketData): void {
    const html = this.generateKitchenTicketHTML(data);
    const previewWindow = window.open('', '_blank', 'width=400,height=700');
    
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  }

  /**
   * Auto-print kitchen ticket based on settings
   */
  async autoPrintIfEnabled(data: KitchenTicketData): Promise<boolean> {
    if (this.settings.auto_print_kitchen) {
      return this.printKitchenTicket(data);
    }
    return false;
  }

  /**
   * Check if auto-print is enabled
   */
  isAutoPrintEnabled(): boolean {
    return this.settings.auto_print_kitchen || false;
  }
}

// Export singleton instance
export const kitchenPrinter = new KitchenPrinterService();
export default kitchenPrinter;
