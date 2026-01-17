import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CategorySidebar } from "./CategorySidebar";
import { ProductGrid } from "./ProductGrid";
import { OrderCart } from "./OrderCart";
import { TableSelectionModal } from "./TableSelectionModal";
import apiClient from "@/api/client";
import type { User, Product, CartItem, DiningTable } from "@/types";

interface POSLayoutProps {
  user: User;
}

export function POSLayout({ user: _user }: POSLayoutProps) {
  const { t } = useTranslation();

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [orderType] = useState<"dine_in" | "takeout" | "delivery">("dine_in");
  const [customerName, setCustomerName] = useState("");

  // Fetch categories
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.getCategories(true),
  });

  // Fetch products
  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ["products", selectedCategory],
    queryFn: () =>
      apiClient.getProducts({
        category_id: selectedCategory || undefined,
        available: true,
      }),
  });

  // Fetch tables
  const { data: tablesResponse } = useQuery({
    queryKey: ["tables"],
    queryFn: () => apiClient.getTables({ available_only: false }),
  });

  const categories = categoriesResponse?.data || [];
  const products = productsResponse?.data || [];
  const tables = tablesResponse?.data || [];

  // Cart functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.product.id !== productId));
    } else {
      setCart(
        cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedTable(null);
    setCustomerName("");
  };

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const taxAmount = subtotal * 0.1; // 10% tax
  const totalAmount = subtotal + taxAmount;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header - temporarily disabled for debugging */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold">{t("pos.debuggingMode")}</h1>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar - back to simple version */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <CategorySidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            isLoading={categoriesLoading}
          />
        </div>

        {/* Products Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.name ||
                    t("pos.products")
                  : t("pos.allProducts")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("pos.itemsAvailable", { count: products.length })}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <ProductGrid
              products={products}
              onProductSelect={addToCart}
              isLoading={productsLoading}
            />
          </div>
        </div>

        {/* Order Cart - back to simple version */}
        <div className="w-96 bg-white border-l border-gray-200 flex-shrink-0">
          <OrderCart
            items={cart}
            subtotal={subtotal}
            taxAmount={taxAmount}
            totalAmount={totalAmount}
            selectedTable={selectedTable}
            orderType={orderType}
            customerName={customerName}
            onUpdateQuantity={updateCartItemQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
          />
        </div>
      </div>

      {/* Table Selection Modal */}
      {showTableModal && (
        <TableSelectionModal
          onClose={() => setShowTableModal(false)}
          tables={tables}
          selectedTable={selectedTable}
          onTableSelect={(table) => {
            setSelectedTable(table);
            setShowTableModal(false);
          }}
        />
      )}

      {/* Keyboard Shortcuts Help - temporarily disabled */}
      {/* <KeyboardShortcutsHelp
        shortcuts={shortcutsList}
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      /> */}
    </div>
  );
}
