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

    // Get user ID from request headers if available
    const authHeader = request.headers.get('authorization')
    let userId = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)
        userId = user?.id
      } catch (error) {
        console.log('Could not verify user token:', error)
      }
    }

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
        payment_method: body.payment_method || 'cash',
        subtotal: body.subtotal,
        tax_amount: body.tax_amount || 0,
        shipping_amount: body.shipping_amount || 0,
        discount_amount: body.discount_amount || 0,
        total_amount: body.total_amount,
        currency: body.currency || 'UGX',
        shipping_address: body.shipping_address,
        billing_address: body.billing_address || body.shipping_address,
        notes: body.notes,
        order_date: new Date().toISOString(),
        user_id: userId, // Associate order with user if authenticated
        is_guest_order: !userId // Mark as guest order if no user
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create order items with validation
    console.log('Creating order items from:', JSON.stringify(body.items, null, 2))
    
    const orderItems = body.items.map(item => {
      // Validate and ensure all required fields are present
      // Check both 'price' and 'unit_price' fields for compatibility
      const unitPrice = typeof item.price === 'number' ? item.price : 
                       typeof item.unit_price === 'number' ? item.unit_price : 
                       parseFloat(item.price || item.unit_price) || 0
      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1
      const totalPrice = typeof item.total_price === 'number' ? item.total_price : (unitPrice * quantity)
      
      if (unitPrice <= 0) {
        throw new Error(`Invalid price for product ${item.product_name || item.product_id}: ${unitPrice}`)
      }
      
      if (quantity <= 0) {
        throw new Error(`Invalid quantity for product ${item.product_name || item.product_id}: ${quantity}`)
      }
      
      return {
        order_id: orderData.id,
        product_id: item.product_id,
        product_name: item.product_name || 'Unknown Product',
        product_sku: item.product_sku || `SKU-${item.product_id}`,
        quantity: quantity,
        price: unitPrice, // Database column is 'price', not 'unit_price'
        total_price: totalPrice,
        product_image: item.product_image || null
      }
    })
    
    console.log('Processed order items:', JSON.stringify(orderItems, null, 2))

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
