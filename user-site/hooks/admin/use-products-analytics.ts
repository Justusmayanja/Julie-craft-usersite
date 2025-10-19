import { useState, useEffect, useCallback } from 'react'

interface ProductsAnalytics {
  overview: {
    total_products: number
    active_products: number
    inactive_products: number
    draft_products: number
    archived_products: number
    total_stock: number
    total_inventory_value: number
    total_retail_value: number
    average_product_price: number
    average_cost_price: number
  }
  stock_analysis: {
    low_stock_count: number
    out_of_stock_count: number
    overstock_count: number
    low_stock_percentage: number
    out_of_stock_percentage: number
    overstock_percentage: number
    stock_efficiency: number
  }
  category_performance: Array<{
    name: string
    product_count: number
    active_products: number
    total_value: number
    total_stock: number
    average_price: number
    performance_score: number
  }>
  top_products: Array<{
    rank: number
    name: string
    price: number
    stock: number
    estimated_sales: number
    estimated_revenue: number
  }>
  recent_activity: {
    new_products: number
    updated_products: number
    total_activity: number
    time_range: string
  }
  inventory_health: {
    overall_score: number
    stock_turnover_estimate: number
    reorder_needed: number
    overstock_items: number
    stock_efficiency: number
  }
  insights: Array<{
    type: 'info' | 'warning' | 'critical'
    title: string
    message: string
    action: string
    priority: 'low' | 'medium' | 'high' | 'critical'
  }>
  filters: {
    time_range: string
    category_id?: string
    status?: string
    low_stock?: boolean
    out_of_stock?: boolean
  }
}

interface ProductsAnalyticsFilters {
  time_range?: '7days' | '30days' | '3months' | '6months' | '1year'
  category_id?: string
  status?: 'active' | 'inactive' | 'draft' | 'archived'
  low_stock?: boolean
  out_of_stock?: boolean
}

interface UseProductsAnalyticsOptions {
  filters?: ProductsAnalyticsFilters
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseProductsAnalyticsReturn {
  data: ProductsAnalytics | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useProductsAnalytics(options: UseProductsAnalyticsOptions = {}): UseProductsAnalyticsReturn {
  const { filters = {}, autoRefresh = false, refreshInterval = 300000 } = options // 5 minutes default

  const [data, setData] = useState<ProductsAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null)
      
      const searchParams = new URLSearchParams()
      
      // Add filters to search params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/products/analytics?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const analytics = await response.json()
      setData(analytics)
    } catch (err) {
      console.error('Error fetching products analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products analytics')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchAnalytics, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchAnalytics])

  return {
    data,
    loading,
    error,
    refresh: fetchAnalytics,
  }
}
