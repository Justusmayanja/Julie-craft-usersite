export interface InventoryItem {
  id: string
  product_id: string
  sku: string
  product_name: string
  category_name?: string
  current_stock: number
  min_stock: number
  max_stock: number
  reorder_point: number
  unit_cost?: number
  unit_price?: number
  total_value: number
  last_restocked?: string
  supplier?: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
  movement_trend: 'increasing' | 'decreasing' | 'stable'
  notes?: string
  created_at: string
  updated_at: string
}

export interface InventoryCreateInput {
  product_id: string
  sku: string
  product_name: string
  category_name?: string
  current_stock: number
  min_stock?: number
  max_stock?: number
  reorder_point?: number
  unit_cost?: number
  unit_price?: number
  supplier?: string
  status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
  movement_trend?: 'increasing' | 'decreasing' | 'stable'
  notes?: string
}

export interface InventoryUpdateInput {
  current_stock?: number
  min_stock?: number
  max_stock?: number
  reorder_point?: number
  unit_cost?: number
  unit_price?: number
  supplier?: string
  status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
  movement_trend?: 'increasing' | 'decreasing' | 'stable'
  notes?: string
  last_restocked?: string
}

export interface InventoryFilters {
  search?: string
  status?: string
  category?: string
  supplier?: string
  movement_trend?: string
  min_stock?: number
  max_stock?: number
  min_value?: number
  max_value?: number
  low_stock?: boolean
  sort_by?: 'product_name' | 'current_stock' | 'total_value' | 'last_restocked' | 'created_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface InventoryStats {
  total_items: number
  total_value: number
  in_stock_items: number
  low_stock_items: number
  out_of_stock_items: number
  discontinued_items: number
  total_products: number
  average_stock_level: number
  reorder_alerts: number
  top_categories: Array<{
    category_name: string
    item_count: number
    total_value: number
  }>
  top_suppliers: Array<{
    supplier: string
    item_count: number
    total_value: number
  }>
  stock_movements: {
    increasing: number
    decreasing: number
    stable: number
  }
}

export interface InventoryListResponse {
  items: InventoryItem[]
  total: number
  page: number
  limit: number
  total_pages: number
  stats: InventoryStats
}

export interface StockMovement {
  id: string
  inventory_id: string
  product_name: string
  sku: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  previous_stock: number
  new_stock: number
  reason: string
  reference?: string
  notes?: string
  created_by: string
  created_at: string
}

export interface StockMovementCreateInput {
  inventory_id: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string
  reference?: string
  notes?: string
}

export interface BulkInventoryUpdate {
  action: 'update_stock' | 'update_prices' | 'update_suppliers' | 'update_status' | 'update_reorder_points'
  item_ids: string[]
  data: {
    stock_adjustment?: number
    new_price?: number
    new_cost?: number
    new_supplier?: string
    new_status?: string
    new_reorder_point?: number
    reason?: string
  }
}
