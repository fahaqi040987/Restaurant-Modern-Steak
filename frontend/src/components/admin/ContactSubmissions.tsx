import { useState } from 'react'
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
      const response = await apiClient.get(`/admin/contacts?${queryParams.toString()}`)
      return response.data
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiClient.put(`/admin/contacts/${id}/status`, { status })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactSubmissions'] })
      showSuccessToast('Status berhasil diperbarui')
    },
    onError: () => {
      showErrorToast('Gagal memperbarui status')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/contacts/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactSubmissions'] })
      showSuccessToast('Pesan berhasil dihapus')
      setViewDialogOpen(false)
    },
    onError: () => {
      showErrorToast('Gagal menghapus pesan')
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
        return 'Baru'
      case 'in_progress':
        return 'Diproses'
      case 'resolved':
        return 'Selesai'
      case 'spam':
        return 'Spam'
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
    if (selectedContact && confirm('Yakin ingin menghapus pesan ini?')) {
      deleteMutation.mutate(selectedContact.id)
    }
  }

  const handleExportCSV = () => {
    const csvData = jsonToCSV(contacts, [
      { key: 'created_at', label: 'Tanggal' },
      { key: 'name', label: 'Nama' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telepon' },
      { key: 'subject', label: 'Subjek' },
      { key: 'message', label: 'Pesan' },
      { key: 'status', label: 'Status' },
    ])
    
    const timestamp = new Date().toISOString().split('T')[0]
    downloadCSV(csvData, `contact-submissions-${timestamp}`)
    showSuccessToast('Data berhasil diekspor ke CSV')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pesan Kontak</h1>
          <p className="text-muted-foreground">Kelola pesan dari formulir kontak</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" disabled={contacts.length === 0}>
          <Download size={16} className="mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="statusFilter" className="flex items-center gap-2">
            <Filter size={16} />
            Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="statusFilter" className="w-[180px]">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="new">Baru</SelectItem>
              <SelectItem value="in_progress">Diproses</SelectItem>
              <SelectItem value="resolved">Selesai</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate" className="flex items-center gap-2">
            <Calendar size={16} />
            Dari Tanggal
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
          <Label htmlFor="endDate">Sampai Tanggal</Label>
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
            Reset Filter
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Tidak ada pesan kontak
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subjek</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
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
                          ? 'Tidak ada pesan dengan status ini'
                          : 'Belum ada pesan kontak'
                      }
                      description={
                        statusFilter !== 'all'
                          ? 'Tidak ada pesan kontak yang cocok dengan filter status. Coba pilih status lain.'
                          : 'Pesan dari formulir kontak website akan muncul di sini. Anda akan mendapat notifikasi saat ada pesan baru.'
                      }
                      action={
                        statusFilter !== 'all'
                          ? {
                              label: 'Lihat Semua Pesan',
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
            <DialogTitle>Detail Pesan Kontak</DialogTitle>
            <DialogDescription>
              Diterima pada{' '}
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
                    Nama
                  </Label>
                  <p className="text-sm">{selectedContact.name}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail size={16} />
                    Email
                  </Label>
                  <p className="text-sm">{selectedContact.email}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone size={16} />
                    Telepon
                  </Label>
                  <p className="text-sm">{selectedContact.phone}</p>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={selectedContact.status}
                    onValueChange={handleUpdateStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Baru</SelectItem>
                      <SelectItem value="in_progress">Diproses</SelectItem>
                      <SelectItem value="resolved">Selesai</SelectItem>
                      <SelectItem value="spam">Spam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subjek</Label>
                <p className="text-sm font-medium">{selectedContact.subject}</p>
              </div>

              <div className="space-y-2">
                <Label>Pesan</Label>
                <div className="border rounded-md p-4 bg-muted/50">
                  <p className="text-sm whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 size={16} className="mr-2" />
              Hapus
            </Button>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
