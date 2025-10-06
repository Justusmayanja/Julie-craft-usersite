import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured' 
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
      // Verify JWT token using Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

      if (error || !user) {
        return NextResponse.json({ 
          error: 'Invalid or expired token' 
        }, { status: 401 })
      }

      // Get user with profile data
      const { data: userWithProfile, error: profileError } = await supabaseAdmin
        .rpc('get_user_with_profile', { user_uuid: user.id })

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
      }

      return NextResponse.json({
        valid: true,
        user: userWithProfile?.[0] || {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'User',
          phone: user.user_metadata?.phone || null,
          is_verified: !!user.email_confirmed_at,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
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
