import { useState, useEffect } from 'react'

interface AnalyticsMetrics {
  totalRevenue: number
  revenueGrowth: number
  totalOrders: number
  ordersGrowth: number
  totalCustomers: number
  customersGrowth: number
  avgOrderValue: number
  aovGrowth: number
  conversionRate: number
  conversionGrowth: number
  returnRate: number
  returnGrowth: number
}

interface TopProduct {
  name: string
  sales: number
  revenue: number
  growth?: number
}

interface CategoryPerformance {
  name: string
  revenue: number
  percentage: number
  growth: number
}

interface SalesTrend {
  month: string
  revenue: number
  orders: number
  customers: number
}

interface AnalyticsData {
  metrics: AnalyticsMetrics
  topProducts: TopProduct[]
  categoryPerformance: CategoryPerformance[]
  salesTrend: SalesTrend[]
  timeRange: {
    from: string
    to: string
    period: string
  }
}

interface UseAnalyticsOptions {
  timeRange?: string
  startDate?: string
  endDate?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    timeRange = '6months',
    startDate,
    endDate,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (timeRange) params.append('timeRange', timeRange)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const token = localStorage.getItem('julie-crafts-token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`/api/analytics?${params}`, {
        headers
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`)
      }

      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange, startDate, endDate])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchAnalytics, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, timeRange, startDate, endDate])

  const refresh = () => {
    fetchAnalytics()
  }

  return {
    data,
    loading,
    error,
    refresh
  }
}
