import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Store,
  LogOut,
  Settings,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  MapPin,
  ChefHat,
  History
} from 'lucide-react'
import apiClient from '@/api/client'
import type { User, DiningTable } from '@/types'

interface POSHeaderProps {
  user: User
  selectedTable: DiningTable | null
  orderType: 'dine_in' | 'takeout' | 'delivery'
  onOrderTypeChange: (type: 'dine_in' | 'takeout' | 'delivery') => void
  onTableSelect: () => void
  customerName: string
  onCustomerNameChange: (name: string) => void
}

export function POSHeader({
  user,
  selectedTable,
  orderType,
  onOrderTypeChange,
  onTableSelect,
  customerName,
  onCustomerNameChange
}: POSHeaderProps) {
  const { t } = useTranslation()
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)

  const handleLogout = async () => {
    try {
      await apiClient.logout()
    } catch (_error) {
      // Even if logout fails, clear local auth
    } finally {
      apiClient.clearAuth()
      window.location.href = '/login'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700'
      case 'manager': return 'bg-blue-100 text-blue-700'
      case 'cashier': return 'bg-green-100 text-green-700'
      case 'kitchen': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const orderTypeConfigs = [
    { type: 'dine_in' as const, labelKey: 'pos.dineIn', icon: UtensilsCrossed, color: 'bg-blue-100 text-blue-700' },
    { type: 'takeout' as const, labelKey: 'pos.takeout', icon: ShoppingBag, color: 'bg-green-100 text-green-700' },
    { type: 'delivery' as const, labelKey: 'pos.delivery', icon: Truck, color: 'bg-purple-100 text-purple-700' },
  ]

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('pos.systemTitle')}</h1>
              <p className="text-sm text-gray-500">{t('pos.title')}</p>
            </div>
          </div>
        </div>

        {/* Center: Order Type & Table Selection */}
        <div className="flex items-center gap-6">
          {/* Order Type Selection */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {orderTypeConfigs.map((config) => {
              const Icon = config.icon
              return (
                <button
                  key={config.type}
                  onClick={() => onOrderTypeChange(config.type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    orderType === config.type
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(config.labelKey)}
                </button>
              )
            })}
          </div>

          {/* Table Selection (Dine In only) */}
          {orderType === 'dine_in' && (
            <Button
              variant={selectedTable ? "default" : "outline"}
              onClick={onTableSelect}
              className="flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {selectedTable ? t('pos.tableNumber', { number: selectedTable.table_number }) : t('pos.selectTable')}
            </Button>
          )}

          {/* Customer Name (Takeout/Delivery) */}
          {orderType !== 'dine_in' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {t('pos.customerLabel')}
              </label>
              <Input
                type="text"
                placeholder={orderType === 'takeout' ? t('pos.customerPlaceholder') : t('pos.deliveryPlaceholder')}
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                className="w-48"
              />
            </div>
          )}
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </span>
              <Badge className={getRoleBadgeColor(user.role)}>
                {user.role}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            {/* Payment History Access */}
            {(user.role === 'admin' || user.role === 'cashier') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPaymentHistory(true)}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                title={t('pos.paymentHistory')}
              >
                <History className="w-4 h-4" />
                <span className="text-sm font-medium">{t('pos.payments')}</span>
              </Button>
            )}

            {/* Kitchen Display Access */}
            {(user.role === 'kitchen' || user.role === 'admin' || user.role === 'manager') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/kitchen'}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                title={t('kitchen.title')}
              >
                <ChefHat className="w-4 h-4" />
                <span className="text-sm font-medium">{t('pos.kitchen')}</span>
              </Button>
            )}
            
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Payment History Modal - TODO: Re-enable when needed */}
      {showPaymentHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">{t('pos.paymentHistory')}</h2>
            <p className="text-gray-600 mb-4">{t('pos.paymentHistoryFeature')}</p>
            <button
              onClick={() => setShowPaymentHistory(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('pos.close')}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

