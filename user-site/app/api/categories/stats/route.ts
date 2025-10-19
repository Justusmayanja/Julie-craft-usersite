import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock category stats')
      return NextResponse.json({
        categories: [],
        summary: {
          total_categories: 0,
          active_categories: 0,
          inactive_categories: 0,
          total_products: 0,
          total_revenue: 0,
          total_inventory_value: 0,
          average_products_per_category: 0
        }
      })
    }

    // Fetch categories with product counts
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select(`
        id,
        name,
        description,
        is_active,
        sort_order,
        created_at,
        products:products(count)
      `)
      .order('sort_order', { ascending: true })

    if (categoriesError) {
      console.error('Database error fetching categories:', categoriesError)
      return NextResponse.json({ error: 'Failed to fetch category stats' }, { status: 500 })
    }

    // Fetch product statistics for each category
    const categoryStats = await Promise.all(
      (categories || []).map(async (category) => {
        // Get detailed product stats for this category
        const { data: products, error: productsError } = await supabaseAdmin
          .from('products')
          .select('id, price, stock_quantity, status')
          .eq('category_id', category.id)

        if (productsError) {
          console.error(`Error fetching products for category ${category.id}:`, productsError)
          return {
            id: category.id,
            name: category.name,
            description: category.description,
            is_active: category.is_active,
            sort_order: category.sort_order,
            created_at: category.created_at,
            total_products: 0,
            active_products: 0,
            inactive_products: 0,
            draft_products: 0,
            total_revenue: 0,
            total_inventory_value: 0,
            average_price: 0,
            low_stock_products: 0
          }
        }

        const productList = products || []
        const totalProducts = productList.length
        const activeProducts = productList.filter(p => p.status === 'active').length
        const inactiveProducts = productList.filter(p => p.status === 'inactive').length
        const draftProducts = productList.filter(p => p.status === 'draft').length
        const totalRevenue = productList.reduce((sum, p) => sum + (p.price || 0), 0)
        const totalInventoryValue = productList.reduce((sum, p) => sum + ((p.price || 0) * (p.stock_quantity || 0)), 0)
        const averagePrice = totalProducts > 0 ? totalRevenue / totalProducts : 0
        const lowStockProducts = productList.filter(p => (p.stock_quantity || 0) < 10).length

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          is_active: category.is_active,
          sort_order: category.sort_order,
          created_at: category.created_at,
          total_products: totalProducts,
          active_products: activeProducts,
          inactive_products: inactiveProducts,
          draft_products: draftProducts,
          total_revenue: totalRevenue,
          total_inventory_value: totalInventoryValue,
          average_price: averagePrice,
          low_stock_products: lowStockProducts
        }
      })
    )

    // Calculate summary statistics
    const totalCategories = categoryStats.length
    const activeCategories = categoryStats.filter(c => c.is_active).length
    const inactiveCategories = totalCategories - activeCategories
    const totalProducts = categoryStats.reduce((sum, c) => sum + c.total_products, 0)
    const totalRevenue = categoryStats.reduce((sum, c) => sum + c.total_revenue, 0)
    const totalInventoryValue = categoryStats.reduce((sum, c) => sum + c.total_inventory_value, 0)
    const averageProductsPerCategory = totalCategories > 0 ? totalProducts / totalCategories : 0

    const summary = {
      total_categories: totalCategories,
      active_categories: activeCategories,
      inactive_categories: inactiveCategories,
      total_products: totalProducts,
      total_revenue: totalRevenue,
      total_inventory_value: totalInventoryValue,
      average_products_per_category: averageProductsPerCategory
    }

    return NextResponse.json({
      categories: categoryStats,
      summary
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
