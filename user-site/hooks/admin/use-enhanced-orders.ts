import { useState, useEffect, useCallback } from 'react'

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
}

interface OrderStatusHistory {
  id: string
  previous_status?: string
  new_status: string
  previous_payment_status?: string
  new_payment_status?: string
  changed_by?: string
  change_reason?: string
  notes?: string
  created_at: string
}

interface OrderNote {
  id: string
  note_type: 'general' | 'customer' | 'internal' | 'fulfillment' | 'payment' | 'shipping'
  content: string
  is_internal: boolean
  created_by?: string
  created_at: string
}

interface OrderTask {
  id: string
  task_type: 'inventory_check' | 'payment_verification' | 'shipping_preparation' | 'quality_control' | 'customer_contact' | 'custom'
  title: string
  description?: string
  assigned_to?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  due_date?: string
  completed_at?: string
  completion_notes?: string
  created_at: string
  updated_at: string
}

interface OrderReservation {
  id: string
  order_item_id: string
  product_id: string
  reserved_quantity: number
  reserved_at: string
  released_at?: string
  status: 'active' | 'released' | 'fulfilled'
}

interface OrderFulfillment {
  id: string
  order_item_id: string
  product_id: string
  fulfilled_quantity: number
  fulfillment_date: string
  fulfilled_by?: string
  fulfillment_method: 'manual' | 'automated'
  notes?: string
}

interface EnhancedOrder {
  id: string
  order_number: string
  customer_id?: string
  customer_email: string
  customer_name: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
  fulfillment_status: 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'shipped' | 'delivered'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  source: 'web' | 'phone' | 'email' | 'walk_in' | 'marketplace' | 'admin'
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
  fulfilled_at?: string
  notes?: string
  processing_notes?: string
  tracking_number?: string
  inventory_reserved: boolean
  reserved_at?: string
  version: number
  order_items: OrderItem[]
  order_status_history: OrderStatusHistory[]
  order_notes: OrderNote[]
  order_tasks: OrderTask[]
  order_item_reservations: OrderReservation[]
  order_fulfillment: OrderFulfillment[]
}

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  processingOrders: number
  shippedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  paidOrders: number
  unfulfilledOrders: number
  urgentOrders: number
}

interface EnhancedOrdersResponse {
  orders: EnhancedOrder[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: OrderStats
}

interface UseEnhancedOrdersOptions {
  search?: string
  status?: string
  payment_status?: string
  fulfillment_status?: string
  priority?: string
  source?: string
  date_from?: string
  date_to?: string
  customer_id?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  limit?: number
  page?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useEnhancedOrders(options: UseEnhancedOrdersOptions = {}) {
  const [data, setData] = useState<EnhancedOrdersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    search,
    status,
    payment_status,
    fulfillment_status,
    priority,
    source,
    date_from,
    date_to,
    customer_id,
    sort_by = 'order_date',
    sort_order = 'desc',
    limit = 20,
    page = 1,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (payment_status) params.append('payment_status', payment_status)
      if (fulfillment_status) params.append('fulfillment_status', fulfillment_status)
      if (priority) params.append('priority', priority)
      if (source) params.append('source', source)
      if (date_from) params.append('date_from', date_from)
      if (date_to) params.append('date_to', date_to)
      if (customer_id) params.append('customer_id', customer_id)
      if (sort_by) params.append('sort_by', sort_by)
      if (sort_order) params.append('sort_order', sort_order)
      if (limit) params.append('limit', limit.toString())
      if (page) params.append('page', page.toString())

      const response = await fetch(`/api/orders/enhanced?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching enhanced orders:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [
    search, status, payment_status, fulfillment_status, priority, source,
    date_from, date_to, customer_id, sort_by, sort_order, limit, page
  ])

  // Create order
  const createOrder = useCallback(async (orderData: any) => {
    try {
      setError(null)

      const response = await fetch('/api/orders/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const result = await response.json()
      
      // Refresh orders list
      await fetchOrders()
      
      return result
    } catch (error) {
      console.error('Error creating order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchOrders])

  // Update order
  const updateOrder = useCallback(async (orderId: string, updateData: any) => {
    try {
      setError(null)

      const response = await fetch(`/api/orders/${orderId}/enhanced`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update order')
      }

      const result = await response.json()
      
      // Refresh orders list
      await fetchOrders()
      
      return result
    } catch (error) {
      console.error('Error updating order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchOrders])

  // Delete order
  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/orders/${orderId}/enhanced`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete order')
      }

      const result = await response.json()
      
      // Refresh orders list
      await fetchOrders()
      
      return result
    } catch (error) {
      console.error('Error deleting order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete order'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchOrders])

  // Reserve inventory
  const reserveInventory = useCallback(async (orderId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/orders/${orderId}/reserve-inventory`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reserve inventory')
      }

      const result = await response.json()
      
      // Refresh orders list
      await fetchOrders()
      
      return result
    } catch (error) {
      console.error('Error reserving inventory:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to reserve inventory'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchOrders])

  // Release inventory
  const releaseInventory = useCallback(async (orderId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/orders/${orderId}/release-inventory`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to release inventory')
      }

      const result = await response.json()
      
      // Refresh orders list
      await fetchOrders()
      
      return result
    } catch (error) {
      console.error('Error releasing inventory:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to release inventory'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchOrders])

  // Fulfill order item
  const fulfillItem = useCallback(async (orderId: string, orderItemId: string, quantity: number, notes?: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/orders/${orderId}/fulfill-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_item_id: orderItemId,
          fulfilled_quantity: quantity,
          notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fulfill item')
      }

      const result = await response.json()
      
      // Refresh orders list
      await fetchOrders()
      
      return result
    } catch (error) {
      console.error('Error fulfilling item:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fulfill item'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchOrders])

  // Get single order
  const getOrder = useCallback(async (orderId: string): Promise<EnhancedOrder | null> => {
    try {
      setError(null)

      const response = await fetch(`/api/orders/${orderId}/enhanced`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch order')
      }

      const result = await response.json()
      return result.order
    } catch (error) {
      console.error('Error fetching order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch order'
      setError(errorMessage)
      return null
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchOrders, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchOrders])

  return {
    data,
    loading,
    error,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    reserveInventory,
    releaseInventory,
    fulfillItem,
    getOrder,
    clearError: () => setError(null)
  }
}
