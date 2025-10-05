import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { Order, OrderFilters, CreateOrderData } from '@/lib/types/order'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning empty orders array')
      return NextResponse.json({
        orders: [],
        total: 0,
        limit: 50,
        offset: 0,
        message: 'Database not configured'
      })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filters: OrderFilters = {
      status: searchParams.get('status') as any || undefined,
      payment_status: searchParams.get('payment_status') as any || undefined,
      customer_email: searchParams.get('customer_email') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      sort_by: searchParams.get('sort_by') as any || 'order_date',
      sort_order: searchParams.get('sort_order') as any || 'desc',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
    }

    // Build query
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `, { count: 'exact' })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status)
    }

    if (filters.customer_email) {
      query = query.eq('customer_email', filters.customer_email)
    }

    if (filters.date_from) {
      query = query.gte('order_date', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('order_date', filters.date_to)
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({
      orders: data || [],
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating order creation')
      
      // Generate a mock order number
      const orderNumber = `ORD-${Date.now()}`
      
      return NextResponse.json({
        id: `mock-${Date.now()}`,
        order_number: orderNumber,
        message: 'Order created successfully (simulated - database not configured)',
        status: 'pending'
      }, { status: 201 })
    }

    const body: CreateOrderData = await request.json()

    // Validate required fields
    if (!body.customer_email || !body.customer_name || !body.shipping_address || !body.items.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Create order
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: body.customer_email,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        status: 'pending',
        payment_status: 'pending',
        subtotal: body.subtotal,
        tax_amount: body.tax_amount || 0,
        shipping_amount: body.shipping_amount || 0,
        discount_amount: body.discount_amount || 0,
        total_amount: body.total_amount,
        currency: body.currency || 'UGX',
        shipping_address: body.shipping_address,
        billing_address: body.billing_address || body.shipping_address,
        notes: body.notes,
        order_date: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create order items
    const orderItems = body.items.map(item => ({
      order_id: orderData.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items creation error:', itemsError)
      // Try to clean up the order
      await supabaseAdmin.from('orders').delete().eq('id', orderData.id)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // Return the complete order with items
    const { data: completeOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `)
      .eq('id', orderData.id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete order:', fetchError)
      return NextResponse.json({ error: 'Order created but failed to fetch details' }, { status: 500 })
    }

    return NextResponse.json(completeOrder, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
