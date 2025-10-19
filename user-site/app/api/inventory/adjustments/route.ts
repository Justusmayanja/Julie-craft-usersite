import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock adjustments')
      
      // Return mock adjustments
      const mockAdjustments = [
        {
          id: '1',
          product_id: '1',
          adjustment_type: 'physical_count',
          reason_code: 'INVENTORY_COUNT',
          quantity_adjusted: 5,
          previous_physical_stock: 20,
          new_physical_stock: 25,
          approval_status: 'approved',
          description: 'Monthly inventory count adjustment',
          supporting_documents: [],
          requested_by: 'admin-123',
          approved_by: 'admin-456',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          approved_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
          notes: 'Found additional stock during physical count',
          products: {
            id: '1',
            name: 'Handwoven Basket',
            sku: 'HW-BASKET-001'
          }
        },
        {
          id: '2',
          product_id: '2',
          adjustment_type: 'damage_writeoff',
          reason_code: 'DAMAGED_GOODS',
          quantity_adjusted: -2,
          previous_physical_stock: 10,
          new_physical_stock: 8,
          approval_status: 'pending',
          description: 'Damaged goods write-off',
          supporting_documents: ['damage_report_001.pdf'],
          requested_by: 'admin-789',
          approved_by: null,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          approved_at: null,
          notes: 'Two vases damaged during shipping',
          products: {
            id: '2',
            name: 'Ceramic Vase',
            sku: 'CER-VASE-002'
          }
        }
      ]

      return NextResponse.json({
        success: true,
        adjustments: mockAdjustments,
        total: mockAdjustments.length,
        message: 'Mock adjustments (database not configured)'
      })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build the query
    let query = supabaseAdmin
      .from('inventory_adjustments')
      .select(`
        id,
        product_id,
        adjustment_type,
        reason_code,
        quantity_adjusted,
        previous_physical_stock,
        new_physical_stock,
        approval_status,
        description,
        supporting_documents,
        requested_by,
        approved_by,
        created_at,
        approved_at,
        notes,
        products!inner(
          id,
          name,
          sku
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (productId) {
      query = query.eq('product_id', productId)
    }
    if (status) {
      query = query.eq('approval_status', status)
    }

    const { data: adjustments, error: adjustmentsError } = await query

    if (adjustmentsError) {
      console.error('Error fetching adjustments:', adjustmentsError)
      return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('inventory_adjustments')
      .select('id', { count: 'exact', head: true })

    if (productId) {
      countQuery = countQuery.eq('product_id', productId)
    }
    if (status) {
      countQuery = countQuery.eq('approval_status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting adjustments:', countError)
    }

    return NextResponse.json({
      success: true,
      adjustments: adjustments || [],
      total: count || 0,
      limit,
      offset,
      message: 'Adjustments fetched successfully'
    })

  } catch (error) {
    console.error('Adjustments API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating adjustment creation')
      return NextResponse.json({
        success: true,
        adjustment: {
          id: 'mock-1',
          product_id: '1',
          adjustment_type: 'manual_correction',
          reason_code: 'MANUAL_ADJUSTMENT',
          quantity_adjusted: 5,
          previous_physical_stock: 20,
          new_physical_stock: 25,
          approval_status: 'pending',
          description: 'Manual stock adjustment',
          supporting_documents: [],
          requested_by: 'admin-123',
          approved_by: null,
          created_at: new Date().toISOString(),
          approved_at: null,
          notes: 'Mock adjustment created'
        },
        message: 'Adjustment created (database not configured)'
      })
    }

    const body = await request.json()
    const {
      product_id,
      adjustment_type,
      reason_code,
      quantity_adjusted,
      previous_physical_stock,
      new_physical_stock,
      description,
      supporting_documents,
      requested_by,
      notes
    } = body

    // Validate required fields
    if (!product_id || !adjustment_type || !reason_code || quantity_adjusted === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create the adjustment
    const { data: adjustment, error: adjustmentError } = await supabaseAdmin
      .from('inventory_adjustments')
      .insert({
        product_id,
        adjustment_type,
        reason_code,
        quantity_adjusted,
        previous_physical_stock,
        new_physical_stock,
        approval_status: 'pending',
        description,
        supporting_documents: supporting_documents || [],
        requested_by,
        notes,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        product_id,
        adjustment_type,
        reason_code,
        quantity_adjusted,
        previous_physical_stock,
        new_physical_stock,
        approval_status,
        description,
        supporting_documents,
        requested_by,
        approved_by,
        created_at,
        approved_at,
        notes,
        products!inner(
          id,
          name,
          sku
        )
      `)
      .single()

    if (adjustmentError) {
      console.error('Error creating adjustment:', adjustmentError)
      return NextResponse.json({ error: 'Failed to create adjustment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      adjustment,
      message: 'Adjustment created successfully'
    })

  } catch (error) {
    console.error('Create adjustment API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating adjustment approval')
      return NextResponse.json({
        success: true,
        message: 'Adjustment approval simulated (database not configured)'
      })
    }

    const body = await request.json()
    const { adjustment_id, approval_status, notes, approved_by } = body

    if (!adjustment_id || !approval_status) {
      return NextResponse.json({ error: 'adjustment_id and approval_status are required' }, { status: 400 })
    }

    if (!['approved', 'rejected'].includes(approval_status)) {
      return NextResponse.json({ error: 'approval_status must be "approved" or "rejected"' }, { status: 400 })
    }

    // Update the adjustment
    const updateData: any = {
      approval_status,
      notes
    }

    if (approval_status === 'approved') {
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = approved_by
    }

    const { data: adjustment, error: adjustmentError } = await supabaseAdmin
      .from('inventory_adjustments')
      .update(updateData)
      .eq('id', adjustment_id)
      .select(`
        id,
        product_id,
        adjustment_type,
        reason_code,
        quantity_adjusted,
        previous_physical_stock,
        new_physical_stock,
        approval_status,
        description,
        supporting_documents,
        requested_by,
        approved_by,
        created_at,
        approved_at,
        notes,
        products!inner(
          id,
          name,
          sku
        )
      `)
      .single()

    if (adjustmentError) {
      console.error('Error updating adjustment:', adjustmentError)
      return NextResponse.json({ error: 'Failed to update adjustment' }, { status: 500 })
    }

    // If approved, update the product stock
    if (approval_status === 'approved' && adjustment) {
      const { error: stockUpdateError } = await supabaseAdmin
        .from('products')
        .update({
          stock_quantity: adjustment.new_physical_stock,
          updated_at: new Date().toISOString()
        })
        .eq('id', adjustment.product_id)

      if (stockUpdateError) {
        console.error('Error updating product stock:', stockUpdateError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      adjustment,
      message: `Adjustment ${approval_status} successfully`
    })

  } catch (error) {
    console.error('Update adjustment API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
