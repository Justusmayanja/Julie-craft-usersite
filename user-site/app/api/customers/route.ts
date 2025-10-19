import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/admin/supabase/server'
import { customerService } from '@/lib/admin/services/customers'
import { createCustomerSchema, customerFiltersSchema } from '@/lib/admin/validations/customer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as 'active' | 'inactive' | 'blocked' || undefined,
      gender: searchParams.get('gender') as 'male' | 'female' | 'other' | 'prefer_not_to_say' || undefined,
      country: searchParams.get('country') || undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      min_orders: searchParams.get('min_orders') ? Number(searchParams.get('min_orders')) : undefined,
      max_orders: searchParams.get('max_orders') ? Number(searchParams.get('max_orders')) : undefined,
      min_spent: searchParams.get('min_spent') ? Number(searchParams.get('min_spent')) : undefined,
      max_spent: searchParams.get('max_spent') ? Number(searchParams.get('max_spent')) : undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      sort_by: searchParams.get('sort_by') as 'name' | 'email' | 'total_orders' | 'total_spent' | 'last_order_date' | 'join_date' | 'created_at' || 'created_at',
      sort_order: searchParams.get('sort_order') as 'asc' | 'desc' || 'desc',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
    }

    // Validate filters
    const validatedFilters = customerFiltersSchema.parse(filters)

    // Get customers
    const result = await customerService.getCustomers(validatedFilters)

    return NextResponse.json(result)

  } catch (error) {
    console.error('API error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid filter parameters' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = createCustomerSchema.parse(body)

    // Create customer
    const customer = await customerService.createCustomer(validatedData)

    return NextResponse.json(customer, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid customer data' }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
