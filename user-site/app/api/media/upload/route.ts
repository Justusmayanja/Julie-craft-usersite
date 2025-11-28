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

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({
        error: 'Forbidden - Admin access required'
      }, { status: 403 })
    }

    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const formCategory = formData.get('category') as string || ''
    const alt_text = formData.get('alt_text') as string || ''
    const caption = formData.get('caption') as string || ''
    const folder = formData.get('folder') as string || 'uploads'
    
    if (!file) {
      return NextResponse.json({
        error: 'No file provided'
      }, { status: 400 })
    }

    // Validate file size (max 50MB for videos, 10MB for others)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `File size must be less than ${maxSize / (1024 * 1024)}MB`
      }, { status: 400 })
    }

    // Determine file_type from mime type
    let file_type = 'other'
    if (file.type.startsWith('image/')) {
      file_type = 'image'
    } else if (file.type.startsWith('video/')) {
      file_type = 'video'
    } else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text') || 
               file.type.includes('word') || file.type.includes('excel') || file.type.includes('powerpoint')) {
      file_type = 'document'
    } else if (file.type.startsWith('audio/')) {
      file_type = 'audio'
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split('.').pop() || ''
    const fileName = `${timestamp}-${randomString}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Determine storage bucket
    const storageBucket = 'media' // Use 'media' bucket for all media library files

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(storageBucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({
        error: 'Failed to upload file to storage',
        details: uploadError.message
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(storageBucket)
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Save to media table
    const { data: mediaData, error: mediaError } = await supabaseAdmin
      .from('media')
      .insert({
        filename: fileName,
        original_name: file.name,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        alt_text: alt_text || null,
        caption: caption || null,
        file_type: file_type,
        uploaded_by: user.id,
        folder: folder,
        is_public: true
      })
      .select()
      .single()

    if (mediaError) {
      console.error('Media table insert error:', mediaError)
      // Try to clean up the uploaded file
      await supabaseAdmin.storage
        .from(storageBucket)
        .remove([filePath])
      
      return NextResponse.json({
        error: 'Failed to save media record',
        details: mediaError.message
      }, { status: 500 })
    }

    // Get profile for uploaded_by_name
    const { data: uploaderProfile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    const uploadedByName = uploaderProfile 
      ? `${uploaderProfile.first_name || ''} ${uploaderProfile.last_name || ''}`.trim() || 'Unknown'
      : 'Unknown'

    // Determine category: use formData category if provided, otherwise map from file_type
    let category: 'images' | 'documents' | 'videos' | 'other' = 'other'
    if (formCategory && ['images', 'documents', 'videos', 'other'].includes(formCategory)) {
      category = formCategory as 'images' | 'documents' | 'videos' | 'other'
    } else {
      // Map file_type to category
      if (file_type === 'image') category = 'images'
      else if (file_type === 'video') category = 'videos'
      else if (file_type === 'document') category = 'documents'
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: mediaData.id,
        filename: mediaData.filename,
        original_name: mediaData.original_name,
        file_path: mediaData.file_path,
        file_size: mediaData.file_size,
        mime_type: mediaData.mime_type,
        alt_text: mediaData.alt_text,
        caption: mediaData.caption,
        category,
        uploaded_by: mediaData.uploaded_by,
        uploaded_by_name: uploadedByName,
        created_at: mediaData.created_at,
        updated_at: mediaData.updated_at
      }
    })

  } catch (error) {
    console.error('Media upload API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
