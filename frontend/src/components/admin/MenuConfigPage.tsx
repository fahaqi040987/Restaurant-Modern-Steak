import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { apiClient } from '@/api/client'
import type { MenuItemConfig } from '@/types'
import { toastHelpers } from '@/lib/toast-helpers'

const MENU_ITEMS = [
  { id: 'home', labelKey: 'public.home' },
  { id: 'menu', labelKey: 'public.menu' },
  { id: 'about', labelKey: 'public.aboutUs' },
  { id: 'reservation', labelKey: 'public.reservation' },
  { id: 'contact', labelKey: 'public.contact' },
  { id: 'franchise', labelKey: 'public.franchise' },
]

export function MenuConfigPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [menuConfig, setMenuConfig] = useState<MenuItemConfig[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch menu config
  const { data: fetchedConfig, isLoading } = useQuery({
    queryKey: ['publicMenuConfig'],
    queryFn: () => apiClient.getPublicMenuConfig(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Record<string, string>) =>
      apiClient.updateSettings(settings as import('@/types').SystemSettings),
    onSuccess: () => {
      toastHelpers.success('Success', t('admin.menuConfigDetails.saveSuccess'))
      setHasChanges(false)
      queryClient.invalidateQueries({ queryKey: ['publicMenuConfig'] })
    },
    onError: (error: Error) => {
      toastHelpers.error('Error', error.message)
    },
  })

  // Initialize state with fetched data
  useEffect(() => {
    if (fetchedConfig) {
      setMenuConfig(fetchedConfig)
    }
  }, [fetchedConfig])

  const handleToggle = (id: string) => {
    setMenuConfig(prev =>
      prev.map(item =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    )
    setHasChanges(true)
  }

  const handleMaintenanceTextChange = (id: string, text: string) => {
    setMenuConfig(prev =>
      prev.map(item =>
        item.id === id ? { ...item, maintenanceText: text } : item
      )
    )
    setHasChanges(true)
  }

  const handleSave = () => {
    // Validate that disabled items have maintenance text
    const invalidItems = menuConfig.filter(
      item => !item.enabled && (!item.maintenanceText || item.maintenanceText.trim() === '')
    )

    if (invalidItems.length > 0) {
      toastHelpers.validationError('Please provide maintenance text for all disabled menu items')
      return
    }

    updateSettingsMutation.mutate({
      public_menu_config: JSON.stringify(menuConfig),
    })
  }

  const isSaving = updateSettingsMutation.isPending

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.menuConfigDetails.title')}</h1>
          <p className="text-muted-foreground">{t('admin.menuConfigDetails.description')}</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t('common.save')}
        </Button>
      </div>

      {/* Menu Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MENU_ITEMS.map((menuItem) => {
          const config = menuConfig.find(c => c.id === menuItem.id) || {
            id: menuItem.id,
            enabled: true,
            maintenanceText: '',
          }

          return (
            <Card key={menuItem.id}>
              <CardHeader>
                <CardTitle className="text-lg">{t(menuItem.labelKey)}</CardTitle>
                <CardDescription>
                  {config.enabled
                    ? t('admin.menuConfigDetails.enabled')
                    : t('admin.menuConfigDetails.disabled')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`toggle-${menuItem.id}`}>
                    {t('admin.menuConfigDetails.showInMenu')}
                  </Label>
                  <Switch
                    id={`toggle-${menuItem.id}`}
                    checked={config.enabled}
                    onCheckedChange={() => handleToggle(menuItem.id)}
                  />
                </div>

                {/* Maintenance Text Input */}
                {!config.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor={`maintenance-${menuItem.id}`}>
                      {t('admin.menuConfigDetails.maintenanceText')}
                    </Label>
                    <Input
                      id={`maintenance-${menuItem.id}`}
                      value={config.maintenanceText}
                      onChange={(e) =>
                        handleMaintenanceTextChange(menuItem.id, e.target.value)
                      }
                      placeholder={t('admin.menuConfigDetails.maintenancePlaceholder')}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin.menuConfigDetails.maintenanceHint')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info Box */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{t('admin.menuConfigDetails.infoBox.text1')}</p>
              <p>{t('admin.menuConfigDetails.infoBox.text2')}</p>
              <p>{t('admin.menuConfigDetails.infoBox.text3')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
