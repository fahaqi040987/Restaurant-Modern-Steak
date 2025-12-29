import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  TextInputField,
  TextareaField,
  PriceInputField,
  NumberInputField,
  SelectField,
  FormSubmitButton,
  productStatusOptions,
} from "@/components/forms/FormComponents";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductData,
  type UpdateProductData,
} from "@/lib/form-schemas";
import { toastHelpers } from "@/lib/toast-helpers";
import apiClient from "@/api/client";
import { ImageUpload } from "@/components/forms/ImageUpload";
import type { Product } from "@/types";
import { X } from "lucide-react";

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
}

export function ProductForm({
  product,
  onSuccess,
  onCancel,
  mode = "create",
}: ProductFormProps) {
  const queryClient = useQueryClient();
  const isEditing = mode === "edit" && product;

  // Fetch categories for dropdown
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.getCategories().then((res) => res.data),
  });

  // Create category options for select field
  const categoryOptions = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
  }));

  // Choose the appropriate schema
  const schema = isEditing ? updateProductSchema : createProductSchema;

  const form = useForm<CreateProductData | UpdateProductData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category_id: "",
      image_url: "",
      status: "active",
      preparation_time: 5,
    },
  });

  // Reset form when categories load or when editing a product
  useEffect(() => {
    if (categoriesLoading) return;

    if (isEditing && product) {
      form.reset({
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.price,
        category_id: product.category_id?.toString() || categories[0]?.id?.toString() || "",
        image_url: product.image_url || "",
        status: product.is_available ? "active" : "inactive",
        preparation_time: product.preparation_time || 5,
      });
    } else if (categories.length > 0) {
      form.reset({
        name: "",
        description: "",
        price: 0,
        category_id: categories[0]?.id?.toString() || "",
        image_url: "",
        status: "active",
        preparation_time: 5,
      });
    }
  }, [categoriesLoading, isEditing, product, categories, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProductData) => {
      const apiData = {
        name: data.name,
        description: data.description || undefined,
        price: Number(data.price),
        category_id: data.category_id,
        image_url: data.image_url || undefined,
        is_available: data.status === "active",
        preparation_time: Number(data.preparation_time),
      };
      console.log("Creating product with data:", apiData);
      return apiClient.createProduct(apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toastHelpers.productCreated(form.getValues("name") || "Product");
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Create product error:", error);
      toastHelpers.apiError("Create product", error);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateProductData) => {
      const statusValue = data.status ?? (product?.is_available ? "active" : "inactive");
      const apiData = {
        name: data.name,
        description: data.description || undefined,
        price: data.price !== undefined ? Number(data.price) : undefined,
        category_id: data.category_id || undefined,
        image_url: data.image_url || undefined,
        is_available: statusValue === "active",
        preparation_time: data.preparation_time !== undefined ? Number(data.preparation_time) : undefined,
      };
      console.log("Updating product with data:", apiData);
      return apiClient.updateProduct(data.id.toString(), apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toastHelpers.apiSuccess("Update", `Product "${form.getValues("name")}"`);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Update product error:", error);
      toastHelpers.apiError("Update product", error);
    },
  });

  const onSubmit = (data: CreateProductData | UpdateProductData) => {
    console.log("Form submitted with data:", data);
    if (isEditing) {
      updateMutation.mutate(data as UpdateProductData);
    } else {
      createMutation.mutate(data as CreateProductData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (categoriesLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {isEditing ? "Edit Product" : "Create New Product"}
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

              <ImageUpload
                value={form.watch("image_url") || ""}
                onChange={(url) => form.setValue("image_url", url)}
                onUpload={async (file) => {
                  const url = await apiClient.uploadProductImage(file);
                  return url;
                }}
                disabled={isLoading}
              />
            </div>

            {/* Pricing & Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PriceInputField
                control={form.control}
                name="price"
                label="Price"
                currency="$"
                description="Product selling price"
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
                {isEditing ? "Update Product" : "Create Product"}
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
      </CardContent>
    </Card>
  );
}
