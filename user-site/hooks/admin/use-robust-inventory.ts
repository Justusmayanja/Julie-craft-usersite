import { useState, useEffect, useCallback } from 'react'

// Types
interface ProductStock {
  id: string
  name: string
  sku: string
  physical_stock: number
  reserved_stock: number
  available_stock: number
  reorder_point: number
  reorder_quantity: number
  max_stock_level: number
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued' | 'on_hold'
  inventory_version: number
  last_stock_update: string
  stock_hold_reason?: string
  stock_hold_until?: string
}

interface StockReservation {
  id: string
  product_id: string
  order_id: string
  quantity_reserved: number
  reservation_status: 'active' | 'fulfilled' | 'cancelled' | 'expired'
  reserved_at: string
  expires_at?: string
  fulfilled_at?: string
  cancelled_at?: string
}

interface InventoryAuditLog {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  physical_stock_before: number
  physical_stock_after: number
  physical_stock_change: number
  reserved_stock_before: number
  reserved_stock_after: number
  reserved_stock_change: number
  available_stock_before: number
  available_stock_after: number
  available_stock_change: number
  operation_type: 'order_reservation' | 'order_fulfillment' | 'order_cancellation' | 'return_processing' | 'inventory_adjustment' | 'reorder_received' | 'damage_writeoff' | 'theft_loss' | 'counting_correction' | 'manual_adjustment'
  operation_reason: string
  quantity_affected: number
  order_id?: string
  adjustment_id?: string
  related_user_id?: string
  created_at: string
  notes?: string
}

interface InventoryAdjustment {
  id: string
  product_id: string
  adjustment_type: 'physical_count' | 'damage_writeoff' | 'theft_loss' | 'counting_error' | 'manual_correction' | 'supplier_return' | 'quality_control_reject'
  reason_code: string
  quantity_adjusted: number
  previous_physical_stock: number
  new_physical_stock: number
  approval_status: 'pending' | 'approved' | 'rejected'
  description: string
  supporting_documents?: string[]
  requested_by?: string
  approved_by?: string
  created_at: string
  approved_at?: string
  notes?: string
  products: {
    id: string
    name: string
    sku: string
  }
}

interface ReorderAlert {
  id: string
  product_id: string
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock'
  current_stock: number
  reorder_point: number
  suggested_reorder_quantity: number
  alert_status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  triggered_at: string
  acknowledged_by?: string
  acknowledged_at?: string
  resolved_at?: string
  notes?: string
  products: {
    id: string
    name: string
    sku: string
    physical_stock: number
    reserved_stock: number
    available_stock: number
  }
}

interface StockValidationResult {
  success: boolean
  available_stock: number
  requested_quantity: number
  can_fulfill: boolean
  error_code?: string
  error_message?: string
}

interface UseRobustInventoryReturn {
  // State
  products: ProductStock[]
  reservations: StockReservation[]
  auditLogs: InventoryAuditLog[]
  adjustments: InventoryAdjustment[]
  reorderAlerts: ReorderAlert[]
  loading: boolean
  error: string | null
  
  // Actions
  reserveStock: (productId: string, orderId: string, quantity: number) => Promise<StockValidationResult>
  fulfillOrder: (productId: string, orderId: string, quantity: number) => Promise<StockValidationResult>
  cancelReservation: (productId: string, orderId: string) => Promise<StockValidationResult>
  processReturn: (productId: string, orderId: string, quantity: number, reason?: string) => Promise<StockValidationResult>
  createAdjustment: (adjustment: Omit<InventoryAdjustment, 'id' | 'created_at' | 'approved_at'>) => Promise<InventoryAdjustment>
  approveAdjustment: (adjustmentId: string, status: 'approved' | 'rejected', notes?: string) => Promise<void>
  updateAlertStatus: (alertId: string, status: 'acknowledged' | 'resolved' | 'dismissed', notes?: string) => Promise<void>
  validateStock: (productId: string, quantity: number) => Promise<StockValidationResult>
  
  // Data fetching
  fetchProducts: (productId?: string, includeReservations?: boolean, includeAuditLog?: boolean) => Promise<void>
  fetchAuditLogs: (filters?: {
    productId?: string
    orderId?: string
    operationType?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }) => Promise<void>
  fetchAdjustments: (filters?: {
    productId?: string
    status?: string
    limit?: number
    offset?: number
  }) => Promise<void>
  fetchReorderAlerts: (filters?: {
    productId?: string
    alertType?: string
    status?: string
    limit?: number
    offset?: number
  }) => Promise<void>
  
  // Utilities
  refreshData: () => Promise<void>
  clearError: () => void
}

export function useRobustInventory(): UseRobustInventoryReturn {
  const [products, setProducts] = useState<ProductStock[]>([])
  const [reservations, setReservations] = useState<StockReservation[]>([])
  const [auditLogs, setAuditLogs] = useState<InventoryAuditLog[]>([])
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([])
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear error function
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Reserve stock for an order
  const reserveStock = useCallback(async (
    productId: string, 
    orderId: string, 
    quantity: number
  ): Promise<StockValidationResult> => {
    try {
      setError(null)
      const response = await fetch('/api/inventory/robust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          order_id: orderId,
          quantity
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          available_stock: 0,
          requested_quantity: quantity,
          can_fulfill: false,
          error_code: data.error_code,
          error_message: data.error
        }
      }

      // Refresh products data
      await fetchProducts()

      return {
        success: true,
        available_stock: data.available_stock_after,
        requested_quantity: quantity,
        can_fulfill: true
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reserve stock'
      setError(errorMessage)
      return {
        success: false,
        available_stock: 0,
        requested_quantity: quantity,
        can_fulfill: false,
        error_message: errorMessage
      }
    }
  }, [])

  // Fulfill an order (ship products)
  const fulfillOrder = useCallback(async (
    productId: string, 
    orderId: string, 
    quantity: number
  ): Promise<StockValidationResult> => {
    try {
      setError(null)
      const response = await fetch('/api/inventory/robust', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          order_id: orderId,
          quantity
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          available_stock: 0,
          requested_quantity: quantity,
          can_fulfill: false,
          error_code: data.error_code,
          error_message: data.error
        }
      }

      // Refresh products data
      await fetchProducts()

      return {
        success: true,
        available_stock: data.available_stock_after,
        requested_quantity: quantity,
        can_fulfill: true
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fulfill order'
      setError(errorMessage)
      return {
        success: false,
        available_stock: 0,
        requested_quantity: quantity,
        can_fulfill: false,
        error_message: errorMessage
      }
    }
  }, [])

  // Cancel order reservation
  const cancelReservation = useCallback(async (
    productId: string, 
    orderId: string
  ): Promise<StockValidationResult> => {
    try {
      setError(null)
      const response = await fetch('/api/inventory/robust', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          order_id: orderId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          available_stock: 0,
          requested_quantity: 0,
          can_fulfill: false,
          error_code: data.error_code,
          error_message: data.error
        }
      }

      // Refresh products data
      await fetchProducts()

      return {
        success: true,
        available_stock: data.available_stock_after,
        requested_quantity: 0,
        can_fulfill: true
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel reservation'
      setError(errorMessage)
      return {
        success: false,
        available_stock: 0,
        requested_quantity: 0,
        can_fulfill: false,
        error_message: errorMessage
      }
    }
  }, [])

  // Process stock return
  const processReturn = useCallback(async (
    productId: string, 
    orderId: string, 
    quantity: number, 
    reason?: string
  ): Promise<StockValidationResult> => {
    try {
      setError(null)
      const response = await fetch('/api/inventory/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          order_id: orderId,
          quantity,
          reason
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          available_stock: 0,
          requested_quantity: quantity,
          can_fulfill: false,
          error_code: data.error_code,
          error_message: data.error
        }
      }

      // Refresh products data
      await fetchProducts()

      return {
        success: true,
        available_stock: data.available_stock_after,
        requested_quantity: quantity,
        can_fulfill: true
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process return'
      setError(errorMessage)
      return {
        success: false,
        available_stock: 0,
        requested_quantity: quantity,
        can_fulfill: false,
        error_message: errorMessage
      }
    }
  }, [])

  // Create inventory adjustment
  const createAdjustment = useCallback(async (
    adjustment: Omit<InventoryAdjustment, 'id' | 'created_at' | 'approved_at'>
  ): Promise<InventoryAdjustment> => {
    try {
      setError(null)
      const response = await fetch('/api/inventory/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adjustment)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create adjustment')
      }

      // Refresh adjustments data
      await fetchAdjustments()

      return data.adjustment

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create adjustment'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Approve inventory adjustment
  const approveAdjustment = useCallback(async (
    adjustmentId: string, 
    status: 'approved' | 'rejected', 
    notes?: string
  ): Promise<void> => {
    try {
      setError(null)
      const response = await fetch('/api/inventory/adjustments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adjustment_id: adjustmentId,
          approval_status: status,
          notes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve adjustment')
      }

      // Refresh adjustments and products data
      await Promise.all([
        fetchAdjustments(),
        fetchProducts()
      ])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve adjustment'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Update reorder alert status
  const updateAlertStatus = useCallback(async (
    alertId: string, 
    status: 'acknowledged' | 'resolved' | 'dismissed', 
    notes?: string
  ): Promise<void> => {
    try {
      setError(null)
      const response = await fetch('/api/inventory/reorder-alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert_id: alertId,
          alert_status: status,
          notes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update alert status')
      }

      // Refresh alerts data
      await fetchReorderAlerts()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update alert status'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Validate stock availability
  const validateStock = useCallback(async (
    productId: string, 
    quantity: number
  ): Promise<StockValidationResult> => {
    try {
      const product = products.find(p => p.id === productId)
      
      if (!product) {
        return {
          success: false,
          available_stock: 0,
          requested_quantity: quantity,
          can_fulfill: false,
          error_message: 'Product not found'
        }
      }

      if (product.stock_status === 'discontinued' || product.stock_status === 'on_hold') {
        return {
          success: false,
          available_stock: product.available_stock,
          requested_quantity: quantity,
          can_fulfill: false,
          error_message: 'Product not available for orders'
        }
      }

      if (product.available_stock < quantity) {
        return {
          success: false,
          available_stock: product.available_stock,
          requested_quantity: quantity,
          can_fulfill: false,
          error_message: 'Insufficient stock available'
        }
      }

      return {
        success: true,
        available_stock: product.available_stock,
        requested_quantity: quantity,
        can_fulfill: true
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate stock'
      return {
        success: false,
        available_stock: 0,
        requested_quantity: quantity,
        can_fulfill: false,
        error_message: errorMessage
      }
    }
  }, [products])

  // Fetch products
  const fetchProducts = useCallback(async (
    productId?: string, 
    includeReservations = true, 
    includeAuditLog = false
  ): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (productId) params.append('product_id', productId)
      if (includeReservations) params.append('include_reservations', 'true')
      if (includeAuditLog) params.append('include_audit_log', 'true')

      const response = await fetch(`/api/inventory/robust?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products')
      }

      setProducts(data.products || [])
      setReservations(data.reservations || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async (filters?: {
    productId?: string
    orderId?: string
    operationType?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.productId) params.append('product_id', filters.productId)
      if (filters?.orderId) params.append('order_id', filters.orderId)
      if (filters?.operationType) params.append('operation_type', filters.operationType)
      if (filters?.startDate) params.append('start_date', filters.startDate)
      if (filters?.endDate) params.append('end_date', filters.endDate)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/inventory/audit?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch audit logs')
      }

      setAuditLogs(data.audit_logs || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch audit logs'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch adjustments
  const fetchAdjustments = useCallback(async (filters?: {
    productId?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.productId) params.append('product_id', filters.productId)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/inventory/adjustments?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch adjustments')
      }

      setAdjustments(data.adjustments || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch adjustments'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch reorder alerts
  const fetchReorderAlerts = useCallback(async (filters?: {
    productId?: string
    alertType?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.productId) params.append('product_id', filters.productId)
      if (filters?.alertType) params.append('alert_type', filters.alertType)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/inventory/reorder-alerts?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reorder alerts')
      }

      setReorderAlerts(data.alerts || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reorder alerts'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh all data
  const refreshData = useCallback(async (): Promise<void> => {
    await Promise.all([
      fetchProducts(),
      fetchAuditLogs(),
      fetchAdjustments(),
      fetchReorderAlerts()
    ])
  }, [fetchProducts, fetchAuditLogs, fetchAdjustments, fetchReorderAlerts])

  // Initial data load
  useEffect(() => {
    refreshData()
  }, [refreshData])

  return {
    // State
    products,
    reservations,
    auditLogs,
    adjustments,
    reorderAlerts,
    loading,
    error,
    
    // Actions
    reserveStock,
    fulfillOrder,
    cancelReservation,
    processReturn,
    createAdjustment,
    approveAdjustment,
    updateAlertStatus,
    validateStock,
    
    // Data fetching
    fetchProducts,
    fetchAuditLogs,
    fetchAdjustments,
    fetchReorderAlerts,
    
    // Utilities
    refreshData,
    clearError
  }
}
