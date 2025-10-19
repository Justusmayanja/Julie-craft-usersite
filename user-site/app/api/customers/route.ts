import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock customers data')
      return NextResponse.json({
        customers: [
          {
            id: "CUST-001",
            name: "Sarah Johnson",
            email: "sarah.johnson@email.com",
            phone: "+1 (555) 123-4567",
            avatar: "SJ",
            address: {
              street: "123 Main St",
              city: "Springfield",
              state: "IL",
              zip: "62701"
            },
            totalOrders: 5,
            totalSpent: 425.95,
            lastOrderDate: "2024-01-15",
            joinDate: "2023-06-15",
            status: "active",
            isVip: true,
            tags: ["Pottery Lover", "Repeat Customer"]
          },
          {
            id: "CUST-002",
            name: "Mike Chen",
            email: "mike.chen@email.com",
            phone: "+1 (555) 987-6543",
            avatar: "MC",
            address: {
              street: "456 Oak Ave",
              city: "Chicago",
              state: "IL",
              zip: "60601"
            },
            totalOrders: 3,
            totalSpent: 189.50,
            lastOrderDate: "2024-01-10",
            joinDate: "2023-08-20",
            status: "active",
            isVip: false,
            tags: ["New Customer"]
          },
          {
            id: "CUST-003",
            name: "Emily Rodriguez",
            email: "emily.rodriguez@email.com",
            phone: "+1 (555) 456-7890",
            avatar: "ER",
            address: {
              street: "789 Pine St",
              city: "Los Angeles",
              state: "CA",
              zip: "90210"
            },
            totalOrders: 8,
            totalSpent: 1200.75,
            lastOrderDate: "2024-01-20",
            joinDate: "2023-03-10",
            status: "active",
            isVip: true,
            tags: ["VIP Customer", "Textile Enthusiast"]
          },
          {
            id: "CUST-004",
            name: "David Kim",
            email: "david.kim@email.com",
            phone: "+1 (555) 321-0987",
            avatar: "DK",
            address: {
              street: "321 Elm St",
              city: "Seattle",
              state: "WA",
              zip: "98101"
            },
            totalOrders: 2,
            totalSpent: 95.25,
            lastOrderDate: "2024-01-05",
            joinDate: "2023-12-01",
            status: "active",
            isVip: false,
            tags: ["New Customer"]
          },
          {
            id: "CUST-005",
            name: "Lisa Thompson",
            email: "lisa.thompson@email.com",
            phone: "+1 (555) 654-3210",
            avatar: "LT",
            address: {
              street: "654 Maple Ave",
              city: "Boston",
              state: "MA",
              zip: "02101"
            },
            totalOrders: 12,
            totalSpent: 2100.00,
            lastOrderDate: "2024-01-18",
            joinDate: "2022-11-15",
            status: "active",
            isVip: true,
            tags: ["VIP Customer", "Woodwork Collector", "Repeat Customer"]
          }
        ],
        total: 5,
        limit: 20,
        offset: 0,
        message: 'Mock data - database not configured'
      })
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: searchParams.get('sort_order') || 'desc',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
    }

    // Build query for profiles (customers are non-admin users)
    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('is_admin', false) // Only get customers, not admins

    // Apply search filter
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    // Apply sorting
    const sortColumn = filters.sort_by === 'name' ? 'full_name' : filters.sort_by
    query = query.order(sortColumn, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1)

    const { data: profiles, error: profilesError, count } = await query

    if (profilesError) {
      console.error('Database error:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    // Get order statistics for each customer
    const customersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        // Get order count and total spent
        const { data: orders } = await supabaseAdmin
          .from('orders')
          .select('total_amount, created_at')
          .eq('customer_id', profile.id)

        const totalOrders = orders?.length || 0
        const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
        const lastOrderDate = orders?.length > 0 
          ? orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null

        return {
          id: profile.id,
          name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          email: profile.email,
          phone: profile.phone,
          avatar: profile.full_name?.charAt(0) || profile.email?.charAt(0) || 'U',
          address: {
            street: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            zip: profile.zip_code || ''
          },
          totalOrders,
          totalSpent,
          lastOrderDate,
          joinDate: profile.created_at,
          status: 'active', // All customers are considered active for now
          isVip: totalSpent > 500, // VIP if spent more than 500
          tags: totalOrders > 3 ? ['Repeat Customer'] : ['New Customer']
        }
      })
    )

    return NextResponse.json({
      customers: customersWithStats,
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
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

    const body = await request.json()
    
    // Create customer profile
    const { data: newProfile, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        email: body.email,
        full_name: `${body.first_name} ${body.last_name}`,
        first_name: body.first_name,
        last_name: body.last_name,
        phone: body.phone,
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Database error:', createError)
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }

    return NextResponse.json(newProfile, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}