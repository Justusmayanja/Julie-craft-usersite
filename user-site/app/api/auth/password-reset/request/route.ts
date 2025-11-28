import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { sendPasswordResetEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured',
        message: 'Password reset service unavailable' 
      }, { status: 503 })
    }

    const { email } = await request.json()

    // Validate input
    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
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

    // Find user by email in profiles table (more efficient than listing all users)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('email', normalizedEmail)
      .single()

    // If profile not found, check auth users as fallback
    let userId: string | null = null
    let userName = 'User'

    if (profile) {
      userId = profile.id
      userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
    } else {
      // Fallback: try to find user in auth (in case profile doesn't exist)
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (!userError && users) {
        const user = users.users.find(u => u.email?.toLowerCase() === normalizedEmail)
        if (user) {
          userId = user.id
          userName = user.user_metadata?.full_name || 'User'
        }
      }
    }

    if (!userId) {
      // Email not found in database
      return NextResponse.json({ 
        error: 'No account found with this email address. Please check your email and try again.',
        code: 'EMAIL_NOT_FOUND'
      }, { status: 404 })
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Code expires in 1 hour

    // Invalidate any existing unused reset tokens for this user
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('used_at', null)

    // Store reset code in database
    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        email: normalizedEmail,
        token: resetCode,
        expires_at: expiresAt.toISOString()
      })

    if (tokenError) {
      console.error('Error storing reset code:', tokenError)
      return NextResponse.json({ 
        error: 'Failed to generate reset code' 
      }, { status: 500 })
    }

    // Send password reset email with code
    const emailSent = await sendPasswordResetEmail(
      normalizedEmail,
      userName,
      resetCode
    )

    if (!emailSent) {
      console.warn('Failed to send password reset email, but code was generated')
      // Still return success to not reveal if email exists
    }

    return NextResponse.json({
      message: 'Password reset code has been sent to your email address.',
      success: true
    }, { status: 200 })

  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

