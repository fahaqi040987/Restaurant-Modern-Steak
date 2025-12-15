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
      const response = await apiClient.get('/admin/inventory')
      return response.data
    },
  })

  // Fetch low stock items
  const { data: lowStock = [] } = useQuery<InventoryItem[]>({
    queryKey: ['lowStock'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/inventory/low-stock')
      return response.data
    },
  })

  // Fetch stock history
  const { data: history = [] } = useQuery<HistoryRecord[]>({
    queryKey: ['inventoryHistory', selectedProduct?.product_id],
    queryFn: async () => {
      if (!selectedProduct) return []
      const response = await apiClient.get(`/admin/inventory/history/${selectedProduct.product_id}`)
      return response.data
    },
    enabled: !!selectedProduct && historyDialogOpen,
  })

  // Adjust stock mutation
  const adjustStockMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/admin/inventory/adjust', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['lowStock'] })
      showSuccessToast('Stok berhasil disesuaikan')
      setAdjustDialogOpen(false)
      resetAdjustForm()
    },
    onError: () => {
      showErrorToast('Gagal menyesuaikan stok')
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
            Habis ({currentStock})
          </Badge>
        )
      case 'low':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
            <AlertTriangle size={14} />
            Menipis ({currentStock})
          </Badge>
        )
      case 'ok':
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-700">
            <CheckCircle size={14} />
            Normal ({currentStock})
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
    const headers = ['Produk', 'Kategori', 'Stok Saat Ini', 'Stok Minimum', 'Stok Maksimum', 'Unit', 'Status', 'Harga']
    const rows = inventory.map(item => [
      item.product_name,
      item.category_name,
      item.current_stock,
      item.min_stock,
      item.max_stock,
      item.unit,
      item.status === 'ok' ? 'Normal' : item.status === 'low' ? 'Menipis' : 'Habis',
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
          <div className="text-sm text-muted-foreground">Total Produk</div>
          <div className="text-2xl font-bold">{inventory.length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-red-50">
          <div className="text-sm text-red-600 flex items-center gap-2">
            <XCircle size={16} />
            Stok Habis
          </div>
          <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
        </div>
        <div className="border rounded-lg p-4 bg-yellow-50">
          <div className="text-sm text-yellow-700 flex items-center gap-2">
            <AlertTriangle size={16} />
            Stok Menipis
          </div>
          <div className="text-2xl font-bold text-yellow-700">{lowStockCount}</div>
        </div>
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="text-sm text-green-700">Nilai Total Stok</div>
          <div className="text-2xl font-bold text-green-700">{formatCurrency(totalValue)}</div>
        </div>
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <TableSkeleton columns={7} rows={8} showHeader={true} />
      ) : inventory.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Tidak ada data inventaris
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">Stok</TableHead>
                <TableHead className="text-center">Min/Max</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terakhir Diisi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
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
                      Sesuaikan
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
            <DialogTitle>Sesuaikan Stok</DialogTitle>
            <DialogDescription>
              {selectedProduct?.product_name} - Stok saat ini: <strong>{selectedProduct?.current_stock}</strong> {selectedProduct?.unit}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Operasi</Label>
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
                      Tambah Stok
                    </div>
                  </SelectItem>
                  <SelectItem value="remove">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} className="text-red-600" />
                      Kurangi Stok
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jumlah</Label>
              <Input
                type="number"
                min="1"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Alasan</Label>
              <Select
                value={adjustForm.reason}
                onValueChange={(value) => setAdjustForm({ ...adjustForm, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Pembelian</SelectItem>
                  <SelectItem value="sale">Penjualan</SelectItem>
                  <SelectItem value="spoilage">Pembusukan</SelectItem>
                  <SelectItem value="manual_adjustment">Penyesuaian Manual</SelectItem>
                  <SelectItem value="inventory_count">Perhitungan Inventaris</SelectItem>
                  <SelectItem value="return">Retur</SelectItem>
                  <SelectItem value="damage">Kerusakan</SelectItem>
                  <SelectItem value="theft">Pencurian</SelectItem>
                  <SelectItem value="expired">Kadaluarsa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                placeholder="Tambahkan catatan..."
                rows={3}
              />
            </div>

            {selectedProduct && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <strong>Stok baru akan menjadi:</strong>{' '}
                {adjustForm.operation === 'add'
                  ? selectedProduct.current_stock + adjustForm.quantity
                  : selectedProduct.current_stock - adjustForm.quantity}{' '}
                {selectedProduct.unit}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAdjustStock} disabled={adjustStockMutation.isPending}>
              {adjustStockMutation.isPending && <ButtonLoadingSpinner />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Riwayat Pergerakan Stok</DialogTitle>
            <DialogDescription>
              {selectedProduct?.product_name}
            </DialogDescription>
          </DialogHeader>

          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada riwayat pergerakan
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
                          {record.operation === 'add' ? 'Tambah' : 'Kurangi'} {record.quantity} unit
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {record.reason.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.previous_stock} → {record.new_stock} unit
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
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
