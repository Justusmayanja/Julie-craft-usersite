import { createClient } from '@/lib/supabase/client'
import { Product, CreateProductData, ProductFilters, ProductStats, Category } from '@/lib/types/product'
import { productFiltersSchema } from '@/lib/validations/product'

export class ProductService {
  private supabase = createClient()

  async getProducts(filters: ProductFilters = {}): Promise<{ products: Product[], total: number }> {
    try {
      // Validate filters
      const validatedFilters = productFiltersSchema.parse(filters)
      
      let query = this.supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `, { count: 'exact' })

      // Apply filters
      if (validatedFilters.search) {
        query = query.or(`name.ilike.%${validatedFilters.search}%,description.ilike.%${validatedFilters.search}%,sku.ilike.%${validatedFilters.search}%`)
      }

      if (validatedFilters.category_id) {
        query = query.eq('category_id', validatedFilters.category_id)
      }

      if (validatedFilters.status) {
        query = query.eq('status', validatedFilters.status)
      }

      if (validatedFilters.featured !== undefined) {
        query = query.eq('featured', validatedFilters.featured)
      }

      if (validatedFilters.min_price !== undefined) {
        query = query.gte('price', validatedFilters.min_price)
      }

      if (validatedFilters.max_price !== undefined) {
        query = query.lte('price', validatedFilters.max_price)
      }

      if (validatedFilters.low_stock) {
        query = query.lte('stock_quantity', 5) // Assuming low stock threshold is 5
      }

      // Apply sorting
      query = query.order(validatedFilters.sort_by, { ascending: validatedFilters.sort_order === 'asc' })

      // Apply pagination
      query = query.range(validatedFilters.offset, validatedFilters.offset + validatedFilters.limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`)
      }

      return {
        products: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  async getProduct(id: string): Promise<Product> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(`Failed to fetch product: ${error.message}`)
      }

      if (!data) {
        throw new Error('Product not found')
      }

      return data
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  async createProduct(productData: CreateProductData): Promise<Product> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .insert(productData)
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) {
        throw new Error(`Failed to create product: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  async updateProduct(id: string, productData: Partial<CreateProductData>): Promise<Product> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) {
        throw new Error(`Failed to update product: ${error.message}`)
      }

      if (!data) {
        throw new Error('Product not found')
      }

      return data
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete product: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  async getProductStats(): Promise<ProductStats> {
    try {
      // Get total products
      const { count: totalProducts } = await this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      // Get active products
      const { count: activeProducts } = await this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Get low stock products
      const { count: lowStockProducts } = await this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lte('stock_quantity', 5)

      // Get featured products
      const { count: featuredProducts } = await this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('featured', true)

      // Get inventory value and average price
      const { data: priceData, error: priceError } = await this.supabase
        .from('products')
        .select('price, stock_quantity')

      if (priceError) {
        throw new Error(`Failed to fetch price data: ${priceError.message}`)
      }

      const totalInventoryValue = priceData?.reduce((sum, product) => {
        return sum + (product.price * product.stock_quantity)
      }, 0) || 0

      const averagePrice = priceData?.length ? 
        priceData.reduce((sum, product) => sum + product.price, 0) / priceData.length : 0

      return {
        total_products: totalProducts || 0,
        active_products: activeProducts || 0,
        low_stock_products: lowStockProducts || 0,
        total_inventory_value: totalInventoryValue,
        average_price: averagePrice,
        featured_products: featuredProducts || 0
      }
    } catch (error) {
      console.error('Error fetching product stats:', error)
      throw error
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch categories: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  async createCategory(categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create category: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }

  async updateCategory(id: string, categoryData: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>): Promise<Category> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .update({
          ...categoryData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update category: ${error.message}`)
      }

      if (!data) {
        throw new Error('Category not found')
      }

      return data
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      // Check if category has products
      const { count } = await this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id)

      if (count && count > 0) {
        throw new Error('Cannot delete category with existing products')
      }

      const { error } = await this.supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete category: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }
}

export const productService = new ProductService()
