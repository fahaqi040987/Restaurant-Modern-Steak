import { z } from 'zod'

// Common validation patterns
export const emailSchema = z.string().email('Invalid email format')
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters')
export const requiredStringSchema = z.string().min(1, 'This field is required')
export const positiveNumberSchema = z.number().min(0, 'Must be a positive number')
export const priceSchema = z.number().min(0.01, 'Price must be greater than 0')

// User/Staff related schemas
export const userRoles = ['admin', 'manager', 'server', 'counter', 'kitchen'] as const
export const userRoleSchema = z.enum(userRoles)

export const createUserSchema = z.object({
  username: requiredStringSchema.min(3, 'Username must be at least 3 characters'),
  email: emailSchema,
  password: passwordSchema,
  first_name: requiredStringSchema,
  last_name: requiredStringSchema,
  role: userRoleSchema,
})

export const updateUserSchema = z.object({
  id: z.string().or(z.number()),
  username: requiredStringSchema.min(3, 'Username must be at least 3 characters').optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  first_name: requiredStringSchema.optional(),
  last_name: requiredStringSchema.optional(),
  role: userRoleSchema.optional(),
})

// Product related schemas
export const productStatusValues = ['active', 'inactive'] as const
export const productStatusSchema = z.enum(productStatusValues)

export const createProductSchema = z.object({
  name: requiredStringSchema.min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  price: priceSchema,
  category_id: z.string().min(1, 'Please select a category'),
  image_url: z.string()
    .refine(
      (val) => val === '' || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
      'Image URL must be a valid URL or empty'
    )
    .optional()
    .or(z.literal('')),
  status: productStatusSchema.default('active'),
  preparation_time: z.number().min(0).max(120).default(5), // minutes
})

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().or(z.number()),
})

// Category related schemas
export const createCategorySchema = z.object({
  name: requiredStringSchema.min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  image_url: z.string()
    .refine(
      (val) => val === '' || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
      'Image URL must be a valid URL or empty'
    )
    .optional()
    .or(z.literal('')),
  sort_order: z.number().min(0).default(0),
})

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().or(z.number()),
})

// Table related schemas
export const tableStatusValues = ['available', 'occupied', 'reserved', 'maintenance'] as const
export const tableStatusSchema = z.enum(tableStatusValues)

export const createTableSchema = z.object({
  table_number: requiredStringSchema.min(1, 'Table number is required'),
  seats: z.number().min(1, 'Table must have at least 1 seat').max(20, 'Maximum 20 seats per table'),
  status: tableStatusSchema.default('available'),
  location: z.string().optional(),
})

export const updateTableSchema = createTableSchema.partial().extend({
  id: z.string().or(z.number()),
})

// Order related schemas
export const orderTypeValues = ['dine-in', 'take-away', 'delivery'] as const
export const orderTypeSchema = z.enum(orderTypeValues)

export const orderStatusValues = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'] as const
export const orderStatusSchema = z.enum(orderStatusValues)

export const orderItemSchema = z.object({
  product_id: z.number(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
})

export const createOrderSchema = z.object({
  table_id: z.number().optional(),
  customer_name: z.string().optional(),
  order_type: orderTypeSchema,
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
})

// Settings schemas
export const posSettingsSchema = z.object({
  restaurant_name: requiredStringSchema,
  address: z.string().optional(),
  phone: z.string().optional(),
  email: emailSchema.optional(),
  tax_rate: z.number().min(0).max(1), // 0.08 for 8%
  currency_symbol: requiredStringSchema.default('$'),
  receipt_footer: z.string().optional(),
  auto_print_receipts: z.boolean().default(false),
  order_timeout_minutes: z.number().min(1).max(120).default(30),
})

// Login schema
export const loginSchema = z.object({
  username: requiredStringSchema,
  password: requiredStringSchema,
})

// ============================================
// Reservation Schemas (Feature: 004-restaurant-management)
// Public website table booking form validation
// ============================================

export const reservationStatusValues = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'] as const
export const reservationStatusSchema = z.enum(reservationStatusValues)

/**
 * Zod schema for public reservation form validation
 * Validates customer reservation submissions from the public website
 */
export const reservationSchema = z.object({
  customer_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(8, 'Phone number must be at least 8 characters')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[+\d\s()-]+$/, 'Please enter a valid phone number'),
  party_size: z
    .number({ required_error: 'Party size is required', invalid_type_error: 'Please enter a valid number' })
    .int('Party size must be a whole number')
    .min(1, 'Party size must be at least 1')
    .max(20, 'Party size cannot exceed 20'),
  reservation_date: z
    .string()
    .min(1, 'Please select a date')
    .refine((date) => {
      const selected = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selected >= today
    }, 'Reservation date must be today or in the future'),
  reservation_time: z
    .string()
    .min(1, 'Please select a time')
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please enter a valid time (HH:MM)'),
  special_requests: z
    .string()
    .max(500, 'Special requests must be less than 500 characters')
    .optional()
    .or(z.literal('')),
})

/**
 * Schema for updating reservation status (admin)
 */
export const updateReservationStatusSchema = z.object({
  status: reservationStatusSchema,
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

// Export types
export type CreateUserData = z.infer<typeof createUserSchema>
export type UpdateUserData = z.infer<typeof updateUserSchema>
export type CreateProductData = z.infer<typeof createProductSchema>
export type UpdateProductData = z.infer<typeof updateProductSchema>
export type CreateCategoryData = z.infer<typeof createCategorySchema>
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>
export type CreateTableData = z.infer<typeof createTableSchema>
export type UpdateTableData = z.infer<typeof updateTableSchema>
export type CreateOrderData = z.infer<typeof createOrderSchema>
export type LoginData = z.infer<typeof loginSchema>
export type POSSettingsData = z.infer<typeof posSettingsSchema>

// Reservation types
export type ReservationFormData = z.infer<typeof reservationSchema>
export type UpdateReservationStatusData = z.infer<typeof updateReservationStatusSchema>
