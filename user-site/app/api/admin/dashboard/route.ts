import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

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

    // Fetch dashboard statistics
    // Total products
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Total orders
    const { count: totalOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })

    // Total customers (users with customer role or no admin flag)
    const { count: totalCustomers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false)

    // Total revenue
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('total')
      .eq('status', 'completed')

    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

    // Pending orders
    const { count: pendingOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Low stock products (stock < 10)
    const { count: lowStockProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lt('stock', 10)

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      totalCustomers: totalCustomers || 0,
      totalRevenue: totalRevenue || 0,
      pendingOrders: pendingOrders || 0,
      lowStockProducts: lowStockProducts || 0
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

