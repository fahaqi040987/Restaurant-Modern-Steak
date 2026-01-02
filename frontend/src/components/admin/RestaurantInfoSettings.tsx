import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Store,
  MapPin,
  Phone,
  Globe,
  Clock,
  Save,
  Loader2,
} from 'lucide-react'
import apiClient from '@/api/client'
import { toastHelpers } from '@/lib/toast-helpers'
import type { UpdateRestaurantInfoRequest, OperatingHourUpdate } from '@/types'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', labelId: 'Minggu' },
  { value: 1, label: 'Monday', labelId: 'Senin' },
  { value: 2, label: 'Tuesday', labelId: 'Selasa' },
  { value: 3, label: 'Wednesday', labelId: 'Rabu' },
  { value: 4, label: 'Thursday', labelId: 'Kamis' },
  { value: 5, label: 'Friday', labelId: "Jum'at" },
  { value: 6, label: 'Saturday', labelId: 'Sabtu' },
]

/**
 * Normalize any time format to HH:MM for HTML time input
 * Handles: HH:MM, HH:MM:SS, ISO datetime, etc.
 */
const normalizeTimeForInput = (time: string | null | undefined): string => {
  if (!time || time === '') return '09:00'

  const timeStr = String(time).trim()

  // Handle ISO datetime format like "0000-01-01T11:00:00Z" or "2024-01-01T11:00:00"
  if (timeStr.includes('T')) {
    const match = timeStr.match(/T(\d{2}):(\d{2})/)
    if (match) {
      return `${match[1]}:${match[2]}`
    }
  }

  // Handle HH:MM:SS or HH:MM format
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    const hour = parts[0].padStart(2, '0')
    const minute = parts[1].padStart(2, '0')
    // Validate the values
    const hourNum = parseInt(hour, 10)
    const minNum = parseInt(minute, 10)
    if (hourNum >= 0 && hourNum <= 23 && minNum >= 0 && minNum <= 59) {
      return `${hour}:${minute}`
    }
  }

  return '09:00'
}

/**
 * Default operating hours for initialization
 */
const getDefaultOperatingHours = (): OperatingHourUpdate[] => {
  return DAYS_OF_WEEK.map((day) => ({
    day_of_week: day.value,
    open_time: '09:00',
    close_time: '22:00',
    is_closed: day.value === 0, // Sunday closed by default
  }))
}

export function RestaurantInfoSettings() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Track if we've initialized from API data
  const hasInitializedHours = useRef(false)

  const [formData, setFormData] = useState<UpdateRestaurantInfoRequest>({
    name: '',
    tagline: undefined,
    description: undefined,
    address: undefined,
    city: undefined,
    postal_code: undefined,
    country: 'Indonesia',
    phone: undefined,
    email: undefined,
    whatsapp: undefined,
    map_latitude: null,
    map_longitude: null,
    google_maps_url: undefined,
    instagram_url: undefined,
    facebook_url: undefined,
    twitter_url: undefined,
    logo_url: undefined,
    hero_image_url: undefined,
  })

  // Initialize with default operating hours
  const [operatingHours, setOperatingHours] = useState<OperatingHourUpdate[]>(getDefaultOperatingHours())

  // Fetch restaurant info
  const { data: restaurantInfo, isLoading } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: () => apiClient.getRestaurantInfo(),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
  })

  // Populate form when data is loaded (only on initial load or explicit refetch)
  useEffect(() => {
    if (restaurantInfo) {
      // Always update basic form data
      setFormData({
        name: restaurantInfo.name,
        tagline: restaurantInfo.tagline || undefined,
        description: restaurantInfo.description || undefined,
        address: restaurantInfo.address || undefined,
        city: restaurantInfo.city || undefined,
        postal_code: restaurantInfo.postal_code || undefined,
        country: restaurantInfo.country || 'Indonesia',
        phone: restaurantInfo.phone || undefined,
        email: restaurantInfo.email || undefined,
        whatsapp: restaurantInfo.whatsapp || undefined,
        map_latitude: restaurantInfo.map_latitude,
        map_longitude: restaurantInfo.map_longitude,
        google_maps_url: restaurantInfo.google_maps_url || undefined,
        instagram_url: restaurantInfo.instagram_url || undefined,
        facebook_url: restaurantInfo.facebook_url || undefined,
        twitter_url: restaurantInfo.twitter_url || undefined,
        logo_url: restaurantInfo.logo_url || undefined,
        hero_image_url: restaurantInfo.hero_image_url || undefined,
      })

      // Process operating hours from API
      if (restaurantInfo.operating_hours && restaurantInfo.operating_hours.length > 0) {
        console.log('API Operating Hours:', restaurantInfo.operating_hours) // Debug log

        const processedHours: OperatingHourUpdate[] = restaurantInfo.operating_hours.map((oh) => {
          const openTime = normalizeTimeForInput(oh.open_time)
          const closeTime = normalizeTimeForInput(oh.close_time)
          console.log(`Day ${oh.day_of_week}: open=${oh.open_time} -> ${openTime}, close=${oh.close_time} -> ${closeTime}`) // Debug
          return {
            day_of_week: oh.day_of_week,
            open_time: openTime,
            close_time: closeTime,
            is_closed: oh.is_closed,
          }
        })

        // Ensure all 7 days are present
        const allDays = getDefaultOperatingHours()
        const mergedHours = allDays.map((defaultDay) => {
          const existingDay = processedHours.find((h) => h.day_of_week === defaultDay.day_of_week)
          return existingDay || defaultDay
        })

        setOperatingHours(mergedHours)
        hasInitializedHours.current = true
      } else if (!hasInitializedHours.current) {
        // Only set defaults if we haven't initialized yet
        setOperatingHours(getDefaultOperatingHours())
        hasInitializedHours.current = true
      }
    }
  }, [restaurantInfo])

  // Update restaurant info mutation
  const updateInfoMutation = useMutation({
    mutationFn: (data: UpdateRestaurantInfoRequest) => apiClient.updateRestaurantInfo(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['restaurantInfo'] })
      toastHelpers.success(t('Restaurant information updated successfully'))
    },
    onError: (error: Error) => {
      toastHelpers.error(error.message || t('Failed to update restaurant information'))
    },
  })

  // Update operating hours mutation
  const updateHoursMutation = useMutation({
    mutationFn: (hours: OperatingHourUpdate[]) =>
      apiClient.updateOperatingHours({ hours }),
    onSuccess: async (_, savedHours) => {
      // Keep the local state - don't reset it
      // The saved hours are already valid, just refresh from server
      await queryClient.invalidateQueries({ queryKey: ['restaurantInfo'] })
      toastHelpers.success(t('Operating hours updated successfully'))
    },
    onError: (error: Error) => {
      toastHelpers.error(error.message || t('Failed to update operating hours'))
    },
  })

  const handleInputChange = (field: keyof UpdateRestaurantInfoRequest, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleHourChange = (dayOfWeek: number, field: keyof OperatingHourUpdate, value: unknown) => {
    setOperatingHours((prev) =>
      prev.map((hour) =>
        hour.day_of_week === dayOfWeek ? { ...hour, [field]: value } : hour
      )
    )
  }

  const handleSaveInfo = () => {
    updateInfoMutation.mutate(formData)
  }

  const handleSaveHours = () => {
    // Validate and normalize all hours before sending
    const validatedHours: OperatingHourUpdate[] = operatingHours.map((hour) => {
      // Get the current displayed values
      const openTime = normalizeTimeForInput(hour.open_time)
      const closeTime = normalizeTimeForInput(hour.close_time)

      return {
        day_of_week: hour.day_of_week,
        open_time: openTime,
        close_time: closeTime,
        is_closed: hour.is_closed,
      }
    })

    console.log('Saving hours:', validatedHours) // Debug log

    // Update local state with validated values first
    setOperatingHours(validatedHours)

    // Then send to backend
    updateHoursMutation.mutate(validatedHours)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {t('Basic Information')}
          </CardTitle>
          <CardDescription>
            {t('Update your restaurant name, tagline, and description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t('Restaurant Name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Modern Steak Restaurant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">{t('Tagline')}</Label>
              <Input
                id="tagline"
                value={formData.tagline || ''}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                placeholder="Premium Steakhouse Experience"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('Description')}</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Tell customers about your restaurant..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {t('Contact Information')}
          </CardTitle>
          <CardDescription>
            {t('Phone, email, and social media links')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('Phone')}</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+62 812-3456-7890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">{t('WhatsApp')}</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp || ''}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                placeholder="+62 812-3456-7890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('Email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="info@steakkenangan.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('Address')}
          </CardTitle>
          <CardDescription>
            {t('Physical location and map coordinates')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">{t('Street Address')}</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Jl. Sudirman No. 123"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">{t('City')}</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Jakarta"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">{t('Postal Code')}</Label>
              <Input
                id="postal_code"
                value={formData.postal_code || ''}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('Country')}</Label>
              <Input
                id="country"
                value={formData.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Indonesia"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="map_latitude">{t('Latitude')}</Label>
              <Input
                id="map_latitude"
                type="number"
                step="any"
                value={formData.map_latitude || ''}
                onChange={(e) => handleInputChange('map_latitude', parseFloat(e.target.value) || null)}
                placeholder="-6.2088"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="map_longitude">{t('Longitude')}</Label>
              <Input
                id="map_longitude"
                type="number"
                step="any"
                value={formData.map_longitude || ''}
                onChange={(e) => handleInputChange('map_longitude', parseFloat(e.target.value) || null)}
                placeholder="106.8456"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('Social Media & Links')}
          </CardTitle>
          <CardDescription>
            {t('Website and social media profiles')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="google_maps_url">{t('Google Maps URL')}</Label>
              <Input
                id="google_maps_url"
                value={formData.google_maps_url || ''}
                onChange={(e) => handleInputChange('google_maps_url', e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_url">{t('Instagram URL')}</Label>
              <Input
                id="instagram_url"
                value={formData.instagram_url || ''}
                onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                placeholder="https://instagram.com/modernsteak"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook_url">{t('Facebook URL')}</Label>
              <Input
                id="facebook_url"
                value={formData.facebook_url || ''}
                onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                placeholder="https://facebook.com/modernsteak"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter_url">{t('Twitter URL')}</Label>
              <Input
                id="twitter_url"
                value={formData.twitter_url || ''}
                onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                placeholder="https://twitter.com/modernsteak"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Basic Info Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveInfo}
          disabled={updateInfoMutation.isPending}
          size="lg"
        >
          {updateInfoMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t('Save Restaurant Information')}
        </Button>
      </div>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('Operating Hours')}
          </CardTitle>
          <CardDescription>
            {t('Set your restaurant opening and closing times for each day')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {operatingHours.map((hour) => {
            const day = DAYS_OF_WEEK.find((d) => d.value === hour.day_of_week)
            // Always normalize values for display
            const displayOpenTime = normalizeTimeForInput(hour.open_time)
            const displayCloseTime = normalizeTimeForInput(hour.close_time)

            return (
              <div key={hour.day_of_week} className="flex items-center gap-4 rounded-lg border p-4">
                <div className="w-24 font-medium">{day?.labelId || day?.label}</div>
                <div className="flex-1 grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`open-${hour.day_of_week}`}>{t('Opens')}</Label>
                    <Input
                      id={`open-${hour.day_of_week}`}
                      type="time"
                      value={displayOpenTime}
                      onChange={(e) =>
                        handleHourChange(hour.day_of_week, 'open_time', e.target.value)
                      }
                      disabled={hour.is_closed}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`close-${hour.day_of_week}`}>{t('Closes')}</Label>
                    <Input
                      id={`close-${hour.day_of_week}`}
                      type="time"
                      value={displayCloseTime}
                      onChange={(e) =>
                        handleHourChange(hour.day_of_week, 'close_time', e.target.value)
                      }
                      disabled={hour.is_closed}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`closed-${hour.day_of_week}`}
                        checked={hour.is_closed}
                        onCheckedChange={(checked) =>
                          handleHourChange(hour.day_of_week, 'is_closed', checked)
                        }
                      />
                      <Label htmlFor={`closed-${hour.day_of_week}`}>{t('Closed')}</Label>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Save Operating Hours Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveHours}
          disabled={updateHoursMutation.isPending}
          size="lg"
        >
          {updateHoursMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t('Save Operating Hours')}
        </Button>
      </div>
    </div>
  )
}
