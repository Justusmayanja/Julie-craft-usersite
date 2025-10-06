import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured',
        message: 'Registration service unavailable' 
      }, { status: 503 })
    }

    const { email, password, full_name, phone } = await request.json()

    // Validate input
    if (!email || !password || !full_name) {
      return NextResponse.json({ 
        error: 'Email, password, and full name are required' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Please enter a valid email address' 
      }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 })
    }

    // Create user using Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        full_name: full_name,
        phone: phone || null
      }
    })

    if (error) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ 
        error: error.message || 'Failed to create account' 
      }, { status: 500 })
    }

    if (!data.user) {
      return NextResponse.json({ 
        error: 'Failed to create user' 
      }, { status: 500 })
    }

    // Get the created user with profile data
    const { data: userWithProfile, error: profileError } = await supabaseAdmin
      .rpc('get_user_with_profile', { user_uuid: data.user.id })

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
    }

    // Create session for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email.toLowerCase(),
      password: password
    })

    if (sessionError) {
      console.error('Error creating session:', sessionError)
    }

    return NextResponse.json({
      message: 'Account created successfully',
      user: userWithProfile?.[0] || {
        id: data.user.id,
        email: data.user.email,
        full_name: full_name,
        phone: phone || null,
        is_verified: true,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at
      },
      session: sessionData
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
