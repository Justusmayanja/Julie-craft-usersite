import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock reorder alerts')
      
      // Return mock reorder alerts
      const mockAlerts = [
        {
          id: '1',
          product_id: '2',
          alert_type: 'low_stock',
          current_stock: 6,
          reorder_point: 10,
          suggested_reorder_quantity: 15,
          alert_status: 'active',
          triggered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          acknowledged_by: null,
          acknowledged_at: null,
          resolved_at: null,
          notes: null,
          products: {
            id: '2',
            name: 'Ceramic Vase',
            sku: 'CER-VASE-002',
            physical_stock: 8,
            reserved_stock: 2,
            available_stock: 6
          }
        },
        {
          id: '2',
          product_id: '3',
          alert_type: 'out_of_stock',
          current_stock: 0,
          reorder_point: 5,
          suggested_reorder_quantity: 10,
          alert_status: 'active',
          triggered_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          acknowledged_by: null,
          acknowledged_at: null,
          resolved_at: null,
          notes: null,
          products: {
            id: '3',
            name: 'Wooden Sculpture',
            sku: 'WD-SCULP-003',
            physical_stock: 0,
            reserved_stock: 0,
            available_stock: 0
          }
        }
      ]

      return NextResponse.json({
        success: true,
        alerts: mockAlerts,
        total: mockAlerts.length,
        message: 'Mock reorder alerts (database not configured)'
      })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const alertType = searchParams.get('alert_type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build the query
    let query = supabaseAdmin
      .from('reorder_alerts')
      .select(`
        id,
        product_id,
        alert_type,
        current_stock,
        reorder_point,
        suggested_reorder_quantity,
        alert_status,
        triggered_at,
        acknowledged_by,
        acknowledged_at,
        resolved_at,
        notes,
        products!inner(
          id,
          name,
          sku,
          stock_quantity
        )
      `)
      .order('triggered_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (productId) {
      query = query.eq('product_id', productId)
    }
    if (alertType) {
      query = query.eq('alert_type', alertType)
    }
    if (status) {
      query = query.eq('alert_status', status)
    }

    const { data: alerts, error: alertsError } = await query

    if (alertsError) {
      console.error('Error fetching reorder alerts:', alertsError)
      return NextResponse.json({ error: 'Failed to fetch reorder alerts' }, { status: 500 })
    }

    // Transform the data to match expected format
    const transformedAlerts = (alerts || []).map(alert => ({
      id: alert.id,
      product_id: alert.product_id,
      alert_type: alert.alert_type,
      current_stock: alert.current_stock,
      reorder_point: alert.reorder_point,
      suggested_reorder_quantity: alert.suggested_reorder_quantity,
      alert_status: alert.alert_status,
      triggered_at: alert.triggered_at,
      acknowledged_by: alert.acknowledged_by,
      acknowledged_at: alert.acknowledged_at,
      resolved_at: alert.resolved_at,
      notes: alert.notes,
      products: {
        id: alert.products.id,
        name: alert.products.name,
        sku: alert.products.sku,
        physical_stock: alert.products.stock_quantity,
        reserved_stock: 0, // Would need to calculate from reservations
        available_stock: alert.products.stock_quantity
      }
    }))

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('reorder_alerts')
      .select('id', { count: 'exact', head: true })

    if (productId) {
      countQuery = countQuery.eq('product_id', productId)
    }
    if (alertType) {
      countQuery = countQuery.eq('alert_type', alertType)
    }
    if (status) {
      countQuery = countQuery.eq('alert_status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting reorder alerts:', countError)
    }

    return NextResponse.json({
      success: true,
      alerts: transformedAlerts,
      total: count || 0,
      limit,
      offset,
      message: 'Reorder alerts fetched successfully'
    })

  } catch (error) {
    console.error('Reorder alerts API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating alert status update')
      return NextResponse.json({
        success: true,
        message: 'Alert status update simulated (database not configured)'
      })
    }

    const body = await request.json()
    const { alert_id, alert_status, notes, acknowledged_by } = body

    if (!alert_id || !alert_status) {
      return NextResponse.json({ error: 'alert_id and alert_status are required' }, { status: 400 })
    }

    if (!['acknowledged', 'resolved', 'dismissed'].includes(alert_status)) {
      return NextResponse.json({ error: 'alert_status must be "acknowledged", "resolved", or "dismissed"' }, { status: 400 })
    }

    // Update the alert
    const updateData: any = {
      alert_status,
      notes
    }

    if (alert_status === 'acknowledged') {
      updateData.acknowledged_at = new Date().toISOString()
      updateData.acknowledged_by = acknowledged_by
    } else if (alert_status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data: alert, error: alertError } = await supabaseAdmin
      .from('reorder_alerts')
      .update(updateData)
      .eq('id', alert_id)
      .select(`
        id,
        product_id,
        alert_type,
        current_stock,
        reorder_point,
        suggested_reorder_quantity,
        alert_status,
        triggered_at,
        acknowledged_by,
        acknowledged_at,
        resolved_at,
        notes,
        products!inner(
          id,
          name,
          sku,
          stock_quantity
        )
      `)
      .single()

    if (alertError) {
      console.error('Error updating alert:', alertError)
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      alert,
      message: `Alert ${alert_status} successfully`
    })

  } catch (error) {
    console.error('Update alert API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
