/**
 * T035: ReservationForm component
 * Public reservation form with Zod validation and TanStack Query mutation
 * T063: Added XSS prevention via input sanitization
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Calendar, Clock, Mail, Phone, User, Users, MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { reservationSchema, type ReservationFormData } from '@/lib/form-schemas'
import { apiClient } from '@/api/client'
import { sanitizeReservationData } from '@/lib/sanitize'
import type { CreateReservationRequest, ReservationResponse } from '@/types'

interface ReservationFormProps {
  /** Custom class name */
  className?: string
  /** Callback on successful submission */
  onSuccess?: (response: ReservationResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Default form values */
  defaultValues?: Partial<ReservationFormData>
  /** Disable the form */
  disabled?: boolean
}

/**
 * Public reservation form component.
 * Allows customers to book a table at the restaurant.
 *
 * @example
 * ```tsx
 * <ReservationForm
 *   onSuccess={(response) => console.log('Reservation created:', response.id)}
 * />
 * ```
 */
export function ReservationForm({
  className,
  onSuccess,
  onError,
  defaultValues,
  disabled = false,
}: ReservationFormProps) {
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      customer_name: defaultValues?.customer_name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      party_size: defaultValues?.party_size || 2,
      reservation_date: defaultValues?.reservation_date || '',
      reservation_time: defaultValues?.reservation_time || '',
      special_requests: defaultValues?.special_requests || '',
    },
  })

  // Mutation for creating reservation
  const mutation = useMutation({
    mutationFn: async (data: CreateReservationRequest) => {
      return apiClient.createReservation(data)
    },
    onSuccess: (response) => {
      setSubmitSuccess(true)
      reset()
      onSuccess?.(response)
    },
    onError: (error: Error) => {
      onError?.(error)
    },
  })

  const onSubmit = (data: ReservationFormData) => {
    // Sanitize input data to prevent XSS attacks (T063)
    const sanitized = sanitizeReservationData(data)
    
    // Convert form data to API request format
    const requestData: CreateReservationRequest = {
      customer_name: sanitized.customer_name,
      email: sanitized.email,
      phone: sanitized.phone,
      party_size: sanitized.party_size,
      reservation_date: sanitized.reservation_date,
      reservation_time: sanitized.reservation_time,
      special_requests: sanitized.special_requests || undefined,
    }
    mutation.mutate(requestData)
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  // Success state
  if (submitSuccess) {
    return (
      <div
        data-testid="reservation-form"
        className={cn(
          'public-card p-8 text-center',
          className
        )}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500" aria-hidden="true" />
        </div>
        <h3 className="text-2xl font-semibold text-[var(--public-text-primary)] mb-4">
          Reservation Request Received!
        </h3>
        <p className="text-[var(--public-text-secondary)] mb-6">
          Thank you for your reservation request. We will confirm your booking shortly via email.
        </p>
        <Button
          onClick={() => setSubmitSuccess(false)}
          className="bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)] text-white"
          aria-label="Make another reservation"
        >
          Make Another Reservation
        </Button>
      </div>
    )
  }

  return (
    <form
      data-testid="reservation-form"
      onSubmit={handleSubmit(onSubmit)}
      className={cn('public-form space-y-6', className)}
    >
      {/* Error message - T067: Added aria-live for screen reader announcements */}
      {mutation.isError && (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span>Failed to submit reservation. Please try again.</span>
        </div>
      )}

      {/* Name Field */}
      <div className="space-y-2">
        <Label
          htmlFor="customer_name"
          className="text-[var(--public-text-primary)] font-medium flex items-center gap-2"
        >
          <User className="h-4 w-4 text-[var(--public-accent)]" />
          Full Name *
        </Label>
        <Input
          id="customer_name"
          type="text"
          {...register('customer_name')}
          placeholder="John Doe"
          className={cn(
            'public-input',
            errors.customer_name && 'border-red-500 focus:ring-red-500'
          )}
          aria-invalid={!!errors.customer_name}
          aria-describedby={errors.customer_name ? 'error-customer_name' : undefined}
          disabled={disabled || mutation.isPending}
        />
        {errors.customer_name && (
          <p
            id="error-customer_name"
            data-testid="error-customer_name"
            role="alert"
            className="text-sm text-red-500"
          >
            {errors.customer_name.message}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-[var(--public-text-primary)] font-medium flex items-center gap-2"
        >
          <Mail className="h-4 w-4 text-[var(--public-accent)]" />
          Email Address *
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="john@example.com"
          className={cn(
            'public-input',
            errors.email && 'border-red-500 focus:ring-red-500'
          )}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'error-email' : undefined}
          disabled={disabled || mutation.isPending}
        />
        {errors.email && (
          <p
            id="error-email"
            data-testid="error-email"
            role="alert"
            className="text-sm text-red-500"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Phone Field */}
      <div className="space-y-2">
        <Label
          htmlFor="phone"
          className="text-[var(--public-text-primary)] font-medium flex items-center gap-2"
        >
          <Phone className="h-4 w-4 text-[var(--public-accent)]" />
          Phone Number *
        </Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="+62 812 3456 7890"
          className={cn(
            'public-input',
            errors.phone && 'border-red-500 focus:ring-red-500'
          )}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'error-phone' : undefined}
          disabled={disabled || mutation.isPending}
        />
        {errors.phone && (
          <p
            id="error-phone"
            data-testid="error-phone"
            role="alert"
            className="text-sm text-red-500"
          >
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Party Size Field */}
      <div className="space-y-2">
        <Label
          htmlFor="party_size"
          className="text-[var(--public-text-primary)] font-medium flex items-center gap-2"
        >
          <Users className="h-4 w-4 text-[var(--public-accent)]" />
          Number of Guests *
        </Label>
        <Input
          id="party_size"
          type="number"
          {...register('party_size', { valueAsNumber: true })}
          min={1}
          max={20}
          placeholder="2"
          className={cn(
            'public-input',
            errors.party_size && 'border-red-500 focus:ring-red-500'
          )}
          aria-invalid={!!errors.party_size}
          aria-describedby={errors.party_size ? 'error-party_size' : undefined}
          disabled={disabled || mutation.isPending}
        />
        {errors.party_size && (
          <p
            id="error-party_size"
            data-testid="error-party_size"
            role="alert"
            className="text-sm text-red-500"
          >
            {errors.party_size.message}
          </p>
        )}
      </div>

      {/* Date and Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date Field */}
        <div className="space-y-2">
          <Label
            htmlFor="reservation_date"
            className="text-[var(--public-text-primary)] font-medium flex items-center gap-2"
          >
            <Calendar className="h-4 w-4 text-[var(--public-accent)]" />
            Date *
          </Label>
          <Input
            id="reservation_date"
            type="date"
            {...register('reservation_date')}
            min={today}
            className={cn(
              'public-input',
              errors.reservation_date && 'border-red-500 focus:ring-red-500'
            )}
            aria-invalid={!!errors.reservation_date}
            aria-describedby={errors.reservation_date ? 'error-reservation_date' : undefined}
            disabled={disabled || mutation.isPending}
          />
          {errors.reservation_date && (
            <p
              id="error-reservation_date"
              data-testid="error-reservation_date"
              role="alert"
              className="text-sm text-red-500"
            >
              {errors.reservation_date.message}
            </p>
          )}
        </div>

        {/* Time Field */}
        <div className="space-y-2">
          <Label
            htmlFor="reservation_time"
            className="text-[var(--public-text-primary)] font-medium flex items-center gap-2"
          >
            <Clock className="h-4 w-4 text-[var(--public-accent)]" />
            Time *
          </Label>
          <Input
            id="reservation_time"
            type="time"
            {...register('reservation_time')}
            className={cn(
              'public-input',
              errors.reservation_time && 'border-red-500 focus:ring-red-500'
            )}
            aria-invalid={!!errors.reservation_time}
            aria-describedby={errors.reservation_time ? 'error-reservation_time' : undefined}
            disabled={disabled || mutation.isPending}
          />
          {errors.reservation_time && (
            <p
              id="error-reservation_time"
              data-testid="error-reservation_time"
              role="alert"
              className="text-sm text-red-500"
            >
              {errors.reservation_time.message}
            </p>
          )}
        </div>
      </div>

      {/* Special Requests Field */}
      <div className="space-y-2">
        <Label
          htmlFor="special_requests"
          className="text-[var(--public-text-primary)] font-medium flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4 text-[var(--public-accent)]" />
          Special Requests (optional)
        </Label>
        <Textarea
          id="special_requests"
          {...register('special_requests')}
          placeholder="Any dietary requirements, occasion, or special requests..."
          rows={4}
          maxLength={500}
          className={cn(
            'public-input resize-none',
            errors.special_requests && 'border-red-500 focus:ring-red-500'
          )}
          aria-invalid={!!errors.special_requests}
          aria-describedby={errors.special_requests ? 'error-special_requests' : undefined}
          disabled={disabled || mutation.isPending}
        />
        {errors.special_requests && (
          <p
            id="error-special_requests"
            data-testid="error-special_requests"
            role="alert"
            className="text-sm text-red-500"
          >
            {errors.special_requests.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        disabled={disabled || mutation.isPending}
        className={cn(
          'w-full py-6 text-lg font-semibold',
          'bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)]',
          'text-white shadow-lg hover:shadow-xl',
          'transition-all duration-300'
        )}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Calendar className="mr-2 h-5 w-5" />
            Book Your Table
          </>
        )}
      </Button>

      {/* Terms notice */}
      <p className="text-sm text-[var(--public-text-muted)] text-center">
        By submitting this form, you agree to our reservation policy.
        We will contact you to confirm your booking.
      </p>
    </form>
  )
}

export default ReservationForm
