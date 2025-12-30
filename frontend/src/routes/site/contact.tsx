import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Copy,
  ExternalLink,
  Send,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PublicLayout } from '@/components/public/PublicLayout'
import { apiClient } from '@/api/client'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export const Route = createFileRoute('/site/contact')({
  component: PublicContactPage,
})

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
  { value: 'reservation', label: 'Reservation' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'catering', label: 'Catering' },
  { value: 'general', label: 'General Inquiry' },
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function PublicContactPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const { data: restaurantInfo, isLoading, error } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 30,
  })

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  })

  const submitMutation = useMutation({
    mutationFn: (data: ContactFormValues) => apiClient.submitContactForm(data),
    onSuccess: () => {
      setIsSubmitted(true)
      form.reset()
      toast({
        title: 'Message Sent!',
        description: 'Thank you for contacting us. We\'ll get back to you soon.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: ContactFormValues) => {
    submitMutation.mutate(data)
  }

  const copyAddress = async () => {
    if (restaurantInfo?.address) {
      const fullAddress = `${restaurantInfo.address}${restaurantInfo.city ? `, ${restaurantInfo.city}` : ''}${restaurantInfo.postal_code ? ` ${restaurantInfo.postal_code}` : ''}`
      await navigator.clipboard.writeText(fullAddress)
      toast({
        title: 'Address Copied',
        description: 'The address has been copied to your clipboard.',
      })
    }
  }

  const formatTime = (time: string): string => {
    // Handle ISO timestamp format (e.g., "0000-01-01T11:00:00Z")
    let hourStr: string
    let minuteStr: string

    if (time.includes('T')) {
      const timePart = time.split('T')[1] // Get "11:00:00Z"
      const [h, m] = timePart.split(':')
      hourStr = h
      minuteStr = m
    } else {
      const [h, m] = time.split(':')
      hourStr = h
      minuteStr = m || '00'
    }

    const hour = parseInt(hourStr, 10)
    const minute = minuteStr || '00'
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return minute === '00' ? `${hour12} ${ampm}` : `${hour12}:${minute} ${ampm}`
  }

  const today = new Date().getDay()

  return (
    <PublicLayout>
      {/* Page Header */}
      <section className="py-12 md:py-16 bg-[var(--public-bg-secondary)]">
        <div className="public-container text-center">
          <h1
            className="text-4xl md:text-5xl font-bold text-[var(--public-text-primary)] mb-4"
            style={{ fontFamily: 'var(--public-font-heading)' }}
          >
            Contact <span className="text-[var(--public-secondary)]">Us</span>
          </h1>
          <p className="text-[var(--public-text-secondary)] max-w-2xl mx-auto">
            We'd love to hear from you. Get in touch for reservations, inquiries, or feedback.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="public-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Contact Info */}
            <div className="space-y-8">
              {/* Error State */}
              {error && (
                <Card className="public-card border-red-500">
                  <CardContent className="py-4">
                    <p className="text-red-500">Error loading restaurant info: {(error as Error).message}</p>
                  </CardContent>
                </Card>
              )}

              {/* Address Card */}
              <Card className="public-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--public-text-primary)]">
                    <MapPin className="h-5 w-5 text-[var(--public-secondary)]" />
                    Our Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <p className="text-[var(--public-text-secondary)]">Loading address...</p>
                  ) : (
                    <p className="text-[var(--public-text-secondary)]">
                      {restaurantInfo?.address || 'Address not available'}
                      {restaurantInfo?.city && <>, {restaurantInfo.city}</>}
                      {restaurantInfo?.postal_code && <> {restaurantInfo.postal_code}</>}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAddress}
                      className="border-[var(--public-border)] text-[var(--public-text-secondary)] hover:bg-[var(--public-bg-hover)]"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Address
                    </Button>
                    {restaurantInfo?.google_maps_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-[var(--public-secondary)] text-[var(--public-secondary)] hover:bg-[var(--public-secondary)] hover:text-[var(--public-text-on-gold)]"
                      >
                        <a
                          href={restaurantInfo.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Get Directions
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Google Maps Embed */}
                  {restaurantInfo?.map_latitude && restaurantInfo?.map_longitude && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-[var(--public-border)]">
                      <iframe
                        src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${restaurantInfo.map_latitude},${restaurantInfo.map_longitude}&zoom=15`}
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Restaurant Location"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Details Card */}
              <Card className="public-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--public-text-primary)]">
                    <Phone className="h-5 w-5 text-[var(--public-secondary)]" />
                    Contact Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <p className="text-[var(--public-text-secondary)]">Loading contact details...</p>
                  ) : (
                    <>
                      {restaurantInfo?.phone ? (
                        <a
                          href={`tel:${restaurantInfo.phone}`}
                          className="flex items-center gap-3 text-[var(--public-text-secondary)] hover:text-[var(--public-secondary)] transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                          {restaurantInfo.phone}
                        </a>
                      ) : (
                        <p className="text-[var(--public-text-secondary)]">Phone not available</p>
                      )}
                      {restaurantInfo?.email ? (
                        <a
                          href={`mailto:${restaurantInfo.email}`}
                          className="flex items-center gap-3 text-[var(--public-text-secondary)] hover:text-[var(--public-secondary)] transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          {restaurantInfo.email}
                        </a>
                      ) : (
                        <p className="text-[var(--public-text-secondary)]">Email not available</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Operating Hours Card */}
              <Card className="public-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--public-text-primary)]">
                    <Clock className="h-5 w-5 text-[var(--public-secondary)]" />
                    Operating Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-[var(--public-text-secondary)]">Loading operating hours...</p>
                  ) : restaurantInfo?.operating_hours && restaurantInfo.operating_hours.length > 0 ? (
                    <div className="space-y-2">
                      {restaurantInfo.operating_hours
                        .sort((a, b) => a.day_of_week - b.day_of_week)
                        .map((hours) => (
                          <div
                            key={hours.id}
                            className={cn(
                              'flex justify-between py-2 px-3 rounded',
                              hours.day_of_week === today
                                ? 'bg-[var(--public-secondary)]/10 border border-[var(--public-secondary)]/30'
                                : ''
                            )}
                          >
                            <span
                              className={cn(
                                'font-medium',
                                hours.day_of_week === today
                                  ? 'text-[var(--public-secondary)]'
                                  : 'text-[var(--public-text-primary)]'
                              )}
                            >
                              {DAY_NAMES[hours.day_of_week]}
                              {hours.day_of_week === today && (
                                <span className="ml-2 text-xs">(Today)</span>
                              )}
                            </span>
                            <span className="text-[var(--public-text-secondary)]">
                              {hours.is_closed
                                ? 'Closed'
                                : `${formatTime(hours.open_time)} - ${formatTime(hours.close_time)}`}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-[var(--public-text-secondary)]">Operating hours not available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Contact Form */}
            <div>
              <Card className="public-card">
                <CardHeader>
                  <CardTitle className="text-[var(--public-text-primary)]">
                    Send Us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-[var(--public-text-primary)] mb-2">
                        Thank You!
                      </h3>
                      <p className="text-[var(--public-text-secondary)] mb-4">
                        Your message has been sent successfully. We'll get back to you soon.
                      </p>
                      <Button
                        onClick={() => setIsSubmitted(false)}
                        variant="outline"
                        className="border-[var(--public-secondary)] text-[var(--public-secondary)]"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[var(--public-text-primary)]">
                                Name <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your name"
                                  {...field}
                                  className="bg-[var(--public-bg-elevated)] border-[var(--public-border)] text-[var(--public-text-primary)]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[var(--public-text-primary)]">
                                Email <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="your@email.com"
                                  {...field}
                                  className="bg-[var(--public-bg-elevated)] border-[var(--public-border)] text-[var(--public-text-primary)]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[var(--public-text-primary)]">
                                Phone (Optional)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="+62 xxx xxxx xxxx"
                                  {...field}
                                  className="bg-[var(--public-bg-elevated)] border-[var(--public-border)] text-[var(--public-text-primary)]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[var(--public-text-primary)]">
                                Subject <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-[var(--public-bg-elevated)] border-[var(--public-border)] text-[var(--public-text-primary)]">
                                    <SelectValue placeholder="Select a subject" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
                                  {SUBJECTS.map((subject) => (
                                    <SelectItem
                                      key={subject.value}
                                      value={subject.value}
                                      className="text-[var(--public-text-primary)]"
                                    >
                                      {subject.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[var(--public-text-primary)]">
                                Message <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Your message..."
                                  rows={5}
                                  {...field}
                                  className="bg-[var(--public-bg-elevated)] border-[var(--public-border)] text-[var(--public-text-primary)] resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={submitMutation.isPending}
                          className="w-full bg-[var(--public-secondary)] text-[var(--public-text-on-gold)] hover:bg-[var(--public-secondary-light)]"
                        >
                          {submitMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
