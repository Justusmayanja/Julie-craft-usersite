import { useState, useEffect, useCallback } from 'react'
import { 
  InventoryItem, 
  InventoryFilters, 
  InventoryListResponse, 
  InventoryStats,
  StockMovement,
  StockMovementCreateInput,
  BulkInventoryUpdate
} from '@/lib/types/inventory'

export function useInventory(filters: InventoryFilters = {}) {
  const [data, setData] = useState<InventoryListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInventory = useCallback(async (newFilters?: InventoryFilters) => {
    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      const currentFilters = newFilters || filters
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString())
        }
      })
      
      const response = await fetch(`/api/inventory?${queryParams.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch inventory')
      }
      
      const result = await response.json()
      setData(result)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching inventory:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  return {
    data,
    loading,
    error,
    refetch: fetchInventory,
  }
}

export function useInventoryItem(id: string) {
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchItem = useCallback(async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/inventory/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch inventory item')
      }
      
      const result = await response.json()
      setItem(result)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching inventory item:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchItem()
  }, [fetchItem])

  return {
    item,
    loading,
    error,
    refetch: fetchItem,
  }
}

export function useInventoryStats() {
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/inventory/stats')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch inventory stats')
      }
      
      const result = await response.json()
      setStats(result)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching inventory stats:', err)
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

export function useLowStockItems() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLowStockItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/inventory/low-stock')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch low stock items')
      }
      
      const result = await response.json()
      setItems(result.items)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching low stock items:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLowStockItems()
  }, [fetchLowStockItems])

  return {
    items,
    loading,
    error,
    refresh: fetchLowStockItems,
  }
}

export function useStockMovements(inventoryId?: string) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMovements = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const url = inventoryId 
        ? `/api/inventory/movements?inventory_id=${inventoryId}`
        : '/api/inventory/movements'
        
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch stock movements')
      }
      
      const result = await response.json()
      setMovements(result.movements)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching stock movements:', err)
    } finally {
      setLoading(false)
    }
  }, [inventoryId])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  const createMovement = useCallback(async (input: StockMovementCreateInput) => {
    try {
      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create stock movement')
      }
      
      const result = await response.json()
      
      // Refresh movements
      await fetchMovements()
      
      return result
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    }
  }, [fetchMovements])

  return {
    movements,
    loading,
    error,
    refetch: fetchMovements,
    createMovement,
  }
}

export function useInventoryBulk() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bulkUpdate = useCallback(async (update: BulkInventoryUpdate) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/inventory/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(update),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to perform bulk update')
      }
      
      const result = await response.json()
      return result
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const syncWithProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/inventory/sync', {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync inventory')
      }
      
      const result = await response.json()
      return result
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    bulkUpdate,
    syncWithProducts,
  }
}
