import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { PaymentMethodConfig, UpdatePaymentMethodRequest } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers'

interface PaymentMethodFormState {
  label: string
  description: string
  provider: string
  api_endpoint: string
  webhook_url: string
  sort_order: string
}

const emptyForm: PaymentMethodFormState = {
  label: '',
  description: '',
  provider: '',
  api_endpoint: '',
  webhook_url: '',
  sort_order: '0',
}

const isValidHttpUrl = (value: string) => /^https?:\/\//.test(value)

export default function PaymentMethodsSettings() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null)
  const [form, setForm] = useState<PaymentMethodFormState>(emptyForm)

  const {
    data: methods = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<PaymentMethodConfig[]>({
    queryKey: ['adminPaymentMethods'],
    queryFn: async () => {
      const response = await apiClient.getAdminPaymentMethods()
      return response.data ?? []
    },
  })

  useEffect(() => {
    if (isError) {
      showErrorToast(t('admin.paymentMethodLoadError'))
    }
  }, [isError, t])

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiClient.updatePaymentMethod(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPaymentMethods'] })
      showSuccessToast(t('admin.paymentMethodUpdateSuccess'))
    },
    onError: () => {
      showErrorToast(t('admin.paymentMethodUpdateError'))
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentMethodRequest }) =>
      apiClient.updatePaymentMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPaymentMethods'] })
      showSuccessToast(t('admin.paymentMethodUpdateSuccess'))
      setEditingMethod(null)
    },
    onError: () => {
      showErrorToast(t('admin.paymentMethodUpdateError'))
    },
  })

  const openEditDialog = (method: PaymentMethodConfig) => {
    setEditingMethod(method)
    setForm({
      label: method.label,
      description: method.description ?? '',
      provider: method.provider ?? '',
      api_endpoint: method.api_endpoint ?? '',
      webhook_url: method.webhook_url ?? '',
      sort_order: String(method.sort_order),
    })
  }

  const handleFieldChange =
    (field: keyof PaymentMethodFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSave = () => {
    if (!editingMethod) return

    const endpoint = form.api_endpoint.trim()
    const webhookUrl = form.webhook_url.trim()
    if ((endpoint !== '' && !isValidHttpUrl(endpoint)) || (webhookUrl !== '' && !isValidHttpUrl(webhookUrl))) {
      showErrorToast(t('admin.paymentMethodUpdateError'))
      return
    }

    editMutation.mutate({
      id: editingMethod.id,
      data: {
        label: form.label.trim(),
        description: form.description.trim() || null,
        provider: form.provider.trim() || null,
        api_endpoint: endpoint || null,
        webhook_url: webhookUrl || null,
        sort_order: Number(form.sort_order) || 0,
      },
    })
  }

  const sortedMethods = [...methods].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('admin.paymentMethodsTitle')}</h1>
        <p className="text-muted-foreground">{t('admin.paymentMethodsSubtitle')}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {t('admin.paymentMethodDisableWarning')}
        </p>
      </div>

      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        {t('admin.paymentMethodIntegrationHint')}
      </div>

      {isLoading ? (
        <div className="text-center py-8">{t('common.loading')}</div>
      ) : isError ? (
        <div className="text-center py-8 space-y-3">
          <p className="text-muted-foreground">{t('admin.paymentMethodLoadError')}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {t('common.refresh')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMethods.map((method) => (
            <div
              key={method.id}
              className="rounded-lg border p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{method.label}</span>
                  <Badge variant="outline">
                    {t('admin.paymentMethodCode')}: {method.code}
                  </Badge>
                  {method.provider ? (
                    <Badge variant="secondary">
                      {t('admin.paymentMethodProvider')}: {method.provider}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t('admin.paymentMethodNoIntegration')}
                    </span>
                  )}
                </div>
                {method.description && (
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {t('admin.paymentMethodStatusLabel')}
                  </span>
                  <Switch
                    checked={method.is_active}
                    disabled={
                      toggleMutation.isPending && toggleMutation.variables?.id === method.id
                    }
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: method.id, is_active: checked })
                    }
                    aria-label={method.label}
                  />
                  <span className="text-sm">
                    {method.is_active ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEditDialog(method)}>
                  {t('common.edit')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={editingMethod !== null}
        onOpenChange={(open) => {
          if (!open) setEditingMethod(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t('common.edit')}: {editingMethod?.label}
            </DialogTitle>
            <DialogDescription>{t('admin.paymentMethodIntegrationHint')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pm-label">{t('common.name')}</Label>
              <Input id="pm-label" value={form.label} onChange={handleFieldChange('label')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pm-description">{t('admin.paymentMethodDescription')}</Label>
              <Input
                id="pm-description"
                value={form.description}
                onChange={handleFieldChange('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pm-provider">{t('admin.paymentMethodProvider')}</Label>
              <Input
                id="pm-provider"
                value={form.provider}
                onChange={handleFieldChange('provider')}
                placeholder="midtrans / xendit / edc / manual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pm-api-endpoint">{t('admin.paymentMethodApiEndpoint')}</Label>
              <Input
                id="pm-api-endpoint"
                value={form.api_endpoint}
                onChange={handleFieldChange('api_endpoint')}
                placeholder="https://api.sandbox.midtrans.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pm-webhook-url">{t('admin.paymentMethodWebhookUrl')}</Label>
              <Input
                id="pm-webhook-url"
                value={form.webhook_url}
                onChange={handleFieldChange('webhook_url')}
                placeholder="https://example.com/webhooks/payments"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pm-sort-order">{t('admin.paymentMethodSortOrder')}</Label>
              <Input
                id="pm-sort-order"
                type="number"
                value={form.sort_order}
                onChange={handleFieldChange('sort_order')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMethod(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={editMutation.isPending}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
