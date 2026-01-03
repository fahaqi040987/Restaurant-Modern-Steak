import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import apiClient from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Table, 
  TrendingUp,
  Plus,
  Settings,
  BarChart3
} from 'lucide-react'

interface IncomeBreakdownItem {
  period: string
  orders: number
  gross: number
  tax: number
  net: number
}

export function AdminDashboard() {
  const { t } = useTranslation()
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')
  const navigate = useNavigate()

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => apiClient.getDashboardStats().then(res => res.data)
  })

  // Fetch income report
  const { data: income, isLoading: incomeLoading } = useQuery({
    queryKey: ['incomeReport', selectedPeriod],
    queryFn: () => apiClient.getIncomeReport(selectedPeriod).then(res => res.data)
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboardTitle')}</h1>
          <p className="text-muted-foreground">
            {t('admin.dashboardSubtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/settings' })}>
            <Settings className="w-4 h-4 mr-2" />
            {t('admin.settings')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/reports' })}>
            <BarChart3 className="w-4 h-4 mr-2" />
            {t('admin.reports')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.todayOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today_orders || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% {t('admin.fromYesterday')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.todayRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.today_revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              +8% {t('admin.fromYesterday')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.activeOrders')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_orders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('admin.currentlyProcessed')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.occupiedTables')}</CardTitle>
            <Table className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.occupied_tables || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('admin.tablesInUse')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income Report */}
      <Card className="col-span-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('admin.incomeReport')}
              </CardTitle>
              <CardDescription>
                {t('admin.incomeDescription')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('today')}
              >
                {t('admin.today')}
              </Button>
              <Button
                variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('week')}
              >
                {t('admin.week')}
              </Button>
              <Button
                variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('month')}
              >
                {t('admin.month')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {incomeLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : income ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {income.summary.total_orders}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('admin.totalOrders')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(income.summary.gross_income)}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('admin.grossIncome')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(income.summary.tax_collected)}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('admin.taxCollected')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(income.summary.net_income)}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('admin.netIncome')}</div>
                </div>
              </div>

              {/* Breakdown Table */}
              {income.breakdown && income.breakdown.length > 0 && (
                <div className="border rounded-lg">
                  <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 font-medium text-sm">
                    <div>{t('admin.period')}</div>
                    <div className="text-center">{t('admin.orders')}</div>
                    <div className="text-center">{t('admin.gross')}</div>
                    <div className="text-center">{t('admin.tax')}</div>
                    <div className="text-center">{t('admin.net')}</div>
                  </div>
                  {income.breakdown.slice(0, 10).map((item: IncomeBreakdownItem, index: number) => (
                    <div key={index} className="grid grid-cols-5 gap-4 p-4 border-t text-sm">
                      <div className="font-medium">
                        {new Date(item.period).toLocaleDateString()}
                      </div>
                      <div className="text-center">{item.orders}</div>
                      <div className="text-center">{formatCurrency(item.gross)}</div>
                      <div className="text-center">{formatCurrency(item.tax)}</div>
                      <div className="text-center font-medium">{formatCurrency(item.net)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('admin.noIncomeData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <Plus className="h-8 w-8 mx-auto text-blue-600" />
            <CardTitle className="text-lg">{t('admin.manageMenu')}</CardTitle>
            <CardDescription>{t('admin.manageMenuDesc')}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <Table className="h-8 w-8 mx-auto text-green-600" />
            <CardTitle className="text-lg">{t('admin.manageTables')}</CardTitle>
            <CardDescription>{t('admin.manageTablesDesc')}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <Users className="h-8 w-8 mx-auto text-purple-600" />
            <CardTitle className="text-lg">{t('admin.manageStaff')}</CardTitle>
            <CardDescription>{t('admin.manageStaffDesc')}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto text-orange-600" />
            <CardTitle className="text-lg">{t('admin.viewReports')}</CardTitle>
            <CardDescription>{t('admin.viewReportsDesc')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
