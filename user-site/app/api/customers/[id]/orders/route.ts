import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/admin/supabase/server'
import { customerService } from '@/lib/admin/services/customers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Limit must be between 1 and 100' }, { status: 400 })
    }

    // Check if customer exists
    const customer = await customerService.getCustomerById(id)
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get customer orders
    const orders = await customerService.getCustomerOrders(id, limit)

    return NextResponse.json({
      customer_id: id,
      customer_name: customer.full_name,
      orders: orders,
      total_orders: customer.total_orders,
      total_spent: customer.total_spent
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
