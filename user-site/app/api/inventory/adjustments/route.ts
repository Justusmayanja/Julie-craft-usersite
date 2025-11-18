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
    // Use left join (products) instead of inner join to avoid filtering out adjustments without products
    let query = supabaseAdmin
      .from('inventory_adjustments')
      .select(`
        id,
        product_id,
        product_name,
        adjustment_type,
        reason,
        quantity_change,
        quantity_before,
        quantity_after,
        approval_status,
        notes,
        reference,
        user_id,
        user_name,
        created_at,
        updated_at,
        products(
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
      reason,
      quantity_change,
      quantity_before,
      quantity_after,
      notes,
      reference,
      user_id,
      user_name
    } = body

    // Validate required fields
    if (!product_id || !adjustment_type || !reason) {
      return NextResponse.json({ error: 'Missing required fields: product_id, adjustment_type, and reason are required' }, { status: 400 })
    }

    // Get product info
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, physical_stock, stock_quantity')
      .eq('id', product_id)
      .single()
    
    if (productError || !product) {
      return NextResponse.json({ 
        error: 'Product not found',
        error_code: 'PRODUCT_NOT_FOUND'
      }, { status: 404 })
    }
    
    // Get current stock
    const currentStock = product.physical_stock || product.stock_quantity || 0
    
    // Calculate quantities if not provided
    let finalQuantityBefore = quantity_before !== undefined ? quantity_before : currentStock
    let finalQuantityAfter = quantity_after
    let finalQuantityChange = quantity_change
    
    if (finalQuantityAfter === undefined) {
      if (adjustment_type === 'increase') {
        finalQuantityChange = finalQuantityChange || 0
        finalQuantityAfter = finalQuantityBefore + finalQuantityChange
      } else if (adjustment_type === 'decrease') {
        finalQuantityChange = finalQuantityChange || 0
        finalQuantityAfter = Math.max(0, finalQuantityBefore - Math.abs(finalQuantityChange))
        finalQuantityChange = -Math.abs(finalQuantityChange)
      } else if (adjustment_type === 'set') {
        finalQuantityAfter = finalQuantityChange || finalQuantityBefore
        finalQuantityChange = finalQuantityAfter - finalQuantityBefore
      } else {
        return NextResponse.json({ 
          error: 'Invalid adjustment_type. Must be: increase, decrease, or set' 
        }, { status: 400 })
      }
    } else {
      finalQuantityChange = finalQuantityAfter - finalQuantityBefore
    }

    // Create the adjustment
    const { data: adjustment, error: adjustmentError } = await supabaseAdmin
      .from('inventory_adjustments')
      .insert({
        product_id,
        product_name: product.name,
        adjustment_type,
        reason,
        quantity_before: finalQuantityBefore,
        quantity_after: finalQuantityAfter,
        quantity_change: finalQuantityChange,
        approval_status: 'pending',
        notes,
        reference,
        user_id,
        user_name,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        product_id,
        product_name,
        adjustment_type,
        reason,
        quantity_change,
        quantity_before,
        quantity_after,
        approval_status,
        notes,
        reference,
        user_id,
        user_name,
        created_at,
        updated_at,
        products(
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
      notes: notes || null,
      updated_at: new Date().toISOString()
    }

    // Note: The database schema doesn't have approved_at or approved_by fields
    // Approval status is tracked via approval_status field only

    const { data: adjustment, error: adjustmentError } = await supabaseAdmin
      .from('inventory_adjustments')
      .update(updateData)
      .eq('id', adjustment_id)
      .select(`
        id,
        product_id,
        product_name,
        adjustment_type,
        reason,
        quantity_change,
        quantity_before,
        quantity_after,
        approval_status,
        notes,
        reference,
        user_id,
        user_name,
        created_at,
        updated_at,
        products(
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

    // If approved, apply the adjustment using atomic function
    if (approval_status === 'approved' && adjustment) {
      // Determine adjustment type and quantity
      const quantityChange = adjustment.quantity_change || 0
      const adjustmentType = adjustment.adjustment_type || (quantityChange > 0 ? 'increase' : quantityChange < 0 ? 'decrease' : 'set')
      const quantity = adjustmentType === 'set' 
        ? adjustment.quantity_after 
        : Math.abs(quantityChange)
      
      // Map reason to reason text
      const reasonText = adjustment.reason || 'Inventory adjustment'
      
      // Use atomic function to apply the adjustment
      const { data: result, error: rpcError } = await supabaseAdmin.rpc('adjust_inventory_atomic', {
        p_product_id: adjustment.product_id,
        p_adjustment_type: adjustmentType,
        p_quantity: quantity,
        p_reason: reasonText,
        p_reference_type: 'adjustment',
        p_reference_id: adjustment.id,
        p_notes: adjustment.notes || `Approved adjustment: ${adjustment.description || ''}`,
        p_user_id: approved_by || null
      })

      if (rpcError || !result || !result.success) {
        console.error('Error applying inventory adjustment:', rpcError || result?.error)
        // Rollback the approval if stock update fails
        await supabaseAdmin
          .from('inventory_adjustments')
          .update({
            approval_status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', adjustment_id)
        
        return NextResponse.json({ 
          error: 'Failed to apply adjustment to inventory',
          details: result?.error || rpcError?.message 
        }, { status: 500 })
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
