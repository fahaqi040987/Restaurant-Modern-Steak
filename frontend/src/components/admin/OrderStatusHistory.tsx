import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowRight, User } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface OrderStatusHistoryRecord {
  id: string
  order_id: string
  previous_status: string
  new_status: string
  changed_by: string
  notes: string
  created_at: string
}

interface OrderStatusHistoryProps {
  orderId: string
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return 'secondary'
    case 'preparing':
      return 'default'
    case 'ready':
      return 'outline'
    case 'completed':
      return 'outline'
    case 'cancelled':
      return 'destructive'
    default:
      return 'default'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Menunggu'
    case 'preparing':
      return 'Diproses'
    case 'ready':
      return 'Siap'
    case 'completed':
      return 'Selesai'
    case 'cancelled':
      return 'Dibatalkan'
    default:
      return status
  }
}

const getStatusIcon = (status: string) => {
  // Different visual indicators for each status
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500',
    preparing: 'bg-blue-500',
    ready: 'bg-green-500',
    completed: 'bg-gray-500',
    cancelled: 'bg-red-500',
  }
  return colors[status] || 'bg-gray-400'
}

export function OrderStatusHistory({ orderId }: OrderStatusHistoryProps) {
  const { data: history = [], isLoading } = useQuery<OrderStatusHistoryRecord[]>({
    queryKey: ['orderStatusHistory', orderId],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${orderId}/status-history`)
      return response.data
    },
    enabled: !!orderId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>Belum ada riwayat status</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Clock size={18} />
        Riwayat Status Pesanan
      </h3>
      
      <div className="relative border-l-2 border-muted ml-4 pl-6 space-y-6">
        {history.map((record, index) => (
          <div key={record.id} className="relative">
            {/* Timeline dot */}
            <div
              className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-background ${getStatusIcon(
                record.new_status
              )}`}
            ></div>

            <div className="space-y-1">
              {/* Status change */}
              <div className="flex items-center gap-2 flex-wrap">
                {record.previous_status && (
                  <>
                    <Badge variant={getStatusBadgeVariant(record.previous_status)}>
                      {getStatusLabel(record.previous_status)}
                    </Badge>
                    <ArrowRight size={16} className="text-muted-foreground" />
                  </>
                )}
                <Badge variant={getStatusBadgeVariant(record.new_status)}>
                  {getStatusLabel(record.new_status)}
                </Badge>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>{record.changed_by}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>
                    {format(new Date(record.created_at), 'dd MMM yyyy, HH:mm', {
                      locale: localeId,
                    })}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {record.notes && (
                <p className="text-sm italic text-muted-foreground mt-2">
                  "{record.notes}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
