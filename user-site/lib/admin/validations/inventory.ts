import { z } from 'zod'

export const createInventorySchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU too long'),
  product_name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
  category_name: z.string().max(100, 'Category name too long').optional(),
  current_stock: z.number().int().min(0, 'Stock cannot be negative'),
  min_stock: z.number().int().min(0, 'Min stock cannot be negative').default(5),
  max_stock: z.number().int().min(0, 'Max stock cannot be negative').default(100),
  reorder_point: z.number().int().min(0, 'Reorder point cannot be negative').default(10),
  unit_cost: z.number().positive('Unit cost must be positive').optional(),
  unit_price: z.number().positive('Unit price must be positive').optional(),
  supplier: z.string().max(255, 'Supplier name too long').optional(),
  status: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'discontinued']).default('in_stock'),
  movement_trend: z.enum(['increasing', 'decreasing', 'stable']).default('stable'),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const updateInventorySchema = z.object({
  current_stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  min_stock: z.number().int().min(0, 'Min stock cannot be negative').optional(),
  max_stock: z.number().int().min(0, 'Max stock cannot be negative').optional(),
  reorder_point: z.number().int().min(0, 'Reorder point cannot be negative').optional(),
  unit_cost: z.number().positive('Unit cost must be positive').optional(),
  unit_price: z.number().positive('Unit price must be positive').optional(),
  supplier: z.string().max(255, 'Supplier name too long').optional(),
  status: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'discontinued']).optional(),
  movement_trend: z.enum(['increasing', 'decreasing', 'stable']).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const inventoryFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  movement_trend: z.string().optional(),
  min_stock: z.number().int().min(0).optional(),
  max_stock: z.number().int().min(0).optional(),
  min_value: z.number().min(0).optional(),
  max_value: z.number().min(0).optional(),
  low_stock: z.boolean().optional(),
  sort_by: z.enum(['product_name', 'current_stock', 'total_value', 'last_restocked', 'created_at']).default('product_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export const stockMovementSchema = z.object({
  inventory_id: z.string().uuid('Invalid inventory ID'),
  movement_type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number().int().positive('Quantity must be positive'),
  reason: z.string().min(1, 'Reason is required').max(255, 'Reason too long'),
  reference: z.string().max(100, 'Reference too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const bulkInventoryUpdateSchema = z.object({
  action: z.enum(['update_stock', 'update_prices', 'update_suppliers', 'update_status', 'update_reorder_points']),
  item_ids: z.array(z.string().uuid()).min(1, 'At least one item must be selected'),
  data: z.object({
    stock_adjustment: z.number().int().optional(),
    new_price: z.number().positive().optional(),
    new_cost: z.number().positive().optional(),
    new_supplier: z.string().max(255).optional(),
    new_status: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'discontinued']).optional(),
    new_reorder_point: z.number().int().min(0).optional(),
    reason: z.string().max(255).optional(),
  }),
})

export type CreateInventoryInput = z.infer<typeof createInventorySchema>
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>
export type InventoryFilters = z.infer<typeof inventoryFiltersSchema>
export type StockMovementInput = z.infer<typeof stockMovementSchema>
export type BulkInventoryUpdateInput = z.infer<typeof bulkInventoryUpdateSchema>
