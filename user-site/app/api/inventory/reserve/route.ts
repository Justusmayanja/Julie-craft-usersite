import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating reservation')
      return NextResponse.json({
        success: true,
        message: 'Product reservation simulated (database not configured)',
        reservations: []
      })
    }

    const body = await request.json()
    const { items, session_id, user_id, reservation_type = 'cart' } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array required' }, { status: 400 })
    }

    // Validate stock availability and create reservations
    const reservations = []
    const errors = []

    for (const item of items) {
      const productId = item.product_id || item.id
      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1

      try {
        // Check current stock
        const { data: product, error: productError } = await supabaseAdmin
          .from('products')
          .select('id, name, stock_quantity, status')
          .eq('id', productId)
          .single()

        if (productError || !product) {
          errors.push({
            product_id: productId,
            error: 'Product not found',
            message: `Product with ID ${productId} not found`
          })
          continue
        }

        // Check if product is active and in stock
        if (product.status !== 'active') {
          errors.push({
            product_id: productId,
            error: 'Product inactive',
            message: `Product "${product.name}" is not available`
          })
          continue
        }

        // Check available stock (considering existing active, non-expired reservations)
        let existingReservations = null
        let reservationError = null
        
        try {
          // Try to query with expires_at filter first
          const result = await supabaseAdmin
            .from('order_item_reservations')
            .select('reserved_quantity')
            .eq('product_id', productId)
            .eq('status', 'active')
            .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
          
          existingReservations = result.data
          reservationError = result.error
        } catch (err: any) {
          // If expires_at column doesn't exist, fall back to query without expiration filter
          if (err?.code === '42703' || err?.message?.includes('expires_at')) {
            console.log('expires_at column not found, using fallback query')
            const fallbackResult = await supabaseAdmin
              .from('order_item_reservations')
              .select('reserved_quantity')
              .eq('product_id', productId)
              .eq('status', 'active')
            
            existingReservations = fallbackResult.data
            reservationError = fallbackResult.error
          } else {
            reservationError = err
            console.error('Error checking existing reservations:', err)
          }
        }

        if (reservationError) {
          console.error('Error checking existing reservations:', reservationError)
        }

        const reservedQuantity = existingReservations?.reduce((sum, r) => sum + r.reserved_quantity, 0) || 0
        const availableStock = product.stock_quantity - reservedQuantity

        if (availableStock < quantity) {
          errors.push({
            product_id: productId,
            error: 'Insufficient stock',
            message: `Only ${availableStock} units of "${product.name}" available`,
            available_quantity: availableStock,
            requested_quantity: quantity
          })
          continue
        }

        // Prevent multiple reservations for same product beyond available quantity
        // Check if user/session already has a reservation for this product
        let existingUserReservations = null
        if (user_id || session_id) {
          try {
            let userQuery = supabaseAdmin
              .from('order_item_reservations')
              .select('reserved_quantity')
              .eq('product_id', productId)
              .eq('status', 'active')
              .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
            
            if (user_id) {
              userQuery = userQuery.eq('user_id', user_id)
            } else if (session_id) {
              userQuery = userQuery.eq('session_id', session_id)
            }
            
            const { data } = await userQuery
            existingUserReservations = data
          } catch (err: any) {
            // If expires_at, user_id, or session_id columns don't exist, skip user reservation check
            if (err?.code === '42703' || err?.message?.includes('expires_at') || err?.message?.includes('user_id') || err?.message?.includes('session_id')) {
              console.log('Reservation tracking columns not found, skipping user reservation check')
              existingUserReservations = []
            } else {
              console.error('Error checking user reservations:', err)
            }
          }
        }

        const userReservedQuantity = existingUserReservations?.reduce((sum, r) => sum + r.reserved_quantity, 0) || 0
        if (userReservedQuantity + quantity > availableStock + userReservedQuantity) {
          errors.push({
            product_id: productId,
            error: 'Reservation limit exceeded',
            message: `Cannot reserve more than available stock for "${product.name}"`,
            available_quantity: availableStock,
            requested_quantity: quantity,
            existing_reservations: userReservedQuantity
          })
          continue
        }

        // Create reservation with expiration (15 minutes default)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes from now
        
        // Build insert object - include all fields (will fail gracefully if columns don't exist)
        const insertData: any = {
          product_id: productId,
          reserved_quantity: quantity,
          status: 'active',
          notes: `Reserved for ${reservation_type} - ${user_id ? 'user' : 'session'}: ${user_id || session_id}`,
          created_at: new Date().toISOString()
        }
        
        // Add optional fields (will be ignored by database if columns don't exist)
        insertData.expires_at = expiresAt
        if (user_id) insertData.user_id = user_id
        if (session_id) insertData.session_id = session_id
        
        let reservation = null
        let createError = null
        
        const result = await supabaseAdmin
          .from('order_item_reservations')
          .insert(insertData)
          .select()
          .single()
        
        reservation = result.data
        createError = result.error
        
        // If insert failed due to missing columns, try without optional fields
        if (createError && (createError.code === '42703' || createError.message?.includes('column') || createError.message?.includes('does not exist'))) {
          console.log('Optional columns not found, creating reservation without expires_at/user_id/session_id')
          const basicInsertData = {
            product_id: productId,
            reserved_quantity: quantity,
            status: 'active',
            notes: `Reserved for ${reservation_type}`,
            created_at: new Date().toISOString()
          }
          
          const retryResult = await supabaseAdmin
            .from('order_item_reservations')
            .insert(basicInsertData)
            .select()
            .single()
          
          if (retryResult.error) {
            createError = retryResult.error
          } else {
            reservation = retryResult.data
            createError = null
          }
        }
        
        if (createError || !reservation) {
          errors.push({
            product_id: productId,
            error: 'Reservation failed',
            message: `Failed to create reservation for "${product.name}": ${createError?.message || 'Unknown error'}`
          })
          continue
        }

        if (createError) {
          errors.push({
            product_id: productId,
            error: 'Reservation failed',
            message: `Failed to create reservation for "${product.name}"`
          })
          continue
        }

        reservations.push({
          reservation_id: reservation.id,
          product_id: productId,
          product_name: product.name,
          reserved_quantity: quantity,
          available_stock: availableStock - quantity
        })

      } catch (itemError) {
        console.error(`Error processing item ${productId}:`, itemError)
        errors.push({
          product_id: productId,
          error: 'Processing error',
          message: 'An error occurred while processing this item'
        })
      }
    }

    // If there are errors, clean up any successful reservations
    if (errors.length > 0 && reservations.length > 0) {
      console.log('Cleaning up reservations due to errors')
      const reservationIds = reservations.map(r => r.reservation_id)
      await supabaseAdmin
        .from('order_item_reservations')
        .delete()
        .in('id', reservationIds)
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors,
        reservations: [],
        message: 'Some items could not be reserved'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      reservations,
      message: 'All items reserved successfully'
    })

  } catch (error) {
    console.error('Reservation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating reservation release')
      return NextResponse.json({
        success: true,
        message: 'Reservation release simulated (database not configured)'
      })
    }

    const body = await request.json()
    const { reservation_ids, session_id, user_id } = body

    if (!reservation_ids || !Array.isArray(reservation_ids) || reservation_ids.length === 0) {
      return NextResponse.json({ error: 'Reservation IDs array required' }, { status: 400 })
    }

    // Release reservations
    const { error } = await supabaseAdmin
      .from('order_item_reservations')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        notes: `Released from ${user_id ? 'user' : 'session'}: ${user_id || session_id}`
      })
      .in('id', reservation_ids)
      .eq('status', 'active')

    if (error) {
      console.error('Error releasing reservations:', error)
      return NextResponse.json({ error: 'Failed to release reservations' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Reservations released successfully'
    })

  } catch (error) {
    console.error('Reservation release API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
