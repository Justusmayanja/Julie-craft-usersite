import { useState, useCallback } from 'react'
import { Product } from '@/lib/types/product'

interface BulkActionOptions {
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
}

interface UseProductBulkReturn {
  loading: boolean
  error: string | null
  selectedProducts: string[]
  setSelectedProducts: (ids: string[]) => void
  toggleProductSelection: (id: string) => void
  selectAllProducts: (products: Product[]) => void
  clearSelection: () => void
  bulkDelete: (productIds: string[], options?: BulkActionOptions) => Promise<void>
  bulkUpdateStatus: (productIds: string[], status: string, options?: BulkActionOptions) => Promise<void>
  bulkUpdatePrice: (productIds: string[], changeType: 'set' | 'increase' | 'decrease', value: number, options?: BulkActionOptions) => Promise<void>
  bulkUpdateCategory: (productIds: string[], categoryId: string | null, options?: BulkActionOptions) => Promise<void>
  bulkUpdateFeatured: (productIds: string[], featured: boolean, options?: BulkActionOptions) => Promise<void>
  exportProducts: (filters?: any, format?: 'csv' | 'json') => Promise<void>
  importProducts: (products: any[], updateExisting?: boolean, skipErrors?: boolean) => Promise<any>
}

export function useProductBulk(): UseProductBulkReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  const toggleProductSelection = useCallback((id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) 
        ? prev.filter(productId => productId !== id)
        : [...prev, id]
    )
  }, [])

  const selectAllProducts = useCallback((products: Product[]) => {
    setSelectedProducts(products.map(p => p.id))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedProducts([])
  }, [])

  const bulkDelete = useCallback(async (productIds: string[], options?: BulkActionOptions) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          product_ids: productIds
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete products')
      }

      const result = await response.json()
      options?.onSuccess?.(result)
      clearSelection()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      options?.onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [clearSelection])

  const bulkUpdateStatus = useCallback(async (productIds: string[], status: string, options?: BulkActionOptions) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_status',
          product_ids: productIds,
          status
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product status')
      }

      const result = await response.json()
      options?.onSuccess?.(result)
      clearSelection()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      options?.onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [clearSelection])

  const bulkUpdatePrice = useCallback(async (productIds: string[], changeType: 'set' | 'increase' | 'decrease', value: number, options?: BulkActionOptions) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_price',
          product_ids: productIds,
          price_change_type: changeType,
          price_change_value: value
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product prices')
      }

      const result = await response.json()
      options?.onSuccess?.(result)
      clearSelection()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      options?.onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [clearSelection])

  const bulkUpdateCategory = useCallback(async (productIds: string[], categoryId: string | null, options?: BulkActionOptions) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_category',
          product_ids: productIds,
          category_id: categoryId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product categories')
      }

      const result = await response.json()
      options?.onSuccess?.(result)
      clearSelection()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      options?.onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [clearSelection])

  const bulkUpdateFeatured = useCallback(async (productIds: string[], featured: boolean, options?: BulkActionOptions) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_featured',
          product_ids: productIds,
          featured
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update featured status')
      }

      const result = await response.json()
      options?.onSuccess?.(result)
      clearSelection()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      options?.onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [clearSelection])

  const exportProducts = useCallback(async (filters?: any, format: 'csv' | 'json' = 'csv') => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value))
          }
        })
      }
      params.append('format', format)

      const response = await fetch(`/api/products/export?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export products')
      }

      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `products-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const importProducts = useCallback(async (products: any[], updateExisting: boolean = false, skipErrors: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products,
          update_existing: updateExisting,
          skip_errors: skipErrors
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import products')
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
    selectedProducts,
    setSelectedProducts,
    toggleProductSelection,
    selectAllProducts,
    clearSelection,
    bulkDelete,
    bulkUpdateStatus,
    bulkUpdatePrice,
    bulkUpdateCategory,
    bulkUpdateFeatured,
    exportProducts,
    importProducts,
  }
}
