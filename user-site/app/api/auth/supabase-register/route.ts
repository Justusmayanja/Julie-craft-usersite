import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase, isSupabaseConfigured } from '@/lib/supabase'

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

    // Ensure profile exists - create it if the trigger didn't fire
    // Split full_name into first_name and last_name
    const nameParts = full_name.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Check if profile exists, if not create it
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single()

    if (profileCheckError || !existingProfile) {
      // Profile doesn't exist, create it explicitly
      const { error: profileCreateError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          is_admin: false,
          is_verified: true, // Since email_confirm: true
          created_at: data.user.created_at,
          updated_at: data.user.created_at,
          preferences: {
            sms: false,
            push: true,
            email: true,
            marketing: true
          },
          role: 'customer',
          total_orders: 0,
          total_spent: 0,
          join_date: data.user.created_at,
          status: 'active'
        })

      if (profileCreateError) {
        console.error('Error creating profile:', profileCreateError)
        // Continue anyway - profile might have been created by trigger
      }
    } else {
      // Profile exists, update it with registration data
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          email: data.user.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user.id)

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError)
      }
    }

    // Get the created user with profile data
    const { data: userWithProfile, error: profileError } = await supabaseAdmin
      .rpc('get_user_with_profile', { user_uuid: data.user.id })

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
    }

    // Create session for the user by signing them in
    // Use a regular client instance to sign in (admin client doesn't support user auth)
    let session = null
    let token = null

    try {
      // Create a new client instance for this request using anon key
      const { createClient } = await import('@supabase/supabase-js')
      const serverClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      )

      const { data: signInData, error: signInError } = await serverClient.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password
      })

      if (signInError) {
        console.error('Error signing in user after registration:', signInError)
        // Continue without session - user can sign in manually
      } else if (signInData.session) {
        session = signInData.session
        token = signInData.session.access_token
      }
    } catch (sessionError) {
      console.error('Error creating session after registration:', sessionError)
      // Continue without session - user can sign in manually
    }

    // Prepare user data for response
    const responseUser = userWithProfile?.[0] || {
      id: data.user.id,
      email: data.user.email,
      full_name: full_name,
      phone: phone || null,
      is_verified: true,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    }

    return NextResponse.json({
      message: 'Account created successfully',
      user: responseUser,
      session: session,
      token: token
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
