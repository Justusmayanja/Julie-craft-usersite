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
      email,
      phone, 
      address,
      bio, 
      location, 
      website, 
      preferences,
      avatar_url
    } = body
    
    // Handle both camelCase and snake_case formats
    const finalFirstName = first_name || firstName
    const finalLastName = last_name || lastName
    const finalEmail = email ? email.toLowerCase().trim() : undefined
    
    // Get user profile to check admin status
    const { data: userProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, is_admin')
      .eq('id', decoded.userId)
      .single()

    // Check if user is admin if trying to update email
    if (finalEmail !== undefined) {
      if (!userProfile?.is_admin) {
        return NextResponse.json({
          error: 'Only admin users can update their email address'
        }, { status: 403 })
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(finalEmail)) {
        return NextResponse.json({
          error: 'Invalid email format'
        }, { status: 400 })
      }

      // Check if email is already in use by another user
      const { data: existingUser, error: emailCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', finalEmail)
        .neq('id', decoded.userId)
        .single()

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is what we want
        console.error('Email check error:', emailCheckError)
        return NextResponse.json({
          error: 'Failed to check email availability'
        }, { status: 500 })
      }

      if (existingUser) {
        return NextResponse.json({
          error: 'Email address is already in use'
        }, { status: 400 })
      }
    }
    
    console.log('Profile update request:', {
      userId: decoded.userId,
      body,
      finalFirstName,
      finalLastName,
      finalEmail,
      phone,
      address,
      avatar_url
    })

    // Get user email from auth if not in decoded
    const userEmail = decoded.user?.email || ''
    
    // Check if profile exists, create it if it doesn't
    const existingProfile = userProfile

    let updatedProfile

    if (profileCheckError || !existingProfile) {
      // Profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: decoded.userId,
          email: userEmail,
          first_name: finalFirstName || '',
          last_name: finalLastName || '',
          phone: phone || null,
          address: address || null,
          bio: bio || null,
          location: location || null,
          website: website || null,
          preferences: preferences || {
            sms: false,
            push: true,
            email: true,
            marketing: true
          },
          avatar_url: avatar_url || null,
          is_admin: false,
          is_verified: true,
          role: 'customer',
          total_orders: 0,
          total_spent: 0,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          join_date: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        return NextResponse.json({ 
          error: 'Failed to create profile',
          details: createError 
        }, { status: 500 })
      }

      updatedProfile = newProfile
    } else {
      // Profile exists, update it
      // Build update object with only defined fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // Only include fields that are provided (not undefined)
      if (finalFirstName !== undefined) updateData.first_name = finalFirstName
      if (finalLastName !== undefined) updateData.last_name = finalLastName
      // Only allow email update for admins (checked above)
      if (finalEmail !== undefined && userProfile?.is_admin) {
        updateData.email = finalEmail
      }
      if (phone !== undefined) updateData.phone = phone
      if (address !== undefined) updateData.address = address
      if (bio !== undefined) updateData.bio = bio
      if (location !== undefined) updateData.location = location
      if (website !== undefined) updateData.website = website
      if (preferences !== undefined) updateData.preferences = preferences
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url

      // Update profile
      const { data: profileData, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
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

      updatedProfile = profileData
    }

    console.log('Profile update successful:', updatedProfile)

    // Update auth.users if name or email changed (for admins)
    const authUpdate: any = {
      user_metadata: {}
    }

    if (finalFirstName && finalLastName) {
      authUpdate.user_metadata.full_name = `${finalFirstName} ${finalLastName}`
      authUpdate.user_metadata.phone = phone || null
    }

    // Update email in auth.users if it was changed (admin only)
    if (finalEmail !== undefined && userProfile?.is_admin) {
      authUpdate.email = finalEmail
    }

    if (Object.keys(authUpdate.user_metadata).length > 0 || authUpdate.email) {
      await supabaseAdmin.auth.admin.updateUserById(decoded.userId, authUpdate)
        .catch(err => {
          // Log but don't fail the request
          console.warn('Failed to update auth metadata:', err)
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
