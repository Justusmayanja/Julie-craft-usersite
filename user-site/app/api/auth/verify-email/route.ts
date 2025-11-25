import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured',
        message: 'Verification service unavailable' 
      }, { status: 503 })
    }

    const { code, email } = await request.json()

    if (!code || !email) {
      return NextResponse.json({ 
        error: 'Verification code and email are required' 
      }, { status: 400 })
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ 
        error: 'Invalid verification code format. Code must be 6 digits.' 
      }, { status: 400 })
    }

    // Find the verification code
    const { data: verificationToken, error: tokenError } = await supabaseAdmin
      .from('email_verification_tokens')
      .select('*')
      .eq('token', code)
      .eq('email', email.toLowerCase())
      .is('used_at', null) // Code not used yet
      .single()

    if (tokenError || !verificationToken) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification code' 
      }, { status: 400 })
    }

    // Check if token has expired
    const expiresAt = new Date(verificationToken.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json({ 
        error: 'Verification token has expired. Please request a new one.' 
      }, { status: 400 })
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      verificationToken.user_id
    )

    if (userError || !user.user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Mark token as used
    await supabaseAdmin
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', verificationToken.id)

    // Update user email confirmation in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      verificationToken.user_id,
      {
        email_confirm: true
      }
    )

    if (updateError) {
      console.error('Error confirming email in Supabase Auth:', updateError)
      // Continue to update profile
    }

    // Update profile to mark as verified
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', verificationToken.user_id)

    if (profileError) {
      console.error('Error updating profile verification status:', profileError)
      // Don't fail - auth user is already confirmed
    }

    return NextResponse.json({
      message: 'Email verified successfully',
      verified: true
    }, { status: 200 })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

