import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name must be less than 255 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  category_id: z.string().uuid('Invalid category ID').optional().nullable(),
  price: z.number().positive('Price must be positive'),
  cost_price: z.number().min(0).optional().nullable(),
  sku: z.string().max(100, 'SKU must be less than 100 characters').optional().nullable(),
  stock_quantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  featured: z.boolean().default(false),
  images: z.array(z.string().url('Invalid image URL')).optional().nullable(),
  dimensions: z.object({
    length: z.number().min(0).optional().nullable(),
    width: z.number().min(0).optional().nullable(),
    height: z.number().min(0).optional().nullable(),
    unit: z.string().max(10).optional().nullable(),
  }).optional().nullable(),
  weight: z.number().min(0).optional().nullable(),
  tags: z.array(z.string().max(50)).optional().nullable(),
  seo_title: z.string().max(60).optional().nullable(),
  seo_description: z.string().max(160).optional().nullable(),
  // Robust inventory fields
  physical_stock: z.number().int().min(0, 'Physical stock cannot be negative').optional(),
  reserved_stock: z.number().int().min(0, 'Reserved stock cannot be negative').default(0),
  reorder_point: z.number().int().min(0, 'Reorder point cannot be negative').default(5),
  reorder_quantity: z.number().int().positive('Reorder quantity must be positive').default(10),
  max_stock_level: z.number().int().positive('Max stock level must be positive').default(1000),
  min_stock_level: z.number().int().min(0, 'Min stock level cannot be negative').default(5),
})

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid('Invalid product ID'),
})

export const productFiltersSchema = z.object({
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  featured: z.boolean().optional(),
  min_price: z.number().positive().optional(),
  max_price: z.number().positive().optional(),
  low_stock: z.boolean().optional(),
  sort_by: z.enum(['name', 'price', 'stock_quantity', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  image_url: z.string().url('Invalid image URL').optional(),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  tags: z.array(z.string().max(50)).optional(),
})

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid('Invalid category ID'),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
