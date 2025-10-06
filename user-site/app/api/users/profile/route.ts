import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// Helper function to verify Supabase JWT token
async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) {
      return null
    }
    return { userId: user.id, user }
  } catch (error) {
    return null
  }
}

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    const decoded = await verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get user profile using the helper function
    const { data: userWithProfile, error: profileError } = await supabaseAdmin
      .rpc('get_user_with_profile', { user_uuid: decoded.userId })

    if (profileError || !userWithProfile || userWithProfile.length === 0) {
      return NextResponse.json({ 
        error: 'Profile not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      profile: userWithProfile[0]
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    const decoded = await verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { 
      first_name, 
      last_name, 
      firstName, 
      lastName, 
      phone, 
      bio, 
      location, 
      website, 
      preferences 
    } = body
    
    // Handle both camelCase and snake_case formats
    const finalFirstName = first_name || firstName
    const finalLastName = last_name || lastName
    
    console.log('Profile update request:', {
      userId: decoded.userId,
      body,
      finalFirstName,
      finalLastName,
      phone
    })

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name: finalFirstName,
        last_name: finalLastName,
        phone,
        bio,
        location,
        website,
        preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.userId)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile',
        details: updateError 
      }, { status: 500 })
    }
    
    console.log('Profile update successful:', updatedProfile)

    // Also update the auth.users metadata if name changed
    if (finalFirstName && finalLastName) {
      await supabaseAdmin.auth.admin.updateUserById(decoded.userId, {
        user_metadata: {
          full_name: `${finalFirstName} ${finalLastName}`,
          phone: phone || null
        }
      })
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
