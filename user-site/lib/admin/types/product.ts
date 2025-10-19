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

export interface CreateProductData {
  name: string
  description: string
  category_id: string
  price: number
  cost_price?: number
  sku?: string
  stock_quantity: number
  status?: 'active' | 'inactive' | 'draft'
  featured?: boolean
  images?: string[]
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
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string
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

export interface ProductStats {
  total_products: number
  active_products: number
  low_stock_products: number
  total_inventory_value: number
  average_price: number
  featured_products: number
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
