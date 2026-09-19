import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/ui/loading-skeletons";
import {
  RefreshCw,
  Volume2,
  VolumeX,
  Clock,
  ChefHat,
  Package,
  CheckCircle,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/api/client";
import type { User as UserType, KitchenOrder, OrderStatus } from "@/types";

// Extend Window interface for webkit prefixed AudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Short beep via WebAudio. Safe no-op when the Audio API is unavailable. */
const playTone = (volume: number, frequency: number, durationSec: number) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + durationSec);
  } catch {
    // Audio API unavailable (e.g. before user gesture) — ignore
  }
};

interface EnhancedOrderCardProps {
  order: KitchenOrder;
  t: Translate;
  volume: number;
  onOrderStatusUpdate: (orderId: string, status: OrderStatus) => Promise<void>;
  onItemStatusUpdate: (
    orderId: string,
    itemId: string,
    status: string,
  ) => Promise<void>;
  onItemServe: (orderId: string, itemId: string) => Promise<void>;
  onRefresh: () => void;
}

/**
 * One kitchen ticket. Extracted to module level so its identity is stable:
 * with auto-refresh (refetch every 3s) the parent re-renders constantly, and
 * an inline component definition would remount every card on each render,
 * wiping the local checkbox state.
 */
const EnhancedOrderCard = memo(function EnhancedOrderCard({
  order,
  t,
  volume,
  onOrderStatusUpdate,
  onItemStatusUpdate,
  onItemServe,
  onRefresh,
}: EnhancedOrderCardProps) {
  // Local optimistic check state; seeded lazily from items already ready.
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    () =>
      new Set(
        order.items?.filter((item) => item.status === "ready").map((item) => item.id) ??
          [],
      ),
  );

  const isOrderReady = order.status === "ready";

  /**
   * Toggle an item's ready state. Disabled once the order is ready: an item
   * must not go back to "cooking" while the order is waiting for pickup.
   */
  const toggleItem = async (itemId: string) => {
    if (isOrderReady) return;

    const newChecked = new Set(checkedItems);
    const willCheck = !newChecked.has(itemId);
    if (willCheck) {
      newChecked.add(itemId);
    } else {
      newChecked.delete(itemId);
    }
    setCheckedItems(newChecked);

    try {
      await onItemStatusUpdate(order.id, itemId, willCheck ? "ready" : "preparing");
      onRefresh();
    } catch (error) {
      console.error("Failed to update item status:", error);
    }
  };

  const getUrgencyColor = () => {
    const created = new Date(order.created_at);
    const now = new Date();
    const minutesWaiting = Math.floor(
      (now.getTime() - created.getTime()) / 1000 / 60,
    );

    if (minutesWaiting > 20) return "border-red-500 bg-red-500/10 dark:bg-red-500/20";
    if (minutesWaiting > 10) return "border-orange-500 bg-orange-500/10 dark:bg-orange-500/20";
    return "border-blue-500 bg-blue-500/10 dark:bg-blue-500/20";
  };

  const waitTime = Math.floor(
    (new Date().getTime() - new Date(order.created_at).getTime()) / 1000 / 60,
  );

  const displayItems =
    order.items && order.items.length > 0
      ? order.items
      : [];

  // Calculate progress including served items
  const totalItems = displayItems.length;
  const readyItems = displayItems.filter(
    (item) => item.status === "ready" || checkedItems.has(item.id)
  ).length;
  const servedItems = displayItems.filter(
    (item) => item.status === "served",
  ).length;
  const progress =
    totalItems > 0 ? ((readyItems + servedItems) / totalItems) * 100 : 0;

  const handleStartCooking = async () => {
    try {
      await onOrderStatusUpdate(order.id, "preparing");
      onRefresh();
    } catch (error) {
      console.error("Failed to start cooking:", error);
    }
  };

  /**
   * Mark every non-served item ready, then flip the order only when ALL item
   * updates succeeded. No blind setTimeout: the order status now reflects the
   * real state of the items.
   */
  const handleMarkAllReady = async () => {
    const pendingItems = displayItems.filter((item) => item.status !== "served");
    const results = await Promise.allSettled(
      pendingItems.map((item) => onItemStatusUpdate(order.id, item.id, "ready")),
    );

    const failedCount = results.filter((r) => r.status === "rejected").length;
    if (failedCount > 0) {
      console.error(`MarkAllReady: ${failedCount} item update(s) failed for order ${order.id}`);
    } else {
      setCheckedItems(new Set(pendingItems.map((item) => item.id)));
      try {
        await onOrderStatusUpdate(order.id, "ready");
      } catch (error) {
        console.error("Failed to mark order ready:", error);
      }
    }
    onRefresh();
  };

  const handleMarkAsPickedUp = async () => {
    try {
      await onOrderStatusUpdate(order.id, "served");
      onRefresh();
    } catch (error) {
      console.error("Failed to mark order as picked up:", error);
    }
  };

  const handleServeItem = async (itemId: string) => {
    try {
      await onItemServe(order.id, itemId);
      playTone(volume, 1400, 0.2);
      onRefresh();
    } catch (error) {
      console.error("Failed to serve item:", error);
    }
  };

  return (
    <Card
      className={cn(
        "w-full max-w-lg mx-auto min-h-[500px]",
        getUrgencyColor(),
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-2xl font-bold">
            #{order.order_number}
          </CardTitle>
          <Badge
            variant={
              order.status === "pending"
                ? "destructive"
                : order.status === "confirmed"
                  ? "secondary"
                  : order.status === "preparing"
                    ? "default"
                    : "outline"
            }
            className="text-sm px-3 py-1"
          >
            {order.status === "pending" ? "NEW ORDER" : order.status.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <span className="font-medium">
            {order.order_type.replace("_", " ").toUpperCase()} •{" "}
            {order.customer_name || "Guest"}
          </span>
          <span className="font-medium">{waitTime}m ago</span>
        </div>

        {order.table_number ? (
          <div className="text-sm text-muted-foreground mb-3">
            📍 {t("kitchen.table")} {order.table_number}
          </div>
        ) : null}

        {/* Progress Bar */}
        <div className="w-full bg-muted dark:bg-muted/50 rounded-full h-3 mt-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm text-muted-foreground mt-2 font-medium truncate" title={`${readyItems} ${t("kitchen.ready")} • ${servedItems} ${t("kitchen.served")} • ${totalItems - readyItems - servedItems} ${t("kitchen.cooking")} (${Math.round(progress)}% ${t("kitchen.completed")})`}>
          {readyItems} {t("kitchen.ready")} • {servedItems}{" "}
          {t("kitchen.served")} • {totalItems - readyItems - servedItems}{" "}
          {t("kitchen.cooking")} ({Math.round(progress)}%{" "}
          {t("kitchen.completed")})
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Items with Checkboxes */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground flex items-center">
            <Package className="w-4 h-4 mr-2" />
            {t("kitchen.foodItems")}
          </h4>

          {displayItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("kitchen.noItems")}
            </p>
          ) : null}

          {displayItems.map((item, index) => {
            const isServed = item.status === "served";
            const isReady = checkedItems.has(item.id) || item.status === "ready";
            const canToggle = !isServed && !isOrderReady;

            const itemStatusLabel = isServed
              ? `🍽️ ${t("kitchen.served")}`
              : isReady
                ? `✅ ${t("kitchen.ready")}`
                : item.status === "preparing"
                  ? `🍳 ${t("kitchen.cooking")}`
                  : `🆕 ${t("kitchen.new")}`;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start space-x-4 p-4 rounded-lg border-2 transition-colors",
                  isServed
                    ? "bg-muted/50 border-border opacity-75"
                    : "bg-card hover:border-blue-500/50",
                )}
              >
                <button
                  onClick={() => canToggle && toggleItem(item.id)}
                  disabled={!canToggle}
                  className={cn(
                    "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all mt-1 flex-shrink-0",
                    isServed
                      ? "bg-muted border-muted text-foreground cursor-not-allowed"
                      : isReady
                        ? "bg-green-500 border-green-500 text-white shadow-lg"
                        : "border-border hover:border-green-400 hover:bg-green-500/10",
                    !canToggle && !isServed && "opacity-60 cursor-not-allowed",
                  )}
                >
                  {(isReady || isServed) && (
                    <CheckCircle className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-semibold text-lg mb-2",
                      (isServed || isReady) && "line-through text-muted-foreground",
                    )}
                  >
                    {item.quantity}x{" "}
                    {item.product_name || item.product?.name || `Item ${index + 1}`}
                    {isServed && (
                      <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        SERVED
                      </span>
                    )}
                  </div>

                  {item.special_instructions && (
                    <div className="text-sm bg-yellow-500/10 border border-yellow-500/20 rounded p-2 text-yellow-700 dark:text-yellow-400">
                      <strong>Special:</strong> {item.special_instructions}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        isServed
                          ? "bg-muted text-muted-foreground"
                          : isReady
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-orange-500/10 text-orange-700 dark:text-orange-400",
                      )}
                    >
                      {itemStatusLabel}
                    </div>

                    {/* Individual Item Serve Button */}
                    {isReady && !isServed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServeItem(item.id);
                        }}
                      >
                        🍽️ {t("kitchen.serveNow")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Notes */}
        {order.notes ? (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <h5 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
              {t("kitchen.orderNotes")}
            </h5>
            <p className="text-blue-700 dark:text-blue-400 text-sm">{order.notes}</p>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {(order.status === "pending" || order.status === "confirmed") && (
            <Button
              onClick={handleStartCooking}
              className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-lg"
              size="lg"
            >
              <ChefHat className="w-5 h-5 mr-2" />
              {t("kitchen.startCooking")}
            </Button>
          )}

          {order.status === "preparing" && (
            <Button
              onClick={handleMarkAllReady}
              className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-lg"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {t("kitchen.markAllReady")}
            </Button>
          )}

          {order.status === "ready" && (
            <div className="flex-1 bg-green-500/10 border-2 border-green-500 rounded-lg p-3 text-center">
              <div className="text-green-700 dark:text-green-400 font-bold text-lg">
                🎉 {t("kitchen.orderComplete")}
              </div>
              <div className="text-green-600 dark:text-green-500 text-sm mb-2">
                {t("kitchen.readyForPickupServing")}
              </div>
              <Button
                onClick={handleMarkAsPickedUp}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                🍽️ {t("kitchen.markAsPickedUp")}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

interface TakeawayBoardProps {
  orders: KitchenOrder[];
  t: Translate;
}

/** Ready takeaway orders waiting for pickup. */
function TakeawayBoard({ orders, t }: TakeawayBoardProps) {
  const takeawayOrders = orders.filter(
    (order) => order.order_type === "takeout" && order.status === "ready",
  );

  if (takeawayOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {t("kitchen.noTakeawayReady")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {takeawayOrders.map((order) => {
        const waitTime = Math.floor(
          (new Date().getTime() -
            new Date(order.updated_at ?? order.created_at).getTime()) /
            1000 /
            60,
        );

        return (
          <Card key={order.id} className="border-green-500 bg-green-500/10">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
                #{order.order_number}
              </CardTitle>
              <div className="text-lg font-semibold text-foreground">
                {order.customer_name || "Guest"}
              </div>
              <Badge
                variant="outline"
                className="text-green-600 dark:text-green-400 border-green-500"
              >
                {t("kitchen.readyForPickup", { count: 0 })}
              </Badge>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-sm text-muted-foreground">
                {t("kitchen.readyFor", { minutes: waitTime })}
              </div>
              <div className="mt-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="text-sm">
                    {item.quantity}x {item.product_name || item.product?.name || `Item`}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface SoundSettingsPanelProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  t: Translate;
}

function SoundSettingsPanel({
  soundEnabled,
  onToggleSound,
  volume,
  onVolumeChange,
  t,
}: SoundSettingsPanelProps) {
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          {t("kitchen.soundSettings")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            {t("kitchen.enableSounds")}
          </label>
          <button
            onClick={onToggleSound}
            className={cn(
              "w-12 h-6 rounded-full transition-colors",
              soundEnabled ? "bg-blue-600" : "bg-gray-300",
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full bg-white transition-transform",
                soundEnabled ? "translate-x-6" : "translate-x-1",
              )}
            />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("kitchen.volume")}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => playTone(volume, 800, 0.5)}
          >
            {t("kitchen.testNewOrder")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => playTone(volume, 1200, 0.3)}
          >
            {t("kitchen.testReady")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface NewEnhancedKitchenLayoutProps {
  user: UserType;
}

export function NewEnhancedKitchenLayout({
  user,
}: NewEnhancedKitchenLayoutProps) {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState("active-orders");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);

  // Fetch kitchen orders
  const {
    data: ordersResponse,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["newEnhancedKitchenOrders"],
    queryFn: () => apiClient.getKitchenOrders("all"),
    refetchInterval: autoRefresh ? 3000 : false,
    select: (data) => (data?.data ?? []) as KitchenOrder[],
  });

  const orders = ordersResponse || [];

  // Filter orders to only show kitchen-relevant statuses
  // Orders disappear when served/completed by server staff
  // Include 'pending' so kitchen can see new orders immediately
  const kitchenRelevantOrders = orders.filter((order) =>
    ["pending", "confirmed", "preparing", "ready"].includes(order.status),
  );

  const takeawayReadyOrders = useMemo(
    () =>
      kitchenRelevantOrders.filter(
        (order) => order.order_type === "takeout" && order.status === "ready",
      ),
    [kitchenRelevantOrders],
  );

  // Group orders by status
  const ordersByStatus = {
    pending: kitchenRelevantOrders.filter(
      (order) => order.status === "pending",
    ),
    confirmed: kitchenRelevantOrders.filter(
      (order) => order.status === "confirmed",
    ),
    preparing: kitchenRelevantOrders.filter(
      (order) => order.status === "preparing",
    ),
    ready: kitchenRelevantOrders.filter(
      (order) => order.status === "ready",
    ),
  };

  // Calculate statistics based on kitchen-relevant orders only
  const stats = {
    total: kitchenRelevantOrders.length,
    newOrders: ordersByStatus.pending.length + ordersByStatus.confirmed.length,
    preparing: ordersByStatus.preparing.length,
    ready: ordersByStatus.ready.length,
    urgent: kitchenRelevantOrders.filter((order) => {
      const created = new Date(order.created_at);
      const now = new Date();
      const minutesWaiting = Math.floor(
        (now.getTime() - created.getTime()) / 1000 / 60,
      );
      return minutesWaiting > 15;
    }).length,
  };

  // Handle logout
  const handleLogout = () => {
    apiClient.clearAuth();
    window.location.href = "/login";
  };

  // Stable API callbacks: mutations return the request promise so callers can
  // await them; refreshing is the caller's responsibility (once per batch).
  const handleOrderStatusUpdate = useCallback(
    async (orderId: string, status: OrderStatus) => {
      await apiClient.updateOrderStatus(orderId, status);
    },
    [],
  );

  const handleItemStatusUpdate = useCallback(
    async (orderId: string, itemId: string, status: string) => {
      await apiClient.updateOrderItemStatus(orderId, itemId, status);
    },
    [],
  );

  const handleItemServe = useCallback(
    async (orderId: string, itemId: string) => {
      await apiClient.updateOrderItemStatus(orderId, itemId, "served");
    },
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Title and stats */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mr-4">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {t("kitchen.title")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("kitchen.chef")} {user.first_name} •{" "}
                  {t("kitchen.activeOrders", { count: stats.total })}
                </p>
              </div>
            </div>

            {/* Status badges */}
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-sm">
                {stats.newOrders} {t("kitchen.new")}
              </Badge>
              <Badge variant="default" className="text-sm">
                {stats.preparing} {t("kitchen.preparing")}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {stats.ready} {t("kitchen.ready")}
              </Badge>
              {stats.urgent > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {stats.urgent} {t("kitchen.urgent")}
                </Badge>
              )}
            </div>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-4">
            {/* Auto-refresh indicator */}
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-300",
                )}
              />
              <span className="text-sm text-muted-foreground">
                {autoRefresh
                  ? t("kitchen.liveUpdates")
                  : t("kitchen.manualRefresh")}
              </span>
            </div>

            {/* Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("w-4 h-4", isLoading && "animate-spin")}
              />
            </Button>

            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Clock className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSoundSettings(!showSoundSettings)}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sound Settings Overlay */}
      {showSoundSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="relative">
            <SoundSettingsPanel
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              volume={volume}
              onVolumeChange={setVolume}
              t={t}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSoundSettings(false)}
              className="absolute -top-2 -right-2"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active-orders" className="text-lg py-3">
              <ChefHat className="w-5 h-5 mr-2" />
              {t("kitchen.kitchenOrders")} ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="takeaway-ready" className="text-lg py-3">
              <Package className="w-5 h-5 mr-2" />
              {t("kitchen.takeawayBoard")} ({takeawayReadyOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active-orders" className="space-y-6">
            {isLoading ? (
              <div className="p-6">
                <CardSkeleton count={6} />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
                  <p className="text-red-600">{t("kitchen.failedToLoad")}</p>
                  <Button onClick={() => refetch()} className="mt-2">
                    {t("kitchen.tryAgain")}
                  </Button>
                </div>
              </div>
            ) : kitchenRelevantOrders.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {t("kitchen.noOrders")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("kitchen.kitchenCaughtUp")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {kitchenRelevantOrders.map((order) => (
                  <EnhancedOrderCard
                    key={order.id}
                    order={order}
                    t={t}
                    volume={volume}
                    onOrderStatusUpdate={handleOrderStatusUpdate}
                    onItemStatusUpdate={handleItemStatusUpdate}
                    onItemServe={handleItemServe}
                    onRefresh={refetch}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="takeaway-ready">
            <TakeawayBoard orders={takeawayReadyOrders} t={t} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
