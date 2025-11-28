import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured',
        message: 'Password reset service unavailable' 
      }, { status: 503 })
    }

    const { code, email, newPassword, tokenId } = await request.json()

    if (!code || !email || !newPassword) {
      return NextResponse.json({ 
        error: 'Reset code, email, and new password are required' 
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

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    // Find the reset token (use tokenId if provided, otherwise search by code and email)
    let resetToken
    if (tokenId) {
      const { data: token, error: tokenError } = await supabaseAdmin
        .from('password_reset_tokens')
        .select('*')
        .eq('id', tokenId)
        .eq('token', code)
        .eq('email', normalizedEmail)
        .is('used_at', null)
        .single()

      if (tokenError || !token) {
        return NextResponse.json({ 
          error: 'Invalid or expired reset code' 
        }, { status: 400 })
      }
      resetToken = token
    } else {
      const { data: token, error: tokenError } = await supabaseAdmin
        .from('password_reset_tokens')
        .select('*')
        .eq('token', code)
        .eq('email', normalizedEmail)
        .is('used_at', null)
        .single()

      if (tokenError || !token) {
        return NextResponse.json({ 
          error: 'Invalid or expired reset code' 
        }, { status: 400 })
      }
      resetToken = token
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

    // Update user password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      resetToken.user_id,
      {
        password: newPassword
      }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update password',
        details: updateError.message 
      }, { status: 500 })
    }

    // Mark reset token as used
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id)

    // Invalidate all other unused reset tokens for this user
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', resetToken.user_id)
      .is('used_at', null)
      .neq('id', resetToken.id)

    return NextResponse.json({
      message: 'Password reset successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Password reset change error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

