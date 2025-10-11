import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating stock check')
      return NextResponse.json({
        success: true,
        message: 'Stock check simulated (database not configured)',
        availability: []
      })
    }

    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array required' }, { status: 400 })
    }

    const availability = []

    for (const item of items) {
      const productId = item.product_id || item.id
      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1

      try {
        // Get product details
        const { data: product, error: productError } = await supabaseAdmin
          .from('products')
          .select('id, name, stock_quantity, status')
          .eq('id', productId)
          .single()

        if (productError || !product) {
          availability.push({
            product_id: productId,
            available: false,
            reason: 'Product not found',
            available_quantity: 0,
            requested_quantity: quantity
          })
          continue
        }

        // Check if product is active
        if (product.status !== 'active') {
          availability.push({
            product_id: productId,
            product_name: product.name,
            available: false,
            reason: 'Product inactive',
            available_quantity: 0,
            requested_quantity: quantity
          })
          continue
        }

        // Check existing reservations
        const { data: existingReservations, error: reservationError } = await supabaseAdmin
          .from('order_item_reservations')
          .select('reserved_quantity')
          .eq('product_id', productId)
          .eq('status', 'active')

        if (reservationError) {
          console.error('Error checking reservations:', reservationError)
        }

        const reservedQuantity = existingReservations?.reduce((sum, r) => sum + r.reserved_quantity, 0) || 0
        const availableQuantity = Math.max(0, product.stock_quantity - reservedQuantity)

        availability.push({
          product_id: productId,
          product_name: product.name,
          available: availableQuantity >= quantity,
          available_quantity: availableQuantity,
          requested_quantity: quantity,
          total_stock: product.stock_quantity,
          reserved_quantity: reservedQuantity,
          reason: availableQuantity >= quantity ? 'Available' : 'Insufficient stock'
        })

      } catch (itemError) {
        console.error(`Error checking availability for item ${productId}:`, itemError)
        availability.push({
          product_id: productId,
          available: false,
          reason: 'Error checking availability',
          available_quantity: 0,
          requested_quantity: quantity
        })
      }
    }

    const allAvailable = availability.every(item => item.available)
    const unavailableItems = availability.filter(item => !item.available)

    return NextResponse.json({
      success: allAvailable,
      availability,
      unavailable_items: unavailableItems,
      message: allAvailable ? 'All items available' : `${unavailableItems.length} items unavailable`
    })

  } catch (error) {
    console.error('Stock check API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
