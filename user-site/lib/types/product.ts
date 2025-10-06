export interface Product {
  id: string
  name: string
  description: string
  category_id: string
  category?: {
    id: string
    name: string
    description?: string
  }
  price: number
  cost_price?: number
  sku?: string
  stock_quantity: number
  status: 'active' | 'inactive' | 'draft'
  featured: boolean
  images?: string[]
  featured_image?: string
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit?: string
  }
  weight?: number
  tags?: string[]
  seo_title?: string
  seo_description?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  image_url?: string
  sort_order?: number
  is_active: boolean
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface ProductFilters {
  search?: string
  category_id?: string
  status?: 'active' | 'inactive' | 'draft'
  featured?: boolean
  min_price?: number
  max_price?: number
  low_stock?: boolean
  sort_by?: 'name' | 'price' | 'stock_quantity' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Frontend-compatible product interface (matches current hardcoded structure)
export interface FrontendProduct {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  description: string
  materials: string
  dimensions: string
  care: string
  cultural: string
  isNew: boolean
  onSale: boolean
  inStock: boolean
}
