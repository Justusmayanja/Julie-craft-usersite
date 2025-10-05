import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { orderNumber } = params

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating order lookup')
      return NextResponse.json({
        order_number: orderNumber,
        status: 'pending',
        message: 'Order lookup simulated - database not configured'
      })
    }

    // Get order by order number
    const { data, error } = await supabaseAdmin
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
        shipped_date,
        delivered_date,
        tracking_number,
        shipping_address,
        order_items:order_items(
          id,
          product_name,
          quantity,
          unit_price,
          product_image
        )
      `)
      .eq('order_number', orderNumber)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      console.error('Order lookup error:', error)
      return NextResponse.json({ error: 'Failed to lookup order' }, { status: 500 })
    }

    // Return order with tracking information
    return NextResponse.json({
      order_number: data.order_number,
      customer_name: data.customer_name,
      status: data.status,
      payment_status: data.payment_status,
      total_amount: data.total_amount,
      order_date: data.order_date,
      shipped_date: data.shipped_date,
      delivered_date: data.delivered_date,
      tracking_number: data.tracking_number,
      shipping_address: data.shipping_address,
      items: data.order_items?.map((item: any) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        image: item.product_image
      })) || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
