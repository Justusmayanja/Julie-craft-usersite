import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating adjustment application')
      return NextResponse.json({
        success: true,
        message: 'Adjustment applied (simulated - database not configured)'
      })
    }

    const body = await request.json()
    const {
      product_id,
      adjustment_type,
      quantity,
      reason,
      notes,
      reference
    } = body

    // Validate required fields
    if (!product_id || !adjustment_type || quantity === undefined || !reason) {
      return NextResponse.json({ 
        error: 'Missing required fields: product_id, adjustment_type, quantity, and reason are required' 
      }, { status: 400 })
    }

    // Validate adjustment type
    if (!['increase', 'decrease', 'set'].includes(adjustment_type)) {
      return NextResponse.json({ 
        error: 'Invalid adjustment_type. Must be: increase, decrease, or set' 
      }, { status: 400 })
    }

    // Validate quantity
    if (quantity < 0) {
      return NextResponse.json({ 
        error: 'Quantity cannot be negative' 
      }, { status: 400 })
    }

    // Get user ID from request if available
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

    // Call the atomic inventory adjustment function
    // This function handles: validation, stock update, stock movement creation, and audit records
    // all in a single database transaction
    console.log('Calling atomic inventory adjustment function...')
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('adjust_inventory_atomic', {
      p_product_id: product_id,
      p_adjustment_type: adjustment_type,
      p_quantity: quantity,
      p_reason: reason,
      p_reference_type: 'adjustment',
      p_reference_id: null,
      p_notes: notes || null,
      p_user_id: userId
    })

    if (rpcError) {
      console.error('RPC function error:', rpcError)
      return NextResponse.json({ 
        error: 'Failed to apply inventory adjustment',
        details: rpcError.message 
      }, { status: 500 })
    }

    // Check if the function returned an error
    if (!result || !result.success) {
      const errorCode = result?.error_code || 'UNKNOWN_ERROR'
      const errorMessage = result?.error || 'Inventory adjustment failed'
      
      console.error('Inventory adjustment failed:', errorMessage, errorCode)
      
      // Return appropriate error based on error code
      if (errorCode === 'EXCEEDS_MAX_STOCK') {
        return NextResponse.json({ 
          error: 'Stock would exceed maximum capacity',
          error_code: errorCode,
          current_stock: result?.current_stock,
          max_stock: result?.max_stock,
          would_result_in: result?.would_result_in,
          message: 'Please reduce the quantity or increase the maximum stock level.'
        }, { status: 400 })
      }
      
      if (errorCode === 'NEGATIVE_STOCK') {
        return NextResponse.json({ 
          error: 'Cannot set stock below zero',
          error_code: errorCode,
          current_stock: result?.current_stock,
          requested_change: result?.requested_change
        }, { status: 400 })
      }
      
      if (errorCode === 'PRODUCT_NOT_FOUND') {
        return NextResponse.json({ 
          error: 'Product not found',
          error_code: errorCode,
          product_id: result?.product_id
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        error_code: errorCode
      }, { status: 500 })
    }

    // Return success with adjustment details
    return NextResponse.json({
      success: true,
      adjustment: {
        product_id: result.product_id,
        product_name: result.product_name,
        previous_stock: result.previous_stock,
        new_stock: result.new_stock,
        quantity_change: result.quantity_change,
        adjustment_type: result.adjustment_type
      },
      message: result.message || 'Inventory adjustment applied successfully'
    }, { status: 200 })

  } catch (error: any) {
    console.error('API error:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

