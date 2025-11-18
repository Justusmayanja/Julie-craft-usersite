import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock audit logs')
      
      // Return mock audit logs
      const mockAuditLogs = [
        {
          id: '1',
          product_id: '1',
          product_name: 'Handwoven Basket',
          product_sku: 'HW-BASKET-001',
          physical_stock_before: 30,
          physical_stock_after: 25,
          physical_stock_change: -5,
          reserved_stock_before: 0,
          reserved_stock_after: 3,
          reserved_stock_change: 3,
          available_stock_before: 30,
          available_stock_after: 22,
          available_stock_change: -8,
          operation_type: 'order_reservation',
          operation_reason: 'Order ORD-001 placed',
          quantity_affected: 2,
          order_id: 'ORD-001',
          related_user_id: 'user-123',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          notes: 'Customer order reservation'
        },
        {
          id: '2',
          product_id: '1',
          product_name: 'Handwoven Basket',
          product_sku: 'HW-BASKET-001',
          physical_stock_before: 25,
          physical_stock_after: 25,
          physical_stock_change: 0,
          reserved_stock_before: 3,
          reserved_stock_after: 4,
          reserved_stock_change: 1,
          available_stock_before: 22,
          available_stock_after: 21,
          available_stock_change: -1,
          operation_type: 'order_reservation',
          operation_reason: 'Order ORD-002 placed',
          quantity_affected: 1,
          order_id: 'ORD-002',
          related_user_id: 'user-456',
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          notes: 'Customer order reservation'
        },
        {
          id: '3',
          product_id: '2',
          product_name: 'Ceramic Vase',
          product_sku: 'CER-VASE-002',
          physical_stock_before: 10,
          physical_stock_after: 8,
          physical_stock_change: -2,
          reserved_stock_before: 0,
          reserved_stock_after: 2,
          reserved_stock_change: 2,
          available_stock_before: 10,
          available_stock_after: 6,
          available_stock_change: -4,
          operation_type: 'order_reservation',
          operation_reason: 'Order ORD-003 placed',
          quantity_affected: 2,
          order_id: 'ORD-003',
          related_user_id: 'user-789',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          notes: 'Customer order reservation'
        }
      ]

      return NextResponse.json({
        success: true,
        audit_logs: mockAuditLogs,
        total: mockAuditLogs.length,
        message: 'Mock audit logs (database not configured)'
      })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const orderId = searchParams.get('order_id')
    const operationType = searchParams.get('operation_type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build the query
    let query = supabaseAdmin
      .from('inventory_audit_log')
      .select(`
        id,
        product_id,
        product_name,
        product_sku,
        physical_stock_before,
        physical_stock_after,
        reserved_stock_before,
        reserved_stock_after,
        available_stock_before,
        available_stock_after,
        operation_type,
        operation_reason,
        quantity_affected,
        order_id,
        adjustment_id,
        related_user_id,
        inventory_version_before,
        inventory_version_after,
        created_at,
        notes
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (productId) {
      query = query.eq('product_id', productId)
    }
    if (orderId) {
      query = query.eq('order_id', orderId)
    }
    if (operationType) {
      query = query.eq('operation_type', operationType)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: auditLogs, error: auditLogsError } = await query

    if (auditLogsError) {
      console.error('Error fetching audit logs:', auditLogsError)
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
    }

    // Calculate change values (not stored in database, computed from before/after)
    const auditLogsWithChanges = (auditLogs || []).map(log => ({
      ...log,
      physical_stock_change: log.physical_stock_after - log.physical_stock_before,
      reserved_stock_change: log.reserved_stock_after - log.reserved_stock_before,
      available_stock_change: log.available_stock_after - log.available_stock_before
    }))

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('inventory_audit_log')
      .select('id', { count: 'exact', head: true })

    if (productId) {
      countQuery = countQuery.eq('product_id', productId)
    }
    if (orderId) {
      countQuery = countQuery.eq('order_id', orderId)
    }
    if (operationType) {
      countQuery = countQuery.eq('operation_type', operationType)
    }
    if (startDate) {
      countQuery = countQuery.gte('created_at', startDate)
    }
    if (endDate) {
      countQuery = countQuery.lte('created_at', endDate)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting audit logs:', countError)
    }

    return NextResponse.json({
      success: true,
      audit_logs: auditLogsWithChanges,
      total: count || 0,
      limit,
      offset,
      message: 'Audit logs fetched successfully'
    })

  } catch (error) {
    console.error('Audit logs API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
