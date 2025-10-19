import { useState, useEffect, useCallback } from 'react'

interface EnhancedInventoryItem {
  id: string
  product_id: string
  product_name: string
  sku: string
  category_name: string
  current_quantity: number
  available_quantity: number
  reserved_quantity: number
  location: string
  warehouse: string
  reorder_point: number
  min_stock_level: number
  max_stock_level: number
  unit_cost: number
  unit_price: number
  total_value: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
  below_reorder_point: boolean
  last_updated: string
  created_at: string
  product_status: string
  category_id: string | null
  description: string | null
  weight: number | null
  dimensions: any | null
  supplier: string
  notes: string | null
}

interface InventorySummary {
  total_items: number
  in_stock: number
  low_stock: number
  out_of_stock: number
  below_reorder_point: number
  total_value: number
  total_quantity: number
}

interface EnhancedInventoryResponse {
  items: EnhancedInventoryItem[]
  summary: InventorySummary
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  filters: any
}

interface EnhancedInventoryFilters {
  search?: string
  status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
  location?: string
  category_id?: string
  sort_by?: 'product_name' | 'current_quantity' | 'available_quantity' | 'last_updated' | 'reorder_point'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
  show_low_stock_only?: boolean
  show_out_of_stock_only?: boolean
}

interface UseEnhancedInventoryOptions {
  filters?: EnhancedInventoryFilters
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseEnhancedInventoryReturn {
  data: EnhancedInventoryResponse | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useEnhancedInventory(options: UseEnhancedInventoryOptions = {}): UseEnhancedInventoryReturn {
  const { filters = {}, autoRefresh = false, refreshInterval = 300000 } = options // 5 minutes default

  const [data, setData] = useState<EnhancedInventoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInventory = useCallback(async () => {
    try {
      setError(null)
      
      const searchParams = new URLSearchParams()
      
      // Add filters to search params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/inventory/enhanced?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching enhanced inventory:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchInventory, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchInventory])

  return {
    data,
    loading,
    error,
    refresh: fetchInventory,
  }
}

// Hook for stock adjustments
interface StockAdjustment {
  product_id: string
  adjustment_type: 'increase' | 'decrease' | 'set'
  quantity: number
  reason: 'received' | 'damaged' | 'lost' | 'correction' | 'return' | 'sale' | 'transfer' | 'other'
  notes?: string
  reference?: string
}

interface UseStockAdjustmentReturn {
  adjustStock: (adjustment: StockAdjustment) => Promise<{ success: boolean; message: string; data?: any }>
  bulkAdjustStock: (adjustments: StockAdjustment[], reason?: string, notes?: string) => Promise<{ success: boolean; message: string; results?: any[]; errors?: any[] }>
  loading: boolean
  error: string | null
}

export function useStockAdjustment(): UseStockAdjustmentReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const adjustStock = useCallback(async (adjustment: StockAdjustment) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adjustment),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to adjust stock')
      }

      return { success: true, message: result.message, data: result.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust stock'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkAdjustStock = useCallback(async (adjustments: StockAdjustment[], reason?: string, notes?: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/inventory/adjust', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adjustments,
          reason,
          notes,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to bulk adjust stock')
      }

      return { 
        success: result.success, 
        message: result.message, 
        results: result.results, 
        errors: result.errors 
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk adjust stock'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    adjustStock,
    bulkAdjustStock,
    loading,
    error,
  }
}

// Hook for inventory history
interface InventoryAdjustment {
  id: string
  product_id: string
  product_name: string
  adjustment_type: 'increase' | 'decrease' | 'set'
  quantity_before: number
  quantity_after: number
  quantity_change: number
  reason: string
  notes: string | null
  reference: string | null
  user_id: string
  user_name: string
  created_at: string
}

interface InventoryHistoryResponse {
  adjustments: InventoryAdjustment[]
  summary: {
    total_adjustments: number
    total_increases: number
    total_decreases: number
    total_sets: number
    net_quantity_change: number
  }
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  filters: any
}

interface InventoryHistoryFilters {
  product_id?: string
  date_from?: string
  date_to?: string
  adjustment_type?: 'increase' | 'decrease' | 'set'
  reason?: string
  user_id?: string
  sort_by?: 'created_at' | 'quantity_change' | 'product_name'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface UseInventoryHistoryOptions {
  filters?: InventoryHistoryFilters
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseInventoryHistoryReturn {
  data: InventoryHistoryResponse | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useInventoryHistory(options: UseInventoryHistoryOptions = {}): UseInventoryHistoryReturn {
  const { filters = {}, autoRefresh = false, refreshInterval = 300000 } = options

  const [data, setData] = useState<InventoryHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [consecutiveTimeouts, setConsecutiveTimeouts] = useState(0)

  const fetchHistory = useCallback(async () => {
    // Don't fetch if we've had too many consecutive timeouts
    if (consecutiveTimeouts >= 3) {
      console.log('Skipping fetch due to consecutive timeouts')
      setError('Inventory history service unavailable - too many consecutive timeouts')
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      const searchParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/inventory/history?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout and better error handling
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!response.ok) {
        // Handle different error types
        if (response.status === 503) {
          // Service unavailable - table doesn't exist
          console.log('Inventory adjustments table not available, returning empty data')
          setData({
            adjustments: [],
            summary: {
              total_adjustments: 0,
              total_increases: 0,
              total_decreases: 0,
              total_sets: 0,
              net_quantity_change: 0,
            },
            pagination: {
              total: 0,
              page: 1,
              limit: 50,
              total_pages: 0,
              has_next: false,
              has_prev: false,
            },
            filters: {},
          })
          setError(null) // Clear any previous errors
          return
        }
        
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: `HTTP error! status: ${response.status}` }
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
      setRetryCount(0) // Reset retry count on success
      setConsecutiveTimeouts(0) // Reset timeout counter on success
    } catch (err) {
      console.error('Error fetching inventory history:', err)
      
      // Handle different types of errors
      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message.includes('timeout') || err.message.includes('TimeoutError')) {
          console.log('Request timeout - setting empty data')
          setConsecutiveTimeouts(prev => prev + 1)
          if (consecutiveTimeouts >= 2) {
            setError('Inventory history service unavailable - too many timeouts')
          } else {
            setError('Request timeout - inventory history unavailable')
          }
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          console.log('Network error - attempting retry')
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1)
            // Retry with exponential backoff
            setTimeout(() => {
              fetchHistory()
            }, Math.pow(2, retryCount) * 1000) // 1s, 2s, 4s delays
            return
          } else {
            setError('Network error - inventory history unavailable after retries')
          }
        } else if (err.message.includes('JSON')) {
          console.log('JSON parsing error, likely due to missing table - setting empty data')
          setError(null) // Clear error for missing table case
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to fetch inventory history')
      }
      
      // Set empty data on error to prevent UI breaking
      setData({
        adjustments: [],
        summary: {
          total_adjustments: 0,
          total_increases: 0,
          total_decreases: 0,
          total_sets: 0,
          net_quantity_change: 0,
        },
        pagination: {
          total: 0,
          page: 1,
          limit: 50,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
        filters: {},
      })
    } finally {
      setLoading(false)
    }
  }, [filters, consecutiveTimeouts])

  useEffect(() => {
    // Add a small delay to prevent rapid successive calls and network issues
    const timeoutId = setTimeout(() => {
      fetchHistory()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [fetchHistory])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchHistory, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchHistory])

  const refresh = useCallback(async () => {
    setConsecutiveTimeouts(0) // Reset timeout counter on manual refresh
    setRetryCount(0) // Reset retry count on manual refresh
    await fetchHistory()
  }, [fetchHistory])

  return {
    data,
    loading,
    error,
    refresh,
  }
}
