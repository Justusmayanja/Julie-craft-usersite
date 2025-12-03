import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { Category } from '@/lib/types/product'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      // Mock category data based on ID
      const mockCategories: Record<string, any> = {
        '1': {
          id: '1',
          name: 'Ceramics',
          description: 'Handmade pottery and ceramic items',
          image_url: '/placeholder.svg',
          is_active: true,
          sort_order: 1,
          tags: ['pottery', 'handmade'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        '2': {
          id: '2',
          name: 'Textiles',
          description: 'Traditional fabrics and textiles',
          image_url: '/placeholder.svg',
          is_active: true,
          sort_order: 2,
          tags: ['fabric', 'traditional'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        '3': {
          id: '3',
          name: 'Jewelry',
          description: 'Handcrafted jewelry and accessories',
          image_url: '/placeholder.svg',
          is_active: true,
          sort_order: 3,
          tags: ['beads', 'handmade'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        '4': {
          id: '4',
          name: 'Woodwork',
          description: 'Wooden crafts and carvings',
          image_url: '/placeholder.svg',
          is_active: true,
          sort_order: 4,
          tags: ['wood', 'carving'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      const mockCategory = mockCategories[categoryId] || mockCategories['1']
      
      return NextResponse.json({
        category: mockCategory,
        message: 'Mock data - database not configured'
      })
    }

    // Helper function to normalize image URLs
    const normalizeImageUrl = (url: string | null | undefined): string | null => {
      if (!url) return null
      
      // If already a full URL, return as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        return url
      }
      
      // Convert /uploads/categories/... to Supabase storage URL
      if (url.startsWith('/uploads/categories/')) {
        // Remove leading /uploads/ to get the storage path
        const storagePath = url.replace('/uploads/', '')
        return `${supabaseUrl}/storage/v1/object/public/media/${storagePath}`
      }
      
      // If it's a relative path starting with /uploads/ (other than categories), try media bucket
      if (url.startsWith('/uploads/')) {
        const storagePath = url.replace('/uploads/', '')
        return `${supabaseUrl}/storage/v1/object/public/media/${storagePath}`
      }
      
      // If it starts with /storage/, prepend base URL
      if (url.startsWith('/storage/')) {
        return `${supabaseUrl}${url}`
      }
      
      // If it looks like a storage path without leading slash
      if (url.includes('categories/') && !url.startsWith('http') && !url.startsWith('/')) {
        if (url.startsWith('categories/')) {
          return `${supabaseUrl}/storage/v1/object/public/media/${url}`
        }
      }
      
      // If it's just a path like "categories/..." without leading slash
      if (url.includes('categories/') && !url.startsWith('http') && !url.startsWith('/')) {
        return `${supabaseUrl}/storage/v1/object/public/media/${url}`
      }
      
      // Return as is if we can't normalize (might be a valid relative path)
      return url
    }

    // Fetch category from database - support both ID and slug lookup
    let query = supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true) // Only show active categories to public
    
    // Check if categoryId is a UUID (36 chars with hyphens) or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)
    
    if (isUUID) {
      query = query.eq('id', categoryId)
    } else {
      query = query.eq('slug', categoryId)
    }
    
    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const category = data as Category

    // Normalize image URL
    const normalizedImageUrl = normalizeImageUrl(category.image_url) || '/placeholder.svg'

    // Transform category to frontend format
    const transformedCategory = {
      ...category,
      image_url: normalizedImageUrl
    }

    return NextResponse.json({ category: transformedCategory })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('julie-crafts-token')?.value
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken

    if (token && isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
        if (error || !user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      } catch (error) {
        return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
      }
    }

    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // First, check if category exists
    const { data: existingCategory, error: fetchError } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Build update object
    const updateData: any = {
      name: body.name,
      description: body.description || null,
      is_active: body.is_active !== undefined ? body.is_active : true,
      updated_at: new Date().toISOString()
    }

    // Only update fields that are provided
    if (body.image_url !== undefined) updateData.image_url = body.image_url || null
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order || 0
    if (body.tags !== undefined) updateData.tags = body.tags || null

    // Update category
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Category update error:', error)
      return NextResponse.json({ 
        error: 'Failed to update category',
        message: error.message || 'Failed to update category',
        details: error.details || error.message
      }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 200 })

  } catch (error) {
    console.error('Admin category update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('julie-crafts-token')?.value
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken

    if (token && isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
        if (error || !user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      } catch (error) {
        return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
      }
    }

    const { id } = await params

    // Delete category
    const { error: deleteError } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete category',
        details: deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Category deleted successfully',
      id: id
    })

  } catch (error) {
    console.error('Category deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

