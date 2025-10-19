import { useState, useEffect, useCallback } from 'react'

interface CategoryStats {
  id: string
  name: string
  description?: string
  is_active: boolean
  sort_order?: number
  created_at: string
  total_products: number
  active_products: number
  inactive_products: number
  draft_products: number
  total_revenue: number
  total_inventory_value: number
  average_price: number
  low_stock_products: number
}

interface CategoryStatsSummary {
  total_categories: number
  active_categories: number
  inactive_categories: number
  total_products: number
  total_revenue: number
  total_inventory_value: number
  average_products_per_category: number
}

interface CategoryStatsResponse {
  categories: CategoryStats[]
  summary: CategoryStatsSummary
}

export function useCategoryStats() {
  const [stats, setStats] = useState<CategoryStatsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/categories/stats')
      
      if (!response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch category stats')
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format - expected JSON')
      }
      
      const data = await response.json()
      setStats(data)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching category stats:', err)
      
      // Set fallback stats on error
      setStats({
        categories: [],
        summary: {
          total_categories: 0,
          active_categories: 0,
          inactive_categories: 0,
          total_products: 0,
          total_revenue: 0,
          total_inventory_value: 0,
          average_products_per_category: 0
        }
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
