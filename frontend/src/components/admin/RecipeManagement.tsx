import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import apiClient from '@/api/client';
import type { ProductIngredient, Ingredient, AddRecipeIngredientRequest, UpdateRecipeIngredientRequest } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { recipeIngredientSchema } from '@/lib/form-schemas';

interface RecipeManagementProps {
  productId: string;
}

type RecipeFormValues = z.infer<typeof recipeIngredientSchema>;

export function RecipeManagement({ productId }: RecipeManagementProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<ProductIngredient | null>(null);

  // Fetch product ingredients
  const { data: recipeData, isLoading: isLoadingRecipe } = useQuery({
    queryKey: ['product-ingredients', productId],
    queryFn: async () => {
      const response = await apiClient.getProductIngredients(productId);
      return response.data || [];
    },
  });

  // Fetch all ingredients for the dropdown
  const { data: ingredientsData, isLoading: isLoadingIngredients } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const response = await apiClient.getIngredients();
      return response.data || [];
    },
  });

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeIngredientSchema),
    defaultValues: {
      ingredient_id: '',
      quantity_required: 0,
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isAddDialogOpen && !editingIngredient) {
      form.reset({
        ingredient_id: '',
        quantity_required: 0,
      });
    }
  }, [isAddDialogOpen, editingIngredient, form]);

  // Populate form when editing
  useEffect(() => {
    if (editingIngredient) {
      form.reset({
        ingredient_id: editingIngredient.ingredient_id,
        quantity_required: editingIngredient.quantity_required,
      });
    }
  }, [editingIngredient, form]);

  // Add ingredient mutation
  const addMutation = useMutation({
    mutationFn: (data: AddRecipeIngredientRequest) =>
      apiClient.addProductIngredient(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-ingredients', productId] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: t('admin.recipe.ingredientAdded'),
        description: t('admin.recipe.ingredientAddedDesc'),
      });
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('admin.recipe.addIngredientError'),
        variant: 'destructive',
      });
    },
  });

  // Update ingredient mutation
  const updateMutation = useMutation({
    mutationFn: ({
      ingredientId,
      data,
    }: {
      ingredientId: string;
      data: UpdateRecipeIngredientRequest;
    }) => apiClient.updateProductIngredient(productId, ingredientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-ingredients', productId] });
      setEditingIngredient(null);
      toast({
        title: t('admin.recipe.ingredientUpdated'),
        description: t('admin.recipe.ingredientUpdatedDesc'),
      });
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('admin.recipe.updateIngredientError'),
        variant: 'destructive',
      });
    },
  });

  // Delete ingredient mutation
  const deleteMutation = useMutation({
    mutationFn: (ingredientId: string) =>
      apiClient.deleteProductIngredient(productId, ingredientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-ingredients', productId] });
      toast({
        title: t('admin.recipe.ingredientRemoved'),
        description: t('admin.recipe.ingredientRemovedDesc'),
      });
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('admin.recipe.removeIngredientError'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: RecipeFormValues) => {
    if (editingIngredient) {
      updateMutation.mutate({
        ingredientId: editingIngredient.ingredient_id,
        data: {
          quantity_required: values.quantity_required,
        },
      });
    } else {
      addMutation.mutate(values);
    }
  };

  const handleEdit = (ingredient: ProductIngredient) => {
    setEditingIngredient(ingredient);
  };

  const handleCancelEdit = () => {
    setEditingIngredient(null);
    form.reset();
  };

  const handleDelete = (ingredientId: string) => {
    if (confirm(t('admin.recipe.confirmRemove'))) {
      deleteMutation.mutate(ingredientId);
    }
  };

  const availableIngredients = ingredientsData?.filter(
    (ing: Ingredient) =>
      !recipeData?.some((recipe: ProductIngredient) => recipe.ingredient_id === ing.id)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('admin.recipe.title')}</CardTitle>
            <CardDescription>{t('admin.recipe.description')}</CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('admin.recipe.addIngredient')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingRecipe ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('common.loading')}...
          </div>
        ) : !recipeData || recipeData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('admin.recipe.noIngredients')}</p>
            <p className="text-sm mt-2">{t('admin.recipe.noIngredientsHint')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.recipe.ingredientName')}</TableHead>
                <TableHead>{t('admin.recipe.quantityRequired')}</TableHead>
                <TableHead>{t('admin.recipe.currentStock')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipeData.map((ingredient: ProductIngredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-medium">
                    {ingredient.ingredient_name}
                  </TableCell>
                  <TableCell>
                    {editingIngredient?.id === ingredient.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register('quantity_required', { valueAsNumber: true })}
                        className="w-24"
                      />
                    ) : (
                      `${ingredient.quantity_required} ${ingredient.ingredient_unit}`
                    )}
                  </TableCell>
                  <TableCell>
                    {ingredient.current_stock} {ingredient.ingredient_unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingIngredient?.id === ingredient.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={form.handleSubmit(onSubmit)}
                          disabled={updateMutation.isPending}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(ingredient)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(ingredient.ingredient_id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Add Ingredient Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.recipe.addIngredient')}</DialogTitle>
            <DialogDescription>
              {t('admin.recipe.addIngredientDesc')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="ingredient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.recipe.selectIngredient')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.recipe.selectIngredientPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingIngredients ? (
                          <SelectItem value="loading" disabled>
                            {t('common.loading')}...
                          </SelectItem>
                        ) : availableIngredients && availableIngredients.length > 0 ? (
                          availableIngredients.map((ingredient: Ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} ({ingredient.current_stock} {ingredient.unit})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            {t('admin.recipe.noAvailableIngredients')}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity_required"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.recipe.quantityRequired')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? t('common.saving') : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
