import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating return processing')
      return NextResponse.json({
        success: true,
        message: 'Return processing simulated (database not configured)',
        available_stock_after: 0
      })
    }

    const body = await request.json()
    const { product_id, order_id, quantity, reason } = body

    if (!product_id || !order_id || !quantity) {
      return NextResponse.json({ error: 'product_id, order_id, and quantity are required' }, { status: 400 })
    }

    // Get current product stock
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, stock_quantity, status')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ 
        success: false,
        error: 'Product not found',
        error_code: 'PRODUCT_NOT_FOUND'
      }, { status: 404 })
    }

    if (product.status !== 'active') {
      return NextResponse.json({ 
        success: false,
        error: 'Product is not active',
        error_code: 'PRODUCT_INACTIVE'
      }, { status: 400 })
    }

    // Update product stock (add returned quantity back)
    const newStock = product.stock_quantity + quantity
    
    const { error: stockUpdateError } = await supabaseAdmin
      .from('products')
      .update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id)

    if (stockUpdateError) {
      console.error('Error updating stock:', stockUpdateError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to update stock',
        error_code: 'STOCK_UPDATE_FAILED'
      }, { status: 500 })
    }

    // Create audit log entry for the return
    const { error: auditError } = await supabaseAdmin
      .from('inventory_audit_logs')
      .insert({
        product_id,
        product_name: product.name,
        product_sku: `SKU-${product_id}`, // Would need to get actual SKU
        physical_stock_before: product.stock_quantity,
        physical_stock_after: newStock,
        physical_stock_change: quantity,
        reserved_stock_before: 0,
        reserved_stock_after: 0,
        reserved_stock_change: 0,
        available_stock_before: product.stock_quantity,
        available_stock_after: newStock,
        available_stock_change: quantity,
        operation_type: 'return_processing',
        operation_reason: `Return from order ${order_id}`,
        quantity_affected: quantity,
        order_id,
        created_at: new Date().toISOString(),
        notes: reason ? `Return reason: ${reason}` : 'Product return processed'
      })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      available_stock_after: newStock,
      message: 'Return processed successfully'
    })

  } catch (error) {
    console.error('Return processing API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
