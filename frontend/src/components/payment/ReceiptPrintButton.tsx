import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Printer,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { receiptPrinter } from '@/services/receiptPrinter';
import { toastHelpers } from '@/lib/toast-helpers';

interface ReceiptPrintButtonProps {
  orderData: {
    order_number: string;
    order_date: string;
    order_type: string;
    table_number?: string;
    customer_name?: string;
    items: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      special_instructions?: string;
    }>;
    subtotal: number;
    tax_amount: number;
    service_charge?: number;
    discount_amount?: number;
    total_amount: number;
    payment_method?: string;
    payment_amount?: number;
    change_amount?: number;
    cashier_name?: string;
  };
  settings?: {
    restaurant_name?: string;
    receipt_header?: string;
    receipt_footer?: string;
    paper_size?: '58mm' | '80mm';
    show_logo?: boolean;
    tax_rate?: number;
    currency?: string;
  };
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  autoPrint?: boolean;
  onPrintSuccess?: () => void;
  onPrintError?: (error: Error) => void;
}

export function ReceiptPrintButton({
  orderData,
  settings,
  variant = 'default',
  size = 'default',
  showText = true,
  autoPrint = false,
  onPrintSuccess,
  onPrintError,
}: ReceiptPrintButtonProps) {
  const { t } = useTranslation();
  const [printing, setPrinting] = useState(false);

  // Update printer settings when component mounts or settings change
  useState(() => {
    if (settings) {
      receiptPrinter.updateSettings(settings);
    }
  });

  // Auto-print if enabled
  useState(() => {
    if (autoPrint) {
      handlePrint();
    }
  });

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const success = await receiptPrinter.printReceipt(orderData);
      if (success) {
        toastHelpers.success(t('payment.printReceipt', 'Receipt printed successfully'));
        onPrintSuccess?.();
      } else {
        throw new Error('Print failed');
      }
    } catch (error) {
      toastHelpers.error(t('errors.generic', 'Failed to print receipt'));
      onPrintError?.(error as Error);
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const success = await receiptPrinter.downloadReceiptAsPDF(orderData);
      if (success) {
        toastHelpers.success(t('common.export', 'Receipt downloaded'));
      }
    } catch (error) {
      toastHelpers.error(t('errors.generic', 'Failed to download receipt'));
    }
  };

  const handlePreview = () => {
    receiptPrinter.previewReceipt(orderData);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={variant}
        size={size}
        onClick={handlePrint}
        disabled={printing}
      >
        {printing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        {showText && <span className="ml-2">{t('payment.printReceipt')}</span>}
      </Button>

      <Button
        variant="outline"
        size={size}
        onClick={handleDownload}
        title={t('common.export', 'Download')}
      >
        <Download className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size={size}
        onClick={handlePreview}
        title={t('common.view', 'Preview')}
      >
        <Eye className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default ReceiptPrintButton;
