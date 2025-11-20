import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const body = await request.json()
    const { reason } = body || {}

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        error: 'Database not configured',
        message: 'Order cancellation not available'
      }, { status: 503 })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    // Get order with items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      console.error('Database error fetching order:', orderError)
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Order already cancelled',
        message: 'This order has already been cancelled'
      }, { status: 400 })
    }

    if (order.status === 'delivered') {
      return NextResponse.json({ 
        error: 'Cannot cancel delivered order',
        message: 'Delivered orders cannot be cancelled. Please process a return instead.'
      }, { status: 400 })
    }

    // Restore inventory for all order items
    const inventoryRestorationResults = []
    
    for (const item of order.order_items || []) {
      try {
        // Get current product stock
        const { data: product, error: productError } = await supabaseAdmin
          .from('products')
          .select('id, name, stock_quantity, sku')
          .eq('id', item.product_id)
          .single()

        if (productError || !product) {
          console.error(`Product ${item.product_id} not found for inventory restoration`)
          inventoryRestorationResults.push({
            product_id: item.product_id,
            success: false,
            error: 'Product not found'
          })
          continue
        }

        // Restore stock quantity
        const newStock = product.stock_quantity + item.quantity
        
        const { error: stockUpdateError } = await supabaseAdmin
          .from('products')
          .update({
            stock_quantity: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id)

        if (stockUpdateError) {
          console.error(`Failed to restore stock for product ${item.product_id}:`, stockUpdateError)
          inventoryRestorationResults.push({
            product_id: item.product_id,
            product_name: product.name,
            success: false,
            error: stockUpdateError.message
          })
          continue
        }

        inventoryRestorationResults.push({
          product_id: item.product_id,
          product_name: product.name,
          quantity_restored: item.quantity,
          new_stock: newStock,
          success: true
        })

        // Create stock movement record (if table exists)
        try {
          await supabaseAdmin
            .from('stock_movements')
            .insert({
              product_id: item.product_id,
              product_name: product.name,
              sku: product.sku || item.product_sku || null,
              movement_type: 'in',
              quantity: item.quantity,
              previous_stock: product.stock_quantity,
              new_stock: newStock,
              reference_type: 'order_cancellation',
              reference_id: orderId,
              notes: reason 
                ? `Order ${order.order_number} cancelled - ${reason}`
                : `Order ${order.order_number} cancelled - inventory restored`,
              created_at: new Date().toISOString()
            })
        } catch (stockMovementError) {
          // Stock movements table might not exist, log but don't fail
          console.warn('Failed to create stock movement record:', stockMovementError)
        }

      } catch (itemError) {
        console.error(`Error processing inventory restoration for item ${item.id}:`, itemError)
        inventoryRestorationResults.push({
          product_id: item.product_id,
          success: false,
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        })
      }
    }

    // Check if any inventory restorations failed
    const failedRestorations = inventoryRestorationResults.filter(r => !r.success)
    if (failedRestorations.length > 0) {
      console.error('Some inventory restorations failed:', failedRestorations)
      // Continue with cancellation but log the failures
    }

    // Update order status to cancelled
    const now = new Date().toISOString()
    const updateData: any = {
      status: 'cancelled',
      updated_at: now
    }

    // Update payment status if order was paid
    if (order.payment_status === 'paid') {
      updateData.payment_status = 'refunded'
    } else if (order.payment_status === 'pending') {
      updateData.payment_status = 'failed'
    }

    // Add cancellation note
    const cancellationNote = reason 
      ? `Order cancelled: ${reason}\nCancelled at: ${now}`
      : `Order cancelled at: ${now}`
    
    updateData.notes = order.notes 
      ? `${order.notes}\n\n${cancellationNote}`
      : cancellationNote

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
        order_items:order_items(*)
      `)
      .single()

    if (updateError) {
      console.error('Database error updating order:', updateError)
      return NextResponse.json({ 
        error: 'Failed to cancel order',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      inventory_restored: inventoryRestorationResults.filter(r => r.success).length,
      inventory_failed: failedRestorations.length,
      inventory_results: inventoryRestorationResults,
      message: 'Order cancelled successfully and inventory restored'
    })

  } catch (error) {
    console.error('API error cancelling order:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

