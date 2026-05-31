import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Edit2 } from 'lucide-react';

import apiClient from '@/api/client';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RecipeManagement } from './RecipeManagement';
import { Input } from '@/components/ui/input';

export function RecipesPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products-all'],
    queryFn: async () => {
      // getAdminProducts returns PaginatedResponse<Product[]> — items in .data
      const response = await apiClient.getAdminProducts({ per_page: 200 });
      return (response?.data ?? []) as Product[];
    },
  });

  const filteredProducts = productsData?.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('admin.sidebar.recipes') || 'Recipes'}</h2>
          <p className="text-muted-foreground">
            Manage ingredient recipes for all menu items.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Input
          placeholder={t('common.search') || 'Search...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.menu.name') || 'Name'}</TableHead>
              <TableHead>{t('admin.menu.category') || 'Category'}</TableHead>
              <TableHead>{t('admin.menu.price') || 'Price'}</TableHead>
              <TableHead className="text-right">{t('common.actions') || 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {t('common.loading') || 'Loading...'}
                </TableCell>
              </TableRow>
            ) : filteredProducts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts?.map((product: Product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category?.name ?? '-'}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                    }).format(product.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Manage Recipe
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedProductId} onOpenChange={(open) => !open && setSelectedProductId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recipe Management</DialogTitle>
          </DialogHeader>
          {selectedProductId && <RecipeManagement productId={selectedProductId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
