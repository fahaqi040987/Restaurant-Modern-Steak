import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function useFranchiseSchema() {
  const { t } = useTranslation()
  return z.object({
    name: z.string().min(1, t('franchise.apply.validation.nameRequired')),
    email: z.string().min(1, t('franchise.apply.validation.emailRequired')).email(t('franchise.apply.validation.emailInvalid')),
    phone: z.string().min(1, t('franchise.apply.validation.phoneRequired')).regex(/^[+]?[\d\s\-()]{8,15}$/, t('franchise.apply.validation.phoneInvalid')),
    location: z.string().min(1, t('franchise.apply.validation.locationRequired')),
    message: z.string().optional(),
  })
}

type FranchiseFormData = z.infer<ReturnType<typeof useFranchiseSchema>>

export function ApplicationForm() {
  const { t } = useTranslation()
  const schema = useFranchiseSchema()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FranchiseFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (_data: FranchiseFormData) => {
    // Phase 1: simulate submission with delay
    // Phase 2: send to backend API
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-[var(--public-accent)] mx-auto mb-4" aria-hidden="true" />
        <h3
          className="text-2xl font-bold text-[var(--public-text-primary)] mb-2"
          style={{ fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}
        >
          {t('franchise.apply.success')}
        </h3>
        <p className="text-[var(--public-text-secondary)] max-w-md mx-auto">
          {t('franchise.apply.successMessage')}
        </p>
      </div>
    )
  }

  const inputClasses = cn(
    'w-full px-4 py-3 rounded-lg',
    'bg-[var(--public-bg-elevated)] border border-[var(--public-border)]',
    'text-[var(--public-text-primary)] placeholder:text-[var(--public-text-muted)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--public-accent)] focus:border-transparent',
    'transition-[border-color,box-shadow] duration-200'
  )

  const labelClasses = 'block text-sm font-medium text-[var(--public-text-secondary)] mb-2'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Full Name */}
      <div>
        <label htmlFor="franchise-name" className={labelClasses}>
          {t('franchise.apply.name')}
        </label>
        <input
          id="franchise-name"
          type="text"
          placeholder={t('franchise.apply.namePlaceholder')}
          className={cn(inputClasses, errors.name && 'border-red-500')}
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="franchise-email" className={labelClasses}>
          {t('franchise.apply.email')}
        </label>
        <input
          id="franchise-email"
          type="email"
          placeholder={t('franchise.apply.emailPlaceholder')}
          className={cn(inputClasses, errors.email && 'border-red-500')}
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="franchise-phone" className={labelClasses}>
          {t('franchise.apply.phone')}
        </label>
        <input
          id="franchise-phone"
          type="tel"
          placeholder={t('franchise.apply.phonePlaceholder')}
          className={cn(inputClasses, errors.phone && 'border-red-500')}
          {...register('phone')}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="franchise-location" className={labelClasses}>
          {t('franchise.apply.location')}
        </label>
        <input
          id="franchise-location"
          type="text"
          placeholder={t('franchise.apply.locationPlaceholder')}
          className={cn(inputClasses, errors.location && 'border-red-500')}
          {...register('location')}
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-400">{errors.location.message}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="franchise-message" className={labelClasses}>
          {t('franchise.apply.message')}
        </label>
        <textarea
          id="franchise-message"
          rows={4}
          placeholder={t('franchise.apply.messagePlaceholder')}
          className={cn(inputClasses, 'resize-none')}
          {...register('message')}
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'w-full py-6 text-lg font-semibold',
          'bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)]',
          'text-white shadow-lg hover:shadow-xl',
          'transition-[background-color,box-shadow] duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isSubmitting ? t('franchise.apply.submitting') : t('franchise.apply.submit')}
      </Button>
    </form>
  )
}

export default ApplicationForm
