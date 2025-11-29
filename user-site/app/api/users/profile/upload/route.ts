import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  if (!supabaseAdmin) {
    return null
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) {
    return null
  }

  return { userId: user.id, user }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        error: 'Database not configured'
      }, { status: 503 })
    }

    // Verify JWT token (any authenticated user, not just admin)
    const decoded = await verifyToken(request)
    if (!decoded) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const userId = decoded.userId

    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({
        error: 'No file provided'
      }, { status: 400 })
    }

    // Validate file type (only images)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        error: 'Invalid file type. Only image files are allowed.'
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 5MB.'
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${userId}_${timestamp}_${randomString}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Determine storage bucket - try 'user-uploads' first, fallback to 'avatars'
    let storageBucket = 'user-uploads'
    let uploadError = null

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()

    // Try uploading to user-uploads bucket first
    let uploadData = await supabaseAdmin.storage
      .from('user-uploads')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600'
      })

    if (uploadData.error) {
      // Fallback to avatars bucket
      storageBucket = 'avatars'
      uploadData = await supabaseAdmin.storage
        .from('avatars')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
          cacheControl: '3600'
        })
    }

    if (uploadData.error) {
      console.error('Storage upload error:', uploadData.error)
      return NextResponse.json({
        error: 'Failed to upload file to storage',
        details: uploadData.error.message
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(storageBucket)
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Update user profile with new avatar URL
    const { data: profileData, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Try to clean up the uploaded file
      await supabaseAdmin.storage
        .from(storageBucket)
        .remove([filePath])
      
      return NextResponse.json({
        error: 'Failed to update profile with avatar URL',
        details: updateError.message
      }, { status: 500 })
    }

    // Also update auth.users metadata
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        avatar_url: publicUrl
      }
    }).catch(err => {
      // Log but don't fail the request
      console.warn('Failed to update auth metadata:', err)
    })

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
      message: 'Profile image uploaded successfully'
    })

  } catch (error) {
    console.error('Profile image upload API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        error: 'Database not configured'
      }, { status: 503 })
    }

    // Verify JWT token (any authenticated user, not just admin)
    const decoded = await verifyToken(request)
    if (!decoded) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const userId = decoded.userId

    // Get current profile to find avatar URL
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({
        error: 'Failed to fetch profile'
      }, { status: 500 })
    }

    // If there's an avatar URL, try to extract the file path and delete it
    if (profile?.avatar_url) {
      try {
        // Extract file path from URL (format: https://...supabase.co/storage/v1/object/public/bucket/path)
        const urlParts = profile.avatar_url.split('/')
        const bucketIndex = urlParts.indexOf('object') + 2
        if (bucketIndex < urlParts.length) {
          const bucket = urlParts[bucketIndex]
          const filePath = urlParts.slice(bucketIndex + 1).join('/')

          // Try to delete from both buckets
          await supabaseAdmin.storage
            .from(bucket)
            .remove([filePath])
            .catch(err => console.warn('Failed to delete from storage:', err))
        }
      } catch (err) {
        // Log but don't fail - the file might not exist or be in a different format
        console.warn('Failed to delete avatar file from storage:', err)
      }
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({
        error: 'Failed to remove avatar from profile',
        details: updateError.message
      }, { status: 500 })
    }

    // Also update auth.users metadata
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        avatar_url: null
      }
    }).catch(err => {
      // Log but don't fail the request
      console.warn('Failed to update auth metadata:', err)
    })

    return NextResponse.json({
      success: true,
      message: 'Profile image removed successfully'
    })

  } catch (error) {
    console.error('Profile image removal API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

