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

      // Get user profile data from profiles table (optional)
      let profile = null
      try {
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!profileError && profileData) {
          profile = profileData
        }
      } catch (profileError) {
        console.log('Profile not found for user, using auth metadata:', profileError)
      }

      return NextResponse.json({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || 'User',
          phone: profile?.phone || user.user_metadata?.phone || null,
          avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
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
