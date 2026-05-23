import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  ImagePlus,
  BarChart3,
  Link2,
  Loader2,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import apiClient from '@/api/client'
import type { BioLink, BioLinkProfile, BioLinkClickAnalytics } from '@/types'

function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads')) {
    const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8080/api/v1'
    return `${apiUrl.replace('/api/v1', '')}${url}`
  }
  return url
}

export function AdminBioLinksManagement() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editingLink, setEditingLink] = useState<BioLink | null>(null)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [analyticsLink, setAnalyticsLink] = useState<BioLink | null>(null)

  // Profile query
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['bioLinkProfile'],
    queryFn: async () => {
      const res = await apiClient.getBioLinkProfile()
      return res.data as BioLinkProfile | undefined
    },
  })

  // Links query
  const { data: linksData, isLoading: linksLoading } = useQuery({
    queryKey: ['bioLinks'],
    queryFn: async () => {
      const res = await apiClient.getBioLinks()
      return (res.data as BioLink[]) || []
    },
  })

  // Analytics query
  const { data: analyticsData } = useQuery({
    queryKey: ['bioLinkAnalytics', analyticsLink?.id],
    queryFn: async () => {
      if (!analyticsLink) return null
      const res = await apiClient.getBioLinkAnalytics(analyticsLink.id)
      return res.data as { link: { id: string; title: string; click_count: number }; daily_clicks: BioLinkClickAnalytics[] } | undefined
    },
    enabled: !!analyticsLink,
  })

  // Profile mutations
  const updateProfile = useMutation({
    mutationFn: (data: Partial<BioLinkProfile>) => apiClient.updateBioLinkProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bioLinkProfile'] })
      queryClient.invalidateQueries({ queryKey: ['publicBioLinks'] })
    },
  })

  // Link mutations
  const createLink = useMutation({
    mutationFn: (data: { title: string; url: string; icon?: string; is_active?: boolean }) =>
      apiClient.createBioLink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bioLinks'] })
      queryClient.invalidateQueries({ queryKey: ['publicBioLinks'] })
      setIsLinkDialogOpen(false)
    },
  })

  const updateLink = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; url?: string; icon?: string; is_active?: boolean; sort_order?: number } }) =>
      apiClient.updateBioLink(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bioLinks'] })
      queryClient.invalidateQueries({ queryKey: ['publicBioLinks'] })
      setEditingLink(null)
      setIsLinkDialogOpen(false)
    },
  })

  const deleteLink = useMutation({
    mutationFn: (id: string) => apiClient.deleteBioLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bioLinks'] })
      queryClient.invalidateQueries({ queryKey: ['publicBioLinks'] })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) =>
      apiClient.reorderBioLinks(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bioLinks'] })
      queryClient.invalidateQueries({ queryKey: ['publicBioLinks'] })
    },
  })

  const profile = profileData
  const links = linksData || []

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    const newLinks = [...links]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newLinks.length) return
    ;[newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]]
    reorderMutation.mutate(
      newLinks.map((link, i) => ({ id: link.id, sort_order: i }))
    )
  }

  const openEditDialog = (link: BioLink) => {
    setEditingLink(link)
    setIsLinkDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingLink(null)
    setIsLinkDialogOpen(true)
  }

  const maxClicks = analyticsData?.daily_clicks
    ? Math.max(...analyticsData.daily_clicks.map((d) => d.clicks), 1)
    : 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.bioLinks')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.bioLinksDescription')}</p>
        </div>
        <a
          href="/links"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          {t('admin.bioLinksViewPage')} <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <Tabs defaultValue="links">
        <TabsList>
          <TabsTrigger value="links">{t('admin.bioLinksManageLinks')}</TabsTrigger>
          <TabsTrigger value="profile">{t('admin.bioLinksProfile')}</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={openAddDialog} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.bioLinksAddLink')}
            </Button>
          </div>

          {linksLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <EmptyState
              icon={Link2}
              title={t('admin.bioLinksAddLink')}
              description="Start by adding your first link button"
              action={{
                label: t('admin.bioLinksAddLink'),
                onClick: openAddDialog,
              }}
            />
          ) : (
            <div className="space-y-2">
              {links.map((link, index) => (
                <Card key={link.id}>
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => handleMoveLink(index, 'up')}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === links.length - 1}
                        onClick={() => handleMoveLink(index, 'down')}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{link.title}</span>
                        <Badge variant={link.is_active ? 'default' : 'secondary'} className="text-xs">
                          {link.is_active ? t('admin.bioLinksActive') : t('admin.bioLinksInactive')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    </div>

                    <button
                      onClick={() => setAnalyticsLink(link)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      {link.click_count}
                    </button>

                    <Switch
                      checked={link.is_active}
                      onCheckedChange={(checked) =>
                        updateLink.mutate({ id: link.id, data: { is_active: checked } })
                      }
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(link)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Link</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                          Delete "{link.title}"? This action cannot be undone.
                        </p>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() => deleteLink.mutate(link.id)}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          {profileLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ProfileForm
              profile={profile || undefined}
              onSave={(data) => updateProfile.mutate(data)}
              isSaving={updateProfile.isPending}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Link Create/Edit Dialog */}
      <LinkDialog
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        link={editingLink}
        onSave={(data) => {
          if (editingLink) {
            updateLink.mutate({ id: editingLink.id, data })
          } else {
            createLink.mutate(data as { title: string; url: string; icon?: string; is_active?: boolean })
          }
        }}
        isSaving={createLink.isPending || updateLink.isPending}
      />

      {/* Analytics Dialog */}
      <Dialog open={!!analyticsLink} onOpenChange={(open) => !open && setAnalyticsLink(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {analyticsLink?.title} — Click Analytics
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{analyticsLink?.click_count || 0}</p>
              <p className="text-xs text-muted-foreground">total clicks</p>
            </div>
            {analyticsData?.daily_clicks && analyticsData.daily_clicks.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground mb-2">Last 30 days</p>
                {analyticsData.daily_clicks.map((day) => (
                  <div key={day.date} className="flex items-center gap-2 text-xs">
                    <span className="w-20 text-muted-foreground flex-shrink-0">{day.date}</span>
                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(day.clicks / maxClicks) * 100}%`,
                          backgroundColor: profile?.theme_color || '#e5612f',
                        }}
                      />
                    </div>
                    <span className="w-6 text-right font-medium">{day.clicks}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No click data yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Profile Form Sub-component ────────────────────────────────────────────────

function ProfileForm({
  profile,
  onSave,
  isSaving,
}: {
  profile?: BioLinkProfile
  onSave: (data: Partial<BioLinkProfile>) => void
  isSaving: boolean
}) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    account_name: profile?.account_name || '',
    bio_text: profile?.bio_text || '',
    avatar_url: profile?.avatar_url || '',
    theme_color: profile?.theme_color || '#e5612f',
    noindex: profile?.noindex !== undefined ? profile.noindex : true,
  })
  const [uploading, setUploading] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await apiClient.uploadImage(file)
      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, avatar_url: res.data!.url }))
      }
    } catch {
      // Upload failure handled silently
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.bioLinksProfile')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 bg-muted flex items-center justify-center flex-shrink-0">
            {getImageUrl(formData.avatar_url) ? (
              <img
                src={getImageUrl(formData.avatar_url) || undefined}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                {formData.account_name?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : t('admin.bioLinksAvatar')}
            </Button>
          </div>
        </div>

        {/* Account Name */}
        <div>
          <label className="text-sm font-medium">{t('admin.bioLinksAccountName')}</label>
          <Input
            value={formData.account_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, account_name: e.target.value }))}
            placeholder="Steak Kenangan"
          />
        </div>

        {/* Bio Text */}
        <div>
          <label className="text-sm font-medium">{t('admin.bioLinksBioText')}</label>
          <textarea
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.bio_text}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio_text: e.target.value }))}
            placeholder="Premium steaks crafted with passion"
          />
        </div>

        {/* Theme Color */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">{t('admin.bioLinksThemeColor')}</label>
          <input
            type="color"
            value={formData.theme_color}
            onChange={(e) => setFormData((prev) => ({ ...prev, theme_color: e.target.value }))}
            className="w-10 h-10 rounded border cursor-pointer"
          />
          <span className="text-sm text-muted-foreground">{formData.theme_color}</span>
        </div>

        {/* Noindex Toggle */}
        <div className="flex items-center gap-3">
          <Switch
            checked={formData.noindex}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, noindex: checked }))
            }
          />
          <label className="text-sm">{t('admin.bioLinksSeoNoindex')}</label>
        </div>

        <Button
          onClick={() => onSave(formData)}
          disabled={isSaving || !formData.account_name}
        >
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t('admin.bioLinksSaveProfile')}
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Link Dialog Sub-component ─────────────────────────────────────────────────

function LinkDialog({
  open,
  onOpenChange,
  link,
  onSave,
  isSaving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  link: BioLink | null
  onSave: (data: { title?: string; url?: string; icon?: string; is_active?: boolean }) => void
  isSaving: boolean
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    title: '',
    url: '',
    icon: '',
    is_active: true,
  })

  // Reset form when link changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && link) {
      setForm({
        title: link.title,
        url: link.url,
        icon: link.icon || '',
        is_active: link.is_active,
      })
    } else if (newOpen && !link) {
      setForm({ title: '', url: '', icon: '', is_active: true })
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.url) return
    onSave({
      title: form.title,
      url: form.url,
      icon: form.icon || undefined,
      is_active: form.is_active,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {link ? t('admin.bioLinksEditLink') : t('admin.bioLinksAddLink')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('admin.bioLinksLinkTitle')}</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Promo Terbaru"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('admin.bioLinksLinkUrl')}</label>
            <Input
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              required
              type="url"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('admin.bioLinksLinkIcon')}</label>
            <Input
              value={form.icon}
              onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
              placeholder="gift, tag, message-circle (optional)"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, is_active: checked }))
              }
            />
            <label className="text-sm">
              {form.is_active ? t('admin.bioLinksActive') : t('admin.bioLinksInactive')}
            </label>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving || !form.title || !form.url}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {link ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
