/**
 * T086: Updated with payment step after order placement
 * QR-based customer ordering flow: Menu -> Cart -> Order -> Payment -> Tracking
 */
import {
  createFileRoute,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ShoppingCart, Plus, Minus, Check, AlertCircle } from "lucide-react";
import apiClient from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PaymentMethod,
  type PaymentMethodType,
} from "@/components/customer/PaymentMethod";
import { PaymentConfirmation } from "@/components/customer/PaymentConfirmation";
import type {
  PublicMenuItem,
  PaymentConfirmation as PaymentConfirmationType,
  CreatePaymentRequest,
} from "@/types";
import "@/styles/public-theme.css";

export const Route = createFileRoute("/order/$tableCode")({
  component: CustomerOrderPage,
});

interface CartItem {
  product: PublicMenuItem;
  quantity: number;
  special_instructions?: string;
}

// T086: Order flow steps
type OrderStep = "menu" | "payment" | "confirmation";

function CustomerOrderPage() {
  const { tableCode } = useParams({ from: "/order/$tableCode" });
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentStep, setCurrentStep] = useState<OrderStep>("menu");
  const [orderInfo, setOrderInfo] = useState<{
    order_id: string;
    order_number: string;
    total_amount: number;
  } | null>(null);
  const [paymentConfirmation, setPaymentConfirmation] =
    useState<PaymentConfirmationType | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethodType | null>(null);

  // Fetch table info by QR code
  const {
    data: table,
    isLoading: tableLoading,
    error: tableError,
  } = useQuery({
    queryKey: ["customer-table", tableCode],
    queryFn: () => apiClient.getTableByQRCode(tableCode),
  });

  // Fetch menu
  const { data: menuItems = [] } = useQuery({
    queryKey: ["public-menu"],
    queryFn: () => apiClient.getPublicMenu(),
    enabled: !!table,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["public-categories"],
    queryFn: () => apiClient.getPublicCategories(),
    enabled: !!table,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: () =>
      apiClient.createCustomerOrder({
        table_id: table!.id,
        customer_name: customerName || undefined,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          special_instructions: item.special_instructions,
        })),
      }),
    onSuccess: (data) => {
      // T086: Store order info and proceed to payment step
      setOrderInfo({
        order_id: data.order_id,
        order_number: data.order_number,
        total_amount: data.total_amount,
      });
      setCart([]);
      setCurrentStep("payment");
    },
  });

  // T086: Payment mutation
  const paymentMutation = useMutation({
    mutationFn: (paymentData: CreatePaymentRequest) =>
      apiClient.createCustomerPayment(orderInfo!.order_id, paymentData),
    onSuccess: (data) => {
      // T086: Store payment confirmation and show confirmation step
      setPaymentConfirmation({
        order_id: orderInfo!.order_id,
        payment_id: data.payment_id || orderInfo!.order_id,
        amount: orderInfo!.total_amount,
        payment_method: selectedPaymentMethod || "qris",
        status: "completed",
        created_at: new Date().toISOString(),
      });
      setCurrentStep("confirmation");
    },
  });

  // T086: Handle payment submission
  const handlePaymentSubmit = (method: PaymentMethodType) => {
    setSelectedPaymentMethod(method);
    // Map component payment method to API payment method
    const apiMethod = method === "card" ? "credit_card" : method;
    paymentMutation.mutate({
      payment_method: apiMethod as CreatePaymentRequest["payment_method"],
      amount: orderInfo!.total_amount,
    });
  };

  // T086: Navigate to order status/tracking page
  const handleProceedToTracking = () => {
    if (orderInfo) {
      navigate({ to: `/order-status/${orderInfo.order_id}` });
    }
  };

  const addToCart = (product: PublicMenuItem) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
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

  const removeFromCart = (productId: string) => {
    const existing = cart.find((item) => item.product.id === productId);
    if (existing && existing.quantity > 1) {
      setCart(
        cart.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        ),
      );
    } else {
      setCart(cart.filter((item) => item.product.id !== productId));
    }
  };

  const getTotal = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const tax = subtotal * 0.11;
    return { subtotal, tax, total: subtotal + tax };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredMenu =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category_id === selectedCategory);

  // Error state - invalid QR code
  if (tableError) {
    return (
      <div className="min-h-screen bg-[var(--public-bg-primary)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
          <CardContent className="pt-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h1 className="text-xl font-bold text-[var(--public-text-primary)] mb-2">
              Invalid QR Code
            </h1>
            <p className="text-[var(--public-text-secondary)] mb-6">
              This QR code is not recognized. Please scan a valid table QR code.
            </p>
            <Button
              onClick={() => navigate({ to: "/site" })}
              className="bg-[var(--public-secondary)] text-[var(--public-text-on-gold)]"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (tableLoading) {
    return (
      <div className="min-h-screen bg-[var(--public-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--public-secondary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--public-text-secondary)]">Loading menu...</p>
        </div>
      </div>
    );
  }

  // T086: Payment step - show after order is placed
  if (currentStep === "payment" && orderInfo) {
    return (
      <div className="min-h-screen bg-[var(--public-bg-primary)] p-4">
        <div className="max-w-lg mx-auto">
          {/* Header with order info */}
          <Card className="mb-6 bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[var(--public-text-muted)]">
                    Nomor Pesanan
                  </p>
                  <p className="text-xl font-bold text-[var(--public-secondary)]">
                    {orderInfo.order_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[var(--public-text-muted)]">
                    Meja
                  </p>
                  <p className="text-xl font-bold text-[var(--public-text-primary)]">
                    {table?.table_number}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 border-t border-[var(--public-border)]">
                <span className="text-[var(--public-text-secondary)]">
                  Total Pembayaran
                </span>
                <span className="text-2xl font-bold text-[var(--public-secondary)]">
                  {formatCurrency(orderInfo.total_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment method selection */}
          <PaymentMethod
            onSelect={handlePaymentSubmit}
            selectedMethod={selectedPaymentMethod || undefined}
            disabled={paymentMutation.isPending}
          />

          {/* Loading state */}
          {paymentMutation.isPending && (
            <div className="mt-4 text-center">
              <div className="w-8 h-8 border-4 border-[var(--public-secondary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-[var(--public-text-secondary)]">
                Memproses pembayaran...
              </p>
            </div>
          )}

          {/* Error state */}
          {paymentMutation.isError && (
            <Card className="mt-4 bg-red-50 border-red-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>Pembayaran gagal. Silakan coba lagi.</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // T086: Payment confirmation step - show after payment is processed
  if (currentStep === "confirmation" && paymentConfirmation && orderInfo) {
    return (
      <div className="min-h-screen bg-[var(--public-bg-primary)] p-4">
        <div className="max-w-lg mx-auto">
          <PaymentConfirmation
            payment={paymentConfirmation}
            orderNumber={orderInfo.order_number}
            tableNumber={table?.table_number}
            onProceedToTracking={handleProceedToTracking}
            onRetryPayment={() => {
              setPaymentConfirmation(null);
              setCurrentStep("payment");
            }}
          />

          {/* Additional action to order more */}
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep("menu");
                setOrderInfo(null);
                setPaymentConfirmation(null);
                setSelectedPaymentMethod(null);
              }}
              className="border-[var(--public-border)] text-[var(--public-text-secondary)]"
            >
              Pesan Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--public-bg-primary)] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--public-bg-elevated)] border-b border-[var(--public-border)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--public-text-primary)]">
                Steak
                <span className="text-[var(--public-secondary)]">Kenangan</span>
              </h1>
              <p className="text-sm text-[var(--public-text-secondary)]">
                Table {table?.table_number}
              </p>
            </div>
            {cart.length > 0 && (
              <Badge className="bg-[var(--public-secondary)] text-[var(--public-text-on-gold)]">
                <ShoppingCart className="w-4 h-4 mr-1" />
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="sticky top-[72px] z-40 bg-[var(--public-bg-primary)] border-b border-[var(--public-border)]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button
              size="sm"
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="whitespace-nowrap"
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className="whitespace-nowrap"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredMenu.map((item) => {
            const cartItem = cart.find((c) => c.product.id === item.id);
            return (
              <Card
                key={item.id}
                className="bg-[var(--public-bg-elevated)] border-[var(--public-border)]"
              >
                {item.image_url && (
                  <div className="aspect-video bg-[var(--public-bg-primary)] overflow-hidden rounded-t-lg">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-[var(--public-text-primary)]">
                        {item.name}
                      </CardTitle>
                      {item.description && (
                        <p className="text-sm text-[var(--public-text-secondary)] mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-[var(--public-secondary)]">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {cartItem ? (
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFromCart(item.id)}
                        className="h-10 w-10"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-lg font-semibold text-[var(--public-text-primary)] w-8 text-center">
                        {cartItem.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToCart(item)}
                        className="h-10 w-10"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => addToCart(item)}
                      className="w-full bg-[var(--public-secondary)] text-[var(--public-text-on-gold)]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Order
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--public-bg-elevated)] border-t border-[var(--public-border)] p-4 safe-area-inset-bottom">
          <div className="container mx-auto max-w-lg">
            {/* Customer Name */}
            <div className="mb-3">
              <Input
                placeholder="Your name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-[var(--public-bg-primary)] border-[var(--public-border)] text-[var(--public-text-primary)]"
              />
            </div>

            {/* Order Summary */}
            <div className="flex justify-between items-center mb-3 text-sm">
              <span className="text-[var(--public-text-secondary)]">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
              <span className="text-[var(--public-text-primary)] font-semibold">
                Total: {formatCurrency(getTotal().total)}
              </span>
            </div>

            {/* Place Order Button */}
            <Button
              onClick={() => createOrderMutation.mutate()}
              disabled={createOrderMutation.isPending}
              className="w-full h-12 bg-[var(--public-secondary)] text-[var(--public-text-on-gold)] font-semibold"
            >
              {createOrderMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Placing Order...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Place Order - {formatCurrency(getTotal().total)}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
