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
import { Textarea } from '@/components/ui/textarea'
import {
  Trash2,
  Eye,
  Calendar,
  CalendarCheck,
  Clock,
  Filter,
  Mail,
  Phone,
  User,
  Users,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers'
import { Reservation, ReservationStatus } from '@/types'

interface ReservationsResponse {
  success: boolean
  data: Reservation[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export default function ReservationsManagement() {
  const { t } = useTranslation()
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [notes, setNotes] = useState<string>('')

  const queryClient = useQueryClient()

  // Build query parameters
  const queryParams = new URLSearchParams()
  if (statusFilter !== 'all') queryParams.append('status', statusFilter)
  if (dateFilter) queryParams.append('date', dateFilter)
  queryParams.append('page', String(page))
  queryParams.append('limit', '20')

  // Fetch reservations
  const { data: reservationsData, isLoading } = useQuery<ReservationsResponse>({
    queryKey: ['reservations', statusFilter, dateFilter, page],
    queryFn: async () => {
      const response = await apiClient.get<ReservationsResponse>(`/admin/reservations?${queryParams.toString()}`)
      return response
    },
  })

  const reservations = reservationsData?.data ?? []
  const pagination = reservationsData?.pagination
  const filtersActive = statusFilter !== 'all' || dateFilter !== ''

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: ReservationStatus; notes?: string | null }) => {
      const response = await apiClient.patch<{ success: boolean; message: string; data: Reservation }>(
        `/admin/reservations/${id}/status`,
        { status, notes }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      showSuccessToast(t('admin.reservationUpdateSuccess'))
    },
    onError: () => {
      showErrorToast(t('admin.reservationUpdateError'))
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete<{ success: boolean; message: string }>(`/admin/reservations/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      showSuccessToast(t('admin.reservationDeleteSuccess'))
      setViewDialogOpen(false)
    },
    onError: () => {
      showErrorToast(t('admin.reservationDeleteError'))
    },
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'confirmed':
        return 'default'
      case 'cancelled':
      case 'no_show':
        return 'destructive'
      case 'completed':
        return 'outline'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return t('admin.statusPending')
      case 'confirmed':
        return t('admin.statusConfirmed')
      case 'cancelled':
        return t('admin.statusCancelled')
      case 'completed':
        return t('admin.statusCompleted')
      case 'no_show':
        return t('admin.statusNoShow')
      default:
        return status
    }
  }

  const handleViewReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setNotes(reservation.notes || '')
    setViewDialogOpen(true)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value)
    setPage(1)
  }

  const resetFilters = () => {
    setStatusFilter('all')
    setDateFilter('')
    setPage(1)
  }

  const handleUpdateStatus = (status: string) => {
    if (selectedReservation) {
      updateStatusMutation.mutate({
        id: selectedReservation.id,
        status: status as ReservationStatus,
        notes: notes || null,
      })
      setSelectedReservation({ ...selectedReservation, status: status as ReservationStatus })
    }
  }

  const handleDelete = () => {
    if (selectedReservation && confirm(t('admin.reservationConfirmDelete'))) {
      deleteMutation.mutate(selectedReservation.id)
    }
  }

  const handleExportCSV = () => {
    const csvData = jsonToCSV(reservations, [
      { key: 'reservation_date', label: t('admin.reservationDate') },
      { key: 'reservation_time', label: t('admin.reservationTime') },
      { key: 'customer_name', label: t('admin.reservationName') },
      { key: 'email', label: t('admin.reservationEmail') },
      { key: 'phone', label: t('admin.reservationPhone') },
      { key: 'party_size', label: t('admin.reservationPartySize') },
      { key: 'status', label: t('admin.reservationStatus') },
      { key: 'special_requests', label: t('admin.reservationSpecialRequests') },
      { key: 'notes', label: t('admin.reservationNotes') },
    ])

    const timestamp = new Date().toISOString().split('T')[0]
    downloadCSV(csvData, `reservations-${timestamp}`)
    showSuccessToast(t('admin.exportSuccess'))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.reservationManagement')}</h1>
          <p className="text-muted-foreground">{t('admin.reservationManagementDesc')}</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" disabled={reservations.length === 0}>
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
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger id="statusFilter" className="w-[180px]">
              <SelectValue placeholder={t('admin.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.allStatus')}</SelectItem>
              <SelectItem value="pending">{t('admin.statusPending')}</SelectItem>
              <SelectItem value="confirmed">{t('admin.statusConfirmed')}</SelectItem>
              <SelectItem value="cancelled">{t('admin.statusCancelled')}</SelectItem>
              <SelectItem value="completed">{t('admin.statusCompleted')}</SelectItem>
              <SelectItem value="no_show">{t('admin.statusNoShow')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateFilter" className="flex items-center gap-2">
            <Calendar size={16} />
            {t('admin.reservationDate')}
          </Label>
          <Input
            id="dateFilter"
            type="date"
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(e.target.value)}
            className="w-[180px]"
          />
        </div>

        {filtersActive && (
          <Button variant="outline" onClick={resetFilters}>
            {t('admin.resetFilter')}
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">{t('common.loading')}</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.reservationDateTime')}</TableHead>
                <TableHead>{t('admin.reservationName')}</TableHead>
                <TableHead>{t('admin.reservationPartySize')}</TableHead>
                <TableHead>{t('admin.reservationEmail')}</TableHead>
                <TableHead>{t('admin.reservationStatus')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] p-0">
                    <EmptyState
                      icon={CalendarCheck}
                      title={filtersActive ? t('admin.noReservationsFiltered') : t('admin.noReservationsYet')}
                      description={
                        filtersActive
                          ? t('admin.noReservationsFilteredDesc')
                          : t('admin.noReservationsYetDesc')
                      }
                      action={
                        filtersActive
                          ? {
                              label: t('admin.viewAllReservations'),
                              onClick: resetFilters,
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      {format(
                        new Date(reservation.reservation_date + 'T' + reservation.reservation_time),
                        'dd MMM yyyy, HH:mm',
                        { locale: localeId }
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{reservation.customer_name}</TableCell>
                    <TableCell>{reservation.party_size}</TableCell>
                    <TableCell>{reservation.email}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(reservation.status)}>
                        {getStatusLabel(reservation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewReservation(reservation)}
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

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('admin.reservationsPageInfo', { page: pagination.page, total: pagination.total_pages })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} className="mr-2" />
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
            >
              {t('common.next')}
              <ChevronRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.reservationDetail')}</DialogTitle>
            <DialogDescription>
              {t('admin.receivedOn')}{' '}
              {selectedReservation &&
                format(new Date(selectedReservation.created_at), 'dd MMMM yyyy HH:mm', {
                  locale: localeId,
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User size={16} />
                    {t('admin.reservationName')}
                  </Label>
                  <p className="text-sm">{selectedReservation.customer_name}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail size={16} />
                    {t('admin.reservationEmail')}
                  </Label>
                  <p className="text-sm">{selectedReservation.email}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone size={16} />
                    {t('admin.reservationPhone')}
                  </Label>
                  <p className="text-sm">{selectedReservation.phone}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users size={16} />
                    {t('admin.reservationPartySize')}
                  </Label>
                  <p className="text-sm">{selectedReservation.party_size}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar size={16} />
                    {t('admin.reservationDate')}
                  </Label>
                  <p className="text-sm">
                    {format(new Date(selectedReservation.reservation_date), 'dd MMMM yyyy', {
                      locale: localeId,
                    })}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock size={16} />
                    {t('admin.reservationTime')}
                  </Label>
                  <p className="text-sm">{selectedReservation.reservation_time}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('admin.reservationStatus')}</Label>
                <Select value={selectedReservation.status} onValueChange={handleUpdateStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('admin.statusPending')}</SelectItem>
                    <SelectItem value="confirmed">{t('admin.statusConfirmed')}</SelectItem>
                    <SelectItem value="cancelled">{t('admin.statusCancelled')}</SelectItem>
                    <SelectItem value="completed">{t('admin.statusCompleted')}</SelectItem>
                    <SelectItem value="no_show">{t('admin.statusNoShow')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reservationNotes">{t('admin.reservationNotes')}</Label>
                <Textarea
                  id="reservationNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('admin.reservationNotesPlaceholder')}
                />
              </div>

              {selectedReservation.special_requests && (
                <div className="space-y-2">
                  <Label>{t('admin.reservationSpecialRequests')}</Label>
                  <div className="border rounded-md p-4 bg-muted/50">
                    <p className="text-sm whitespace-pre-wrap">{selectedReservation.special_requests}</p>
                  </div>
                </div>
              )}

              {(selectedReservation.confirmed_by || selectedReservation.confirmed_at) && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {selectedReservation.confirmed_by && (
                    <p>
                      {t('admin.reservationConfirmedBy')}: {selectedReservation.confirmed_by}
                    </p>
                  )}
                  {selectedReservation.confirmed_at && (
                    <p>
                      {t('admin.reservationConfirmedAt')}:{' '}
                      {format(new Date(selectedReservation.confirmed_at), 'dd MMMM yyyy HH:mm', {
                        locale: localeId,
                      })}
                    </p>
                  )}
                </div>
              )}
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
