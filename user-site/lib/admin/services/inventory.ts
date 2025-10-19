import { createClient } from '@/lib/supabase/server'
import { 
  InventoryItem, 
  InventoryCreateInput, 
  InventoryUpdateInput, 
  InventoryFilters, 
  InventoryStats,
  InventoryListResponse,
  StockMovement,
  StockMovementCreateInput,
  BulkInventoryUpdate
} from '@/lib/types/inventory'

export class InventoryService {
  private async getSupabase() {
    return await createClient()
  }

  async getInventoryItems(filters: InventoryFilters = {}): Promise<InventoryListResponse> {
    const {
      search,
      status,
      category,
      supplier,
      movement_trend,
      min_stock,
      max_stock,
      min_value,
      max_value,
      low_stock,
      sort_by = 'product_name',
      sort_order = 'asc',
      page = 1,
      limit = 20
    } = filters

    const supabase = await this.getSupabase()
    let query = supabase
      .from('inventory')
      .select('*', { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`product_name.ilike.%${search}%,sku.ilike.%${search}%,category_name.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (category) {
      query = query.eq('category_name', category)
    }

    if (supplier) {
      query = query.eq('supplier', supplier)
    }

    if (movement_trend) {
      query = query.eq('movement_trend', movement_trend)
    }

    if (min_stock !== undefined) {
      query = query.gte('current_stock', min_stock)
    }

    if (max_stock !== undefined) {
      query = query.lte('current_stock', max_stock)
    }

    if (min_value !== undefined) {
      query = query.gte('total_value', min_value)
    }

    if (max_value !== undefined) {
      query = query.lte('total_value', max_value)
    }

    if (low_stock) {
      // For low stock, we'll filter in the application layer since Supabase doesn't support column comparison in filters
      // This will be handled after the query
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch inventory: ${error.message}`)
    }

    // Apply low stock filter in application layer if needed
    let filteredData = data || []
    if (low_stock) {
      filteredData = filteredData.filter(item => item.current_stock <= item.min_stock)
    }

    // Get statistics
    const stats = await this.getInventoryStats()

    return {
      items: filteredData,
      total: low_stock ? filteredData.length : (count || 0),
      page,
      limit,
      total_pages: Math.ceil((low_stock ? filteredData.length : (count || 0)) / limit),
      stats
    }
  }

  async getInventoryItem(id: string): Promise<InventoryItem> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch inventory item: ${error.message}`)
    }

    return data
  }

  async createInventoryItem(input: InventoryCreateInput): Promise<InventoryItem> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('inventory')
      .insert([input])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create inventory item: ${error.message}`)
    }

    return data
  }

  async updateInventoryItem(id: string, input: InventoryUpdateInput): Promise<InventoryItem> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('inventory')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update inventory item: ${error.message}`)
    }

    return data
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete inventory item: ${error.message}`)
    }
  }

  async getInventoryStats(): Promise<InventoryStats> {
    const supabase = await this.getSupabase()
    // Get basic counts
    const { data: basicStats, error: basicError } = await supabase
      .from('inventory')
      .select('status, current_stock, total_value, category_name, supplier, movement_trend')

    if (basicError) {
      throw new Error(`Failed to fetch inventory stats: ${basicError.message}`)
    }

    // Calculate statistics
    const totalItems = basicStats?.length || 0
    const totalValue = basicStats?.reduce((sum, item) => sum + (item.total_value || 0), 0) || 0
    const inStockItems = basicStats?.filter(item => item.status === 'in_stock').length || 0
    const lowStockItems = basicStats?.filter(item => item.status === 'low_stock').length || 0
    const outOfStockItems = basicStats?.filter(item => item.status === 'out_of_stock').length || 0
    const discontinuedItems = basicStats?.filter(item => item.status === 'discontinued').length || 0
    const averageStockLevel = totalItems > 0 ? basicStats?.reduce((sum, item) => sum + item.current_stock, 0) / totalItems : 0

    // Get reorder alerts - filter in application layer
    const reorderAlerts = basicStats?.filter(item => item.current_stock <= 10).length || 0

    // Get top categories
    const categoryStats = new Map()
    basicStats?.forEach(item => {
      if (item.category_name) {
        const current = categoryStats.get(item.category_name) || { item_count: 0, total_value: 0 }
        categoryStats.set(item.category_name, {
          item_count: current.item_count + 1,
          total_value: current.total_value + (item.total_value || 0)
        })
      }
    })

    const topCategories = Array.from(categoryStats.entries())
      .map(([category_name, stats]) => ({ category_name, ...stats }))
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 5)

    // Get top suppliers
    const supplierStats = new Map()
    basicStats?.forEach(item => {
      if (item.supplier) {
        const current = supplierStats.get(item.supplier) || { item_count: 0, total_value: 0 }
        supplierStats.set(item.supplier, {
          item_count: current.item_count + 1,
          total_value: current.total_value + (item.total_value || 0)
        })
      }
    })

    const topSuppliers = Array.from(supplierStats.entries())
      .map(([supplier, stats]) => ({ supplier, ...stats }))
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 5)

    // Get stock movements
    const stockMovements = {
      increasing: basicStats?.filter(item => item.movement_trend === 'increasing').length || 0,
      decreasing: basicStats?.filter(item => item.movement_trend === 'decreasing').length || 0,
      stable: basicStats?.filter(item => item.movement_trend === 'stable').length || 0
    }

    return {
      total_items: totalItems,
      total_value: totalValue,
      in_stock_items: inStockItems,
      low_stock_items: lowStockItems,
      out_of_stock_items: outOfStockItems,
      discontinued_items: discontinuedItems,
      total_products: totalItems, // Same as total_items for inventory
      average_stock_level: Math.round(averageStockLevel * 100) / 100,
      reorder_alerts: reorderAlerts,
      top_categories: topCategories,
      top_suppliers: topSuppliers,
      stock_movements: stockMovements
    }
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('current_stock', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch low stock items: ${error.message}`)
    }

    // Filter low stock items in application layer
    const lowStockItems = (data || []).filter(item => item.current_stock <= item.min_stock)
    return lowStockItems
  }

  async getStockMovements(inventoryId?: string): Promise<StockMovement[]> {
    try {
      const supabase = await this.getSupabase()
      let query = supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })

      if (inventoryId) {
        query = query.eq('inventory_id', inventoryId)
      }

      const { data, error } = await query

      if (error) {
        // If the table doesn't exist yet, return empty array
        if (error.message.includes('does not exist') || 
            error.message.includes('relation "stock_movements" does not exist') ||
            error.message.includes('column "inventory_id" does not exist')) {
          console.warn('Stock movements table does not exist yet. Please run the database migration.')
          return []
        }
        throw new Error(`Failed to fetch stock movements: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.warn('Error accessing stock movements table:', error)
      return []
    }
  }

  async createStockMovement(input: StockMovementCreateInput): Promise<StockMovement> {
    // Get current inventory item
    const inventoryItem = await this.getInventoryItem(input.inventory_id)
    
    // Calculate new stock
    let newStock = inventoryItem.current_stock
    if (input.movement_type === 'in') {
      newStock += input.quantity
    } else if (input.movement_type === 'out') {
      newStock -= input.quantity
    } else if (input.movement_type === 'adjustment') {
      newStock = input.quantity
    }

    // Create stock movement record
    const movementData = {
      ...input,
      previous_stock: inventoryItem.current_stock,
      new_stock: newStock,
      product_name: inventoryItem.product_name,
      sku: inventoryItem.sku,
      created_by: 'system' // TODO: Get from auth context
    }

    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('stock_movements')
      .insert([movementData])
      .select()
      .single()

    if (error) {
      // If the table doesn't exist yet, skip stock movement creation
      if (error.message.includes('does not exist') || 
          error.message.includes('relation "stock_movements" does not exist') ||
          error.message.includes('column "inventory_id" does not exist')) {
        console.warn('Stock movements table does not exist yet. Skipping movement creation. Please run the database migration.')
        // Still update the inventory item
        await this.updateInventoryItem(input.inventory_id, {
          current_stock: newStock,
          last_restocked: new Date().toISOString()
        })
        // Return a mock movement object
        return {
          id: 'temp-' + Date.now(),
          ...movementData,
          created_at: new Date().toISOString()
        } as StockMovement
      }
      throw new Error(`Failed to create stock movement: ${error.message}`)
    }

    // Update inventory stock
    await this.updateInventoryItem(input.inventory_id, {
      current_stock: newStock,
      last_restocked: new Date().toISOString()
    })

    return data
  }

  async bulkUpdateInventory(update: BulkInventoryUpdate): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = []
    let updated = 0

    for (const itemId of update.item_ids) {
      try {
        const item = await this.getInventoryItem(itemId)
        const updateData: InventoryUpdateInput = {}

        switch (update.action) {
          case 'update_stock':
            if (update.data.stock_adjustment !== undefined) {
              updateData.current_stock = item.current_stock + update.data.stock_adjustment
            }
            break
          case 'update_prices':
            if (update.data.new_price !== undefined) {
              updateData.unit_price = update.data.new_price
            }
            if (update.data.new_cost !== undefined) {
              updateData.unit_cost = update.data.new_cost
            }
            break
          case 'update_suppliers':
            if (update.data.new_supplier !== undefined) {
              updateData.supplier = update.data.new_supplier
            }
            break
          case 'update_status':
            if (update.data.new_status !== undefined) {
              updateData.status = update.data.new_status as 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
            }
            break
          case 'update_reorder_points':
            if (update.data.new_reorder_point !== undefined) {
              updateData.reorder_point = update.data.new_reorder_point
            }
            break
        }

        if (Object.keys(updateData).length > 0) {
          await this.updateInventoryItem(itemId, updateData)
          updated++
        }
      } catch (error) {
        errors.push(`Failed to update item ${itemId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { updated, errors }
  }

  async syncWithProducts(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = []
    let synced = 0

    try {
      const supabase = await this.getSupabase()
      // Get all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, category_id, price, cost_price, stock_quantity, min_stock_level, max_stock_level, reorder_point, status')

      if (productsError) {
        throw new Error(`Failed to fetch products: ${productsError.message}`)
      }

      // Get categories for product names
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')

      if (categoriesError) {
        throw new Error(`Failed to fetch categories: ${categoriesError.message}`)
      }

      const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || [])

      // Sync each product
      for (const product of products || []) {
        try {
          // Check if inventory item exists
          const { data: existingInventory } = await supabase
            .from('inventory')
            .select('id')
            .eq('product_id', product.id)
            .single()

          const inventoryData = {
            product_id: product.id,
            sku: product.sku || `PROD-${product.id.slice(0, 8)}`,
            product_name: product.name,
            category_name: product.category_id ? categoryMap.get(product.category_id) : undefined,
            current_stock: product.stock_quantity || 0,
            min_stock: product.min_stock_level || 5,
            max_stock: product.max_stock_level || 100,
            reorder_point: product.reorder_point || 10,
            unit_cost: product.cost_price,
            unit_price: product.price,
            status: product.status === 'active' ? 'in_stock' : 'discontinued'
          }

          if (existingInventory) {
            // Update existing inventory item
            await supabase
              .from('inventory')
              .update(inventoryData)
              .eq('id', existingInventory.id)
          } else {
            // Create new inventory item
            await supabase
              .from('inventory')
              .insert([inventoryData])
          }

          synced++
        } catch (error) {
          errors.push(`Failed to sync product ${product.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } catch (error) {
      errors.push(`Failed to sync with products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { synced, errors }
  }
}
