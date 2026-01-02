import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Settings,
  Database,
  Bell,
  Globe,
  DollarSign,
  Printer,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  Languages,
  Palette,
  Store,
} from 'lucide-react'
import apiClient from '@/api/client'
import { toastHelpers } from '@/lib/toast-helpers'
import { useTheme } from '@/components/theme-provider'
import { receiptPrinter } from '@/services/receiptPrinter'
import { RestaurantInfoSettings } from './RestaurantInfoSettings'

type SystemSettings = Record<string, any>

export function AdminSettings() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<SystemSettings>({})
  const { theme, setTheme } = useTheme()

  // Fetch settings from backend
  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await apiClient.getSettings()
      if (!response.success) {
        throw new Error(response.message)
      }
      return response.data as SystemSettings
    },
  })

  // Fetch system health
  const { data: healthData, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await apiClient.getSystemHealth()
      if (!response.success) {
        throw new Error(response.message)
      }
      return response.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Update local state when data is fetched
  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData)
    }
  }, [settingsData])

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: SystemSettings) => {
      // Convert all values to strings as backend expects map[string]string
      const stringifiedSettings: Record<string, string> = {}
      for (const [key, value] of Object.entries(newSettings)) {
        if (value === null || value === undefined) {
          stringifiedSettings[key] = ''
        } else if (typeof value === 'boolean') {
          stringifiedSettings[key] = value ? 'true' : 'false'
        } else {
          stringifiedSettings[key] = String(value)
        }
      }

      const response = await apiClient.updateSettings(stringifiedSettings)
      if (!response.success) {
        throw new Error(response.message)
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      toastHelpers.success('Settings saved successfully!')
    },
    onError: (error: Error) => {
      toastHelpers.error(error.message || 'Failed to save settings')
    },
  })

  const handleSave = () => {
    saveSettingsMutation.mutate(settings)
  }

  const handleReset = () => {
    if (settingsData) {
      setSettings(settingsData)
      toastHelpers.info('Settings reset to saved values')
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // State for test printing
  const [testPrinting, setTestPrinting] = useState(false)

  // Handle test print
  const handleTestPrint = async () => {
    setTestPrinting(true)
    try {
      // Update printer settings before test
      receiptPrinter.updateSettings({
        restaurant_name: settings.restaurant_name,
        receipt_header: settings.receipt_header,
        receipt_footer: settings.receipt_footer,
        paper_size: settings.paper_size,
        currency: settings.currency,
        tax_rate: parseFloat(settings.tax_rate) || 11,
        printer_name: settings.printer_name,
        print_copies: parseInt(settings.print_copies) || 1,
      })

      await receiptPrinter.testPrint()
      toastHelpers.success('Test print berhasil! Periksa printer Anda.')
    } catch (error) {
      console.error('Test print error:', error)
      toastHelpers.error('Test print gagal. Periksa koneksi printer.')
    } finally {
      setTestPrinting(false)
    }
  }

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h2>
        <p className="text-muted-foreground">
          {t('common.loading', 'Configure your restaurant settings and POS system')}
        </p>
      </div>

      {/* Tabs for different settings sections */}
      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('System Settings')}
          </TabsTrigger>
          <TabsTrigger value="restaurant" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            {t('Restaurant Info')}
          </TabsTrigger>
        </TabsList>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} disabled={saveSettingsMutation.isPending}>
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('common.cancel', 'Reset')}
              </Button>
              <Button onClick={handleSave} disabled={saveSettingsMutation.isPending}>
                {saveSettingsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {t('common.save')}
              </Button>
            </div>
          </div>

      {/* Language Switcher */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            {t('settings.language')}
          </CardTitle>
          <CardDescription>
            Switch interface language instantly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={i18n.language === 'id-ID' ? 'default' : 'outline'}
              onClick={() => i18n.changeLanguage('id-ID')}
              className="flex-1"
            >
              🇮🇩 Bahasa Indonesia
            </Button>
            <Button
              variant={i18n.language === 'en-US' ? 'default' : 'outline'}
              onClick={() => i18n.changeLanguage('en-US')}
              className="flex-1"
            >
              🇺🇸 English
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Current: {i18n.language === 'id-ID' ? 'Bahasa Indonesia' : 'English (US)'}
          </p>
        </CardContent>
      </Card>

      {/* Theme Toggle */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="flex-1"
            >
              ☀️ Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="flex-1"
            >
              🌙 Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
              className="flex-1"
            >
              💻 System
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Current theme: {theme === 'system' ? 'System Default' : theme.charAt(0).toUpperCase() + theme.slice(1)}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Restaurant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('settings.restaurantInfo')}
            </CardTitle>
            <CardDescription>
              {t('settings.restaurantInfo', 'Basic information about your restaurant')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restaurant_name">{t('settings.restaurantName')}</Label>
              <Input
                id="restaurant_name"
                value={settings.restaurant_name || ''}
                onChange={(e) => updateSetting('restaurant_name', e.target.value)}
                placeholder="Steak Kenangan"
              />
              <p className="text-xs text-muted-foreground">Nama yang ditampilkan di POS dan struk</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('settings.currency')}</Label>
              <Select
                value={settings.currency || 'IDR'}
                onValueChange={(value) => updateSetting('currency', value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">IDR - Rupiah Indonesia</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('settings.currency', 'Currency for all transactions')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_language">{t('settings.language')}</Label>
              <Select
                value={settings.default_language || 'id-ID'}
                onValueChange={(value) => updateSetting('default_language', value)}
              >
                <SelectTrigger id="default_language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id-ID">Bahasa Indonesia</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {t('settings.financial')}
            </CardTitle>
            <CardDescription>
              {t('settings.financial', 'Configure currency, taxes, and charges')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_rate">{t('settings.taxRate')} (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.tax_rate || ''}
                  onChange={(e) => updateSetting('tax_rate', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">PPN Indonesia: 11%</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_charge">{t('settings.serviceCharge')} (%)</Label>
                <Input
                  id="service_charge"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.service_charge || ''}
                  onChange={(e) => updateSetting('service_charge', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_method">{t('settings.taxMethod')}</Label>
              <Select
                value={settings.tax_calculation_method || 'exclusive'}
                onValueChange={(value) => updateSetting('tax_calculation_method', value)}
              >
                <SelectTrigger id="tax_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclusive">{t('settings.exclusive')}</SelectItem>
                  <SelectItem value="inclusive">{t('settings.inclusive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable_rounding">{t('settings.rounding')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.rounding', 'Round total to nearest value')}</p>
              </div>
              <Switch
                id="enable_rounding"
                checked={settings.enable_rounding === 'true' || settings.enable_rounding === true}
                onCheckedChange={(checked) => updateSetting('enable_rounding', checked.toString())}
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              {t('settings.receipt')}
            </CardTitle>
            <CardDescription>
              {t('settings.receipt', 'Customize receipt appearance and messages')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receipt_header">{t('settings.receiptHeader')}</Label>
              <Textarea
                id="receipt_header"
                value={settings.receipt_header || ''}
                onChange={(e) => updateSetting('receipt_header', e.target.value)}
                placeholder="Terima kasih sudah makan di sini!"
                rows={2}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">Maksimal 200 karakter</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt_footer">{t('settings.receiptFooter')}</Label>
              <Textarea
                id="receipt_footer"
                value={settings.receipt_footer || ''}
                onChange={(e) => updateSetting('receipt_footer', e.target.value)}
                placeholder="Kunjungi kami lagi!"
                rows={2}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paper_size">{t('settings.paperSize')}</Label>
              <Select
                value={settings.paper_size || '80mm'}
                onValueChange={(value) => updateSetting('paper_size', value)}
              >
                <SelectTrigger id="paper_size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (kecil)</SelectItem>
                  <SelectItem value="80mm">80mm (standar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show_logo">{t('settings.showLogo')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.showLogo', 'Logo at top of receipt')}</p>
                </div>
                <Switch
                  id="show_logo"
                  checked={settings.show_logo === 'true' || settings.show_logo === true}
                  onCheckedChange={(checked) => updateSetting('show_logo', checked.toString())}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto_print">{t('settings.autoPrint')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.autoPrint', 'Auto print customer copy')}</p>
                </div>
                <Switch
                  id="auto_print"
                  checked={settings.auto_print_customer_copy === 'true' || settings.auto_print_customer_copy === true}
                  onCheckedChange={(checked) => updateSetting('auto_print_customer_copy', checked.toString())}
                />
              </div>
            </div>

            {/* Printer Configuration */}
            <div className="border-t pt-4 mt-4 space-y-4">
              <h4 className="font-medium text-sm">{t('settings.printerConfig', 'Konfigurasi Printer')}</h4>

              <div className="space-y-2">
                <Label htmlFor="printer_name">{t('settings.printerName', 'Nama Printer')}</Label>
                <Input
                  id="printer_name"
                  value={settings.printer_name || ''}
                  onChange={(e) => updateSetting('printer_name', e.target.value)}
                  placeholder="Default"
                />
                <p className="text-xs text-muted-foreground">Nama printer sistem (kosongkan untuk default)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="print_copies">{t('settings.printCopies', 'Jumlah Salinan')}</Label>
                <Select
                  value={settings.print_copies || '1'}
                  onValueChange={(value) => updateSetting('print_copies', value)}
                >
                  <SelectTrigger id="print_copies">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Salinan</SelectItem>
                    <SelectItem value="2">2 Salinan (Pelanggan + Dapur)</SelectItem>
                    <SelectItem value="3">3 Salinan</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Jumlah salinan struk yang dicetak</p>
              </div>

              <Button
                onClick={handleTestPrint}
                variant="outline"
                className="w-full"
                disabled={testPrinting}
              >
                {testPrinting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4 mr-2" />
                )}
                {testPrinting ? 'Mencetak...' : t('settings.testPrint', 'Test Print')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Kitchen Printer Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              {t('settings.kitchenPrinter', 'Printer Dapur')}
            </CardTitle>
            <CardDescription>
              {t('settings.kitchenPrinter', 'Configure kitchen ticket printing')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kitchen_paper_size">{t('settings.paperSize')}</Label>
              <Select
                value={settings.kitchen_paper_size || '80mm'}
                onValueChange={(value) => updateSetting('kitchen_paper_size', value)}
              >
                <SelectTrigger id="kitchen_paper_size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (kecil)</SelectItem>
                  <SelectItem value="80mm">80mm (standar)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Ukuran kertas untuk tiket dapur</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto_print_kitchen">{t('settings.autoPrintKitchen', 'Auto Print Dapur')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.autoPrintKitchen', 'Auto print to kitchen on new order')}</p>
                </div>
                <Switch
                  id="auto_print_kitchen"
                  checked={settings.auto_print_kitchen === 'true' || settings.auto_print_kitchen === true}
                  onCheckedChange={(checked) => updateSetting('auto_print_kitchen', checked.toString())}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show_prices_kitchen">{t('settings.showPricesKitchen', 'Tampilkan Harga')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.showPricesKitchen', 'Show item prices on kitchen tickets')}</p>
                </div>
                <Switch
                  id="show_prices_kitchen"
                  checked={settings.show_prices_kitchen === 'true' || settings.show_prices_kitchen === true}
                  onCheckedChange={(checked) => updateSetting('show_prices_kitchen', checked.toString())}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="kitchen_print_categories">{t('settings.printByCategory', 'Cetak Per Kategori')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.printByCategory', 'Print separate tickets by category')}</p>
                </div>
                <Switch
                  id="kitchen_print_categories"
                  checked={settings.kitchen_print_categories === 'true' || settings.kitchen_print_categories === true}
                  onCheckedChange={(checked) => updateSetting('kitchen_print_categories', checked.toString())}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kitchen_urgent_time">{t('settings.urgentOrderTime', 'Waktu Pesanan Mendesak (menit)')}</Label>
              <Input
                id="kitchen_urgent_time"
                type="number"
                min="5"
                max="60"
                value={settings.kitchen_urgent_time || '20'}
                onChange={(e) => updateSetting('kitchen_urgent_time', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Pesanan akan ditandai mendesak setelah waktu ini</p>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('settings.system')}
            </CardTitle>
            <CardDescription>
              {t('settings.system', 'System behavior and preferences')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup_frequency">{t('settings.backupFrequency')}</Label>
              <Select
                value={settings.backup_frequency || 'daily'}
                onValueChange={(value) => updateSetting('backup_frequency', value)}
              >
                <SelectTrigger id="backup_frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">{t('settings.hourly')}</SelectItem>
                  <SelectItem value="daily">{t('settings.daily')}</SelectItem>
                  <SelectItem value="weekly">{t('settings.weekly')}</SelectItem>
                  <SelectItem value="manual">{t('settings.manual')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_retention">{t('settings.dataRetention')}</Label>
              <Input
                id="data_retention"
                type="number"
                min="30"
                max="3650"
                value={settings.data_retention_days || '365'}
                onChange={(e) => updateSetting('data_retention_days', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Berapa lama data disimpan sebelum dihapus otomatis</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_timeout">{t('settings.sessionTimeout')}</Label>
              <Input
                id="session_timeout"
                type="number"
                min="5"
                max="480"
                value={settings.session_timeout || '60'}
                onChange={(e) => updateSetting('session_timeout', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Logout otomatis setelah tidak aktif</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">{t('settings.lowStockThreshold')}</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="1"
                max="1000"
                value={settings.low_stock_threshold || '10'}
                onChange={(e) => updateSetting('low_stock_threshold', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Notifikasi saat stok di bawah nilai ini</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="audit_logging">Audit Logging</Label>
                <p className="text-xs text-muted-foreground">Catat semua aktivitas sistem</p>
              </div>
              <Switch
                id="audit_logging"
                checked={settings.enable_audit_logging === 'true' || settings.enable_audit_logging === true}
                onCheckedChange={(checked) => updateSetting('enable_audit_logging', checked.toString())}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Current system health and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHealth ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge variant="outline" className="w-full">
                  Database
                </Badge>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {healthData?.database?.status === 'connected' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <p className="text-sm text-green-600">Connected</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 text-red-600" />
                      <p className="text-sm text-red-600">Disconnected</p>
                    </>
                  )}
                </div>
                {healthData?.database?.latency_ms !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {healthData.database.latency_ms.toFixed(2)}ms
                  </p>
                )}
              </div>
              <div className="text-center">
                <Badge variant="outline" className="w-full">
                  API Version
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {healthData?.api?.version || 'v1.0.0'}
                </p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="w-full">
                  Last Backup
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {healthData?.backup?.last_backup
                    ? new Date(healthData.backup.last_backup).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="w-full">
                  Status
                </Badge>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <p className="text-sm text-green-600">Online</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Restaurant Info Tab */}
        <TabsContent value="restaurant" className="mt-6">
          <RestaurantInfoSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
