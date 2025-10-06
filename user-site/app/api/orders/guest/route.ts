import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { GuestCheckoutData } from '@/lib/types/user'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guest_info, order_data }: { guest_info: GuestCheckoutData, order_data: any } = body

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating guest order creation')
      
      // Generate a mock order number
      const orderNumber = `ORD-${Date.now()}`
      
      return NextResponse.json({
        id: `mock-${Date.now()}`,
        order_number: orderNumber,
        message: 'Guest order created successfully (simulated - database not configured)',
        status: 'pending',
        guest_email: guest_info.email
      }, { status: 201 })
    }

    // Validate required fields
    if (!guest_info.email || !guest_info.name || !order_data.items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Create order with guest information
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: guest_info.email,
        customer_name: guest_info.name,
        customer_phone: guest_info.phone,
        status: 'pending',
        payment_status: 'pending',
        subtotal: order_data.subtotal || 0,
        tax_amount: order_data.tax_amount || 0,
        shipping_amount: order_data.shipping_amount || 0,
        discount_amount: order_data.discount_amount || 0,
        total_amount: order_data.total_amount || 0,
        currency: order_data.currency || 'UGX',
        shipping_address: guest_info.shipping_address,
        billing_address: guest_info.billing_address || guest_info.shipping_address,
        notes: order_data.notes,
        order_date: new Date().toISOString(),
        is_guest_order: true // Flag to identify guest orders
      })
      .select()
      .single()

    if (orderError) {
      console.error('Guest order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create guest order' }, { status: 500 })
    }

    // Create order items
    const orderItems = order_data.items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.product_id || item.id.toString(),
      product_name: item.product_name || item.name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      price: item.unit_price || item.price, // Database column is 'price', not 'unit_price'
      total_price: item.total_price || (item.price * item.quantity),
      product_image: item.product_image || item.image
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Guest order items creation error:', itemsError)
      // Try to clean up the order
      await supabaseAdmin.from('orders').delete().eq('id', orderData.id)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // Optionally save guest info for future orders if requested
    if (guest_info.save_for_future) {
      // Store guest info for potential future orders
      await supabaseAdmin
        .from('guest_customers')
        .upsert({
          email: guest_info.email,
          name: guest_info.name,
          phone: guest_info.phone,
          default_shipping_address: guest_info.shipping_address,
          default_billing_address: guest_info.billing_address,
          last_order_date: new Date().toISOString(),
          order_count: 1 // This would be incremented on subsequent orders
        }, {
          onConflict: 'email'
        })
    }

    // Return the complete order
    const { data: completeOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `)
      .eq('id', orderData.id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete guest order:', fetchError)
      return NextResponse.json({ error: 'Order created but failed to fetch details' }, { status: 500 })
    }

    return NextResponse.json(completeOrder, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
