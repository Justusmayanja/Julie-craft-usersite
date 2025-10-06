import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured',
        message: 'Authentication service unavailable' 
      }, { status: 503 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'No token provided' 
      }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any

      // Get user from database
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single()

      if (userError || !user) {
        return NextResponse.json({ 
          error: 'User not found' 
        }, { status: 404 })
      }

      // Get profile data if available
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', decoded.userId)
        .single()

      // Combine user and profile data
      const userData = {
        ...user,
        ...(profile && {
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
          preferences: profile.preferences,
          is_verified: profile.is_verified,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          timezone: profile.timezone,
          language: profile.language
        })
      }

      // Return user data (without password)
      const { password_hash, ...userWithoutPassword } = userData

      return NextResponse.json({
        valid: true,
        user: userWithoutPassword
      })

    } catch (jwtError) {
      return NextResponse.json({ 
        error: 'Invalid or expired token' 
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
