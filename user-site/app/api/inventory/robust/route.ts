import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock inventory data')
      
      // Return mock data for robust inventory
      const mockProducts = [
        {
          id: '1',
          name: 'Handwoven Basket',
          sku: 'HW-BASKET-001',
          physical_stock: 25,
          reserved_stock: 3,
          available_stock: 22,
          reorder_point: 5,
          reorder_quantity: 20,
          max_stock_level: 50,
          stock_status: 'in_stock',
          inventory_version: 1,
          last_stock_update: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Ceramic Vase',
          sku: 'CER-VASE-002',
          physical_stock: 8,
          reserved_stock: 2,
          available_stock: 6,
          reorder_point: 10,
          reorder_quantity: 15,
          max_stock_level: 30,
          stock_status: 'low_stock',
          inventory_version: 1,
          last_stock_update: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Wooden Sculpture',
          sku: 'WD-SCULP-003',
          physical_stock: 0,
          reserved_stock: 0,
          available_stock: 0,
          reorder_point: 5,
          reorder_quantity: 10,
          max_stock_level: 20,
          stock_status: 'out_of_stock',
          inventory_version: 1,
          last_stock_update: new Date().toISOString(),
        }
      ]

      const mockReservations = [
        {
          id: '1',
          product_id: '1',
          order_id: 'ORD-001',
          quantity_reserved: 2,
          reservation_status: 'active',
          reserved_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          product_id: '1',
          order_id: 'ORD-002',
          quantity_reserved: 1,
          reservation_status: 'active',
          reserved_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          product_id: '2',
          order_id: 'ORD-003',
          quantity_reserved: 2,
          reservation_status: 'active',
          reserved_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }
      ]

      return NextResponse.json({
        success: true,
        products: mockProducts,
        reservations: mockReservations,
        message: 'Mock inventory data (database not configured)'
      })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const includeReservations = searchParams.get('include_reservations') === 'true'
    const includeAuditLog = searchParams.get('include_audit_log') === 'true'

    // Build the query
    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        sku,
        stock_quantity,
        status,
        created_at,
        updated_at
      `)

    // Filter by product ID if provided
    if (productId) {
      query = query.eq('id', productId)
    }

    const { data: products, error: productsError } = await query

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Transform products to match the expected format
    const transformedProducts = (products || []).map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku || `SKU-${product.id}`,
      physical_stock: product.stock_quantity || 0,
      reserved_stock: 0, // Will be calculated from reservations
      available_stock: product.stock_quantity || 0, // Will be calculated
      reorder_point: 5, // Default value
      reorder_quantity: 10, // Default value
      max_stock_level: 100, // Default value
      stock_status: product.stock_quantity > 10 ? 'in_stock' : 
                   product.stock_quantity > 0 ? 'low_stock' : 'out_of_stock',
      inventory_version: 1,
      last_stock_update: product.updated_at || product.created_at,
    }))

    // Get reservations if requested
    let reservations = []
    if (includeReservations) {
      const { data: reservationsData, error: reservationsError } = await supabaseAdmin
        .from('order_item_reservations')
        .select(`
          id,
          product_id,
          order_id,
          reserved_quantity,
          status,
          created_at,
          notes
        `)
        .eq('status', 'active')

      if (reservationsError) {
        console.error('Error fetching reservations:', reservationsError)
      } else {
        reservations = (reservationsData || []).map(reservation => ({
          id: reservation.id,
          product_id: reservation.product_id,
          order_id: reservation.order_id,
          quantity_reserved: reservation.reserved_quantity,
          reservation_status: reservation.status,
          reserved_at: reservation.created_at,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default 24h expiry
        }))

        // Update reserved stock and available stock in products
        transformedProducts.forEach(product => {
          const productReservations = reservations.filter(r => r.product_id === product.id)
          product.reserved_stock = productReservations.reduce((sum, r) => sum + r.quantity_reserved, 0)
          product.available_stock = Math.max(0, product.physical_stock - product.reserved_stock)
        })
      }
    }

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      reservations,
      message: 'Inventory data fetched successfully'
    })

  } catch (error) {
    console.error('Robust inventory API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating stock reservation')
      return NextResponse.json({
        success: true,
        message: 'Stock reservation simulated (database not configured)',
        available_stock_after: 0
      })
    }

    const body = await request.json()
    const { product_id, order_id, quantity } = body

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

    // Check existing reservations
    const { data: existingReservations, error: reservationError } = await supabaseAdmin
      .from('order_item_reservations')
      .select('reserved_quantity')
      .eq('product_id', product_id)
      .eq('status', 'active')

    if (reservationError) {
      console.error('Error checking reservations:', reservationError)
    }

    const reservedQuantity = existingReservations?.reduce((sum, r) => sum + r.reserved_quantity, 0) || 0
    const availableStock = product.stock_quantity - reservedQuantity

    if (availableStock < quantity) {
      return NextResponse.json({ 
        success: false,
        error: 'Insufficient stock available',
        error_code: 'INSUFFICIENT_STOCK',
        available_stock: availableStock,
        requested_quantity: quantity
      }, { status: 400 })
    }

    // Create reservation
    const { data: reservation, error: createError } = await supabaseAdmin
      .from('order_item_reservations')
      .insert({
        product_id,
        order_id,
        reserved_quantity: quantity,
        status: 'active',
        notes: `Reserved for order ${order_id}`,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating reservation:', createError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create reservation',
        error_code: 'RESERVATION_FAILED'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reservation_id: reservation.id,
      available_stock_after: availableStock - quantity,
      message: 'Stock reserved successfully'
    })

  } catch (error) {
    console.error('Stock reservation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating order fulfillment')
      return NextResponse.json({
        success: true,
        message: 'Order fulfillment simulated (database not configured)',
        available_stock_after: 0
      })
    }

    const body = await request.json()
    const { product_id, order_id, quantity } = body

    if (!product_id || !order_id || !quantity) {
      return NextResponse.json({ error: 'product_id, order_id, and quantity are required' }, { status: 400 })
    }

    // Find and update the reservation
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('order_item_reservations')
      .select('*')
      .eq('product_id', product_id)
      .eq('order_id', order_id)
      .eq('status', 'active')
      .single()

    if (reservationError || !reservation) {
      return NextResponse.json({ 
        success: false,
        error: 'Reservation not found',
        error_code: 'RESERVATION_NOT_FOUND'
      }, { status: 404 })
    }

    // Update reservation status to fulfilled
    const { error: updateError } = await supabaseAdmin
      .from('order_item_reservations')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString()
      })
      .eq('id', reservation.id)

    if (updateError) {
      console.error('Error updating reservation:', updateError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fulfill reservation',
        error_code: 'FULFILLMENT_FAILED'
      }, { status: 500 })
    }

    // Update product stock
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('stock_quantity')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ 
        success: false,
        error: 'Product not found',
        error_code: 'PRODUCT_NOT_FOUND'
      }, { status: 404 })
    }

    const newStock = Math.max(0, product.stock_quantity - quantity)
    
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

    return NextResponse.json({
      success: true,
      available_stock_after: newStock,
      message: 'Order fulfilled successfully'
    })

  } catch (error) {
    console.error('Order fulfillment API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating reservation cancellation')
      return NextResponse.json({
        success: true,
        message: 'Reservation cancellation simulated (database not configured)',
        available_stock_after: 0
      })
    }

    const body = await request.json()
    const { product_id, order_id } = body

    if (!product_id || !order_id) {
      return NextResponse.json({ error: 'product_id and order_id are required' }, { status: 400 })
    }

    // Find and cancel the reservation
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('order_item_reservations')
      .select('*')
      .eq('product_id', product_id)
      .eq('order_id', order_id)
      .eq('status', 'active')
      .single()

    if (reservationError || !reservation) {
      return NextResponse.json({ 
        success: false,
        error: 'Reservation not found',
        error_code: 'RESERVATION_NOT_FOUND'
      }, { status: 404 })
    }

    // Update reservation status to cancelled
    const { error: updateError } = await supabaseAdmin
      .from('order_item_reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', reservation.id)

    if (updateError) {
      console.error('Error cancelling reservation:', updateError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to cancel reservation',
        error_code: 'CANCELLATION_FAILED'
      }, { status: 500 })
    }

    // Get current product stock for response
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('stock_quantity')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ 
        success: false,
        error: 'Product not found',
        error_code: 'PRODUCT_NOT_FOUND'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      available_stock_after: product.stock_quantity,
      message: 'Reservation cancelled successfully'
    })

  } catch (error) {
    console.error('Reservation cancellation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
