import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured',
        message: 'Password reset verification service unavailable' 
      }, { status: 503 })
    }

    const { code, email } = await request.json()

    if (!code || !email) {
      return NextResponse.json({ 
        error: 'Reset code and email are required' 
      }, { status: 400 })
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ 
        error: 'Invalid reset code format. Code must be 6 digits.' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Please enter a valid email address' 
      }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    // Find the reset token
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', code)
      .eq('email', normalizedEmail)
      .is('used_at', null) // Code not used yet
      .single()

    if (tokenError || !resetToken) {
      return NextResponse.json({ 
        error: 'Invalid or expired reset code' 
      }, { status: 400 })
    }

    // Check if token has expired
    const expiresAt = new Date(resetToken.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json({ 
        error: 'Reset code has expired. Please request a new one.' 
      }, { status: 400 })
    }

    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      resetToken.user_id
    )

    if (userError || !user.user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Verify email matches
    if (user.user.email?.toLowerCase() !== normalizedEmail) {
      return NextResponse.json({ 
        error: 'Invalid reset code' 
      }, { status: 400 })
    }

    // Return success with token ID for the next step (password change)
    // We don't mark it as used yet - that happens when password is actually changed
    return NextResponse.json({
      message: 'Reset code verified successfully',
      verified: true,
      tokenId: resetToken.id // This will be used to verify the password change request
    }, { status: 200 })

  } catch (error) {
    console.error('Password reset verification error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

