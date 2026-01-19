import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { jsonToCSV, downloadCSV } from '@/lib/csv-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Eye, Calendar, Filter, Mail, Phone, User, Inbox, Download } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers'

interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: 'new' | 'in_progress' | 'resolved' | 'spam'
  created_at: string
  updated_at: string
}

export default function ContactSubmissions() {
  const { t } = useTranslation()
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const queryClient = useQueryClient()

  // Build query parameters
  const queryParams = new URLSearchParams()
  if (statusFilter !== 'all') queryParams.append('status', statusFilter)
  if (startDate) queryParams.append('start_date', startDate)
  if (endDate) queryParams.append('end_date', endDate)

  // Fetch contact submissions
  const { data: contacts = [], isLoading } = useQuery<ContactSubmission[]>({
    queryKey: ['contactSubmissions', statusFilter, startDate, endDate],
    queryFn: async () => {
      const response = await apiClient.get<ContactSubmission[]>(`/admin/contacts?${queryParams.toString()}`)
      return response
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiClient.put<{ success: boolean; data: ContactSubmission }>(`/admin/contacts/${id}/status`, { status })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactSubmissions'] })
      showSuccessToast(t('admin.statusUpdateSuccess'))
    },
    onError: () => {
      showErrorToast(t('admin.statusUpdateError'))
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/contacts/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactSubmissions'] })
      showSuccessToast(t('admin.deleteSuccess'))
      setViewDialogOpen(false)
    },
    onError: () => {
      showErrorToast(t('admin.deleteError'))
    },
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'default'
      case 'in_progress':
        return 'secondary'
      case 'resolved':
        return 'outline'
      case 'spam':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return t('admin.statusNew')
      case 'in_progress':
        return t('admin.statusInProgress')
      case 'resolved':
        return t('admin.statusResolved')
      case 'spam':
        return t('admin.statusSpam')
      default:
        return status
    }
  }

  const handleViewContact = (contact: ContactSubmission) => {
    setSelectedContact(contact)
    setViewDialogOpen(true)
  }

  const handleUpdateStatus = (status: string) => {
    if (selectedContact) {
      updateStatusMutation.mutate({ id: selectedContact.id, status })
      setSelectedContact({ ...selectedContact, status: status as any })
    }
  }

  const handleDelete = () => {
    if (selectedContact && confirm(t('admin.confirmDelete'))) {
      deleteMutation.mutate(selectedContact.id)
    }
  }

  const handleExportCSV = () => {
    const csvData = jsonToCSV(contacts, [
      { key: 'created_at', label: t('admin.contactDate') },
      { key: 'name', label: t('admin.contactName') },
      { key: 'email', label: t('admin.contactEmail') },
      { key: 'phone', label: t('admin.contactPhone') },
      { key: 'subject', label: t('admin.contactSubject') },
      { key: 'message', label: t('admin.contactMessage') },
      { key: 'status', label: t('admin.contactStatus') },
    ])

    const timestamp = new Date().toISOString().split('T')[0]
    downloadCSV(csvData, `contact-submissions-${timestamp}`)
    showSuccessToast(t('admin.exportSuccess'))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.contactSubmissions')}</h1>
          <p className="text-muted-foreground">{t('admin.contactSubmissionsDesc')}</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" disabled={contacts.length === 0}>
          <Download size={16} className="mr-2" />
          {t('common.export')} CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="statusFilter" className="flex items-center gap-2">
            <Filter size={16} />
            {t('common.status')}
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="statusFilter" className="w-[180px]">
              <SelectValue placeholder={t('admin.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.allStatus')}</SelectItem>
              <SelectItem value="new">{t('admin.statusNew')}</SelectItem>
              <SelectItem value="in_progress">{t('admin.statusInProgress')}</SelectItem>
              <SelectItem value="resolved">{t('admin.statusResolved')}</SelectItem>
              <SelectItem value="spam">{t('admin.statusSpam')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate" className="flex items-center gap-2">
            <Calendar size={16} />
            {t('admin.fromDate')}
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[180px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">{t('admin.toDate')}</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[180px]"
          />
        </div>

        {(statusFilter !== 'all' || startDate || endDate) && (
          <Button
            variant="outline"
            onClick={() => {
              setStatusFilter('all')
              setStartDate('')
              setEndDate('')
            }}
          >
            {t('admin.resetFilter')}
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">{t('common.loading')}</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('admin.noContacts')}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.contactDate')}</TableHead>
                <TableHead>{t('admin.contactName')}</TableHead>
                <TableHead>{t('admin.contactEmail')}</TableHead>
                <TableHead>{t('admin.contactSubject')}</TableHead>
                <TableHead>{t('admin.contactStatus')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] p-0">
                    <EmptyState
                      icon={Inbox}
                      title={
                        statusFilter !== 'all'
                          ? t('admin.noContactsFiltered')
                          : t('admin.noContactsYet')
                      }
                      description={
                        statusFilter !== 'all'
                          ? t('admin.noContactsFilteredDesc')
                          : t('admin.noContactsYetDesc')
                      }
                      action={
                        statusFilter !== 'all'
                          ? {
                              label: t('admin.viewAllMessages'),
                              onClick: () => setStatusFilter('all'),
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    {format(new Date(contact.created_at), 'dd MMM yyyy HH:mm', {
                      locale: localeId,
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.subject}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(contact.status)}>
                      {getStatusLabel(contact.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewContact(contact)}
                    >
                      <Eye size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.contactDetail')}</DialogTitle>
            <DialogDescription>
              {t('admin.receivedOn')}{' '}
              {selectedContact &&
                format(new Date(selectedContact.created_at), 'dd MMMM yyyy HH:mm', {
                  locale: localeId,
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User size={16} />
                    {t('admin.contactName')}
                  </Label>
                  <p className="text-sm">{selectedContact.name}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail size={16} />
                    {t('admin.contactEmail')}
                  </Label>
                  <p className="text-sm">{selectedContact.email}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone size={16} />
                    {t('admin.contactPhone')}
                  </Label>
                  <p className="text-sm">{selectedContact.phone}</p>
                </div>

                <div className="space-y-2">
                  <Label>{t('admin.contactStatus')}</Label>
                  <Select
                    value={selectedContact.status}
                    onValueChange={handleUpdateStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">{t('admin.statusNew')}</SelectItem>
                      <SelectItem value="in_progress">{t('admin.statusInProgress')}</SelectItem>
                      <SelectItem value="resolved">{t('admin.statusResolved')}</SelectItem>
                      <SelectItem value="spam">{t('admin.statusSpam')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('admin.contactSubject')}</Label>
                <p className="text-sm font-medium">{selectedContact.subject}</p>
              </div>

              <div className="space-y-2">
                <Label>{t('admin.contactMessage')}</Label>
                <div className="border rounded-md p-4 bg-muted/50">
                  <p className="text-sm whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 size={16} className="mr-2" />
              {t('common.delete')}
            </Button>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
