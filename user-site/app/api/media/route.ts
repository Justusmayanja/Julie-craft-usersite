import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export interface MediaFile {
  id: string
  filename: string
  original_name: string
  file_path: string
  file_size: number
  mime_type: string
  alt_text?: string
  caption?: string
  category: 'images' | 'documents' | 'videos' | 'other'
  uploaded_by: string
  uploaded_by_name: string
  created_at: string
  updated_at: string
}

export interface MediaFilters {
  search?: string
  category?: 'images' | 'documents' | 'videos' | 'other'
  mime_type?: string
  uploaded_by?: string
  sort_by?: 'created_at' | 'updated_at' | 'filename' | 'file_size'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning empty media files')
      
      return NextResponse.json({
        files: [],
        total: 0,
        limit: 50,
        offset: 0,
        error: 'Database not configured',
        message: 'Supabase is not configured. Please configure database connection.'
      }, { status: 503 })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        files: [],
        total: 0,
        limit: 50,
        offset: 0,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json({
          files: [],
          total: 0,
          limit: 50,
          offset: 0,
          error: 'Invalid token',
          message: 'Authentication token is invalid'
        }, { status: 401 })
      }
    } catch (error) {
      console.error('Token verification error for media:', error)
      return NextResponse.json({
        files: [],
        total: 0,
        limit: 50,
        offset: 0,
        error: 'Authentication error',
        message: 'Failed to verify authentication token'
      }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filters: MediaFilters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') as any || undefined,
      mime_type: searchParams.get('mime_type') || undefined,
      uploaded_by: searchParams.get('uploaded_by') || undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (searchParams.get('sort_order') as any) || 'desc',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
    }

    // Build query - use 'media' table
    let query = supabaseAdmin
      .from('media')
      .select(`
        id,
        filename,
        original_name,
        file_path,
        file_size,
        mime_type,
        alt_text,
        caption,
        file_type,
        uploaded_by,
        created_at
      `, { count: 'exact' })

    // Apply filters
    if (filters.search) {
      query = query.or(`filename.ilike.%${filters.search}%,original_name.ilike.%${filters.search}%,alt_text.ilike.%${filters.search}%,caption.ilike.%${filters.search}%`)
    }

    if (filters.category) {
      // Map category to file_type
      const fileTypeMap: Record<string, string> = {
        'images': 'image',
        'videos': 'video',
        'documents': 'document',
        'other': 'audio'
      }
      const fileType = fileTypeMap[filters.category] || filters.category
      query = query.eq('file_type', fileType)
    }

    if (filters.mime_type) {
      query = query.like('mime_type', `%${filters.mime_type}%`)
    }

    if (filters.uploaded_by) {
      query = query.eq('uploaded_by', filters.uploaded_by)
    }

    // Apply sorting - map sort_by to actual column names
    // Note: media table doesn't have updated_at, so use created_at instead
    const sortColumnMap: Record<string, string> = {
      'created_at': 'created_at',
      'updated_at': 'created_at', // Fallback to created_at since updated_at doesn't exist
      'filename': 'filename',
      'file_size': 'file_size'
    }
    const sortColumn = sortColumnMap[filters.sort_by || 'created_at'] || 'created_at'
    query = query.order(sortColumn, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      // Return empty array instead of mock data
      return NextResponse.json({
        files: [],
        total: 0,
        limit: filters.limit,
        offset: filters.offset,
        error: 'Failed to fetch media files',
        message: error.message || 'Database error'
      }, { status: 500 })
    }

    // Get all uploaded_by user IDs
    const uploadedByIds = [...new Set((data || []).map((item: any) => item.uploaded_by).filter(Boolean))]
    
    // Fetch profiles for all uploaders
    let profilesMap: Record<string, { first_name?: string; last_name?: string }> = {}
    if (uploadedByIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', uploadedByIds)
      
      if (profiles) {
        profiles.forEach((profile: any) => {
          profilesMap[profile.id] = {
            first_name: profile.first_name,
            last_name: profile.last_name
          }
        })
      }
    }

    // Transform data to match MediaFile interface
    const transformedFiles = (data || []).map((item: any) => {
      // Determine category from file_type
      let category: 'images' | 'documents' | 'videos' | 'other' = 'other'
      if (item.file_type === 'image') category = 'images'
      else if (item.file_type === 'video') category = 'videos'
      else if (item.file_type === 'document') category = 'documents'
      
      // Get uploaded_by_name from profile
      const profile = item.uploaded_by ? profilesMap[item.uploaded_by] : null
      const uploadedByName = profile 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'
        : 'Unknown'

      return {
        id: item.id,
        filename: item.filename || item.original_name || '',
        original_name: item.original_name || item.filename || '',
        file_path: item.file_path || '',
        file_size: item.file_size || 0,
        mime_type: item.mime_type || '',
        alt_text: item.alt_text || null,
        caption: item.caption || null,
        category,
        uploaded_by: item.uploaded_by || '',
        uploaded_by_name: uploadedByName,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.created_at || new Date().toISOString() // Use created_at since updated_at doesn't exist in DB
      }
    })

    return NextResponse.json({
      files: transformedFiles,
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset
    })

  } catch (error) {
    console.error('Media API error:', error)
    // Return empty array instead of mock data
    return NextResponse.json({
      files: [],
      total: 0,
      limit: 50,
      offset: 0,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to fetch media files'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, alt_text, caption, original_name } = body

    if (!id) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Build update object
    // Note: media table doesn't have updated_at column, so we don't update it
    const updateData: any = {}

    if (alt_text !== undefined) updateData.alt_text = alt_text || null
    if (caption !== undefined) updateData.caption = caption || null
    if (original_name !== undefined) updateData.original_name = original_name || null

    // Update media file
    const { data: updatedFile, error: updateError } = await supabaseAdmin
      .from('media')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating media file:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update media file',
        details: updateError.message 
      }, { status: 500 })
    }

    // Get profile for uploaded_by_name
    const { data: uploaderProfile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', updatedFile.uploaded_by)
      .single()

    const uploadedByName = uploaderProfile 
      ? `${uploaderProfile.first_name || ''} ${uploaderProfile.last_name || ''}`.trim() || 'Unknown'
      : 'Unknown'

    // Determine category from file_type
    let category: 'images' | 'documents' | 'videos' | 'other' = 'other'
    if (updatedFile.file_type === 'image') category = 'images'
    else if (updatedFile.file_type === 'video') category = 'videos'
    else if (updatedFile.file_type === 'document') category = 'documents'

    return NextResponse.json({
      success: true,
      message: 'Media file updated successfully',
      file: {
        id: updatedFile.id,
        filename: updatedFile.filename,
        original_name: updatedFile.original_name,
        file_path: updatedFile.file_path,
        file_size: updatedFile.file_size,
        mime_type: updatedFile.mime_type,
        alt_text: updatedFile.alt_text,
        caption: updatedFile.caption,
        category,
        uploaded_by: updatedFile.uploaded_by,
        uploaded_by_name: uploadedByName,
        created_at: updatedFile.created_at,
        updated_at: updatedFile.created_at // Use created_at since updated_at doesn't exist in DB
      }
    })

  } catch (error) {
    console.error('Media update API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    console.log('DELETE request for media file ID:', fileId)

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating media file deletion')
      return NextResponse.json({ message: 'Media file deleted (simulated)' })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // First, get the file to delete from storage
    // Try to find the file - use maybeSingle() to avoid error if not found
    const { data: mediaFile, error: fetchError } = await supabaseAdmin
      .from('media')
      .select('id, file_path, filename, folder')
      .eq('id', fileId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching media file:', fetchError)
      console.error('File ID searched:', fileId)
      return NextResponse.json({ 
        error: 'Failed to fetch media file',
        details: fetchError.message 
      }, { status: 500 })
    }

    if (!mediaFile) {
      console.warn(`Media file not found with ID: ${fileId}`)
      // Check if file exists with different query to help debug
      const { data: allFiles } = await supabaseAdmin
        .from('media')
        .select('id, filename, original_name')
        .limit(10)
      console.log('Sample media files in database:', allFiles?.map(f => ({ id: f.id, name: f.original_name || f.filename })))
      
      return NextResponse.json({ 
        error: 'Media file not found',
        details: `No file found with ID: ${fileId}. The file may have already been deleted.`
      }, { status: 404 })
    }

    console.log('Found media file to delete:', { id: mediaFile.id, filename: mediaFile.filename, file_path: mediaFile.file_path })

    // Delete from storage if file_path exists
    if (mediaFile.file_path) {
      try {
        // Extract path from file_path (could be a full URL or relative path)
        let storagePath = mediaFile.file_path
        
        // If it's a full Supabase storage URL, extract the path after the bucket name
        // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        if (storagePath.includes('/storage/v1/object/public/')) {
          const urlParts = storagePath.split('/storage/v1/object/public/')
          if (urlParts.length > 1) {
            // Remove the bucket name (first part) and get the rest as the path
            const pathAfterBucket = urlParts[1]
            const pathSegments = pathAfterBucket.split('/')
            if (pathSegments.length > 1) {
              // Remove bucket name (first segment) and join the rest
              storagePath = pathSegments.slice(1).join('/')
            } else {
              // Only bucket name, use filename from database
              storagePath = mediaFile.filename
            }
          }
        } else if (storagePath.startsWith('http')) {
          // Other URL format, try to extract path
          const url = new URL(storagePath)
          storagePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
        } else {
          // Relative path - remove leading slash if present
          storagePath = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath
        }
        
        // Fallback: if we couldn't extract a valid path, use folder and filename
        if (!storagePath || storagePath === mediaFile.file_path) {
          storagePath = `${mediaFile.folder || 'uploads'}/${mediaFile.filename}`
        }
        
        // Use 'media' bucket (as per upload route)
        const storageBucket = 'media'
        
        console.log(`Attempting to delete from storage: bucket=${storageBucket}, path=${storagePath}`)
        
        // Try to delete from storage (ignore errors if file doesn't exist)
        const { error: storageError } = await supabaseAdmin.storage
          .from(storageBucket)
          .remove([storagePath])
        
        if (storageError) {
          console.warn('Storage deletion warning (file may not exist):', storageError)
          // Continue with database deletion even if storage deletion fails
        } else {
          console.log(`Successfully deleted from storage: ${storagePath}`)
        }
      } catch (storageErr) {
        console.warn('Storage deletion error (continuing with database deletion):', storageErr)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete media file record
    const { error: deleteError } = await supabaseAdmin
      .from('media')
      .delete()
      .eq('id', fileId)

    if (deleteError) {
      console.error('Error deleting media file record:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete media file record',
        details: deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Media file deleted successfully' 
    })

  } catch (error) {
    console.error('Media deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
