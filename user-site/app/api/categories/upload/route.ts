import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Storage not configured. Please configure Supabase storage buckets.' 
      }, { status: 503 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categoryId = formData.get('categoryId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required.' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WEBP are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const maxFileSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxFileSize) {
      return NextResponse.json({ 
        error: 'File size exceeds 5MB limit.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${categoryId}_${Date.now()}_${uuidv4()}.${fileExtension}`
    const filePath = `categories/${uniqueFileName}`

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    // Try 'media' bucket first (as per StorageService), fallback to 'categories'
    const storageBucket = 'media' // or 'categories' depending on your setup
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(storageBucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // Check if bucket doesn't exist
      if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === '404') {
        return NextResponse.json({ 
          error: `Storage bucket not found. Please create a "${storageBucket}" bucket in Supabase Storage.` 
        }, { status: 500 })
      }
      return NextResponse.json({ 
        error: `Upload failed: ${uploadError.message}` 
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(storageBucket)
      .getPublicUrl(filePath)

    const imageUrl = urlData.publicUrl

    return NextResponse.json({
      success: true,
      imageUrl,
      fileName: uniqueFileName,
      fileSize: file.size,
      fileType: file.type,
    })

  } catch (error: any) {
    console.error('Error uploading category image:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to upload image.' 
    }, { status: 500 })
  }
}
