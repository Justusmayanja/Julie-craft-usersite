import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { Order, OrderFilters, CreateOrderData } from '@/lib/types/order'
import { createOrderNotifications } from '@/lib/notifications'
import { sendNewOrderNotificationEmail } from '@/lib/email-service'

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
        stats: {
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          completedOrders: 0
        },
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

    // Build query for orders
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
    query = query.order(filters.sort_by || 'order_date', { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Fetch customer profiles separately
    const customerIds = [...new Set((data || [])
      .map((order: any) => order.customer_id || order.user_id)
      .filter((id: any) => id !== null && id !== undefined)
    )]

    let customerProfiles: Record<string, any> = {}
    
    if (customerIds.length > 0) {
      const { data: profilesData } = await supabaseAdmin
        .from('profiles')
        .select('id, avatar_url, first_name, last_name, full_name')
        .in('id', customerIds)

      if (profilesData) {
        profilesData.forEach((profile: any) => {
          customerProfiles[profile.id] = profile
        })
      }
    }

    // Process orders to include customer avatar_url
    const orders = (data || []).map((order: any) => {
      const customerId = order.customer_id || order.user_id
      const customer = customerId ? customerProfiles[customerId] : null
      return {
        ...order,
        customer: customer ? {
          avatar_url: customer.avatar_url,
          first_name: customer.first_name,
          last_name: customer.last_name,
          full_name: customer.full_name
        } : null,
        customer_avatar_url: customer?.avatar_url || null
      }
    })
    
    const stats = {
      totalOrders: count || 0,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      completedOrders: orders.filter(order => order.status === 'delivered').length
    }

    return NextResponse.json({
      orders,
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset,
      stats
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

    // Convert address objects to JSON strings as database expects text type
    const shippingAddressText = typeof body.shipping_address === 'string' 
      ? body.shipping_address 
      : JSON.stringify(body.shipping_address)
    const billingAddressText = typeof body.billing_address === 'string'
      ? (body.billing_address || shippingAddressText)
      : JSON.stringify(body.billing_address || body.shipping_address)

    // Prepare order items for RPC function
    const orderItems = body.items.map(item => {
      // Validate and ensure all required fields are present
      const unitPrice = typeof item.price === 'number' ? item.price : 
                       typeof (item as any).unit_price === 'number' ? (item as any).unit_price : 
                       parseFloat(item.price || (item as any).unit_price) || 0
      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1
      const totalPrice = typeof item.total_price === 'number' ? item.total_price : (unitPrice * quantity)
      
      if (unitPrice <= 0) {
        throw new Error(`Invalid price for product ${item.product_name || item.product_id}: ${unitPrice}`)
      }
      
      if (quantity <= 0) {
        throw new Error(`Invalid quantity for product ${item.product_name || item.product_id}: ${quantity}`)
      }
      
      return {
        product_id: item.product_id,
        product_name: item.product_name || 'Unknown Product',
        product_sku: item.product_sku || `SKU-${item.product_id}`,
        quantity: quantity,
        price: unitPrice,
        total_price: totalPrice,
        product_image: item.product_image || null
      }
    })

    // Get reservation IDs from request if available (from cart context)
    const reservationIds = (body as any).reservation_ids || null

    // Call the atomic order creation function
    // This function handles: stock validation, inventory deduction, order creation, and order items
    // all in a single database transaction
    // Note: Parameter order matters - required params first, then optional ones
    console.log('Calling atomic order creation function...')
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('create_order_atomic', {
      // Required parameters (must be in this order)
      p_order_number: orderNumber,
      p_customer_email: body.customer_email,
      p_customer_name: body.customer_name,
      p_subtotal: body.subtotal,
      p_total_amount: body.total_amount,
      p_shipping_address: shippingAddressText,
      p_billing_address: billingAddressText,
      p_order_items: orderItems,
      // Optional parameters (can be in any order when using named parameters)
      p_customer_phone: body.customer_phone || null,
      p_user_id: userId,
      p_customer_id: userId,
      p_is_guest_order: !userId,
      p_payment_method: body.payment_method || 'cash',
      p_tax_amount: body.tax_amount || 0,
      p_shipping_amount: body.shipping_amount || 0,
      p_discount_amount: body.discount_amount || 0,
      p_currency: body.currency || 'UGX',
      p_notes: body.notes || null,
      p_reservation_ids: reservationIds
    })

    if (rpcError) {
      console.error('RPC function error:', rpcError)
      return NextResponse.json({ 
        error: 'Failed to create order',
        details: rpcError.message 
      }, { status: 500 })
    }

    // Check if the function returned an error
    if (!result || !result.success) {
      const errorCode = result?.error_code || 'UNKNOWN_ERROR'
      const errorMessage = result?.error || 'Order creation failed'
      const failedProducts = result?.failed_products || []
      
      console.error('Order creation failed:', errorMessage, errorCode)
      
      // Return appropriate error based on error code
      if (errorCode === 'INSUFFICIENT_STOCK') {
        return NextResponse.json({ 
          error: 'Some items are no longer available',
          error_code: errorCode,
          failed_products: failedProducts,
          message: 'Please review your cart and remove unavailable items.'
        }, { status: 400 })
      }
      
      if (errorCode === 'PRODUCT_NOT_FOUND') {
        return NextResponse.json({ 
          error: 'One or more products not found',
          error_code: errorCode,
          product_id: result?.product_id
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        error_code: errorCode
      }, { status: 500 })
    }

    // Order created successfully, fetch the complete order with items
    const orderId = result.order_id
    const { data: completeOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (fetchError) {
      console.error('Error fetching complete order:', fetchError)
      // Order was created but we can't fetch it - still return success with order number
      return NextResponse.json({
        order_id: orderId,
        order_number: orderNumber,
        message: 'Order created successfully! Your beautiful handcrafted items are being prepared with care.',
        success: true,
        estimated_delivery: '3-5 business days',
        tracking_info: 'You will receive tracking information via email once your order ships.'
      }, { status: 201 })
    }

    // Create notifications for order placement (async, don't wait)
    createOrderNotifications({
      id: completeOrder.id,
      order_number: completeOrder.order_number,
      customer_name: completeOrder.customer_name,
      customer_email: completeOrder.customer_email,
      status: completeOrder.status,
      payment_status: completeOrder.payment_status,
      customer_id: completeOrder.customer_id,
      user_id: completeOrder.user_id || completeOrder.customer_id
    }, undefined, undefined).catch(err => {
      console.error('[Orders API] Error creating order notifications:', err)
      // Don't fail the request if notification creation fails
    })

    // Send email notification to admin (async, don't wait)
    if (isSupabaseConfigured && supabaseAdmin) {
      // Get admin email from site settings
      const { data: emailSetting } = await supabaseAdmin
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'contact_email')
        .maybeSingle()

      let adminEmail: string | null = null
      if (emailSetting) {
        let emailValue = emailSetting.setting_value
        // Parse JSON if it's a string
        if (typeof emailValue === 'string' && (emailValue.startsWith('"') || emailValue.startsWith('{'))) {
          try {
            emailValue = JSON.parse(emailValue)
          } catch {
            // If parsing fails, use the string as-is
          }
        }
        adminEmail = typeof emailValue === 'string' ? emailValue : emailValue?.value || null
      }

      // Fallback to default admin email if not found in settings
      if (!adminEmail) {
        adminEmail = process.env.ADMIN_EMAIL || 'kingsjuliet90@gmail.com'
      }

      // Prepare order items for email
      const orderItems = (completeOrder.order_items || []).map((item: any) => ({
        product_name: item.product_name || 'Unknown Product',
        quantity: item.quantity || 1,
        price: parseFloat(item.price || item.unit_price || 0)
      }))

      // Send email notification (async, don't block response)
      sendNewOrderNotificationEmail(
        adminEmail,
        completeOrder.order_number,
        completeOrder.customer_name,
        completeOrder.customer_email,
        parseFloat(completeOrder.total_amount || 0),
        completeOrder.currency || 'UGX',
        orderItems
      ).catch(err => {
        console.error('[Orders API] Error sending admin email notification:', err)
        // Don't fail the request if email sending fails
      })
    }

    // Return complete order with success message
    const response = {
      ...completeOrder,
      message: 'Order created successfully! Your beautiful handcrafted items are being prepared with care.',
      success: true,
      estimated_delivery: '3-5 business days',
      tracking_info: 'You will receive tracking information via email once your order ships.'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('API error:', error)
    
    // Handle validation errors
    if (error.message && error.message.includes('Invalid')) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
