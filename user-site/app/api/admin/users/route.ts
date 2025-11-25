import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/admin/users - Fetch all users with filters
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const role = searchParams.get('role') || undefined
    const status = searchParams.get('status') || undefined

    // Build query - Only fetch admin users (is_admin = true OR role in admin roles)
    // First, get all admin users
    let query = supabaseAdmin
      .from('profiles')
      .select('id, email, first_name, last_name, phone, role, is_admin, is_verified, status, avatar_url, created_at, updated_at, last_login', { count: 'exact' })
      .or('is_admin.eq.true,role.in.(admin,super_admin,manager)')

    // Apply role filter (only if not 'all')
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    // Apply status filter (only if not 'all')
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false })

    const { data: profiles, error: profilesError, count } = await query

    if (profilesError) {
      console.error('Database error:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Apply search filter in memory if provided (since Supabase .or() chaining can be tricky)
    let filteredProfiles = profiles || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredProfiles = filteredProfiles.filter(profile => {
        const firstName = (profile.first_name || '').toLowerCase()
        const lastName = (profile.last_name || '').toLowerCase()
        const email = (profile.email || '').toLowerCase()
        return firstName.includes(searchLower) || lastName.includes(searchLower) || email.includes(searchLower)
      })
    }

    // Format users for response
    const users = filteredProfiles.map(profile => ({
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
      lastLogin: profile.last_login || null
    }))

    return NextResponse.json({
      users,
      total: filteredProfiles.length
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { email, password, firstName, lastName, phone, role = 'admin', isAdmin = false } = body

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ 
        error: 'Email, password, first name, and last name are required' 
      }, { status: 400 })
    }

    // Validate role - Only admin roles allowed
    const validRoles = ['admin', 'super_admin', 'manager']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      }, { status: 400 })
    }

    // All users created here must be admins
    const shouldBeAdmin = true

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        full_name: `${firstName} ${lastName}`,
        phone: phone || null
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return NextResponse.json({ 
        error: 'Failed to create user account',
        details: authError.message 
      }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ 
        error: 'User creation failed' 
      }, { status: 500 })
    }

    // Ensure profile exists and has correct data
    // Wait a brief moment to allow database trigger to complete (if it exists)
    await new Promise(resolve => setTimeout(resolve, 300))

    // Prepare profile data
    const profileData = {
      id: authData.user.id,
      email: email.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      role: role,
      is_admin: shouldBeAdmin,
      is_verified: true,
      status: 'active',
      updated_at: new Date().toISOString(),
      preferences: {
        sms: false,
        push: true,
        email: true,
        marketing: true
      },
      total_orders: 0,
      total_spent: 0
    }

    // Try to update profile first (handles case where trigger created it)
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profileData)
      .eq('id', authData.user.id)
      .select()

    // If update didn't affect any rows or failed, try to insert
    const profileExists = !updateError && updateData && updateData.length > 0

    let profileDataFinal: any = null

    if (!profileExists) {
      console.log('Profile does not exist or update failed, attempting insert...')
      
      // Add fields required for insert
      const insertData = {
        ...profileData,
        created_at: authData.user.created_at,
        join_date: authData.user.created_at
      }

      const { data: insertResult, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        // If insert fails with duplicate key, profile exists (created by trigger after our check)
        if (insertError.code === '23505' || 
            insertError.message?.includes('duplicate key') || 
            insertError.message?.includes('unique constraint') ||
            insertError.message?.includes('profiles_pkey')) {
          console.log('Profile already exists (created by trigger), ensuring data is updated...')
          
          // Final update attempt to ensure all data is correct
          const { data: finalUpdateData, error: finalUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({
              first_name: firstName,
              last_name: lastName,
              phone: phone || null,
              email: email.toLowerCase(),
              role: role,
              is_admin: shouldBeAdmin,
              is_verified: true,
              status: 'active',
              updated_at: new Date().toISOString(),
              preferences: profileData.preferences
            })
            .eq('id', authData.user.id)
            .select()
            .single()

          if (finalUpdateError) {
            console.error('Error updating existing profile:', finalUpdateError)
            // Try to clean up the auth user if profile update fails
            try {
              await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            } catch (deleteError) {
              console.error('Failed to clean up auth user:', deleteError)
            }
            return NextResponse.json({ 
              error: 'Failed to create user profile',
              details: finalUpdateError.message 
            }, { status: 500 })
          }
          profileDataFinal = finalUpdateData
        } else {
          console.error('Error creating profile:', insertError)
          // Try to clean up the auth user if profile creation fails
          try {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          } catch (deleteError) {
            console.error('Failed to clean up auth user:', deleteError)
          }
          return NextResponse.json({ 
            error: 'Failed to create user profile',
            details: insertError.message 
          }, { status: 500 })
        }
      } else {
        profileDataFinal = insertResult
      }
    } else {
      profileDataFinal = updateData[0]
    }

    if (!profileDataFinal) {
      return NextResponse.json({ 
        error: 'Failed to retrieve created profile' 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: profileDataFinal.id,
        email: profileDataFinal.email,
        name: `${profileDataFinal.first_name} ${profileDataFinal.last_name}`.trim(),
        firstName: profileDataFinal.first_name,
        lastName: profileDataFinal.last_name,
        phone: profileDataFinal.phone,
        role: profileDataFinal.role,
        isAdmin: profileDataFinal.is_admin,
        isVerified: profileDataFinal.is_verified,
        status: profileDataFinal.status,
        createdAt: profileDataFinal.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

