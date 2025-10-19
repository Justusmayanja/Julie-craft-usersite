import { useState, useEffect } from 'react'
import { Product, ProductFilters, ProductStats, Category } from '@/lib/types/product'

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
  total: number
  refetch: () => Promise<void>
}

interface UseProductStatsResult {
  stats: ProductStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseCategoriesResult {
  categories: Category[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProducts(filters: ProductFilters = {}): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })

      const response = await fetch(`/api/products?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      setProducts(data.products)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [JSON.stringify(filters)])

  return {
    products,
    loading,
    error,
    total,
    refetch: fetchProducts
  }
}

export function useProductStats(): UseProductStatsResult {
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/products/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch product stats')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/categories')
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  }
}

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/products/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found')
        }
        throw new Error('Failed to fetch product')
      }

      const data = await response.json()
      setProduct(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [id])

  return {
    product,
    loading,
    error,
    refetch: fetchProduct
  }
}
