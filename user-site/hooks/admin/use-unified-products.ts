import { useState, useEffect, useCallback } from 'react'

interface UnifiedProduct {
  // Product data
  id: string
  name: string
  description: string | null
  category_id: string | null
  category_name: string | null
  sku: string | null
  price: number
  cost_price: number | null
  status: 'active' | 'inactive' | 'draft' | 'archived'
  featured: boolean
  tags: string[] | null
  images: string[] | null
  featured_image: string | null
  weight: number | null
  dimensions: any | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  created_at: string
  updated_at: string
  
  // Inventory data
  current_stock: number
  min_stock: number
  max_stock: number
  reorder_point: number
  unit_cost: number | null
  unit_price: number
  total_value: number
  last_restocked: string | null
  supplier: string | null
  inventory_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
  movement_trend: 'increasing' | 'decreasing' | 'stable'
  inventory_notes: string | null
  inventory_created_at: string | null
  inventory_updated_at: string | null
  
  // Consistency flags
  has_inventory_record: boolean
  stock_consistency: boolean
  price_consistency: boolean
  cost_consistency: boolean
  
  // Calculated fields
  is_low_stock: boolean
  is_out_of_stock: boolean
  needs_restock: boolean
}

interface UnifiedProductsStats {
  overview: {
    total_products: number
    total_inventory_items: number
    products_with_inventory: number
    products_without_inventory: number
    inventory_without_products: number
    consistency_percentage: number
  }
  status_breakdown: {
    products: {
      active: number
      inactive: number
      draft: number
      archived: number
    }
    inventory: {
      in_stock: number
      low_stock: number
      out_of_stock: number
      discontinued: number
    }
    movement_trends: {
      increasing: number
      decreasing: number
      stable: number
    }
  }
  financial: {
    total_inventory_value: number
    total_product_value: number
    average_product_price: number
    average_inventory_value: number
    value_discrepancy: number
  }
  consistency: {
    stock_consistency: number
    price_consistency: number
    cost_consistency: number
    total_consistent: number
  }
  stock_analysis: {
    low_stock_count: number
    out_of_stock_count: number
    low_stock_percentage: number
    out_of_stock_percentage: number
    needs_attention: number
  }
  recent_activity: {
    new_products_30_days: number
    inventory_updates_30_days: number
    total_activity: number
  }
  alerts: {
    needs_sync: boolean
    low_stock_alert: boolean
    out_of_stock_alert: boolean
    consistency_alert: boolean
    high_discrepancy: boolean
  }
  recommendations: Array<{
    type: string
    priority: 'low' | 'medium' | 'high'
    title: string
    description: string
    action: string
  }>
}

interface UnifiedProductsFilters {
  search?: string
  status?: 'active' | 'inactive' | 'draft' | 'archived'
  category_id?: string
  low_stock?: boolean
  out_of_stock?: boolean
  sort_by?: 'name' | 'price' | 'stock_quantity' | 'current_stock' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface UseUnifiedProductsOptions {
  filters?: UnifiedProductsFilters
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseUnifiedProductsReturn {
  data: {
    products: UnifiedProduct[]
    pagination: {
      page: number
      limit: number
      total: number
      total_pages: number
      has_next: boolean
      has_prev: boolean
    }
    filters: UnifiedProductsFilters
  } | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useUnifiedProducts(options: UseUnifiedProductsOptions = {}): UseUnifiedProductsReturn {
  const { filters = {}, autoRefresh = false, refreshInterval = 300000 } = options // 5 minutes default

  const [data, setData] = useState<UseUnifiedProductsReturn['data']>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setError(null)
      
      const searchParams = new URLSearchParams()
      
      // Add filters to search params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/products/unified?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching unified products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchProducts, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchProducts])

  return {
    data,
    loading,
    error,
    refresh: fetchProducts,
  }
}

interface UseUnifiedProductsStatsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseUnifiedProductsStatsReturn {
  data: UnifiedProductsStats | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useUnifiedProductsStats(options: UseUnifiedProductsStatsOptions = {}): UseUnifiedProductsStatsReturn {
  const { autoRefresh = false, refreshInterval = 300000 } = options // 5 minutes default

  const [data, setData] = useState<UnifiedProductsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setError(null)
      
      // Try the simple stats API first (more reliable)
      let response = await fetch('/api/products/unified/simple-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // If simple stats fails, fall back to the full stats API
      if (!response.ok) {
        console.warn('Simple stats API failed, trying full stats API')
        response = await fetch('/api/products/unified/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const stats = await response.json()
      setData(stats)
    } catch (err) {
      console.error('Error fetching unified products stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchStats, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchStats])

  return {
    data,
    loading,
    error,
    refresh: fetchStats,
  }
}
