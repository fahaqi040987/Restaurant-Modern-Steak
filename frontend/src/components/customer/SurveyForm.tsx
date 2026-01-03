/**
 * T081: SurveyForm Component
 * Customer satisfaction survey form component
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Star, Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { apiClient } from '@/api/client'
import type { CreateSurveyRequest } from '@/types'

const surveySchema = z.object({
  food_rating: z.number().min(1, 'Berikan rating untuk makanan').max(5),
  service_rating: z.number().min(1, 'Berikan rating untuk pelayanan').max(5),
  ambiance_rating: z.number().min(1, 'Berikan rating untuk suasana').max(5),
  comments: z.string().max(1000, 'Komentar maksimal 1000 karakter').optional(),
})

type SurveyFormData = z.infer<typeof surveySchema>

interface SurveyFormProps {
  /** Order ID for the survey */
  orderId: string
  /** Callback on successful submission */
  onSuccess?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Custom class name */
  className?: string
}

const ratingCategories = [
  { key: 'food_rating' as const, label: 'Kualitas Makanan', icon: '🍽️' },
  { key: 'service_rating' as const, label: 'Pelayanan', icon: '👨‍🍳' },
  { key: 'ambiance_rating' as const, label: 'Suasana', icon: '🏠' },
]

/**
 * Customer satisfaction survey form component.
 * Allows customers to rate their dining experience across multiple categories.
 *
 * @example
 * ```tsx
 * <SurveyForm
 *   orderId="order-123"
 *   onSuccess={() => console.log('Survey submitted!')}
 * />
 * ```
 */
export function SurveyForm({ orderId, onSuccess, onError, className }: SurveyFormProps) {
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [hoveredRatings, setHoveredRatings] = useState<Record<string, number>>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      food_rating: 0,
      service_rating: 0,
      ambiance_rating: 0,
      comments: '',
    },
  })

  const foodRating = watch('food_rating')
  const serviceRating = watch('service_rating')
  const ambianceRating = watch('ambiance_rating')

  const ratings = {
    food_rating: foodRating,
    service_rating: serviceRating,
    ambiance_rating: ambianceRating,
  }

  // Mutation for submitting survey
  const mutation = useMutation({
    mutationFn: async (data: SurveyFormData) => {
      const request: CreateSurveyRequest = {
        overall_rating: data.food_rating, // Use food rating as overall
        food_quality: data.food_rating,
        service_quality: data.service_rating,
        ambiance: data.ambiance_rating,
        comments: data.comments,
      }
      return apiClient.createSurvey(orderId, request)
    },
    onSuccess: () => {
      setSubmitSuccess(true)
      onSuccess?.()
    },
    onError: (error: Error) => {
      onError?.(error)
    },
  })

  const onSubmit = (data: SurveyFormData) => {
    mutation.mutate(data)
  }

  const StarRating = ({
    category,
    value,
    onChange,
  }: {
    category: keyof SurveyFormData
    value: number
    onChange: (value: number) => void
  }) => {
    const hoveredValue = hoveredRatings[category] || 0

    return (
      <div className="flex gap-2" role="radiogroup" aria-label={`Rating untuk ${category}`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (hoveredValue || value)

          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoveredRatings({ ...hoveredRatings, [category]: star })}
              onMouseLeave={() => setHoveredRatings({ ...hoveredRatings, [category]: 0 })}
              className={cn(
                'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--public-accent)] rounded',
                'hover:scale-110'
              )}
              aria-label={`${star} bintang`}
              role="radio"
              aria-checked={value === star}
            >
              <Star
                className={cn(
                  'h-8 w-8 transition-colors',
                  isFilled
                    ? 'fill-[var(--public-accent)] text-[var(--public-accent)]'
                    : 'text-[var(--public-border)] hover:text-[var(--public-accent)]'
                )}
              />
            </button>
          )
        })}
      </div>
    )
  }

  // Success state
  if (submitSuccess) {
    return (
      <Card
        className={cn('p-8 text-center', className)}
        role="status"
        aria-live="polite"
        data-testid="survey-success"
      >
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500" aria-hidden="true" />
        </div>
        <h3 className="text-2xl font-semibold text-[var(--public-text-primary)] mb-4">
          Terima Kasih!
        </h3>
        <p className="text-[var(--public-text-secondary)] mb-6">
          Feedback Anda sangat berharga bagi kami untuk terus meningkatkan kualitas layanan.
        </p>
      </Card>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-6', className)}
      data-testid="survey-form"
    >
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-[var(--public-text-primary)] mb-2">
          Berikan Penilaian Anda
        </h3>
        <p className="text-sm text-[var(--public-text-secondary)] mb-6">
          Bagaimana pengalaman Anda di restoran kami?
        </p>

        {/* Error message */}
        {mutation.isError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <span>Gagal mengirim survey. Silakan coba lagi.</span>
          </div>
        )}

        {/* Rating categories */}
        <div className="space-y-6">
          {ratingCategories.map((category) => (
            <div key={category.key} className="space-y-3">
              <Label className="text-[var(--public-text-primary)] font-medium flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">
                  {category.icon}
                </span>
                {category.label}
                <span className="text-red-500">*</span>
              </Label>
              <StarRating
                category={category.key}
                value={ratings[category.key]}
                onChange={(value) => setValue(category.key, value)}
              />
              {errors[category.key] && (
                <p className="text-sm text-red-500" role="alert">
                  {errors[category.key]?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Comments */}
        <div className="mt-6 space-y-2">
          <Label htmlFor="comments" className="text-[var(--public-text-primary)] font-medium">
            Komentar Tambahan (Opsional)
          </Label>
          <Textarea
            id="comments"
            {...register('comments')}
            placeholder="Ceritakan pengalaman Anda atau berikan saran untuk kami..."
            rows={4}
            maxLength={1000}
            className={cn(
              'resize-none',
              errors.comments && 'border-red-500 focus:ring-red-500'
            )}
            aria-invalid={!!errors.comments}
            aria-describedby={errors.comments ? 'error-comments' : undefined}
          />
          {errors.comments && (
            <p id="error-comments" className="text-sm text-red-500" role="alert">
              {errors.comments.message}
            </p>
          )}
          <p className="text-xs text-[var(--public-text-muted)] text-right">
            {watch('comments')?.length || 0} / 1000
          </p>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className={cn(
            'w-full mt-6 py-6 text-lg font-semibold',
            'bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)]',
            'text-white shadow-lg hover:shadow-xl',
            'transition-all duration-300'
          )}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Mengirim...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Kirim Penilaian
            </>
          )}
        </Button>
      </Card>
    </form>
  )
}

export default SurveyForm
