import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Calendar,
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Receipt,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import apiClient from '@/api/client';
import { toastHelpers } from '@/lib/toast-helpers';
import { ReceiptPrintButton } from '@/components/payment/ReceiptPrintButton';
import { Order as APIOrder } from '@/types';
import { TableSkeleton } from '@/components/ui/loading-skeletons';

interface OrderHistoryItem extends Omit<APIOrder, 'table' | 'user'> {
  table_number?: string;
  payment_method?: string;
  payment_status?: string;
  created_by?: string;
}

interface OrderHistoryFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export function AdminOrderHistory() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<OrderHistoryFilters>({
    page: 1,
    pageSize: 20,
  });
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['order-history', filters],
    queryFn: async () => {
      const orderFilters: {
        page: number;
        limit: number;
        start_date?: string;
        end_date?: string;
        status?: string;
        search?: string;
      } = {
        page: filters.page,
        limit: filters.pageSize,
      };

      if (filters.startDate) orderFilters.start_date = filters.startDate;
      if (filters.endDate) orderFilters.end_date = filters.endDate;
      if (filters.status) orderFilters.status = filters.status;
      if (filters.search) orderFilters.search = filters.search;

      const response = await apiClient.getOrders(orderFilters);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch orders');
      }
      
      const orders = (response.data || []) as OrderHistoryItem[];
      const meta = response.meta || {};
      
      return {
        orders: orders.map((order: OrderHistoryItem) => ({
          ...order,
          table_number: order.table_number,
        })),
        total: meta.total || 0,
        page: meta.current_page || 1,
        page_size: meta.per_page || 20,
        total_pages: meta.total_pages || Math.ceil((meta.total || 0) / (meta.per_page || 20)),
      };
    },
  });

  const updateFilter = (key: keyof OrderHistoryFilters, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : prev.page,
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 20,
    });
  };

  const viewOrderDetails = (order: OrderHistoryItem) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const exportToCSV = () => {
    if (!ordersData?.orders || ordersData.orders.length === 0) {
      toastHelpers.error(t('orders.noDataToExport', 'Tidak ada data untuk diekspor'));
      return;
    }

    try {
      const headers = [
        'Order Number',
        'Date',
        'Time',
        'Type',
        'Table',
        'Customer',
        'Status',
        'Total',
        'Payment Method',
        'Payment Status',
      ];

      const rows = ordersData.orders.map((order) => [
        order.order_number,
        format(new Date(order.created_at), 'dd/MM/yyyy', { locale: localeId }),
        format(new Date(order.created_at), 'HH:mm', { locale: localeId }),
        order.order_type,
        order.table_number || '-',
        order.customer_name || '-',
        order.status,
        order.total_amount.toString(),
        order.payment_method || '-',
        order.payment_status || '-',
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order_history_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toastHelpers.success(t('orders.exportSuccess', 'Data berhasil diekspor'));
    } catch (error) {
      console.error('Export error:', error);
      toastHelpers.error(t('orders.exportError', 'Gagal mengekspor data'));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      pending: { variant: 'secondary', label: t('orders.pending', 'Menunggu') },
      confirmed: { variant: 'default', label: t('orders.confirmed', 'Dikonfirmasi') },
      preparing: { variant: 'default', label: t('orders.preparing', 'Sedang Disiapkan') },
      ready: { variant: 'default', label: t('orders.ready', 'Siap') },
      served: { variant: 'default', label: t('orders.served', 'Disajikan') },
      completed: { variant: 'outline', label: t('orders.completed', 'Selesai') },
      cancelled: { variant: 'destructive', label: t('orders.cancelled', 'Dibatalkan') },
    };

    const config = statusConfig[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getOrderTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      dine_in: t('pos.dineIn', 'Makan di Tempat'),
      takeaway: t('pos.takeaway', 'Bawa Pulang'),
      takeout: t('pos.takeaway', 'Bawa Pulang'),
      delivery: t('pos.delivery', 'Antar'),
    };
    return types[type] || type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalPages = ordersData?.total_pages || 1;
  const currentPage = ordersData?.page || 1;

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('orders.orderHistory', 'Riwayat Pesanan')}
          </CardTitle>
          <CardDescription>
            {t('orders.orderHistory', 'View and search order history')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('reports.startDate', 'Tanggal Mulai')}</label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => updateFilter('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('reports.endDate', 'Tanggal Akhir')}</label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => updateFilter('endDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.status', 'Status')}</label>
              <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all', 'Semua')}</SelectItem>
                  <SelectItem value="pending">{t('orders.pending', 'Menunggu')}</SelectItem>
                  <SelectItem value="confirmed">{t('orders.confirmed', 'Dikonfirmasi')}</SelectItem>
                  <SelectItem value="preparing">{t('orders.preparing', 'Sedang Disiapkan')}</SelectItem>
                  <SelectItem value="ready">{t('orders.ready', 'Siap')}</SelectItem>
                  <SelectItem value="served">{t('orders.served', 'Disajikan')}</SelectItem>
                  <SelectItem value="completed">{t('orders.completed', 'Selesai')}</SelectItem>
                  <SelectItem value="cancelled">{t('orders.cancelled', 'Dibatalkan')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.search', 'Cari')}</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('orders.searchPlaceholder', 'No. pesanan atau nama...')}
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                {t('common.clearFilters', 'Hapus Filter')}
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!ordersData?.orders || ordersData.orders.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                {t('common.export', 'Ekspor')}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {ordersData?.total || 0} {t('orders.totalOrders', 'pesanan')}
            </div>
          </div>

          {/* Orders Table */}
          {isLoading ? (
            <TableSkeleton columns={8} rows={10} showHeader={true} />
          ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orders.orderNumber', 'Nomor Pesanan')}</TableHead>
                  <TableHead>{t('common.date', 'Tanggal')}</TableHead>
                  <TableHead>{t('pos.orderType', 'Jenis')}</TableHead>
                  <TableHead>{t('kitchen.table', 'Meja')}</TableHead>
                  <TableHead>{t('pos.customerName', 'Pelanggan')}</TableHead>
                  <TableHead>{t('common.status', 'Status')}</TableHead>
                  <TableHead className="text-right">{t('common.total', 'Total')}</TableHead>
                  <TableHead className="text-center">{t('common.actions', 'Aksi')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!ordersData?.orders || ordersData.orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-[400px] p-0">
                      <EmptyState
                        icon={Receipt}
                        title={t('orders.noOrders', 'Tidak ada pesanan')}
                        description={
                          filters.search || filters.status || filters.startDate
                            ? t('orders.noOrdersFiltered', 'Tidak ada pesanan yang cocok dengan filter. Coba ubah kriteria pencarian.')
                            : t('orders.noOrdersYet', 'Belum ada pesanan. Pesanan baru akan muncul di sini.')
                        }
                        action={
                          filters.search || filters.status || filters.startDate
                            ? {
                                label: t('common.clearFilters', 'Hapus Filter'),
                                onClick: () => {
                                  setFilters({
                                    page: 1,
                                    pageSize: 20,
                                  })
                                },
                              }
                            : undefined
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  ordersData.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(order.created_at), 'dd/MM/yyyy', { locale: localeId })}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), 'HH:mm', { locale: localeId })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getOrderTypeLabel(order.order_type)}</TableCell>
                      <TableCell>{order.table_number || '-'}</TableCell>
                      <TableCell>{order.customer_name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" onClick={() => viewOrderDetails(order)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          )}

          {/* Pagination */}
          {ordersData && ordersData.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('common.page', 'Halaman')} {currentPage} {t('common.of', 'dari')} {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('page', currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('common.previous', 'Sebelumnya')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('page', currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  {t('common.next', 'Lanjut')}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {t('orders.orderDetails', 'Detail Pesanan')} - {selectedOrder.order_number}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(selectedOrder.created_at), 'dd MMMM yyyy, HH:mm', { locale: localeId })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowDetailsModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t('pos.orderType', 'Jenis Pesanan')}</div>
                  <div className="text-base">{getOrderTypeLabel(selectedOrder.order_type)}</div>
                </div>
                {selectedOrder.table_number && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">{t('kitchen.table', 'Meja')}</div>
                    <div className="text-base">{selectedOrder.table_number}</div>
                  </div>
                )}
                {selectedOrder.customer_name && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">{t('pos.customerName', 'Nama Pelanggan')}</div>
                    <div className="text-base">{selectedOrder.customer_name}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t('common.status', 'Status')}</div>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                {selectedOrder.payment_method && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">{t('payment.paymentMethod', 'Metode Pembayaran')}</div>
                    <div className="text-base capitalize">{selectedOrder.payment_method}</div>
                  </div>
                )}
                {selectedOrder.created_by && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">{t('orders.createdBy', 'Dibuat Oleh')}</div>
                    <div className="text-base">{selectedOrder.created_by}</div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-medium mb-2">{t('kitchen.items', 'Item Pesanan')}</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('inventory.product', 'Produk')}</TableHead>
                        <TableHead className="text-center">{t('inventory.quantity', 'Jumlah')}</TableHead>
                        <TableHead className="text-right">{t('payment.price', 'Harga')}</TableHead>
                        <TableHead className="text-right">{t('common.subtotal', 'Subtotal')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedOrder.items || []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product?.name || 'Unknown'}</div>
                              {item.special_instructions && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  ⚠ {item.special_instructions}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total_price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800 mb-1">{t('common.notes', 'Catatan')}</div>
                  <div className="text-sm text-yellow-700">{selectedOrder.notes}</div>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div className="text-lg font-semibold">{t('common.total', 'Total')}</div>
                <div className="text-2xl font-bold">{formatCurrency(selectedOrder.total_amount)}</div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <ReceiptPrintButton
                  orderData={{
                    order_number: selectedOrder.order_number,
                    order_date: selectedOrder.created_at,
                    order_type: selectedOrder.order_type,
                    table_number: selectedOrder.table_number,
                    customer_name: selectedOrder.customer_name,
                    items: (selectedOrder.items || []).map((item) => ({
                      product_name: item.product?.name || 'Unknown',
                      quantity: item.quantity,
                      unit_price: item.unit_price,
                      total_price: item.total_price,
                      special_instructions: item.special_instructions,
                    })),
                    subtotal: selectedOrder.subtotal,
                    tax_amount: selectedOrder.tax_amount,
                    service_charge: 0,
                    discount_amount: selectedOrder.discount_amount,
                    total_amount: selectedOrder.total_amount,
                    payment_method: selectedOrder.payment_method || 'cash',
                    payment_amount: selectedOrder.total_amount,
                    change_amount: 0,
                  }}
                  variant="default"
                  showText={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
