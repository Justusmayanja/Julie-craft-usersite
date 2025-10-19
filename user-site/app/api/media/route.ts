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

// Mock media files
const mockMediaFiles: MediaFile[] = [
  {
    id: 'MEDIA-001',
    filename: 'homepage-hero.jpg',
    original_name: 'homepage-hero.jpg',
    file_path: '/uploads/images/homepage-hero.jpg',
    file_size: 245760,
    mime_type: 'image/jpeg',
    alt_text: 'Beautiful handmade ceramics on display',
    caption: 'Our featured ceramic collection',
    category: 'images',
    uploaded_by: 'admin-001',
    uploaded_by_name: 'Julie Anderson',
    created_at: '2023-09-01T10:00:00Z',
    updated_at: '2023-09-01T10:00:00Z'
  },
  {
    id: 'MEDIA-002',
    filename: 'about-hero.jpg',
    original_name: 'about-hero.jpg',
    file_path: '/uploads/images/about-hero.jpg',
    file_size: 189440,
    mime_type: 'image/jpeg',
    alt_text: 'Artisan working on pottery',
    caption: 'Our skilled artisans at work',
    category: 'images',
    uploaded_by: 'admin-001',
    uploaded_by_name: 'Julie Anderson',
    created_at: '2023-09-02T10:00:00Z',
    updated_at: '2023-09-02T10:00:00Z'
  },
  {
    id: 'MEDIA-003',
    filename: 'product-catalog.pdf',
    original_name: 'product-catalog.pdf',
    file_path: '/uploads/documents/product-catalog.pdf',
    file_size: 1024000,
    mime_type: 'application/pdf',
    alt_text: 'Product catalog document',
    caption: 'Complete product catalog for 2023',
    category: 'documents',
    uploaded_by: 'admin-001',
    uploaded_by_name: 'Julie Anderson',
    created_at: '2023-09-03T10:00:00Z',
    updated_at: '2023-09-03T10:00:00Z'
  },
  {
    id: 'MEDIA-004',
    filename: 'crafting-process.mp4',
    original_name: 'crafting-process.mp4',
    file_path: '/uploads/videos/crafting-process.mp4',
    file_size: 15728640,
    mime_type: 'video/mp4',
    alt_text: 'Video showing the crafting process',
    caption: 'Behind the scenes: Our crafting process',
    category: 'videos',
    uploaded_by: 'admin-001',
    uploaded_by_name: 'Julie Anderson',
    created_at: '2023-09-04T10:00:00Z',
    updated_at: '2023-09-04T10:00:00Z'
  },
  {
    id: 'MEDIA-005',
    filename: 'jewelry-collection.jpg',
    original_name: 'jewelry-collection.jpg',
    file_path: '/uploads/images/jewelry-collection.jpg',
    file_size: 312320,
    mime_type: 'image/jpeg',
    alt_text: 'Traditional Ugandan jewelry collection',
    caption: 'Our traditional jewelry collection',
    category: 'images',
    uploaded_by: 'admin-001',
    uploaded_by_name: 'Julie Anderson',
    created_at: '2023-09-05T10:00:00Z',
    updated_at: '2023-09-05T10:00:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock media files')
      
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
      
      let filtered = [...mockMediaFiles]
      
      // Apply filters
      if (filters.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter(file => 
          file.filename.toLowerCase().includes(search) ||
          file.original_name.toLowerCase().includes(search) ||
          file.alt_text?.toLowerCase().includes(search) ||
          file.caption?.toLowerCase().includes(search)
        )
      }
      
      if (filters.category) {
        filtered = filtered.filter(file => file.category === filters.category)
      }
      
      if (filters.mime_type) {
        filtered = filtered.filter(file => file.mime_type.includes(filters.mime_type!))
      }
      
      if (filters.uploaded_by) {
        filtered = filtered.filter(file => file.uploaded_by === filters.uploaded_by)
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        const aVal = a[filters.sort_by!] || ''
        const bVal = b[filters.sort_by!] || ''
        if (filters.sort_order === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
      
      // Apply pagination
      const paginated = filtered.slice(filters.offset, filters.offset! + filters.limit!)
      
      return NextResponse.json({
        files: paginated,
        total: filtered.length,
        limit: filters.limit,
        offset: filters.offset,
        message: 'Mock data - database not configured'
      })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found for media, returning mock data')
      return NextResponse.json({
        files: mockMediaFiles.slice(0, 5),
        total: mockMediaFiles.length,
        limit: 5,
        offset: 0,
        message: 'Mock data - no authentication'
      })
    }

    const token = authHeader.substring(7)
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        console.log('Token verification failed for media, returning mock data')
        return NextResponse.json({
          files: mockMediaFiles.slice(0, 3),
          total: mockMediaFiles.length,
          limit: 3,
          offset: 0,
          message: 'Mock data - authentication failed'
        })
      }
    } catch (error) {
      console.log('Token verification error for media, returning mock data')
      return NextResponse.json({
        files: mockMediaFiles.slice(0, 3),
        total: mockMediaFiles.length,
        limit: 3,
        offset: 0,
        message: 'Mock data - token verification error'
      })
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

    // Build query
    let query = supabaseAdmin
      .from('media_files')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.search) {
      query = query.or(`filename.ilike.%${filters.search}%,original_name.ilike.%${filters.search}%,alt_text.ilike.%${filters.search}%,caption.ilike.%${filters.search}%`)
    }

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.mime_type) {
      query = query.like('mime_type', `%${filters.mime_type}%`)
    }

    if (filters.uploaded_by) {
      query = query.eq('uploaded_by', filters.uploaded_by)
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        files: mockMediaFiles.slice(0, 5),
        total: mockMediaFiles.length,
        limit: 5,
        offset: 0,
        message: 'Mock data - database error fallback'
      })
    }

    return NextResponse.json({
      files: data || [],
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset
    })

  } catch (error) {
    console.error('Media API error:', error)
    return NextResponse.json({
      files: mockMediaFiles.slice(0, 5),
      total: mockMediaFiles.length,
      limit: 5,
      offset: 0,
      message: 'Mock data - API error'
    })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

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

    // Delete media file
    const { error } = await supabaseAdmin
      .from('media_files')
      .delete()
      .eq('id', fileId)

    if (error) {
      console.error('Error deleting media file:', error)
      return NextResponse.json({ error: 'Failed to delete media file' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Media file deleted successfully' })

  } catch (error) {
    console.error('Media deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
