import type { FrontendProduct, Category } from './types/product'

const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://your-domain.com/api'
  }
  
  // In development, use the current window location
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:3000/api'
}

export interface ProductsResponse {
  products: FrontendProduct[]
  total: number
  limit: number
  offset: number
}

export interface CategoriesResponse {
  categories: Category[]
  total: number
  limit: number
  offset: number
}

export interface ProductFilters {
  search?: string
  category_id?: string
  featured?: boolean
  min_price?: number
  max_price?: number
  low_stock?: boolean
  sort_by?: 'name' | 'price' | 'stock_quantity' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString())
    }
  })

  const url = `${getApiBaseUrl()}/products${params.toString() ? `?${params.toString()}` : ''}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // Add cache control for better performance
    next: { revalidate: 300 }, // Revalidate every 5 minutes
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`)
  }

  return response.json()
}

export async function fetchCategories(): Promise<CategoriesResponse> {
  const url = `${getApiBaseUrl()}/categories`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 3600 }, // Revalidate every hour
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`)
  }

  return response.json()
}

export async function fetchFeaturedProducts(limit: number = 8): Promise<FrontendProduct[]> {
  const response = await fetchProducts({ featured: true, limit })
  return response.products
}
