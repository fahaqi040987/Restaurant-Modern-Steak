import { useState, useEffect } from 'react';
import { Printer, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import kitchenPrinter from '@/services/kitchenPrinter';
import { toastHelpers } from '@/lib/toast-helpers';
import { useTranslation } from 'react-i18next';

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

interface KitchenPrintButtonProps {
  orderData: KitchenTicketData;
  settings?: {
    restaurant_name?: string;
    paper_size?: '58mm' | '80mm';
    show_prices?: boolean;
    auto_print_kitchen?: boolean;
  };
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  autoPrint?: boolean;
  onPrintSuccess?: () => void;
  onPrintError?: (error: Error) => void;
}

export function KitchenPrintButton({
  orderData,
  settings,
  variant = 'default',
  size = 'default',
  showText = true,
  autoPrint = false,
  onPrintSuccess,
  onPrintError,
}: KitchenPrintButtonProps) {
  const [printing, setPrinting] = useState(false);
  const { t } = useTranslation();

  // Update printer settings when props change
  useEffect(() => {
    if (settings) {
      kitchenPrinter.updateSettings(settings);
    }
  }, [settings]);

  // Auto-print on mount if enabled
  useEffect(() => {
    if (autoPrint) {
      handlePrint();
    }
  }, [autoPrint]);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const success = await kitchenPrinter.printKitchenTicket(orderData);
      
      if (success) {
        toastHelpers.success(t('kitchen.printSuccess', 'Tiket dapur berhasil dicetak'));
        onPrintSuccess?.();
      } else {
        throw new Error('Print failed');
      }
    } catch (error) {
      console.error('Kitchen print error:', error);
      toastHelpers.error(t('kitchen.printError', 'Gagal mencetak tiket dapur'));
      onPrintError?.(error as Error);
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const success = await kitchenPrinter.downloadKitchenTicket(orderData);
      
      if (success) {
        toastHelpers.success(t('kitchen.downloadSuccess', 'Tiket dapur berhasil diunduh'));
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Kitchen download error:', error);
      toastHelpers.error(t('kitchen.downloadError', 'Gagal mengunduh tiket dapur'));
    }
  };

  const handlePreview = () => {
    try {
      kitchenPrinter.previewKitchenTicket(orderData);
    } catch (error) {
      console.error('Kitchen preview error:', error);
      toastHelpers.error(t('kitchen.previewError', 'Gagal menampilkan preview'));
    }
  };

  return (
    <div className="flex gap-2">
      {/* Print Button */}
      <Button
        onClick={handlePrint}
        disabled={printing}
        variant={variant}
        size={size}
        className="gap-2"
      >
        <Printer className="h-4 w-4" />
        {showText && (printing ? t('common.printing', 'Mencetak...') : t('kitchen.printTicket', 'Cetak Tiket'))}
      </Button>

      {/* Download Button */}
      <Button
        onClick={handleDownload}
        variant="outline"
        size={size}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {showText && t('common.download', 'Unduh')}
      </Button>

      {/* Preview Button */}
      <Button
        onClick={handlePreview}
        variant="ghost"
        size={size}
        className="gap-2"
      >
        <Eye className="h-4 w-4" />
        {showText && t('common.preview', 'Preview')}
      </Button>
    </div>
  );
}
