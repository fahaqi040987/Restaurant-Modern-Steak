import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Edit,
  Trash2,
  PackagePlus,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers'

interface Ingredient {
  id: string
  name: string
  description: string
  unit: string
  current_stock: number
  minimum_stock: number
  maximum_stock: number
  unit_cost: number
  supplier: string
  last_restocked: string
  is_active: boolean
  status: 'ok' | 'low' | 'out'
  total_value: number
  created_at: string
  updated_at: string
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

export default function IngredientsManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [restockDialogOpen, setRestockDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    unit: 'kg',
    current_stock: 0,
    minimum_stock: 10,
    maximum_stock: 100,
    unit_cost: 0,
    supplier: '',
  })

  const [restockForm, setRestockForm] = useState({
    quantity: 0,
    notes: '',
  })

  const queryClient = useQueryClient()

  // Fetch ingredients
  const { data: ingredients = [], isLoading } = useQuery<Ingredient[]>({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/ingredients')
      return response.data
    },
  })

  // Fetch ingredient history
  const { data: history = [] } = useQuery<HistoryRecord[]>({
    queryKey: ['ingredientHistory', selectedIngredient?.id],
    queryFn: async () => {
      if (!selectedIngredient) return []
      const response = await apiClient.get(`/admin/ingredients/${selectedIngredient.id}/history`)
      return response.data
    },
    enabled: !!selectedIngredient && historyDialogOpen,
  })

  // Create ingredient mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      const response = await apiClient.post('/admin/ingredients', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      showSuccessToast('Bahan baku berhasil ditambahkan')
      setCreateDialogOpen(false)
      setCreateForm({
        name: '',
        description: '',
        unit: 'kg',
        current_stock: 0,
        minimum_stock: 10,
        maximum_stock: 100,
        unit_cost: 0,
        supplier: '',
      })
    },
    onError: () => {
      showErrorToast('Gagal menambahkan bahan baku')
    },
  })

  // Update ingredient mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Ingredient>) => {
      const response = await apiClient.put(`/admin/ingredients/${data.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      showSuccessToast('Bahan baku berhasil diperbarui')
      setEditDialogOpen(false)
    },
    onError: () => {
      showErrorToast('Gagal memperbarui bahan baku')
    },
  })

  // Delete ingredient mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/ingredients/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      showSuccessToast('Bahan baku berhasil dihapus')
    },
    onError: () => {
      showErrorToast('Gagal menghapus bahan baku')
    },
  })

  // Restock ingredient mutation
  const restockMutation = useMutation({
    mutationFn: async (data: { ingredient_id: string; quantity: number; notes: string }) => {
      const response = await apiClient.post('/admin/ingredients/restock', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      showSuccessToast('Stok berhasil ditambahkan')
      setRestockDialogOpen(false)
      setRestockForm({ quantity: 0, notes: '' })
    },
    onError: () => {
      showErrorToast('Gagal menambah stok')
    },
  })

  const getStatusBadge = (status: string, currentStock: number, minStock: number) => {
    if (status === 'out') {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle size={14} />
          Habis
        </Badge>
      )
    } else if (status === 'low') {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle size={14} />
          Stok Rendah
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="gap-1">
        <CheckCircle size={14} />
        Aman
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleCreateSubmit = () => {
    createMutation.mutate(createForm)
  }

  const handleEditSubmit = () => {
    if (selectedIngredient) {
      updateMutation.mutate(selectedIngredient)
    }
  }

  const handleRestockSubmit = () => {
    if (selectedIngredient) {
      restockMutation.mutate({
        ingredient_id: selectedIngredient.id,
        quantity: restockForm.quantity,
        notes: restockForm.notes,
      })
    }
  }

  const handleDelete = (ingredient: Ingredient) => {
    if (confirm(`Yakin ingin menghapus ${ingredient.name}?`)) {
      deleteMutation.mutate(ingredient.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bahan Baku</h2>
          <p className="text-muted-foreground">Kelola stok bahan baku restoran</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2" size={16} />
          Tambah Bahan Baku
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Bahan Baku</p>
              <p className="text-2xl font-bold">{ingredients.length}</p>
            </div>
            <Package className="text-muted-foreground" size={32} />
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Stok Rendah</p>
              <p className="text-2xl font-bold text-yellow-600">
                {ingredients.filter((i) => i.status === 'low').length}
              </p>
            </div>
            <AlertTriangle className="text-yellow-600" size={32} />
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Nilai Stok</p>
              <p className="text-2xl font-bold">
                {formatCurrency(ingredients.reduce((sum, i) => sum + i.total_value, 0))}
              </p>
            </div>
            <PackagePlus className="text-muted-foreground" size={32} />
          </div>
        </div>
      </div>

      {/* Ingredients Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Stok Saat Ini</TableHead>
                <TableHead>Min / Max</TableHead>
                <TableHead>Harga Satuan</TableHead>
                <TableHead>Total Nilai</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-[400px] p-0">
                    <EmptyState
                      icon={Package}
                      title="Belum ada bahan baku"
                      description="Mulai dengan menambahkan bahan baku pertama untuk tracking stok bahan mentah seperti kentang, tomat, saus, dll."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                ingredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ingredient.name}</div>
                        {ingredient.description && (
                          <div className="text-sm text-muted-foreground">{ingredient.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {ingredient.current_stock} {ingredient.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ingredient.minimum_stock} / {ingredient.maximum_stock} {ingredient.unit}
                    </TableCell>
                    <TableCell>{formatCurrency(ingredient.unit_cost)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(ingredient.total_value)}</TableCell>
                    <TableCell className="text-sm">{ingredient.supplier || '-'}</TableCell>
                    <TableCell>
                      {getStatusBadge(ingredient.status, ingredient.current_stock, ingredient.minimum_stock)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedIngredient(ingredient)
                            setRestockDialogOpen(true)
                          }}
                        >
                          <PackagePlus size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedIngredient(ingredient)
                            setHistoryDialogOpen(true)
                          }}
                        >
                          <History size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedIngredient(ingredient)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ingredient)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Ingredient Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Bahan Baku</DialogTitle>
            <DialogDescription>Tambah bahan baku baru ke inventori</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Bahan Baku *</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Kentang, Tomat, dll"
              />
            </div>
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Keterangan tambahan"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">Satuan *</Label>
                <Select value={createForm.unit} onValueChange={(value) => setCreateForm({ ...createForm, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="dozen">Dozen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unit_cost">Harga Satuan (Rp)</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  value={createForm.unit_cost}
                  onChange={(e) => setCreateForm({ ...createForm, unit_cost: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="current_stock">Stok Awal</Label>
                <Input
                  id="current_stock"
                  type="number"
                  value={createForm.current_stock}
                  onChange={(e) => setCreateForm({ ...createForm, current_stock: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="minimum_stock">Min</Label>
                <Input
                  id="minimum_stock"
                  type="number"
                  value={createForm.minimum_stock}
                  onChange={(e) => setCreateForm({ ...createForm, minimum_stock: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="maximum_stock">Max</Label>
                <Input
                  id="maximum_stock"
                  type="number"
                  value={createForm.maximum_stock}
                  onChange={(e) => setCreateForm({ ...createForm, maximum_stock: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={createForm.supplier}
                onChange={(e) => setCreateForm({ ...createForm, supplier: e.target.value })}
                placeholder="Nama supplier"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateSubmit} disabled={!createForm.name || !createForm.unit}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ingredient Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bahan Baku</DialogTitle>
            <DialogDescription>Perbarui informasi bahan baku</DialogDescription>
          </DialogHeader>
          {selectedIngredient && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_name">Nama Bahan Baku</Label>
                <Input
                  id="edit_name"
                  value={selectedIngredient.name}
                  onChange={(e) =>
                    setSelectedIngredient({ ...selectedIngredient, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_description">Deskripsi</Label>
                <Textarea
                  id="edit_description"
                  value={selectedIngredient.description}
                  onChange={(e) =>
                    setSelectedIngredient({ ...selectedIngredient, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_unit_cost">Harga Satuan</Label>
                  <Input
                    id="edit_unit_cost"
                    type="number"
                    value={selectedIngredient.unit_cost}
                    onChange={(e) =>
                      setSelectedIngredient({ ...selectedIngredient, unit_cost: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_supplier">Supplier</Label>
                  <Input
                    id="edit_supplier"
                    value={selectedIngredient.supplier}
                    onChange={(e) =>
                      setSelectedIngredient({ ...selectedIngredient, supplier: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_minimum_stock">Stok Minimum</Label>
                  <Input
                    id="edit_minimum_stock"
                    type="number"
                    value={selectedIngredient.minimum_stock}
                    onChange={(e) =>
                      setSelectedIngredient({ ...selectedIngredient, minimum_stock: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_maximum_stock">Stok Maximum</Label>
                  <Input
                    id="edit_maximum_stock"
                    type="number"
                    value={selectedIngredient.maximum_stock}
                    onChange={(e) =>
                      setSelectedIngredient({ ...selectedIngredient, maximum_stock: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditSubmit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Stok</DialogTitle>
            <DialogDescription>
              Tambah stok untuk {selectedIngredient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Jumlah ({selectedIngredient?.unit})</Label>
              <Input
                id="quantity"
                type="number"
                value={restockForm.quantity}
                onChange={(e) => setRestockForm({ ...restockForm, quantity: parseFloat(e.target.value) })}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                value={restockForm.notes}
                onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                placeholder="Pembelian dari supplier..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleRestockSubmit} disabled={restockForm.quantity <= 0}>
              Tambah Stok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Riwayat Stok</DialogTitle>
            <DialogDescription>{selectedIngredient?.name}</DialogDescription>
          </DialogHeader>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Belum ada riwayat</div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div key={record.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {record.operation === 'restock' ? 'Restock' : record.operation} {record.quantity} {selectedIngredient?.unit}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {record.reason}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.previous_stock} → {record.new_stock} {selectedIngredient?.unit}
                    </div>
                    {record.notes && (
                      <div className="text-sm italic text-muted-foreground">"{record.notes}"</div>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{record.adjusted_by}</div>
                    <div>
                      {format(new Date(record.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
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
