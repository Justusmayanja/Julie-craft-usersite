import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// POST /api/site-content/logo - Upload site logo
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (!user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WEBP, and SVG are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (max 2MB for logo)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 2MB limit' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `logo_${timestamp}_${randomString}.${fileExtension}`
    const filePath = `site-assets/${fileName}`

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()

    // Try different storage buckets
    const buckets = ['media', 'site-assets', 'public']
    let uploadSuccess = false
    let uploadData: any = null
    let uploadError: any = null
    let usedBucket = ''

    for (const bucket of buckets) {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .upload(filePath, fileBuffer, {
            contentType: file.type,
            upsert: true, // Allow overwriting
            cacheControl: '3600'
          })

        if (!error) {
          uploadData = data
          uploadSuccess = true
          usedBucket = bucket
          break
        }
        uploadError = error
      } catch (err) {
        // Try next bucket
        continue
      }
    }

    if (!uploadSuccess) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload logo. Please ensure storage buckets are configured.' 
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(usedBucket)
      .getPublicUrl(filePath)

    const logoUrl = urlData.publicUrl

    // Update site_settings with logo URL
    const { error: settingsError } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        setting_key: 'logo_url',
        setting_value: logoUrl,
        setting_type: 'appearance',
        description: 'Site logo URL'
      }, {
        onConflict: 'setting_key'
      })

    if (settingsError) {
      console.error('Error updating site settings:', settingsError)
      // Still return success since file was uploaded
    }

    return NextResponse.json({
      success: true,
      logo_url: logoUrl,
      file_path: filePath,
      message: 'Logo uploaded successfully'
    })

  } catch (error) {
    console.error('Logo upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/site-content/logo - Delete logo
export async function DELETE(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (!user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    // Get current logo URL from settings
    const { data: logoSetting } = await supabaseAdmin
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'logo_url')
      .single()

    if (logoSetting?.setting_value) {
      // Extract file path from URL and try to delete from storage
      const logoUrl = logoSetting.setting_value as string
      const urlParts = logoUrl.split('/')
      const filePath = urlParts.slice(-2).join('/') // Get last two parts (folder/filename)
      
      // Try to delete from storage (best effort)
      const buckets = ['media', 'site-assets', 'public']
      for (const bucket of buckets) {
        try {
          await supabaseAdmin.storage.from(bucket).remove([filePath])
        } catch {
          // Ignore errors
        }
      }
    }

    // Remove logo URL from settings
    const { error } = await supabaseAdmin
      .from('site_settings')
      .update({
        setting_value: null
      })
      .eq('setting_key', 'logo_url')

    if (error) {
      console.error('Error deleting logo setting:', error)
      return NextResponse.json({ error: 'Failed to delete logo' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Logo deleted successfully' })
  } catch (error) {
    console.error('Logo delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

