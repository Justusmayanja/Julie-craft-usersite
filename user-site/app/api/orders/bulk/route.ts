import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_ids, updates } = body

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        error: 'Database not configured',
        message: 'Bulk updates not available'
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

    // Validate request body
    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid request',
        message: 'order_ids must be a non-empty array'
      }, { status: 400 })
    }

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: 'Invalid request',
        message: 'updates object is required and cannot be empty'
      }, { status: 400 })
    }

    // Validate allowed update fields
    const allowedFields = ['status', 'payment_status', 'tracking_number', 'shipped_date', 'delivered_date', 'is_archived']
    const updateFields = Object.keys(updates)
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field))
    
    if (invalidFields.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid update fields',
        message: `The following fields are not allowed: ${invalidFields.join(', ')}`,
        invalid_fields: invalidFields
      }, { status: 400 })
    }

    // Get existing orders to check statuses and dates
    const { data: existingOrders, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status, shipped_date, delivered_date')
      .in('id', order_ids)

    if (fetchError) {
      console.error('Database error fetching orders:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch orders',
        details: fetchError.message 
      }, { status: 500 })
    }

    if (!existingOrders || existingOrders.length === 0) {
      return NextResponse.json({ 
        error: 'No orders found',
        message: 'None of the provided order IDs were found'
      }, { status: 404 })
    }

    // Build update data
    const updateData: any = { ...updates }
    const now = new Date().toISOString()

    // Auto-update dates based on status changes
    if (updates.status) {
      if (updates.status === 'shipped' && !updates.shipped_date) {
        updateData.shipped_date = now
      }
      if (updates.status === 'delivered' && !updates.delivered_date) {
        updateData.delivered_date = now
      }
    }

    // Handle archive/unarchive
    if (updates.is_archived !== undefined) {
      if (updates.is_archived === true) {
        updateData.archived_at = now
      } else {
        updateData.archived_at = null
      }
    }

    // Always update updated_at timestamp
    updateData.updated_at = now

    // Perform bulk update
    const { data: updatedOrders, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .in('id', order_ids)
      .select('id')

    if (updateError) {
      console.error('Database error updating orders:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update orders',
        details: updateError.message 
      }, { status: 500 })
    }

    const updatedCount = updatedOrders?.length || 0
    const failedCount = order_ids.length - updatedCount

    return NextResponse.json({
      success: true,
      total_count: order_ids.length,
      updated_count: updatedCount,
      failed_count: failedCount,
      updates_applied: updateData,
      message: `Successfully updated ${updatedCount} of ${order_ids.length} orders`
    })

  } catch (error) {
    console.error('API error performing bulk update:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

