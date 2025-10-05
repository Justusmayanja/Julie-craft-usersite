import { useState, useEffect } from 'react'
import { fetchProducts, fetchCategories, type FrontendProduct, type Category, type ProductFilters } from '@/lib/api'

export function useProducts(filters: ProductFilters = {}) {
  const [products, setProducts] = useState<FrontendProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchProducts(filters)
        setProducts(response.products)
        setTotal(response.total)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [JSON.stringify(filters)])

  return { products, loading, error, total }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchCategories()
        setCategories(response.categories)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories')
        console.error('Error fetching categories:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  return { categories, loading, error }
}

export function useFeaturedProducts(limit: number = 8) {
  const [products, setProducts] = useState<FrontendProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchProducts({ featured: true, limit })
        setProducts(response.products)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch featured products')
        console.error('Error fetching featured products:', err)
      } finally {
        setLoading(false)
      }
    }

    loadFeaturedProducts()
  }, [limit])

  return { products, loading, error }
}
