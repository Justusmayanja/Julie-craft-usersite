import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning empty user orders')
      return NextResponse.json({
        orders: [],
        total: 0,
        limit: 50,
        offset: 0,
        message: 'Database not configured'
      })
    }

    // Verify JWT token if provided
    const authHeader = request.headers.get('authorization')
    let authenticatedUserId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
        if (!error && user) {
          authenticatedUserId = user.id
        }
      } catch (error) {
        console.error('Token verification failed:', error)
      }
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const sessionId = searchParams.get('session_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use authenticated user ID if available, otherwise fall back to URL parameter
    const targetUserId = authenticatedUserId || userId

    if (!targetUserId && !sessionId) {
      return NextResponse.json({ error: 'User ID or Session ID required' }, { status: 400 })
    }

    // Build query to get orders for user or session
    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        customer_email,
        customer_name,
        status,
        payment_status,
        total_amount,
        order_date,
        order_items:order_items(
          id,
          product_name,
          quantity,
          price,
          product_image
        )
      `, { count: 'exact' })

    // Filter by user ID or session
    if (targetUserId) {
      // For registered users, filter by user_id (which we now store in orders)
      // First, check if targetUserId looks like an email (for backward compatibility)
      if (targetUserId.includes('@')) {
        query = query.eq('customer_email', targetUserId)
      } else {
        // If it's a UUID, filter by user_id column
        query = query.eq('user_id', targetUserId)
      }
    } else if (sessionId) {
      // For guest sessions, we might need to store session_id with orders
      // For now, we'll return empty since guest orders don't have session tracking yet
      return NextResponse.json({
        orders: [],
        total: 0,
        limit,
        offset,
        message: 'Guest session orders not yet implemented'
      })
    }

    // Apply sorting and pagination
    query = query
      .order('order_date', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch user orders' }, { status: 500 })
    }

    // Transform data to match UserOrderHistory interface
    const transformedOrders = (data || []).map(order => ({
      order_id: order.id,
      order_number: order.order_number,
      order_date: order.order_date,
      status: order.status,
      total_amount: order.total_amount,
      item_count: order.order_items?.length || 0,
      items: order.order_items?.map((item: any) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price, // Database column is 'price', not 'unit_price'
        image: item.product_image
      })) || []
    }))

    return NextResponse.json({
      orders: transformedOrders,
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
