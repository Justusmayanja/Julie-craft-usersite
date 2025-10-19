import { useState, useEffect, useCallback } from 'react'

interface InventoryStats {
  total_products: number
  active_products: number
  inactive_products: number
  draft_products: number
  total_inventory_value: number
  low_stock_products: number
  out_of_stock_products: number
  total_categories: number
  average_price: number
  total_suppliers: number
}

interface UseInventoryStatsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseInventoryStatsReturn {
  data: InventoryStats | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useInventoryStats(options: UseInventoryStatsOptions = {}): UseInventoryStatsReturn {
  const { autoRefresh = false, refreshInterval = 300000 } = options // 5 minutes default

  const [data, setData] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setError(null)
      
      const response = await fetch('/api/inventory/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const stats = await response.json()
      setData(stats)
    } catch (err) {
      console.error('Error fetching inventory stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory stats')
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
