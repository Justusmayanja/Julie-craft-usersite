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

    // Verify admin authentication - check both header and cookies
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('julie-crafts-token')?.value
    
    let token: string | null = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (!token) {
      console.log('No authorization token found (header or cookie), returning mock data')
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
          }
        ],
        total: 2,
        limit: 20,
        offset: 0,
        message: 'Mock data - no authentication'
      })
    }
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        console.log('Token verification failed, returning mock data:', error?.message)
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
            }
          ],
          total: 1,
          limit: 20,
          offset: 0,
          message: 'Mock data - authentication failed'
        })
      }
    } catch (error) {
      console.log('Token verification error, returning mock data:', error)
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
          }
        ],
        total: 1,
        limit: 20,
        offset: 0,
        message: 'Mock data - token verification error'
      })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get('include_archived') === 'true'
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

    // Apply archive filter
    if (filters.status === 'archived') {
      query = query.eq('is_archived', true)
    } else if (!includeArchived) {
      // By default, exclude archived customers unless explicitly requested
      query = query.eq('is_archived', false)
    }

    // Apply search filter
    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    // Apply sorting
    const sortColumn = filters.sort_by === 'name' ? 'created_at' : filters.sort_by
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
        if (!supabaseAdmin) {
          return {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
            email: profile.email,
            phone: profile.phone || '',
            avatar: (profile.email || 'U').charAt(0).toUpperCase(),
            address: {
              street: profile.address || '',
              city: profile.city || '',
              state: profile.state || '',
              zip: profile.zip_code || ''
            },
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: null,
            joinDate: profile.created_at || profile.join_date,
            status: (profile.status || 'active') as 'active' | 'inactive' | 'blocked',
            isVip: false,
            tags: ['New Customer']
          }
        }
        
        const { data: orders } = await supabaseAdmin
          .from('orders')
          .select('total_amount, created_at')
          .eq('customer_id', profile.id)

        const totalOrders = orders?.length || 0
        const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
        const lastOrderDate = (orders && orders.length > 0)
          ? orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null

        const isVip = totalSpent > 500 // VIP if spent more than 500
        const status = profile.status || 'active' // Use profile status if available

        // Build full name from first_name and last_name
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'
        const displayName = fullName !== 'Unknown' ? fullName : (profile.email || 'Unknown')
        
        // Get initials for fallback
        const getInitials = (name: string) => {
          return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2)
        }
        const initials = displayName !== 'Unknown' ? getInitials(displayName) : (profile.email?.charAt(0).toUpperCase() || 'U')
        
        return {
          id: profile.id,
          name: displayName,
          email: profile.email,
          phone: profile.phone || '',
          avatar: initials,
          avatar_url: profile.avatar_url || null,
          address: {
            street: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            zip: profile.zip_code || ''
          },
          totalOrders,
          totalSpent,
          lastOrderDate,
          joinDate: profile.created_at || profile.join_date,
          status: status as 'active' | 'inactive' | 'blocked',
          isVip,
          tags: totalOrders > 3 ? ['Repeat Customer'] : ['New Customer']
        }
      })
    )

    // Apply VIP filter if needed (before pagination)
    let filteredCustomers = customersWithStats
    if (filters.status === 'vip') {
      filteredCustomers = customersWithStats.filter(c => c.isVip)
    } else if (filters.status && filters.status !== 'all' && filters.status !== 'vip') {
      filteredCustomers = customersWithStats.filter(c => c.status === filters.status)
    }

    // If filtering, we need to get the total count of filtered results
    // For now, return the filtered count, but ideally we'd query the database with the filter
    const filteredTotal = filteredCustomers.length

    return NextResponse.json({
      customers: filteredCustomers,
      total: filters.status === 'vip' || (filters.status && filters.status !== 'all') 
        ? filteredTotal 
        : (count || 0), // Use original count if no filter, filtered count if filtered
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

    // Verify admin authentication - check both header and cookies
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('julie-crafts-token')?.value
    
    let token: string | null = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        first_name: body.first_name,
        last_name: body.last_name,
        phone: body.phone || null,
        is_admin: false,
        role: 'customer',
        status: 'active',
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        join_date: new Date().toISOString(),
        total_orders: 0,
        total_spent: 0
      })
      .select()
      .single()

    if (createError) {
      console.error('Database error:', createError)
      return NextResponse.json({ error: 'Failed to create customer', details: createError.message }, { status: 500 })
    }

    // Build full name from first_name and last_name
    const fullName = `${newProfile.first_name || ''} ${newProfile.last_name || ''}`.trim() || 'Unknown'
    const displayName = fullName !== 'Unknown' ? fullName : (newProfile.email || 'Unknown')
    
    // Get initials for fallback
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    const initials = displayName !== 'Unknown' ? getInitials(displayName) : (newProfile.email?.charAt(0).toUpperCase() || 'U')
    
    // Return customer in the expected format
    const customer = {
      id: newProfile.id,
      name: displayName,
      email: newProfile.email,
      phone: newProfile.phone || '',
      avatar: initials,
      avatar_url: newProfile.avatar_url || null,
      address: {
        street: newProfile.address || '',
        city: newProfile.city || '',
        state: newProfile.state || '',
        zip: newProfile.zip_code || ''
      },
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
      joinDate: newProfile.created_at || newProfile.join_date,
      status: (newProfile.status || 'active') as 'active' | 'inactive' | 'blocked',
      isVip: false,
      tags: ['New Customer']
    }

    return NextResponse.json(customer, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}