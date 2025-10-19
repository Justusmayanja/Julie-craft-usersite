import { z } from 'zod'

// Customer status enum
export const customerStatusSchema = z.enum(['active', 'inactive', 'blocked'])

// Customer gender enum
export const customerGenderSchema = z.enum(['male', 'female', 'other', 'prefer_not_to_say'])

// Base customer schema
export const baseCustomerSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  date_of_birth: z.string().optional(),
  gender: customerGenderSchema.optional(),
  // Address information
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().default('United States'),
  // Customer preferences
  preferences: z.record(z.any()).optional(),
  notes: z.string().optional(),
  status: customerStatusSchema.default('active'),
})

// Create customer schema
export const createCustomerSchema = baseCustomerSchema

// Update customer schema
export const updateCustomerSchema = baseCustomerSchema.partial().extend({
  id: z.string().uuid('Invalid customer ID'),
})

// Customer filters schema
export const customerFiltersSchema = z.object({
  search: z.string().optional(),
  status: customerStatusSchema.optional(),
  gender: customerGenderSchema.optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  min_orders: z.number().int().min(0).optional(),
  max_orders: z.number().int().min(0).optional(),
  min_spent: z.number().min(0).optional(),
  max_spent: z.number().min(0).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort_by: z.enum(['name', 'email', 'total_orders', 'total_spent', 'last_order_date', 'join_date', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

// Customer stats schema
export const customerStatsSchema = z.object({
  total_customers: z.number().int().min(0),
  active_customers: z.number().int().min(0),
  inactive_customers: z.number().int().min(0),
  blocked_customers: z.number().int().min(0),
  new_customers_this_month: z.number().int().min(0),
  total_revenue: z.number().min(0),
  average_order_value: z.number().min(0),
  top_customers: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    total_orders: z.number().int(),
    total_spent: z.number(),
  })).optional(),
})

// Export types
export type CustomerStatus = z.infer<typeof customerStatusSchema>
export type CustomerGender = z.infer<typeof customerGenderSchema>
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CustomerFilters = z.infer<typeof customerFiltersSchema>
export type CustomerStats = z.infer<typeof customerStatsSchema>
