import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

/**
 * Real-time Analytics API Route
 * 
 * Fetches analytics data using admin privileges (bypasses RLS)
 * Used by the real-time analytics hook for initial data fetch
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    // Get authorization token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid token' 
      }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required' 
      }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch orders
    let ordersQuery = supabaseAdmin
      .from('orders')
      .select('id, order_number, total_amount, status, payment_status, created_at, updated_at, user_id, customer_email, order_date')
      .order('created_at', { ascending: false })

    if (startDate && endDate) {
      ordersQuery = ordersQuery
        .gte('created_at', startDate)
        .lte('created_at', endDate)
    }

    const { data: ordersData, error: ordersError } = await ordersQuery

    if (ordersError) {
      console.error('Orders fetch error:', ordersError)
      return NextResponse.json({ 
        error: 'Failed to fetch orders',
        details: ordersError.message 
      }, { status: 500 })
    }

    // Fetch order items
    const orderIds = ordersData?.map(o => o.id) || []
    let itemsData: any[] = []
    
    if (orderIds.length > 0) {
      const { data, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('id, order_id, product_id, product_name, quantity, price, unit_price, total_price, created_at')
        .in('order_id', orderIds)

      if (itemsError) {
        console.error('Order items fetch error:', itemsError)
        return NextResponse.json({ 
          error: 'Failed to fetch order items',
          details: itemsError.message 
        }, { status: 500 })
      }
      
      itemsData = data || []
    }

    // Fetch products (for ordered products)
    const productIds = Array.from(new Set(itemsData?.map(i => i.product_id).filter(Boolean) || []))
    let productsData: any[] = []
    
    if (productIds.length > 0) {
      const { data, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id, name, category_name, category_id, stock_quantity, price, created_at')
        .in('id', productIds)

      if (productsError) {
        console.error('Products fetch error:', productsError)
        return NextResponse.json({ 
          error: 'Failed to fetch products',
          details: productsError.message 
        }, { status: 500 })
      }
      
      productsData = data || []
    }

    // Fetch all products for inventory
    const { data: allProductsData, error: allProductsError } = await supabaseAdmin
      .from('products')
      .select('id, name, category_name, category_id, stock_quantity, price, created_at')

    if (allProductsError) {
      console.warn('Error fetching all products:', allProductsError)
    }

    // Fetch categories (if table exists)
    let categoriesData: any[] | null = null
    try {
      const { data, error: categoriesError } = await supabaseAdmin
        .from('categories')
        .select('id, name, slug')
      
      if (!categoriesError && data) {
        categoriesData = data
      }
    } catch (err) {
      console.warn('Categories table not accessible:', err)
      categoriesData = null
    }

    return NextResponse.json({
      orders: ordersData || [],
      orderItems: itemsData || [],
      products: allProductsData || productsData || [],
      categories: categoriesData || []
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

