import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
  TextInputField,
  TextareaField,
  PriceInputField,
  NumberInputField,
  SelectField,
  FormSubmitButton,
  productStatusOptions
} from '@/components/forms/FormComponents'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { createProductSchema, updateProductSchema, type CreateProductData, type UpdateProductData } from '@/lib/form-schemas'
import { toastHelpers } from '@/lib/toast-helpers'
import apiClient from '@/api/client'
import type { Product } from '@/types'
import { X } from 'lucide-react'
import { RecipeManagement } from '@/components/admin/RecipeManagement'
import { Separator } from '@/components/ui/separator'

interface ProductFormProps {
  product?: Product // If provided, we're editing; otherwise creating
  onSuccess?: () => void
  onCancel?: () => void
  mode?: 'create' | 'edit'
}

export function ProductForm({ product, onSuccess, onCancel, mode = 'create' }: ProductFormProps) {
  const queryClient = useQueryClient()
  const isEditing = mode === 'edit' && product

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories().then(res => res.data)
  })

  // Create category options for select field
  const categoryOptions = categories.map(cat => ({
    value: cat.id.toString(),
    label: cat.name
  }))

  // Choose the appropriate schema and default values
  const schema = isEditing ? updateProductSchema : createProductSchema
  const defaultValues: any = isEditing && product
    ? {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        category_id: product.category_id?.toString() || categories[0]?.id?.toString() || '',
        image_url: product.image_url || '',
        status: product.is_available ? 'active' as const : 'inactive' as const,
        preparation_time: product.preparation_time || 5,
      }
    : {
        name: '',
        description: '',
        price: 0,
        category_id: categories[0]?.id?.toString() || '',
        image_url: '',
        status: 'active' as const,
        preparation_time: 5,
      }

  const form = useForm<CreateProductData | UpdateProductData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  // Set default category when categories load (for new products)
  useEffect(() => {
    if (!isEditing && categories.length > 0 && !form.getValues('category_id')) {
      form.setValue('category_id', categories[0].id.toString())
    }
  }, [categories, isEditing, form])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProductData) => {
      // Convert status to is_available for backend
      const apiData = {
        category_id: data.category_id,
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        image_url: data.image_url || undefined,
        is_available: data.status === 'active',
        preparation_time: data.preparation_time,
      };
      return apiClient.createProduct(apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toastHelpers.productCreated(form.getValues('name') || 'Product')
      form.reset()
      onSuccess?.()
    },
    onError: (error) => {
      toastHelpers.apiError('Create product', error)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateProductData) => {
      // Convert status to is_available for backend
      const apiData = {
        category_id: data.category_id,
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        image_url: data.image_url || undefined,
        is_available: data.status === 'active',
        preparation_time: data.preparation_time,
      };
      return apiClient.updateProduct(data.id.toString(), apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toastHelpers.apiSuccess('Update', `Product "${form.getValues('name')}"`)
      onSuccess?.()
    },
    onError: (error) => {
      toastHelpers.apiError('Update product', error)
    },
  })

  const onSubmit = (data: CreateProductData | UpdateProductData) => {
    if (isEditing) {
      updateMutation.mutate(data as UpdateProductData)
    } else {
      createMutation.mutate(data as CreateProductData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  if (categories.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You need to create at least one category before adding products.
            </p>
            <Button onClick={onCancel} variant="outline">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {isEditing ? 'Edit Product' : 'Create New Product'}
        </CardTitle>
        {onCancel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <TextInputField
                control={form.control}
                name="name"
                label="Product Name"
                placeholder="Enter product name"
                description="The name that will appear on the menu"
              />
              
              <TextareaField
                control={form.control}
                name="description"
                label="Description"
                placeholder="Describe the product..."
                rows={3}
                description="Optional description for staff and customers"
              />

              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <FormControl>
                      <ImageUploader
                        value={field.value}
                        onChange={(url) => field.onChange(url || '')}
                        onError={(error) => toastHelpers.error('Upload failed', error)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a product image (JPEG, PNG, GIF, WebP - max 5MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing & Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PriceInputField
                control={form.control}
                name="price"
                label="Harga"
                currency="Rp"
                description="Harga jual produk"
              />
              
              <NumberInputField
                control={form.control}
                name="preparation_time"
                label="Preparation Time (minutes)"
                min={1}
                max={120}
                description="Estimated cooking/prep time"
              />
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                control={form.control}
                name="category_id"
                label="Category"
                options={categoryOptions}
                placeholder="Select a category"
                description="Product category for menu organization"
              />
              
              <SelectField
                control={form.control}
                name="status"
                label="Status"
                options={productStatusOptions}
                description="Active products appear on the menu"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <FormSubmitButton
                isLoading={isLoading}
                loadingText={isEditing ? "Updating..." : "Creating..."}
                className="flex-1"
              >
                {isEditing ? 'Update Product' : 'Create Product'}
              </FormSubmitButton>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>

        {/* Recipe Management - Only shown when editing existing product */}
        {isEditing && product && (
          <>
            <Separator className="my-6" />
            <RecipeManagement productId={product.id} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
