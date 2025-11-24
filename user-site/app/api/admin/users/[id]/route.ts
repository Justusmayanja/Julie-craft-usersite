import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/admin/users/[id] - Get a single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

      // Verify the requesting user is an admin
      const { data: requesterProfile } = await supabaseAdmin
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .single()

      if (!requesterProfile?.is_admin && requesterProfile?.role !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    const { id } = await params

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get auth user info
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id)

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown',
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      phone: profile.phone || '',
      role: profile.role || 'customer',
      isAdmin: profile.is_admin || false,
      isVerified: profile.is_verified || false,
      status: profile.status || 'active',
      avatarUrl: profile.avatar_url || null,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      lastLogin: profile.last_login || null,
      emailVerified: authUser?.user?.email_confirmed_at ? true : false
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

      // Verify the requesting user is an admin
      const { data: requesterProfile } = await supabaseAdmin
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .single()

      if (!requesterProfile?.is_admin && requesterProfile?.role !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const { firstName, lastName, email, phone, role, isAdmin, status, password } = body

    // Validate role if provided - Only admin roles allowed
    if (role) {
      const validRoles = ['admin', 'super_admin', 'manager']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ 
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
        }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (firstName !== undefined) updateData.first_name = firstName
    if (lastName !== undefined) updateData.last_name = lastName
    if (email !== undefined) updateData.email = email.toLowerCase()
    if (phone !== undefined) updateData.phone = phone || null
    if (role !== undefined) updateData.role = role
    if (status !== undefined) updateData.status = status

    // All users managed here must be admins
    updateData.is_admin = true

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Update auth user if email or password changed
    if (email || password) {
      const authUpdate: any = {}
      if (email) {
        authUpdate.email = email.toLowerCase()
      }
      if (password) {
        authUpdate.password = password
      }
      if (firstName && lastName) {
        authUpdate.user_metadata = {
          full_name: `${firstName} ${lastName}`,
          phone: phone || null
        }
      }

      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdate)
      if (authUpdateError) {
        console.error('Auth update error:', authUpdateError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: `${updatedProfile.first_name || ''} ${updatedProfile.last_name || ''}`.trim() || updatedProfile.email || 'Unknown',
        firstName: updatedProfile.first_name,
        lastName: updatedProfile.last_name,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
        isAdmin: updatedProfile.is_admin,
        isVerified: updatedProfile.is_verified,
        status: updatedProfile.status,
        updatedAt: updatedProfile.updated_at
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete or deactivate a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

      // Verify the requesting user is an admin
      const { data: requesterProfile } = await supabaseAdmin
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .single()

      if (!requesterProfile?.is_admin && requesterProfile?.role !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
      }

      // Prevent self-deletion
      const { id } = await params
      if (id === user.id) {
        return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete - remove from auth and profiles
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (deleteError) {
        console.error('Error deleting user:', deleteError)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
      }
      return NextResponse.json({ message: 'User deleted successfully' })
    } else {
      // Soft delete - mark as inactive
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) {
        console.error('Error deactivating user:', updateError)
        return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 })
      }

      return NextResponse.json({ message: 'User deactivated successfully' })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

