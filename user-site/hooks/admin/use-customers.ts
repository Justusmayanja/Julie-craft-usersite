import { useState, useEffect, useCallback } from 'react'
import { Customer, CustomerFilters, CustomerStats, CustomerCreateInput, CustomerUpdateInput, CustomerListResponse } from '@/lib/types/customer'

interface UseCustomersOptions {
  initialFilters?: CustomerFilters
  autoFetch?: boolean
}

interface UseCustomersReturn {
  customers: Customer[]
  loading: boolean
  error: string | null
  total: number
  page: number
  limit: number
  hasMore: boolean
  filters: CustomerFilters
  setFilters: (filters: CustomerFilters) => void
  fetchCustomers: (newFilters?: CustomerFilters) => Promise<void>
  createCustomer: (data: CustomerCreateInput) => Promise<Customer>
  updateCustomer: (id: string, data: CustomerUpdateInput) => Promise<Customer>
  deleteCustomer: (id: string) => Promise<void>
  getCustomerById: (id: string) => Promise<Customer | null>
  refresh: () => Promise<void>
}

export function useCustomers(options: UseCustomersOptions = {}): UseCustomersReturn {
  const { initialFilters = {}, autoFetch = true } = options
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [hasMore, setHasMore] = useState(false)
  const [filters, setFiltersState] = useState<CustomerFilters>(initialFilters)

  const buildQueryString = useCallback((filters: CustomerFilters) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    
    return params.toString()
  }, [])

  const fetchCustomers = useCallback(async (newFilters?: CustomerFilters) => {
    setLoading(true)
    setError(null)
    
    try {
      const currentFilters = newFilters || filters
      const queryString = buildQueryString(currentFilters)
      const url = `/api/customers${queryString ? `?${queryString}` : ''}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch customers')
      }
      
      const data: CustomerListResponse = await response.json()
      
      setCustomers(data.customers)
      setTotal(data.total)
      setPage(data.page)
      setLimit(data.limit)
      setHasMore(data.has_more)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching customers:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, buildQueryString])

  const createCustomer = useCallback(async (data: CustomerCreateInput): Promise<Customer> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create customer')
      }
      
      const customer = await response.json()
      
      // Refresh the customers list
      await fetchCustomers()
      
      return customer
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchCustomers])

  const updateCustomer = useCallback(async (id: string, data: CustomerUpdateInput): Promise<Customer> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update customer')
      }
      
      const customer = await response.json()
      
      // Update the customer in the list
      setCustomers(prev => prev.map(c => c.id === id ? customer : c))
      
      return customer
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteCustomer = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete customer')
      }
      
      // Remove the customer from the list
      setCustomers(prev => prev.filter(c => c.id !== id))
      setTotal(prev => prev - 1)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getCustomerById = useCallback(async (id: string): Promise<Customer | null> => {
    try {
      const response = await fetch(`/api/customers/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch customer')
      }
      
      return await response.json()
      
    } catch (err) {
      console.error('Error fetching customer:', err)
      return null
    }
  }, [])

  const setFilters = useCallback((newFilters: CustomerFilters) => {
    setFiltersState(newFilters)
  }, [])

  const refresh = useCallback(async () => {
    await fetchCustomers()
  }, [fetchCustomers])

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchCustomers()
    }
  }, [autoFetch, fetchCustomers])

  return {
    customers,
    loading,
    error,
    total,
    page,
    limit,
    hasMore,
    filters,
    setFilters,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    refresh,
  }
}

// Hook for customer statistics
export function useCustomerStats() {
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/customers/stats')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch customer stats')
      }
      
      const data = await response.json()
      setStats(data)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching customer stats:', err)
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

// Hook for customer orders
export function useCustomerOrders(customerId: string, limit: number = 10) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!customerId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/customers/${customerId}/orders?limit=${limit}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch customer orders')
      }
      
      const data = await response.json()
      setOrders(data.orders || [])
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching customer orders:', err)
    } finally {
      setLoading(false)
    }
  }, [customerId, limit])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    error,
    refresh: fetchOrders,
  }
}
