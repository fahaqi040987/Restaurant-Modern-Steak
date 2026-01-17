/**
 * T087: Order Status Tracking Page
 * T088: Includes survey prompt after order completion
 *
 * Route: /order-status/:orderId
 * Customer can track their order status and submit satisfaction survey
 */
import {
  createFileRoute,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  ChefHat,
  CheckCircle,
  Bell,
  Star,
  ArrowLeft,
  AlertCircle,
  Loader2,
  UtensilsCrossed,
  PartyPopper,
} from "lucide-react";
import apiClient from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SurveyForm } from "@/components/customer/SurveyForm";
import type { Order, OrderStatus as OrderStatusType } from "@/types";
import "@/styles/public-theme.css";

export const Route = createFileRoute("/order-status/$orderId")({
  component: OrderStatusPage,
});

// Status configuration with icons, colors, and descriptions
const statusConfig: Record<
  OrderStatusType,
  {
    icon: typeof Clock;
    label: string;
    description: string;
    color: string;
    bgColor: string;
  }
> = {
  pending: {
    icon: Clock,
    label: "Pesanan Diterima",
    description: "Pesanan Anda sedang diverifikasi",
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
  },
  confirmed: {
    icon: CheckCircle,
    label: "Pesanan Dikonfirmasi",
    description: "Pesanan Anda akan segera diproses",
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  preparing: {
    icon: ChefHat,
    label: "Sedang Dimasak",
    description: "Chef sedang menyiapkan pesanan Anda",
    color: "text-orange-500",
    bgColor: "bg-orange-100",
  },
  ready: {
    icon: Bell,
    label: "Siap Disajikan",
    description: "Pesanan siap! Akan segera diantar ke meja Anda",
    color: "text-green-500",
    bgColor: "bg-green-100",
  },
  served: {
    icon: UtensilsCrossed,
    label: "Sudah Disajikan",
    description: "Selamat menikmati hidangan Anda!",
    color: "text-emerald-500",
    bgColor: "bg-emerald-100",
  },
  completed: {
    icon: PartyPopper,
    label: "Selesai",
    description: "Terima kasih telah berkunjung!",
    color: "text-purple-500",
    bgColor: "bg-purple-100",
  },
  cancelled: {
    icon: AlertCircle,
    label: "Dibatalkan",
    description: "Pesanan telah dibatalkan",
    color: "text-red-500",
    bgColor: "bg-red-100",
  },
};

// Status progression order
const statusOrder: OrderStatusType[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "completed",
];

function OrderStatusPage() {
  const { orderId } = useParams({ from: "/order-status/$orderId" });
  const navigate = useNavigate();
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<OrderStatusType | null>(
    null,
  );

  // Fetch order details with polling
  const {
    data: orderData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order-status", orderId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Order }>(
        `/customer/orders/${orderId}`,
      );
      return response.data;
    },
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: !!orderId,
  });

  const order = orderData;

  // T088: Detect when order is served/completed and show survey prompt
  useEffect(() => {
    if (order && order.status !== previousStatus) {
      setPreviousStatus(order.status);

      // Show survey prompt when order is served or completed (and not already submitted)
      if (
        (order.status === "served" || order.status === "completed") &&
        !surveySubmitted
      ) {
        // Delay survey prompt to let customer enjoy the notification
        const timer = setTimeout(() => {
          setShowSurvey(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [order, previousStatus, surveySubmitted]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentStatusIndex = (status: OrderStatusType): number => {
    return statusOrder.indexOf(status);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--public-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--public-secondary)] mx-auto mb-4" />
          <p className="text-[var(--public-text-secondary)]">
            Memuat status pesanan...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-[var(--public-bg-primary)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
          <CardContent className="pt-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h1 className="text-xl font-bold text-[var(--public-text-primary)] mb-2">
              Pesanan Tidak Ditemukan
            </h1>
            <p className="text-[var(--public-text-secondary)] mb-6">
              Tidak dapat menemukan pesanan dengan ID tersebut.
            </p>
            <Button
              onClick={() => navigate({ to: "/site" })}
              className="bg-[var(--public-secondary)] text-[var(--public-text-on-gold)]"
            >
              Kembali ke Beranda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = statusConfig[order.status] || statusConfig.pending;
  const CurrentIcon = currentStatus.icon;
  const currentStatusIndex = getCurrentStatusIndex(order.status);

  return (
    <div className="min-h-screen bg-[var(--public-bg-primary)] pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--public-bg-elevated)] border-b border-[var(--public-border)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/site" })}
              className="text-[var(--public-text-secondary)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Beranda
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-[var(--public-text-primary)]">
                Status Pesanan
              </h1>
              <p className="text-sm text-[var(--public-text-muted)]">
                #{order.order_number}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Current Status Card */}
        <Card
          className={`mb-6 border-2 ${currentStatus.color.replace("text-", "border-")}`}
        >
          <CardContent className="pt-6 text-center">
            <div
              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${currentStatus.bgColor}`}
            >
              <CurrentIcon className={`w-10 h-10 ${currentStatus.color}`} />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${currentStatus.color}`}>
              {currentStatus.label}
            </h2>
            <p className="text-[var(--public-text-secondary)]">
              {currentStatus.description}
            </p>
          </CardContent>
        </Card>

        {/* Status Progress */}
        <Card className="mb-6 bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
          <CardHeader>
            <CardTitle className="text-[var(--public-text-primary)]">
              Progress Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Progress line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--public-border)]" />
              <div
                className="absolute left-4 top-0 w-0.5 bg-[var(--public-secondary)] transition-all duration-500"
                style={{
                  height:
                    order.status === "cancelled"
                      ? "0%"
                      : `${(currentStatusIndex / (statusOrder.length - 1)) * 100}%`,
                }}
              />

              {/* Status steps */}
              <div className="space-y-6">
                {statusOrder.slice(0, -1).map((status, index) => {
                  const config = statusConfig[status];
                  const Icon = config.icon;
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;

                  return (
                    <div
                      key={status}
                      className="relative flex items-center gap-4"
                    >
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-[var(--public-secondary)] text-white"
                            : "bg-[var(--public-bg-primary)] border-2 border-[var(--public-border)] text-[var(--public-text-muted)]"
                        } ${isCurrent ? "ring-4 ring-[var(--public-secondary)]/20" : ""}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            isCompleted
                              ? "text-[var(--public-text-primary)]"
                              : "text-[var(--public-text-muted)]"
                          }`}
                        >
                          {config.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-[var(--public-text-secondary)]">
                            {config.description}
                          </p>
                        )}
                      </div>
                      {isCurrent && (
                        <span className="px-2 py-1 text-xs font-medium bg-[var(--public-secondary)] text-white rounded-full">
                          Sekarang
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="mb-6 bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
          <CardHeader>
            <CardTitle className="text-[var(--public-text-primary)]">
              Detail Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Order items */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-3 mb-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="text-[var(--public-text-primary)]">
                        {item.quantity}x {item.product?.name || "Item"}
                      </p>
                      {item.special_instructions && (
                        <p className="text-xs text-[var(--public-text-muted)]">
                          Catatan: {item.special_instructions}
                        </p>
                      )}
                    </div>
                    <p className="text-[var(--public-text-secondary)]">
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Order totals */}
            <div className="border-t border-[var(--public-border)] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--public-text-secondary)]">
                  Subtotal
                </span>
                <span className="text-[var(--public-text-primary)]">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--public-text-secondary)]">
                  Pajak (11%)
                </span>
                <span className="text-[var(--public-text-primary)]">
                  {formatCurrency(order.tax_amount)}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-[var(--public-border)]">
                <span className="text-[var(--public-text-primary)]">Total</span>
                <span className="text-[var(--public-secondary)]">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Survey prompt for served/completed orders */}
        {(order.status === "served" || order.status === "completed") &&
          !surveySubmitted && (
            <Card className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="py-6 text-center">
                <Star className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  Bagaimana Pengalaman Anda?
                </h3>
                <p className="text-sm text-amber-700 mb-4">
                  Bantu kami meningkatkan layanan dengan memberikan penilaian
                </p>
                <Button
                  onClick={() => setShowSurvey(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Beri Penilaian
                </Button>
              </CardContent>
            </Card>
          )}

        {/* Survey submitted confirmation */}
        {surveySubmitted && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="py-6 text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Terima Kasih!
              </h3>
              <p className="text-sm text-green-700">
                Penilaian Anda sangat berharga bagi kami
              </p>
            </CardContent>
          </Card>
        )}

        {/* Refresh button */}
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="w-full border-[var(--public-border)] text-[var(--public-text-secondary)]"
        >
          <Loader2 className="w-4 h-4 mr-2" />
          Perbarui Status
        </Button>
      </div>

      {/* T088: Survey Dialog */}
      <Dialog open={showSurvey} onOpenChange={setShowSurvey}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--public-bg-elevated)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--public-text-primary)]">
              Penilaian Pengalaman
            </DialogTitle>
          </DialogHeader>
          <SurveyForm
            orderId={orderId}
            onSuccess={() => {
              setSurveySubmitted(true);
              setShowSurvey(false);
            }}
            onError={(error) => console.error("Survey error:", error)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
