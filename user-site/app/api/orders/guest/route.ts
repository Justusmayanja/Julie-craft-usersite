import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { GuestCheckoutData } from '@/lib/types/user'
import { sendNewOrderNotificationEmail } from '@/lib/email-service'

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

    // Convert address objects to JSON strings as database expects text type
    const shippingAddressText = typeof guest_info.shipping_address === 'string' 
      ? guest_info.shipping_address 
      : JSON.stringify(guest_info.shipping_address)
    const billingAddressText = typeof guest_info.billing_address === 'string'
      ? (guest_info.billing_address || shippingAddressText)
      : JSON.stringify(guest_info.billing_address || guest_info.shipping_address)

    // Prepare order items for RPC function
    const orderItems = order_data.items.map((item: any) => {
      const unitPrice = typeof item.price === 'number' ? item.price : 
                       typeof item.unit_price === 'number' ? item.unit_price : 
                       parseFloat(item.price || item.unit_price) || 0
      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1
      const totalPrice = typeof item.total_price === 'number' ? item.total_price : (unitPrice * quantity)
      
      if (unitPrice <= 0) {
        throw new Error(`Invalid price for product ${item.product_name || item.name || item.product_id}: ${unitPrice}`)
      }
      
      if (quantity <= 0) {
        throw new Error(`Invalid quantity for product ${item.product_name || item.name || item.product_id}: ${quantity}`)
      }
      
      return {
        product_id: item.product_id || item.id?.toString(),
        product_name: item.product_name || item.name || 'Unknown Product',
        product_sku: item.product_sku || '',
        quantity: quantity,
        price: unitPrice,
        total_price: totalPrice,
        product_image: item.product_image || item.image || null
      }
    })

    // Call the atomic order creation function
    // This function handles: stock validation, inventory deduction, order creation, and order items
    // all in a single database transaction
    // Note: Parameter order matters - required params first, then optional ones
    console.log('Calling atomic order creation function for guest order...')
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('create_order_atomic', {
      // Required parameters (must be in this order)
      p_order_number: orderNumber,
      p_customer_email: guest_info.email,
      p_customer_name: guest_info.name,
      p_subtotal: order_data.subtotal || 0,
      p_total_amount: order_data.total_amount || 0,
      p_shipping_address: shippingAddressText,
      p_billing_address: billingAddressText,
      p_order_items: orderItems,
      // Optional parameters (can be in any order when using named parameters)
      p_customer_phone: guest_info.phone || null,
      p_user_id: null, // Guest orders have no user_id
      p_customer_id: null,
      p_is_guest_order: true,
      p_payment_method: order_data.payment_method || 'cash',
      p_tax_amount: order_data.tax_amount || 0,
      p_shipping_amount: order_data.shipping_amount || 0,
      p_discount_amount: order_data.discount_amount || 0,
      p_currency: order_data.currency || 'UGX',
      p_notes: order_data.notes || null,
      p_reservation_ids: null // Guest orders typically don't use reservations
    })

    if (rpcError) {
      console.error('RPC function error for guest order:', rpcError)
      return NextResponse.json({ 
        error: 'Failed to create guest order',
        details: rpcError.message 
      }, { status: 500 })
    }

    // Check if the function returned an error
    if (!result || !result.success) {
      const errorCode = result?.error_code || 'UNKNOWN_ERROR'
      const errorMessage = result?.error || 'Guest order creation failed'
      const failedProducts = result?.failed_products || []
      
      console.error('Guest order creation failed:', errorMessage, errorCode)
      
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
      console.error('Error fetching complete guest order:', fetchError)
      // Order was created but we can't fetch it - still return success with order number
      return NextResponse.json({
        order_id: orderId,
        order_number: orderNumber,
        message: 'Guest order created successfully! Your beautiful handcrafted items are being prepared with care.',
        success: true,
        estimated_delivery: '3-5 business days',
        tracking_info: 'You will receive tracking information via email once your order ships.'
      }, { status: 201 })
    }

    // Optionally save guest info for future orders if requested
    if (guest_info.save_for_future) {
      try {
        await supabaseAdmin
          .from('guest_customers')
          .upsert({
            email: guest_info.email,
            name: guest_info.name,
            phone: guest_info.phone,
            default_shipping_address: guest_info.shipping_address,
            default_billing_address: guest_info.billing_address,
            last_order_date: new Date().toISOString(),
            order_count: 1
          }, {
            onConflict: 'email'
          })
      } catch (guestSaveError) {
        // Non-critical error, log but don't fail the order
        console.log('Failed to save guest info for future orders:', guestSaveError)
      }
    }

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
        console.error('[Guest Orders API] Error sending admin email notification:', err)
        // Don't fail the request if email sending fails
      })
    }

    // Return complete order with success message
    const response = {
      ...completeOrder,
      message: 'Guest order created successfully! Your beautiful handcrafted items are being prepared with care.',
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
