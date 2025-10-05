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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const sessionId = searchParams.get('session_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId && !sessionId) {
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
          unit_price,
          product_image
        )
      `, { count: 'exact' })

    // Filter by user email or session
    if (userId) {
      // For registered users, we need to get the user's email first
      // Since userId might be an email or UUID, we'll try both approaches
      
      // First, check if userId looks like an email
      if (userId.includes('@')) {
        query = query.eq('customer_email', userId)
      } else {
        // If it's a UUID, we need to get the user's email from the users table
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', userId)
          .single()
        
        if (userError || !userData) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        
        query = query.eq('customer_email', userData.email)
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
        unit_price: item.unit_price,
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
