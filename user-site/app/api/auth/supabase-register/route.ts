import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase, isSupabaseConfigured } from '@/lib/supabase'
import { sendVerificationEmail } from '@/lib/email-service'
import { randomBytes } from 'crypto'

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

    // Create user using Supabase Auth (email not confirmed yet)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: false, // Require email verification
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

    // Ensure profile exists and has correct data
    // Split full_name into first_name and last_name
    const nameParts = full_name.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Wait a brief moment to allow database trigger to complete (if it exists)
    await new Promise(resolve => setTimeout(resolve, 300))

    // Prepare profile data
    const profileData = {
      id: data.user.id,
      email: data.user.email,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      is_admin: false,
      is_verified: false, // Email not verified yet
      updated_at: new Date().toISOString(),
      preferences: {
        sms: false,
        push: true,
        email: true,
        marketing: true
      },
      role: 'customer',
      total_orders: 0,
      total_spent: 0,
      status: 'active'
    }

    // Try to update profile first (handles case where trigger created it)
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profileData)
      .eq('id', data.user.id)
      .select()

    // If update didn't affect any rows or failed, try to insert
    const profileExists = !updateError && updateData && updateData.length > 0

    if (!profileExists) {
      console.log('Profile does not exist or update failed, attempting insert...')
      
      // Add fields required for insert
      const insertData = {
        ...profileData,
        created_at: data.user.created_at,
        join_date: data.user.created_at
      }

      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert(insertData)

      if (insertError) {
        // If insert fails with duplicate key, profile exists (created by trigger after our check)
        // This is expected - just ensure data is updated
        if (insertError.code === '23505' || 
            insertError.message?.includes('duplicate key') || 
            insertError.message?.includes('unique constraint') ||
            insertError.message?.includes('profiles_pkey')) {
          console.log('Profile already exists (created by trigger), ensuring data is updated...')
          
          // Final update attempt to ensure all data is correct
          const { error: finalUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({
              first_name: firstName,
              last_name: lastName,
              phone: phone || null,
              email: data.user.email,
              is_verified: false,
              updated_at: new Date().toISOString(),
              preferences: profileData.preferences,
              role: profileData.role,
              status: profileData.status
            })
            .eq('id', data.user.id)

          if (finalUpdateError) {
            console.error('Error updating existing profile:', finalUpdateError)
          }
        } else {
          console.error('Error creating profile:', insertError)
          // Don't fail registration - user can still verify email and login
          // The trigger might create the profile later
        }
      }
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Code expires in 24 hours

    // Store verification code in database
    const { error: tokenError } = await supabaseAdmin
      .from('email_verification_tokens')
      .insert({
        user_id: data.user.id,
        email: email.toLowerCase(),
        token: verificationCode, // Store code in token field
        expires_at: expiresAt.toISOString()
      })

    if (tokenError) {
      console.error('Error storing verification code:', tokenError)
      // Continue - we'll still try to send the email
    }

    // Send verification email with code
    const emailSent = await sendVerificationEmail(
      email.toLowerCase(),
      full_name,
      verificationCode
    )

    if (!emailSent) {
      console.warn('Failed to send verification email, but user was created')
      // Don't fail registration if email fails - user can request resend
    }

    // Prepare user data for response
    const responseUser = {
      id: data.user.id,
      email: data.user.email,
      full_name: full_name,
      phone: phone || null,
      is_verified: false,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    }

    return NextResponse.json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: responseUser,
      requiresVerification: true,
      emailSent: emailSent
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
