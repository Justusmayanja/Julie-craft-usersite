import { useState, useEffect, useCallback } from 'react'

interface ProductsInventoryItem {
  id: string
  product_id: string
  product_name: string
  sku: string
  category_name: string
  current_stock: number
  min_stock: number
  max_stock: number
  reorder_point: number
  unit_cost: number
  unit_price: number
  total_value: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
  movement_trend: 'increasing' | 'decreasing' | 'stable'
  supplier: string
  last_restocked: string | null
  notes: string | null
  created_at: string
  updated_at: string
  product_status: string
  category_id: string | null
  weight: number | null
  dimensions: any | null
}

interface ProductsInventoryResponse {
  items: ProductsInventoryItem[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
  filters: any
}

interface ProductsInventoryFilters {
  search?: string
  status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
  low_stock?: boolean
  out_of_stock?: boolean
  category_id?: string
  sort_by?: 'product_name' | 'current_stock' | 'total_value' | 'last_restocked' | 'created_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface UseProductsInventoryOptions {
  filters?: ProductsInventoryFilters
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseProductsInventoryReturn {
  data: ProductsInventoryResponse | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useProductsInventory(options: UseProductsInventoryOptions = {}): UseProductsInventoryReturn {
  const { filters = {}, autoRefresh = false, refreshInterval = 300000 } = options // 5 minutes default

  const [data, setData] = useState<ProductsInventoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInventory = useCallback(async () => {
    try {
      setError(null)
      
      const searchParams = new URLSearchParams()
      
      // Add filters to search params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/inventory/products-based?${searchParams.toString()}`, {
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
      console.error('Error fetching products inventory:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchInventory, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchInventory])

  return {
    data,
    loading,
    error,
    refresh: fetchInventory,
  }
}

// Hook for inventory stats based on products
export function useProductsInventoryStats() {
  const [stats, setStats] = useState({
    total_items: 0,
    low_stock_items: 0,
    out_of_stock_items: 0,
    total_value: 0,
    avg_stock_level: 0,
  })
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

      // If simple stats fails, fall back to the full analytics API
      if (!response.ok) {
        console.warn('Simple stats API failed, trying full analytics API')
        response = await fetch('/api/products/analytics', {
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

      const analytics = await response.json()
      
      setStats({
        total_items: analytics.overview?.total_products || 0,
        low_stock_items: analytics.stock_analysis?.low_stock_count || 0,
        out_of_stock_items: analytics.stock_analysis?.out_of_stock_count || 0,
        total_value: analytics.overview?.total_inventory_value || 0,
        avg_stock_level: analytics.stock_analysis?.stock_efficiency || 0,
      })
    } catch (err) {
      console.error('Error fetching products inventory stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory stats')
      
      // Set fallback stats to prevent UI breaking
      setStats({
        total_items: 0,
        low_stock_items: 0,
        out_of_stock_items: 0,
        total_value: 0,
        avg_stock_level: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  }
}
