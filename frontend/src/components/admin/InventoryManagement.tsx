import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import apiClient from '@/api/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { TableSkeleton } from '@/components/ui/loading-skeletons'
import { ButtonLoadingSpinner } from '@/components/ui/loading-spinner'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Package, 
  Plus, 
  Minus, 
  History, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  TrendingUp,
  TrendingDown,
  PackageOpen
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers'

interface InventoryItem {
  product_id: string
  product_name: string
  category_name: string
  current_stock: number
  min_stock: number
  max_stock: number
  unit: string
  last_restocked: string
  status: 'ok' | 'low' | 'out'
  price: number
}

interface HistoryRecord {
  id: string
  operation: 'add' | 'remove'
  quantity: number
  previous_stock: number
  new_stock: number
  reason: string
  notes: string
  adjusted_by: string
  created_at: string
}

export default function InventoryManagement() {
  const { t } = useTranslation()
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null)
  const [adjustForm, setAdjustForm] = useState({
    operation: 'add',
    quantity: 1,
    reason: 'manual_adjustment',
    notes: '',
  })

  const queryClient = useQueryClient()

  // Fetch inventory
  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: InventoryItem[] }>('/admin/inventory')
      return response.data
    },
  })

  // Fetch low stock items (used for alerting purposes)
  useQuery<InventoryItem[]>({
    queryKey: ['lowStock'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: InventoryItem[] }>('/admin/inventory/low-stock')
      return response.data
    },
  })

  // Fetch stock history
  const { data: history = [] } = useQuery<HistoryRecord[]>({
    queryKey: ['inventoryHistory', selectedProduct?.product_id],
    queryFn: async () => {
      if (!selectedProduct) return []
      const response = await apiClient.get<{ success: boolean; data: HistoryRecord[] }>(`/admin/inventory/history/${selectedProduct.product_id}`)
      return response.data
    },
    enabled: !!selectedProduct && historyDialogOpen,
  })

  // Adjust stock mutation
  const adjustStockMutation = useMutation({
    mutationFn: async (data: { product_id: string; operation: string; quantity: number; reason: string; notes: string }) => {
      const response = await apiClient.post<{ success: boolean; data: InventoryItem }>('/admin/inventory/adjust', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['lowStock'] })
      showSuccessToast(t('inventory.stockAdjusted', 'Stock adjusted successfully'))
      setAdjustDialogOpen(false)
      resetAdjustForm()
    },
    onError: () => {
      showErrorToast(t('inventory.stockAdjustFailed', 'Failed to adjust stock'))
    },
  })

  const resetAdjustForm = () => {
    setAdjustForm({
      operation: 'add',
      quantity: 1,
      reason: 'manual_adjustment',
      notes: '',
    })
  }

  const handleAdjustStock = () => {
    if (!selectedProduct) return
    adjustStockMutation.mutate({
      product_id: selectedProduct.product_id,
      ...adjustForm,
      quantity: parseInt(adjustForm.quantity.toString()),
    })
  }

  const handleViewHistory = (item: InventoryItem) => {
    setSelectedProduct(item)
    setHistoryDialogOpen(true)
  }

  const handleAdjustClick = (item: InventoryItem) => {
    setSelectedProduct(item)
    setAdjustDialogOpen(true)
  }

  const getStatusBadge = (status: string, currentStock: number) => {
    switch (status) {
      case 'out':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle size={14} />
            {t('inventory.statusOutOfStock', 'Out of Stock')} ({currentStock})
          </Badge>
        )
      case 'low':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
            <AlertTriangle size={14} />
            {t('inventory.statusLow', 'Low')} ({currentStock})
          </Badge>
        )
      case 'ok':
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-700">
            <CheckCircle size={14} />
            {t('inventory.statusNormal', 'Normal')} ({currentStock})
          </Badge>
        )
      default:
        return null
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const exportToCSV = () => {
    const headers = [
      t('inventory.product'),
      t('admin.categories'),
      t('inventory.currentStock'),
      t('inventory.minimumStock'),
      t('inventory.maximumStock'),
      t('common.unit', 'Unit'),
      t('common.status'),
      t('common.price')
    ]
    const rows = inventory.map(item => [
      item.product_name,
      item.category_name,
      item.current_stock,
      item.min_stock,
      item.max_stock,
      item.unit,
      item.status === 'ok' ? t('inventory.statusNormal') : item.status === 'low' ? t('inventory.statusLow') : t('inventory.statusOutOfStock'),
      item.price,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inventory_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const outOfStockCount = inventory.filter(i => i.status === 'out').length
  const lowStockCount = inventory.filter(i => i.status === 'low').length
  const totalValue = inventory.reduce((sum, item) => sum + (item.current_stock * item.price), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package size={28} />
            {t('inventory.title')}
          </h1>
          <p className="text-muted-foreground">{t('inventory.title', 'Manage product stock and track inventory movements')}</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download size={16} className="mr-2" />
          {t('common.export')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">{t('admin.products')}</div>
          <div className="text-2xl font-bold">{inventory.length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-red-50">
          <div className="text-sm text-red-600 flex items-center gap-2">
            <XCircle size={16} />
            {t('inventory.outOfStock')}
          </div>
          <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
        </div>
        <div className="border rounded-lg p-4 bg-yellow-50">
          <div className="text-sm text-yellow-700 flex items-center gap-2">
            <AlertTriangle size={16} />
            {t('inventory.lowStock')}
          </div>
          <div className="text-2xl font-bold text-yellow-700">{lowStockCount}</div>
        </div>
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="text-sm text-green-700">{t('inventory.totalStockValue', 'Total Stock Value')}</div>
          <div className="text-2xl font-bold text-green-700">{formatCurrency(totalValue)}</div>
        </div>
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <TableSkeleton columns={7} rows={8} showHeader={true} />
      ) : inventory.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('inventory.noData', 'No inventory data')}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('inventory.product')}</TableHead>
                <TableHead>{t('admin.categories')}</TableHead>
                <TableHead className="text-center">{t('inventory.currentStock')}</TableHead>
                <TableHead className="text-center">{t('inventory.minimumStock')}/{t('inventory.maximumStock')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('inventory.lastRestocked', 'Last Restocked')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-[400px] p-0">
                    <EmptyState
                      icon={PackageOpen}
                      title={t('inventory.noItems', 'Belum ada item inventori')}
                      description={t('inventory.noItemsDescription', 'Sistem inventori siap digunakan. Item akan muncul secara otomatis saat produk ditambahkan dengan informasi stok.')}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((item) => (
                <TableRow key={item.product_id} className={item.status === 'out' ? 'bg-red-50' : item.status === 'low' ? 'bg-yellow-50' : ''}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell>{item.category_name}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold">{item.current_stock}</span> {item.unit}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {item.min_stock} / {item.max_stock}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status, item.current_stock)}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(item.last_restocked), 'dd MMM yyyy', { locale: localeId })}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdjustClick(item)}
                    >
                      <Package size={14} className="mr-1" />
                      {t('inventory.adjustStock')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewHistory(item)}
                    >
                      <History size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inventory.adjustStock')}</DialogTitle>
            <DialogDescription>
              {selectedProduct?.product_name} - {t('inventory.currentStock')}: <strong>{selectedProduct?.current_stock}</strong> {selectedProduct?.unit}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('inventory.operation')}</Label>
              <Select
                value={adjustForm.operation}
                onValueChange={(value) => setAdjustForm({ ...adjustForm, operation: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-green-600" />
                      {t('inventory.addStock')}
                    </div>
                  </SelectItem>
                  <SelectItem value="remove">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} className="text-red-600" />
                      {t('inventory.removeStock')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('inventory.quantity')}</Label>
              <Input
                type="number"
                min="1"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('inventory.reason')}</Label>
              <Select
                value={adjustForm.reason}
                onValueChange={(value) => setAdjustForm({ ...adjustForm, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">{t('inventory.purchase')}</SelectItem>
                  <SelectItem value="sale">{t('inventory.sale')}</SelectItem>
                  <SelectItem value="spoilage">{t('inventory.spoilage')}</SelectItem>
                  <SelectItem value="manual_adjustment">{t('inventory.adjustment')}</SelectItem>
                  <SelectItem value="inventory_count">{t('inventory.count')}</SelectItem>
                  <SelectItem value="return">{t('inventory.return')}</SelectItem>
                  <SelectItem value="damage">{t('inventory.damage')}</SelectItem>
                  <SelectItem value="theft">{t('inventory.theft')}</SelectItem>
                  <SelectItem value="expired">{t('inventory.expired')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('common.notes')} ({t('common.optional', 'Optional')})</Label>
              <Textarea
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                placeholder={t('inventory.addNotes', 'Add notes...')}
                rows={3}
              />
            </div>

            {selectedProduct && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <strong>{t('inventory.newStockWillBe', 'New stock will be')}:</strong>{' '}
                {adjustForm.operation === 'add'
                  ? selectedProduct.current_stock + adjustForm.quantity
                  : selectedProduct.current_stock - adjustForm.quantity}{' '}
                {selectedProduct.unit}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAdjustStock} disabled={adjustStockMutation.isPending}>
              {adjustStockMutation.isPending && <ButtonLoadingSpinner />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('inventory.stockMovementHistory', 'Stock Movement History')}</DialogTitle>
            <DialogDescription>
              {selectedProduct?.product_name}
            </DialogDescription>
          </DialogHeader>

          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('inventory.noHistory', 'No movement history yet')}
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((record) => (
                <div key={record.id} className="border rounded-md p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {record.operation === 'add' ? (
                          <Plus size={16} className="text-green-600" />
                        ) : (
                          <Minus size={16} className="text-red-600" />
                        )}
                        <span className="font-medium">
                          {record.operation === 'add' ? t('inventory.added', 'Added') : t('inventory.removed', 'Removed')} {record.quantity} {t('common.units', 'units')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {record.reason.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.previous_stock} → {record.new_stock} {t('common.units', 'units')}
                      </div>
                      {record.notes && (
                        <div className="text-sm italic text-muted-foreground">
                          "{record.notes}"
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{record.adjusted_by}</div>
                      <div>{format(new Date(record.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
