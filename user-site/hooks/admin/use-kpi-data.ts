"use client"

import { useState, useEffect, useCallback, useRef } from "react"

/**
 * Real-time KPI Data Hook
 * 
 * Fetches and streams real-time KPI metrics from the database.
 * Uses API route with admin privileges (bypasses RLS) and polling for updates.
 */

export interface KpiMetrics {
  // Total Sales
  todaySales: number
  monthlySales: number
  todaySalesChange: number // % change vs yesterday
  monthlySalesChange: number // % change vs last month
  
  // Total Orders
  totalOrders: number
  ordersChange: number // % change vs last week
  
  // Average Order Value
  averageOrderValue: number
  aovChange: number // % change vs last month
  
  // Returning Customers
  returningCustomersPercent: number
  returningCustomersChange: number // % change vs last month
  
  // Pending Orders
  pendingOrders: number
  pendingOrdersChange: number // % change vs last week
  
  // Low Stock Items
  lowStockItems: number
  lowStockItemsChange: number // % change vs last week
  
  // Sparkline data (last 7 days)
  salesSparkline: number[]
  ordersSparkline: number[]
}

interface UseKpiDataOptions {
  enableRealtime?: boolean
  pollingInterval?: number // milliseconds
  lowStockThreshold?: number
}

const DEFAULT_POLLING_INTERVAL = 30000 // 30 seconds
const DEFAULT_LOW_STOCK_THRESHOLD = 5

export function useKpiData(options: UseKpiDataOptions = {}) {
  const {
    enableRealtime = true,
    pollingInterval = DEFAULT_POLLING_INTERVAL,
    lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD
  } = options

  const [metrics, setMetrics] = useState<KpiMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Fetch KPI metrics from API route (with admin privileges)
   */
  const fetchKpiData = useCallback(async () => {
    try {
      setError(null)
      
      // Get auth token
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('julie-crafts-token') 
        : null
      
      if (!token) {
        setError('Authentication required')
        setLoading(false)
        return
      }

      // Build query parameters
      const params = new URLSearchParams()
      params.append('lowStockThreshold', lowStockThreshold.toString())

      // Fetch data from API route (uses admin privileges)
      const response = await fetch(`/api/admin/kpi?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch KPI data: ${response.statusText}`)
      }

      const data = await response.json()

      const kpiMetrics: KpiMetrics = {
        todaySales: data.todaySales || 0,
        monthlySales: data.monthlySales || 0,
        todaySalesChange: data.todaySalesChange || 0,
        monthlySalesChange: data.monthlySalesChange || 0,
        totalOrders: data.totalOrders || 0,
        ordersChange: data.ordersChange || 0,
        averageOrderValue: data.averageOrderValue || 0,
        aovChange: data.aovChange || 0,
        returningCustomersPercent: data.returningCustomersPercent || 0,
        returningCustomersChange: data.returningCustomersChange || 0,
        pendingOrders: data.pendingOrders || 0,
        pendingOrdersChange: data.pendingOrdersChange || 0,
        lowStockItems: data.lowStockItems || 0,
        lowStockItemsChange: data.lowStockItemsChange || 0,
        salesSparkline: data.salesSparkline || [0, 0, 0, 0, 0, 0, 0],
        ordersSparkline: data.ordersSparkline || [0, 0, 0, 0, 0, 0, 0]
      }

      setMetrics(kpiMetrics)
    } catch (err) {
      console.error('Error fetching KPI data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch KPI data')
      
      // Set mock data on error for UI continuity
      setMetrics({
        todaySales: 0,
        monthlySales: 0,
        todaySalesChange: 0,
        monthlySalesChange: 0,
        totalOrders: 0,
        ordersChange: 0,
        averageOrderValue: 0,
        aovChange: 0,
        returningCustomersPercent: 0,
        returningCustomersChange: 0,
        pendingOrders: 0,
        pendingOrdersChange: 0,
        lowStockItems: 0,
        lowStockItemsChange: 0,
        salesSparkline: [0, 0, 0, 0, 0, 0, 0],
        ordersSparkline: [0, 0, 0, 0, 0, 0, 0]
      })
    } finally {
      setLoading(false)
    }
  }, [lowStockThreshold])

  /**
   * Set up polling for real-time updates
   */
  useEffect(() => {
    // Initial fetch
    fetchKpiData()

    if (!enableRealtime) {
      // Fall back to polling only
      pollingRef.current = setInterval(fetchKpiData, pollingInterval)
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }
    }

    // Set up polling for updates (since we're using API route, we use polling instead of Supabase subscriptions)
    // The API route approach is more reliable for admin access and bypasses RLS
    pollingRef.current = setInterval(fetchKpiData, pollingInterval)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [enableRealtime, pollingInterval, fetchKpiData])

  return {
    metrics,
    loading,
    error,
    refresh: fetchKpiData
  }
}

