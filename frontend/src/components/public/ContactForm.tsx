/**
 * T040: ContactForm component
 * Public contact form with Zod validation and TanStack Query mutation
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { User, Mail, Phone, MessageSquare, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { apiClient } from '@/api/client'
import { useToast } from '@/hooks/use-toast'

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Please select a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message is too long'),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

const SUBJECTS = [
  { value: 'reservation', labelKey: 'contact.subjectReservation' },
  { value: 'feedback', labelKey: 'contact.subjectFeedback' },
  { value: 'catering', labelKey: 'contact.subjectCatering' },
  { value: 'general', labelKey: 'contact.subjectGeneral' },
]

interface ContactFormProps {
  /** Custom class name */
  className?: string
  /** Callback on successful submission */
  onSuccess?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Default form values */
  defaultValues?: Partial<ContactFormValues>
  /** Disable the form */
  disabled?: boolean
}

/**
 * Public contact form component.
 * Allows customers to send messages to the restaurant.
 *
 * @example
 * ```tsx
 * <ContactForm
 *   onSuccess={() => console.log('Message sent!')}
 * />
 * ```
 */
export function ContactForm({
  className,
  onSuccess,
  onError,
  defaultValues,
  disabled = false,
}: ContactFormProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      subject: defaultValues?.subject || '',
      message: defaultValues?.message || '',
    },
  })

  const selectedSubject = watch('subject')

  // Mutation for submitting contact form
  const mutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      return apiClient.submitContactForm(data)
    },
    onSuccess: () => {
      setSubmitSuccess(true)
      reset()
      toast({
        title: t('contact.messageSentToast'),
        description: t('contact.messageSentDesc'),
      })
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast({
        title: t('contact.errorTitle'),
        description: error.message || t('contact.errorDesc'),
        variant: 'destructive',
      })
      onError?.(error)
    },
  })

  const onSubmit = (data: ContactFormValues) => {
    mutation.mutate(data)
  }

  // Success state
  if (submitSuccess) {
    return (
      <div
        data-testid="contact-form"
        className={cn(
          'public-card p-8 text-center',
          className
        )}
      >
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
        </div>
        <h3 className="text-2xl font-semibold text-[var(--public-text-primary)] mb-4">
          {t('contact.thankYou')}
        </h3>
        <p className="text-[var(--public-text-secondary)] mb-6">
          {t('contact.messageSent')}
        </p>
        <Button
          onClick={() => setSubmitSuccess(false)}
          className="bg-[var(--public-accent)] hover:bg-[var(--public-accent-dark)] text-white"
        >
          {t('contact.sendAnother')}
        </Button>
      </div>
    )
  }

  return (
    <form
      data-testid="contact-form"
      onSubmit={handleSubmit(onSubmit)}
      className={cn('public-form space-y-6', className)}
    >
      {/* Error message */}
      {mutation.isError && (
        <div
          role="alert"
          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{t('contact.submitFailed')}</span>
        </div>
      )}

      {/* Name Field */}
      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="text-[var(--public-text-primary)] font-medium flex items-center gap-2"
        >
          <User className="h-4 w-4 text-[var(--public-accent)]" />
          {t('contact.name')} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          {...register('name')}
          placeholder={t('contact.namePlaceholder')}
          className={cn(
            'public-input',
            errors.name && 'border-red-500 focus:ring-red-500'
          )}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'error-name' : undefined}
          disabled={disabled || mutation.isPending}
        />
        {errors.name && (
          <p
            id="error-name"
            data-testid="error-name"
            role="alert"
            className="text-sm text-red-500"
          >
            {errors.name.message}
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
          {t('contact.email')} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder={t('contact.emailPlaceholder')}
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
          {t('contact.phone')}
        </Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder={t('contact.phonePlaceholder')}
          className="public-input"
          disabled={disabled || mutation.isPending}
        />
      </div>

      {/* Subject Field */}
      <div className="space-y-2">
        <Label
          htmlFor="subject"
          className="text-[var(--public-text-primary)] font-medium flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4 text-[var(--public-accent)]" />
          {t('contact.subject')} <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedSubject}
          onValueChange={(value) => setValue('subject', value)}
          disabled={disabled || mutation.isPending}
        >
          <SelectTrigger
            data-testid="subject-trigger"
            className={cn(
              'public-input',
              errors.subject && 'border-red-500 focus:ring-red-500'
            )}
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? 'error-subject' : undefined}
          >
            <SelectValue placeholder={t('contact.selectSubject')} />
          </SelectTrigger>
          <SelectContent className="bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
            {SUBJECTS.map((subject) => (
              <SelectItem
                key={subject.value}
                value={subject.value}
                className="text-[var(--public-text-primary)]"
              >
                {t(subject.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.subject && (
          <p
            id="error-subject"
            data-testid="error-subject"
            role="alert"
            className="text-sm text-red-500"
          >
            {errors.subject.message}
          </p>
        )}
      </div>

      {/* Message Field */}
      <div className="space-y-2">
        <Label
          htmlFor="message"
          className="text-[var(--public-text-primary)] font-medium flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4 text-[var(--public-accent)]" />
          {t('contact.message')} <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="message"
          {...register('message')}
          placeholder={t('contact.messagePlaceholder')}
          rows={5}
          maxLength={1000}
          className={cn(
            'public-input resize-none',
            errors.message && 'border-red-500 focus:ring-red-500'
          )}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'error-message' : undefined}
          disabled={disabled || mutation.isPending}
        />
        {errors.message && (
          <p
            id="error-message"
            data-testid="error-message"
            role="alert"
            className="text-sm text-red-500"
          >
            {errors.message.message}
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
            {t('contact.sending')}
          </>
        ) : (
          <>
            <Send className="mr-2 h-5 w-5" />
            {t('contact.sendMessage')}
          </>
        )}
      </Button>
    </form>
  )
}

export default ContactForm
