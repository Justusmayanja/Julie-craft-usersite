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

    const token = authHeader.substring(7)

    try {
      // Verify JWT token using Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

      if (error || !user) {
        return NextResponse.json({ 
          error: 'Invalid or expired token' 
        }, { status: 401 })
      }

      // Get user profile directly from profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile query error:', profileError)
        return NextResponse.json({ 
          error: 'Profile not found',
          details: profileError.message
        }, { status: 404 })
      }

      // Test the get_user_with_profile function
      const { data: functionResult, error: functionError } = await supabaseAdmin
        .rpc('get_user_with_profile', { user_uuid: user.id })

      return NextResponse.json({
        debug: 'User role information',
        auth_user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile_direct: {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          is_admin: profile.is_admin,
          first_name: profile.first_name,
          last_name: profile.last_name
        },
        function_result: functionResult?.[0] || null,
        function_error: functionError?.message || null,
        is_admin_calculation: {
          by_role: profile.role === 'admin' || profile.role === 'super_admin',
          by_flag: profile.is_admin === true,
          combined: (profile.role === 'admin' || profile.role === 'super_admin' || profile.is_admin === true)
        }
      })

    } catch (jwtError) {
      return NextResponse.json({ 
        error: 'Invalid or expired token' 
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
