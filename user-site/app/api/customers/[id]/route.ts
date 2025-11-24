import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Get customer profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('is_admin', false) // Ensure it's a customer, not admin
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get customer orders
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })

    const totalOrders = orders?.length || 0
    const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

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
    
    const customer = {
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
      joinDate: profile.created_at || profile.join_date,
      status: (profile.status || 'active') as 'active' | 'inactive' | 'blocked',
      isVip: totalSpent > 500,
      tags: totalOrders > 3 ? ['Repeat Customer'] : ['New Customer'],
      recentOrders: orders?.slice(0, 5) || []
    }

    return NextResponse.json(customer)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    // Split name into first and last name if needed
    const nameParts = (body.name || '').trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Update customer profile
    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      email: body.email,
      phone: body.phone || null,
      updated_at: new Date().toISOString()
    }

    // Add address fields if provided
    if (body.address) {
      updateData.address = body.address.street || null
      updateData.city = body.address.city || null
      updateData.state = body.address.state || null
      updateData.zip_code = body.address.zip || null
    }

    // Add status if provided
    if (body.status) {
      updateData.status = body.status
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .eq('is_admin', false) // Ensure it's a customer, not admin
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
    }

    if (!updatedProfile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get order statistics for the updated customer
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('total_amount, created_at')
      .eq('customer_id', id)

    const totalOrders = orders?.length || 0
    const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    const lastOrderDate = (orders && orders.length > 0)
      ? orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null

    // Build full name from first_name and last_name
    const fullName = `${updatedProfile.first_name || ''} ${updatedProfile.last_name || ''}`.trim() || 'Unknown'
    const displayName = fullName !== 'Unknown' ? fullName : (updatedProfile.email || 'Unknown')
    
    // Get initials for fallback
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    const initials = displayName !== 'Unknown' ? getInitials(displayName) : (updatedProfile.email?.charAt(0).toUpperCase() || 'U')
    
    // Return customer in the expected format
    const customer = {
      id: updatedProfile.id,
      name: displayName,
      email: updatedProfile.email,
      phone: updatedProfile.phone || '',
      avatar: initials,
      avatar_url: updatedProfile.avatar_url || null,
      address: {
        street: updatedProfile.address || '',
        city: updatedProfile.city || '',
        state: updatedProfile.state || '',
        zip: updatedProfile.zip_code || ''
      },
      totalOrders,
      totalSpent,
      lastOrderDate,
      joinDate: updatedProfile.created_at || updatedProfile.join_date,
      status: (updatedProfile.status || 'active') as 'active' | 'inactive' | 'blocked',
      isVip: totalSpent > 500,
      tags: totalOrders > 3 ? ['Repeat Customer'] : ['New Customer']
    }

    return NextResponse.json(customer)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Soft delete - mark as inactive instead of hard delete
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_admin: null, // This effectively removes them from customer list
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('is_admin', false) // Ensure it's a customer, not admin
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
    }

    if (!updatedProfile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Customer deleted successfully' })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}