import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured',
        message: 'Authentication service unavailable' 
      }, { status: 503 })
    }

    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 })
    }

    // Authenticate user using Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    })

    if (error) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ 
        error: 'Invalid email or password' 
      }, { status: 401 })
    }

    if (!data.user || !data.session) {
      return NextResponse.json({ 
        error: 'Authentication failed' 
      }, { status: 401 })
    }

    // Get user with profile data
    const { data: userWithProfile, error: profileError } = await supabaseAdmin
      .rpc('get_user_with_profile', { user_uuid: data.user.id })

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
    }

    // Update last login
    await supabaseAdmin
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)

    return NextResponse.json({
      message: 'Login successful',
      user: userWithProfile?.[0] || {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || 'User',
        phone: data.user.user_metadata?.phone || null,
        is_verified: !!data.user.email_confirmed_at,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at
      },
      session: data.session
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
