import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        error: 'Database not configured'
      }, { status: 503 })
    }

    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({
        error: 'Invalid or expired token'
      }, { status: 401 })
    }

    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'avatars'
    
    if (!file) {
      return NextResponse.json({
        error: 'No file provided'
      }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        error: 'File must be an image'
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File size must be less than 5MB'
      }, { status: 400 })
    }

    // Determine storage bucket and path based on folder
    let storageBucket = 'profile-images'
    let filePath = ''
    
    if (folder === 'pages') {
      storageBucket = 'media' // or 'pages' if you have a dedicated bucket
      const fileExt = file.name.split('.').pop()
      const fileName = `pages/${user.id}-${Date.now()}.${fileExt}`
      filePath = fileName
    } else if (folder === 'avatars') {
      storageBucket = 'profile-images'
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      filePath = `avatars/${fileName}`
    } else {
      // Default to media bucket for other folders
      storageBucket = 'media'
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${user.id}-${Date.now()}.${fileExt}`
      filePath = fileName
    }

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(storageBucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({
        error: 'Failed to upload file'
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(storageBucket)
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Only update profile if folder is 'avatars'
    if (folder === 'avatars') {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        // Try to clean up the uploaded file
        await supabaseAdmin.storage
          .from(storageBucket)
          .remove([filePath])
        
        return NextResponse.json({
          error: 'Failed to update profile'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Image uploaded successfully',
        url: publicUrl,
        avatar_url: publicUrl,
        file_path: filePath
      })
    }

    // For other folders, just return the URL
    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      url: publicUrl,
      file_path: filePath
    })

  } catch (error) {
    console.error('Media upload API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
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

    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({
        error: 'Invalid or expired token'
      }, { status: 401 })
    }

    // Remove avatar URL from profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return NextResponse.json({
        error: 'Failed to remove avatar'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully'
    })

  } catch (error) {
    console.error('Media delete API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
