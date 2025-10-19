import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    const { email, password, name, role = 'admin' } = await request.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: 'Email, password, and name are required' 
      }, { status: 400 })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm email for testing
      user_metadata: {
        full_name: name
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

    // Create profile with admin role
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        first_name: name.split(' ')[0] || name,
        last_name: name.split(' ').slice(1).join(' ') || '',
        role: role,
        is_admin: role === 'admin' || role === 'super_admin',
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Try to clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ 
        error: 'Failed to create user profile',
        details: profileError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Test user created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
        role: role,
        is_admin: role === 'admin' || role === 'super_admin'
      }
    })

  } catch (error) {
    console.error('Create test user error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
