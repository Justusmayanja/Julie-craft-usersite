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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch category stats')
      }
      
      const data = await response.json()
      setStats(data)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching category stats:', err)
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
