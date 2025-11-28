"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { Order, OrderItem, Product, Category } from "@/lib/types/analytics"
import {
  groupByDay,
  groupByWeek,
  groupByMonth,
  detectTimeGrouping,
  sumRevenue,
  groupByCategory,
  sortTopSelling,
  getStatusColor,
  getInventoryStatus
} from "@/lib/analytics-helpers"

/**
 * Real-time Analytics Data Hook
 * 
 * Fetches and subscribes to real-time updates for analytics data
 * from Supabase tables (orders, order_items, products, categories)
 */

interface UseRealtimeAnalyticsOptions {
  timeRange?: {
    start: Date
    end: Date
  }
  enableRealtime?: boolean
}

export function useRealtimeAnalytics(options: UseRealtimeAnalyticsOptions = {}) {
  const { timeRange, enableRealtime = true } = options
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data state
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  // Subscription refs
  const ordersChannelRef = useRef<any>(null)
  const productsChannelRef = useRef<any>(null)
  const orderItemsChannelRef = useRef<any>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Fetch initial data using API route (with admin privileges)
   */
  const fetchData = useCallback(async () => {
    try {
      setError(null)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (timeRange) {
        params.append('startDate', timeRange.start.toISOString())
        params.append('endDate', timeRange.end.toISOString())
      }

      // Get auth token
      const token = localStorage.getItem('julie-crafts-token')
      if (!token) {
        setError('Authentication required')
        setLoading(false)
        return
      }

      // Fetch data from API route (uses admin privileges)
      const response = await fetch(`/api/admin/analytics/realtime?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch data: ${response.statusText}`)
      }

      const data = await response.json()

      setOrders(data.orders || [])
      setOrderItems(data.orderItems || [])
      setProducts(data.products || [])
      setCategories(data.categories || [])

    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  /**
   * Set up real-time subscriptions
   */
  useEffect(() => {
    // Initial fetch
    fetchData()

    if (!enableRealtime || !supabase) {
      // Fallback to polling if realtime is disabled or supabase is not available
      pollingRef.current = setInterval(fetchData, 30000)
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }
    }

    // Subscribe to orders changes
    ordersChannelRef.current = supabase
      .channel('analytics-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    // Subscribe to products changes
    productsChannelRef.current = supabase
      .channel('analytics-products')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    // Subscribe to order_items changes
    orderItemsChannelRef.current = supabase
      .channel('analytics-order-items')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    // Fallback polling in case subscriptions fail
    pollingRef.current = setInterval(fetchData, 30000)

    return () => {
      const supabaseClient = supabase
      if (supabaseClient) {
        if (ordersChannelRef.current) {
          supabaseClient.removeChannel(ordersChannelRef.current)
        }
        if (productsChannelRef.current) {
          supabaseClient.removeChannel(productsChannelRef.current)
        }
        if (orderItemsChannelRef.current) {
          supabaseClient.removeChannel(orderItemsChannelRef.current)
        }
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [enableRealtime, fetchData])

  return {
    orders,
    orderItems,
    products,
    categories,
    loading,
    error,
    refresh: fetchData
  }
}

