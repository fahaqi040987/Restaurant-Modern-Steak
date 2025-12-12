import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  XCircle
} from 'lucide-react'
import apiClient from '@/api/client'
import { toastHelpers } from '@/lib/toast-helpers'

type SystemSettings = Record<string, any>

export function AdminSettings() {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<SystemSettings>({})

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
      const response = await apiClient.updateSettings(newSettings)
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

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">
            Configure your restaurant's POS system settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saveSettingsMutation.isPending}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saveSettingsMutation.isPending}>
            {saveSettingsMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Restaurant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Restaurant Information
            </CardTitle>
            <CardDescription>
              Basic information about your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Restaurant Name</label>
              <Input
                value={settings.restaurant_name || ''}
                onChange={(e) => updateSetting('restaurant_name', e.target.value)}
                placeholder="Enter restaurant name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Settings
            </CardTitle>
            <CardDescription>
              Configure currency, taxes, and charges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Currency</label>
              <Input
                value={settings.currency || ''}
                onChange={(e) => updateSetting('currency', e.target.value)}
                placeholder="USD"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tax Rate (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.tax_rate || ''}
                  onChange={(e) => updateSetting('tax_rate', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Service Charge (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.service_charge || ''}
                  onChange={(e) => updateSetting('service_charge', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Receipt Settings
            </CardTitle>
            <CardDescription>
              Customize receipt appearance and messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Receipt Header</label>
              <Input
                value={settings.receipt_header || ''}
                onChange={(e) => updateSetting('receipt_header', e.target.value)}
                placeholder="Header message"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Receipt Footer</label>
              <Input
                value={settings.receipt_footer || ''}
                onChange={(e) => updateSetting('receipt_footer', e.target.value)}
                placeholder="Footer message"
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Configuration
            </CardTitle>
            <CardDescription>
              System behavior and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Backup Frequency</label>
              <select
                className="w-full p-2 border border-input rounded-md bg-background"
                value={settings.backup_frequency || 'daily'}
                onChange={(e) => updateSetting('backup_frequency', e.target.value)}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual Only</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Session Timeout (minutes)</label>
              <Input
                type="number"
                value={settings.session_timeout || ''}
                onChange={(e) => updateSetting('session_timeout', e.target.value)}
                placeholder="60"
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
                  {healthData?.database === 'connected' ? (
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
                {healthData?.database_latency_ms && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {healthData.database_latency_ms.toFixed(2)}ms
                  </p>
                )}
              </div>
              <div className="text-center">
                <Badge variant="outline" className="w-full">
                  API Version
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {healthData?.api_version || 'v1.0.0'}
                </p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="w-full">
                  Last Backup
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {healthData?.last_backup_at 
                    ? new Date(healthData.last_backup_at).toLocaleDateString()
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
    </div>
  )
}
