import { useState, useEffect } from 'react'

interface OrderItem {
  id: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  order_number: string
  customer_id?: string
  customer_email: string
  customer_name: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
  payment_method?: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  shipping_address?: any
  billing_address?: any
  order_date: string
  shipped_date?: string
  delivered_date?: string
  notes?: string
  tracking_number?: string
  order_items: OrderItem[]
}

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
}

interface OrdersResponse {
  orders: Order[]
  total: number
  limit: number
  offset: number
  stats: OrderStats
}

interface UseOrdersOptions {
  search?: string
  status?: string
  payment_status?: string
  date_from?: string
  date_to?: string
  customer_id?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useOrders(options: UseOrdersOptions = {}) {
  const [data, setData] = useState<OrdersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    search,
    status,
    payment_status,
    date_from,
    date_to,
    customer_id,
    sort_by = 'order_date',
    sort_order = 'desc',
    limit = 20,
    offset = 0,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (payment_status) params.append('payment_status', payment_status)
      if (date_from) params.append('date_from', date_from)
      if (date_to) params.append('date_to', date_to)
      if (customer_id) params.append('customer_id', customer_id)
      if (sort_by) params.append('sort_by', sort_by)
      if (sort_order) params.append('sort_order', sort_order)
      if (limit) params.append('limit', limit.toString())
      if (offset) params.append('offset', offset.toString())

      const response = await fetch(`/api/orders?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`)
      }

      const ordersData = await response.json()
      setData(ordersData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
      console.error('Orders fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [search, status, payment_status, date_from, date_to, customer_id, sort_by, sort_order, limit, offset])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchOrders, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, search, status, payment_status, date_from, date_to, customer_id, sort_by, sort_order, limit, offset])

  const refresh = () => {
    fetchOrders()
  }

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Failed to update order: ${response.statusText}`)
      }

      const updatedOrder = await response.json()
      
      // Update local state
      if (data) {
        setData({
          ...data,
          orders: data.orders.map(order => 
            order.id === orderId ? updatedOrder : order
          )
        })
      }

      return updatedOrder
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order')
      throw err
    }
  }

  const deleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete order: ${response.statusText}`)
      }

      // Update local state
      if (data) {
        setData({
          ...data,
          orders: data.orders.filter(order => order.id !== orderId),
          total: data.total - 1
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order')
      throw err
    }
  }

  return {
    data,
    loading,
    error,
    refresh,
    updateOrder,
    deleteOrder
  }
}
