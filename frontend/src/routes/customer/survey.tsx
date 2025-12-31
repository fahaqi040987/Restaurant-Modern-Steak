import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SurveyForm } from '@/components/customer/SurveyForm'
import apiClient from '@/api/client'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const Route = createFileRoute('/customer/survey')({
  component: SurveyPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      order_id: (search.order_id as string) || '',
    }
  },
})

function SurveyPage() {
  const navigate = useNavigate()
  const { order_id } = Route.useSearch()

  // Fetch order details to show order number
  const { data: orderData, isLoading, isError } = useQuery({
    queryKey: ['order', order_id],
    queryFn: () => apiClient.getOrder(order_id).then(res => res.data),
    enabled: !!order_id,
  })

  const handleSurveySuccess = () => {
    // Navigate to thank you page or homepage after 2 seconds
    setTimeout(() => {
      navigate({ to: '/' })
    }, 2000)
  }

  if (!order_id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Order ID is required. Please access this page from a valid order link.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading order details...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError || !orderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load order details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Bagaimana pengalaman Anda?
          </CardTitle>
          <p className="text-center text-muted-foreground mt-2">
            Pesanan #{orderData.order_number}
          </p>
        </CardHeader>
        <CardContent>
          <SurveyForm 
            orderId={order_id} 
            onSuccess={handleSurveySuccess}
          />
        </CardContent>
      </Card>
    </div>
  )
}
