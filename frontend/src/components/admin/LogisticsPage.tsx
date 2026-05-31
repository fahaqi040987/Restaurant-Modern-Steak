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
  PackageOpen,
  Trash2
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers'

interface IngredientItem {
  id: string
  name: string
  description: string
  code: string
  category: string
  unit: string
  storage_location: string
  current_stock: number
  minimum_stock: number
  maximum_stock: number
  unit_cost: number
  supplier: string
  lead_time_days: number
  status: 'ok' | 'low' | 'out'
  last_restocked: string
  total_value: number
}

interface HistoryRecord {
  id: string
  operation: string
  quantity: number
  previous_stock: number
  new_stock: number
  reason: string
  notes: string
  adjusted_by: string
  created_at: string
}

const CATEGORIES = ['Daging', 'Seafood', 'Sayur', 'Buah', 'Bumbu', 'Bahan Kering', 'Minuman', 'Dairy', 'Minyak', 'Lainnya']
const STORAGE_LOCATIONS = ['Chiller', 'Freezer', 'Dry Storage', 'Rack', 'Bar', 'Lainnya']
const UNITS = ['kg', 'gram', 'liter', 'ml', 'pcs', 'pack', 'box', 'buah', 'ikat', 'ons', 'pon']
const MOVEMENT_REASONS = ['purchase', 'spoilage', 'damage', 'expired', 'theft', 'stock_opname', 'manual_adjustment']

export default function LogisticsPage() {
  const { t } = useTranslation()
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<IngredientItem | null>(null)
  const [adjustForm, setAdjustForm] = useState({
    operation: 'add',
    quantity: 1,
    reason: 'manual_adjustment',
    notes: '',
  })
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    code: '',
    category: 'Lainnya',
    unit: 'pcs',
    storage_location: 'Dry Storage',
    current_stock: 0,
    minimum_stock: 10,
    maximum_stock: 100,
    unit_cost: 0,
    supplier: '',
    lead_time_days: 0,
  })
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterLocation, setFilterLocation] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const queryClient = useQueryClient()

  // Fetch ingredients (logistics items)
  const { data: ingredients = [], isLoading } = useQuery<IngredientItem[]>({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const response = await apiClient.get<IngredientItem[]>('/admin/ingredients')
      return Array.isArray(response) ? response : (response as any).data ?? []
    },
  })

  // Fetch low stock items
  useQuery<IngredientItem[]>({
    queryKey: ['lowStockIngredients'],
    queryFn: async () => {
      const response = await apiClient.get<IngredientItem[]>('/admin/ingredients/low-stock')
      return Array.isArray(response) ? response : (response as any).data ?? []
    },
  })

  // Fetch movement history
  const { data: history = [] } = useQuery<HistoryRecord[]>({
    queryKey: ['ingredientHistory', selectedItem?.id],
    queryFn: async () => {
      if (!selectedItem) return []
      const response = await apiClient.get<HistoryRecord[]>(`/admin/ingredients/${selectedItem.id}/history`)
      return Array.isArray(response) ? response : (response as any).data ?? []
    },
    enabled: !!selectedItem && historyDialogOpen,
  })

  // Adjust stock mutation
  const adjustStockMutation = useMutation({
    mutationFn: async (data: { id: string; operation: string; quantity: number; reason: string; notes: string }) => {
      const response = await apiClient.post<{ previous_stock: number; new_stock: number }>(
        `/admin/ingredients/${data.id}/adjust`,
        { ingredient_id: data.id, operation: data.operation, quantity: data.quantity, reason: data.reason, notes: data.notes }
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['lowStockIngredients'] })
      showSuccessToast(t('logistics.stockAdjusted', 'Stok berhasil diadjust'))
      setAdjustDialogOpen(false)
      resetAdjustForm()
    },
    onError: () => {
      showErrorToast(t('logistics.stockAdjustFailed', 'Gagal adjust stok'))
    },
  })

  // Create ingredient mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      const response = await apiClient.post<IngredientItem>('/admin/ingredients', data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      showSuccessToast(t('logistics.ingredientCreated', 'Bahan baku berhasil dibuat'))
      setCreateDialogOpen(false)
      resetCreateForm()
    },
    onError: () => {
      showErrorToast(t('logistics.createFailed', 'Gagal membuat bahan baku'))
    },
  })

  // Delete ingredient mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/admin/ingredients/${id}`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['lowStockIngredients'] })
      showSuccessToast(t('logistics.ingredientDeletedSuccess', 'Bahan baku berhasil dihapus'))
      setDeleteDialogOpen(false)
    },
    onError: () => {
      showErrorToast(t('logistics.ingredientDeletedError', 'Gagal menghapus bahan baku'))
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

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      code: '',
      category: 'Lainnya',
      unit: 'pcs',
      storage_location: 'Dry Storage',
      current_stock: 0,
      minimum_stock: 10,
      maximum_stock: 100,
      unit_cost: 0,
      supplier: '',
      lead_time_days: 0,
    })
  }

  const handleAdjustStock = () => {
    if (!selectedItem) return
    adjustStockMutation.mutate({
      id: selectedItem.id,
      ...adjustForm,
      quantity: parseInt(adjustForm.quantity.toString()),
    })
  }

  const handleViewHistory = (item: IngredientItem) => {
    setSelectedItem(item)
    setHistoryDialogOpen(true)
  }

  const handleAdjustClick = (item: IngredientItem) => {
    setSelectedItem(item)
    setAdjustDialogOpen(true)
  }

  const handleDeleteClick = (item: IngredientItem) => {
    setSelectedItem(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!selectedItem) return
    deleteMutation.mutate(selectedItem.id)
  }

  const handleCreateIngredient = () => {
    createMutation.mutate(createForm)
  }

  const getStatusBadge = (status: string, currentStock: number) => {
    switch (status) {
      case 'out':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle size={14} />
            {t('logistics.statusOutOfStock', 'Habis')} ({currentStock})
          </Badge>
        )
      case 'low':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
            <AlertTriangle size={14} />
            {t('logistics.statusLow', 'Rendah')} ({currentStock})
          </Badge>
        )
      case 'ok':
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-700">
            <CheckCircle size={14} />
            {t('logistics.statusNormal', 'Normal')} ({currentStock})
          </Badge>
        )
      default:
        return null
    }
  }

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    return `Rp.${formatted},-`;
  }

  const exportToCSV = () => {
    const headers = [
      t('logistics.name'),
      t('logistics.code'),
      t('logistics.category'),
      t('logistics.unit'),
      t('logistics.currentStock'),
      t('logistics.minimumStock'),
      t('logistics.maximumStock'),
      t('logistics.storageLocation'),
      t('logistics.supplier'),
      t('common.status'),
      t('logistics.unitCost'),
    ]
    const rows = ingredients.map(item => [
      item.name,
      item.code,
      item.category,
      item.unit,
      item.current_stock,
      item.minimum_stock,
      item.maximum_stock,
      item.storage_location,
      item.supplier,
      item.status,
      item.unit_cost,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `logistics_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter ingredients
  const filteredIngredients = ingredients.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    const matchesLocation = filterLocation === 'all' || item.storage_location === filterLocation
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesLocation && matchesSearch
  })

  const outOfStockCount = ingredients.filter(i => i.status === 'out').length
  const lowStockCount = ingredients.filter(i => i.status === 'low').length
  const totalValue = ingredients.reduce((sum, item) => sum + (item.total_value || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package size={28} />
            {t('logistics.title', 'Logistics')}
          </h1>
          <p className="text-muted-foreground">{t('logistics.subtitle', 'Kelola stok bahan baku dan tracking pergerakan')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus size={16} className="mr-2" />
            {t('logistics.addIngredient', 'Tambah Bahan Baku')}
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download size={16} className="mr-2" />
            {t('common.export', 'Ekspor')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">{t('logistics.totalItems', 'Total Item')}</div>
          <div className="text-2xl font-bold">{ingredients.length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-red-50">
          <div className="text-sm text-red-600 flex items-center gap-2">
            <XCircle size={16} />
            {t('logistics.outOfStock', 'Habis')}
          </div>
          <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
        </div>
        <div className="border rounded-lg p-4 bg-yellow-50">
          <div className="text-sm text-yellow-700 flex items-center gap-2">
            <AlertTriangle size={16} />
            {t('logistics.lowStock', 'Stok Rendah')}
          </div>
          <div className="text-2xl font-bold text-yellow-700">{lowStockCount}</div>
        </div>
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="text-sm text-green-700">{t('logistics.totalValue', 'Total Nilai')}</div>
          <div className="text-2xl font-bold text-green-700">{formatCurrency(totalValue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder={t('logistics.searchPlaceholder', 'Cari nama atau kode...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('logistics.allCategories', 'Semua Kategori')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('logistics.allCategories', 'Semua Kategori')}</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterLocation} onValueChange={setFilterLocation}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('logistics.allLocations', 'Semua Lokasi')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('logistics.allLocations', 'Semua Lokasi')}</SelectItem>
            {STORAGE_LOCATIONS.map(loc => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ingredients Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('common.loading', 'Memuat...')}
        </div>
      ) : filteredIngredients.length === 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('logistics.name')}</TableHead>
                <TableHead>{t('logistics.code')}</TableHead>
                <TableHead>{t('logistics.category')}</TableHead>
                <TableHead className="text-center">{t('logistics.currentStock')}</TableHead>
                <TableHead>{t('logistics.storageLocation')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="h-[400px] p-0">
                  <EmptyState
                    icon={PackageOpen}
                    title={t('logistics.noItems', 'Belum ada bahan baku')}
                    description={t('logistics.noItemsDescription', 'Mulai dengan menambahkan bahan baku untuk melacak stok.')}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('logistics.name')}</TableHead>
                <TableHead>{t('logistics.code')}</TableHead>
                <TableHead>{t('logistics.category')}</TableHead>
                <TableHead className="text-center">{t('logistics.currentStock')}</TableHead>
                <TableHead>{t('logistics.storageLocation')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIngredients.map((item) => (
                <TableRow key={item.id} className={item.status === 'out' ? 'bg-red-50' : item.status === 'low' ? 'bg-yellow-50' : ''}>
                  <TableCell className="font-medium">
                    {item.name}
                    {item.description && (
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    )}
                  </TableCell>
                  <TableCell>{item.code || '-'}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold">{item.current_stock}</span> {item.unit}
                  </TableCell>
                  <TableCell>{item.storage_location}</TableCell>
                  <TableCell>{getStatusBadge(item.status, item.current_stock)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdjustClick(item)}
                    >
                      <Package size={14} className="mr-1" />
                      {t('logistics.adjustStock', 'Adjust')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewHistory(item)}
                    >
                      <History size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteClick(item)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('logistics.adjustStock', 'Adjust Stok')}</DialogTitle>
            <DialogDescription>
              {selectedItem?.name} - {t('logistics.currentStock')}: <strong>{selectedItem?.current_stock}</strong> {selectedItem?.unit}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('logistics.operation')}</Label>
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
                      {t('logistics.addStock', 'Tambah Stok')}
                    </div>
                  </SelectItem>
                  <SelectItem value="remove">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} className="text-red-600" />
                      {t('logistics.removeStock', 'Kurangi Stok')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('logistics.quantity')}</Label>
              <Input
                type="number"
                min="1"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('logistics.reason')}</Label>
              <Select
                value={adjustForm.reason}
                onValueChange={(value) => setAdjustForm({ ...adjustForm, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_REASONS.map(reason => (
                    <SelectItem key={reason} value={reason}>
                      {t(`logistics.reason_${reason}`, reason)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('common.notes')} ({t('common.optional', 'Opsional')})</Label>
              <Textarea
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                placeholder={t('logistics.addNotes', 'Tambah catatan...')}
                rows={3}
              />
            </div>

            {selectedItem && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <strong>{t('logistics.newStockWillBe', 'Stok baru akan menjadi')}:</strong>{' '}
                {adjustForm.operation === 'add'
                  ? selectedItem.current_stock + adjustForm.quantity
                  : selectedItem.current_stock - adjustForm.quantity}{' '}
                {selectedItem.unit}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              {t('common.cancel', 'Batal')}
            </Button>
            <Button onClick={handleAdjustStock} disabled={adjustStockMutation.isPending}>
              {adjustStockMutation.isPending && <span className="animate-spin mr-2">⏳</span>}
              {t('common.save', 'Simpan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('logistics.movementHistory', 'History Pergerakan')}</DialogTitle>
            <DialogDescription>
              {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>

          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('logistics.noHistory', 'Belum ada history pergerakan')}
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((record) => (
                <div key={record.id} className="border rounded-md p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {record.operation === 'add' || record.operation === 'restock' ? (
                          <Plus size={16} className="text-green-600" />
                        ) : (
                          <Minus size={16} className="text-red-600" />
                        )}
                        <span className="font-medium">
                          {record.operation === 'add' || record.operation === 'restock'
                            ? t('logistics.added', 'Ditambah')
                            : t('logistics.removed', 'Dikurangi')} {record.quantity} {t('common.units', 'unit')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {record.reason}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.previous_stock} → {record.new_stock} {t('common.units', 'unit')}
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
              {t('common.close', 'Tutup')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ingredient Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('logistics.addIngredient', 'Tambah Bahan Baku')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('logistics.name')} *</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder={t('logistics.namePlaceholder', 'Nama bahan baku')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('logistics.code')}</Label>
                <Input
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                  placeholder={t('logistics.codePlaceholder', 'Kode/Barcode')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('logistics.description')}</Label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder={t('logistics.descriptionPlaceholder', 'Deskripsi...')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('logistics.category')} *</Label>
                <Select value={createForm.category} onValueChange={(value) => setCreateForm({ ...createForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('logistics.unit')} *</Label>
                <Select value={createForm.unit} onValueChange={(value) => setCreateForm({ ...createForm, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('logistics.storageLocation')}</Label>
                <Select value={createForm.storage_location} onValueChange={(value) => setCreateForm({ ...createForm, storage_location: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STORAGE_LOCATIONS.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('logistics.currentStock')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={createForm.current_stock}
                  onChange={(e) => setCreateForm({ ...createForm, current_stock: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('logistics.minimumStock')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={createForm.minimum_stock}
                  onChange={(e) => setCreateForm({ ...createForm, minimum_stock: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('logistics.maximumStock')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={createForm.maximum_stock}
                  onChange={(e) => setCreateForm({ ...createForm, maximum_stock: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('logistics.unitCost')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={createForm.unit_cost}
                  onChange={(e) => setCreateForm({ ...createForm, unit_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('logistics.leadTimeDays')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={createForm.lead_time_days}
                  onChange={(e) => setCreateForm({ ...createForm, lead_time_days: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('logistics.supplier')}</Label>
                <Input
                  value={createForm.supplier}
                  onChange={(e) => setCreateForm({ ...createForm, supplier: e.target.value })}
                  placeholder={t('logistics.supplierPlaceholder', 'Nama supplier')}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t('common.cancel', 'Batal')}
            </Button>
            <Button onClick={handleCreateIngredient} disabled={createMutation.isPending}>
              {createMutation.isPending && <span className="animate-spin mr-2">⏳</span>}
              {t('common.save', 'Simpan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.confirmDelete', 'Konfirmasi Hapus')}</DialogTitle>
            <DialogDescription>
              {t('logistics.confirmDeleteIngredient', 'Apakah Anda yakin ingin menghapus {{name}}?', { name: selectedItem?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel', 'Batal')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <span className="animate-spin mr-2">⏳</span>}
              {t('common.delete', 'Hapus')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
