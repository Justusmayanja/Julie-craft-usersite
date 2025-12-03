"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  avatar: string
  avatar_url?: string | null
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  totalOrders: number
  totalSpent: number
  lastOrderDate?: string
  joinDate: string
  status: 'active' | 'inactive' | 'blocked'
  isVip: boolean
  tags: string[]
}

export interface CustomerFilters {
  search?: string
  status?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
  includeArchived?: boolean
}

export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  newCustomersThisMonth: number
  vipCustomers: number
  averageOrderValue: number
  totalRevenue: number
  topCountries: Array<{ country: string; count: number }>
  customerGrowth: number
}

export interface CustomersResponse {
  customers: Customer[]
  total: number
  limit: number
  offset: number
  message?: string
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const { token } = useAuth()

  const fetchCustomers = useCallback(async (filters: CustomerFilters = {}) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.sort_order) params.append('sort_order', filters.sort_order)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())
      if (filters.includeArchived) params.append('include_archived', 'true')

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/customers?${params.toString()}`, {
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`)
      }

      const data: CustomersResponse = await response.json()
      setCustomers(data.customers)
      setTotal(data.total)

    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }, [token])

  const refresh = useCallback(() => {
    fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return {
    customers,
    loading,
    error,
    total,
    fetchCustomers,
    refresh
  }
}

export function useCustomerStats() {
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/customers/stats', {
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch customer stats: ${response.statusText}`)
      }

      const data: CustomerStats = await response.json()
      setStats(data)

    } catch (err) {
      console.error('Error fetching customer stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch customer stats')
    } finally {
      setLoading(false)
    }
  }, [token])

  const refresh = useCallback(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    fetchStats,
    refresh
  }
}

export function useCustomer(id: string) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  const fetchCustomer = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/customers/${id}`, {
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch customer: ${response.statusText}`)
      }

      const data: Customer = await response.json()
      setCustomer(data)

    } catch (err) {
      console.error('Error fetching customer:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch customer')
    } finally {
      setLoading(false)
    }
  }, [token, id])

  const updateCustomer = useCallback(async (updates: Partial<Customer>) => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Failed to update customer: ${response.statusText}`)
      }

      const data: Customer = await response.json()
      setCustomer(data)
      return data

    } catch (err) {
      console.error('Error updating customer:', err)
      setError(err instanceof Error ? err.message : 'Failed to update customer')
      throw err
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  return {
    customer,
    loading,
    error,
    fetchCustomer,
    updateCustomer
  }
}