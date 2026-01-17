import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      showSuccessToast(t('admin.ingredientCreatedSuccess'))
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
      showErrorToast(t('admin.ingredientCreatedError'))
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
      showSuccessToast(t('admin.ingredientUpdatedSuccess'))
      setEditDialogOpen(false)
    },
    onError: () => {
      showErrorToast(t('admin.ingredientUpdatedError'))
    },
  })

  // Delete ingredient mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/ingredients/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      showSuccessToast(t('admin.ingredientDeletedSuccess'))
    },
    onError: () => {
      showErrorToast(t('admin.ingredientDeletedError'))
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
      showSuccessToast(t('admin.restockSuccess'))
      setRestockDialogOpen(false)
      setRestockForm({ quantity: 0, notes: '' })
    },
    onError: () => {
      showErrorToast(t('admin.restockError'))
    },
  })

  const getStatusBadge = (status: string, _currentStock: number, _minStock: number) => {
    if (status === 'out') {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle size={14} />
          {t('admin.stockOut')}
        </Badge>
      )
    } else if (status === 'low') {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle size={14} />
          {t('admin.stockLow')}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="gap-1">
        <CheckCircle size={14} />
        {t('admin.stockOk')}
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
    if (confirm(t('admin.confirmDeleteIngredient', { name: ingredient.name }))) {
      deleteMutation.mutate(ingredient.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.ingredientsManagement')}</h2>
          <p className="text-muted-foreground">{t('admin.ingredientsManagementDesc')}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2" size={16} />
          {t('admin.addIngredient')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.totalIngredients')}</p>
              <p className="text-2xl font-bold">{ingredients.length}</p>
            </div>
            <Package className="text-muted-foreground" size={32} />
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.stockLow')}</p>
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
              <p className="text-sm text-muted-foreground">{t('admin.totalStockValue')}</p>
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
        <div className="text-center py-8">{t('common.loading')}</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('admin.currentStock')}</TableHead>
                <TableHead>{t('admin.minMax')}</TableHead>
                <TableHead>{t('admin.unitPrice')}</TableHead>
                <TableHead>{t('admin.totalValue')}</TableHead>
                <TableHead>{t('admin.supplier')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-[400px] p-0">
                    <EmptyState
                      icon={Package}
                      title={t('admin.noIngredientsYet')}
                      description={t('admin.noIngredientsDesc')}
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
            <DialogTitle>{t('admin.addIngredient')}</DialogTitle>
            <DialogDescription>{t('admin.addIngredientToInventory')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('admin.ingredientName')} *</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder={t('admin.ingredientNamePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder={t('admin.additionalNotes')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">{t('admin.ingredientUnit')} *</Label>
                <Select value={createForm.unit} onValueChange={(value) => setCreateForm({ ...createForm, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">{t('admin.unitKg')}</SelectItem>
                    <SelectItem value="liter">{t('admin.unitLiter')}</SelectItem>
                    <SelectItem value="pcs">{t('admin.unitPcs')}</SelectItem>
                    <SelectItem value="box">{t('admin.unitBox')}</SelectItem>
                    <SelectItem value="dozen">{t('admin.unitDozen')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unit_cost">{t('admin.unitPriceRp')}</Label>
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
                <Label htmlFor="current_stock">{t('admin.initialStock')}</Label>
                <Input
                  id="current_stock"
                  type="number"
                  value={createForm.current_stock}
                  onChange={(e) => setCreateForm({ ...createForm, current_stock: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="minimum_stock">{t('admin.min')}</Label>
                <Input
                  id="minimum_stock"
                  type="number"
                  value={createForm.minimum_stock}
                  onChange={(e) => setCreateForm({ ...createForm, minimum_stock: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="maximum_stock">{t('admin.max')}</Label>
                <Input
                  id="maximum_stock"
                  type="number"
                  value={createForm.maximum_stock}
                  onChange={(e) => setCreateForm({ ...createForm, maximum_stock: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="supplier">{t('admin.supplier')}</Label>
              <Input
                id="supplier"
                value={createForm.supplier}
                onChange={(e) => setCreateForm({ ...createForm, supplier: e.target.value })}
                placeholder={t('admin.supplierName')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateSubmit} disabled={!createForm.name || !createForm.unit}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ingredient Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.editIngredient')}</DialogTitle>
            <DialogDescription>{t('admin.updateIngredientInfo')}</DialogDescription>
          </DialogHeader>
          {selectedIngredient && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_name">{t('admin.ingredientName')}</Label>
                <Input
                  id="edit_name"
                  value={selectedIngredient.name}
                  onChange={(e) =>
                    setSelectedIngredient({ ...selectedIngredient, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_description">{t('common.description')}</Label>
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
                  <Label htmlFor="edit_unit_cost">{t('admin.unitPrice')}</Label>
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
                  <Label htmlFor="edit_supplier">{t('admin.supplier')}</Label>
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
                  <Label htmlFor="edit_minimum_stock">{t('inventory.minimumStock')}</Label>
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
                  <Label htmlFor="edit_maximum_stock">{t('inventory.maximumStock')}</Label>
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditSubmit}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('inventory.addStock')}</DialogTitle>
            <DialogDescription>
              {t('admin.addStockFor', { name: selectedIngredient?.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">{t('inventory.quantity')} ({selectedIngredient?.unit})</Label>
              <Input
                id="quantity"
                type="number"
                value={restockForm.quantity}
                onChange={(e) => setRestockForm({ ...restockForm, quantity: parseFloat(e.target.value) })}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="notes">{t('admin.notesOptional')}</Label>
              <Textarea
                id="notes"
                value={restockForm.notes}
                onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                placeholder={t('admin.purchaseFromSupplier')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleRestockSubmit} disabled={restockForm.quantity <= 0}>
              {t('inventory.addStock')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('inventory.stockHistory')}</DialogTitle>
            <DialogDescription>{selectedIngredient?.name}</DialogDescription>
          </DialogHeader>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('admin.noHistory')}</div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div key={record.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {record.operation === 'restock' ? t('admin.restock') : record.operation} {record.quantity} {selectedIngredient?.unit}
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
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
