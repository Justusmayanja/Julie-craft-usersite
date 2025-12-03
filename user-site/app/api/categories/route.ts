import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { Category } from '@/lib/types/product'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        categories: [],
        total: 0,
        limit: 50,
        offset: 0,
        message: 'Database not configured - using fallback data'
      })
    }
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0

    // Build query - fetch active categories (is_active = true OR is_active IS NULL)
    // This treats null/undefined as active for backward compatibility
    let query = supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact' })
      .or('is_active.eq.true,is_active.is.null')
      .order('sort_order', { ascending: true })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    let data, error, count
    try {
      const result = await query
      data = result.data
      error = result.error
      count = result.count
    } catch (fetchError: any) {
      console.error('Database error:', {
        message: fetchError?.message || 'TypeError: fetch failed',
        details: fetchError?.stack || String(fetchError),
        hint: 'This may indicate a network issue or Supabase connection problem',
        code: ''
      })
      
      // Return empty categories array instead of error to allow page to load
      return NextResponse.json({
        categories: [],
        total: 0,
        limit,
        offset,
        message: 'Database connection unavailable - using fallback data'
      })
    }

    if (error) {
      console.error('Database error:', error)
      // Return empty array instead of error status to allow page to load
      return NextResponse.json({
        categories: [],
        total: 0,
        limit,
        offset,
        message: 'Failed to fetch categories - using fallback data'
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

    // Normalize image URLs for all categories
    const categoriesWithNormalizedImages = (data || []).map((category: Category) => ({
      ...category,
      image_url: normalizeImageUrl(category.image_url) || null
    }))

    // Debug logging
    console.log('Categories API - Returning categories:', {
      count: categoriesWithNormalizedImages.length,
      total: count || 0,
      categories: categoriesWithNormalizedImages.map(c => ({
        id: c.id,
        name: c.name,
        is_active: c.is_active,
        sort_order: c.sort_order
      }))
    })

    return NextResponse.json({
      categories: categoriesWithNormalizedImages,
      total: count || 0,
      limit,
      offset
    })

  } catch (error: any) {
    console.error('API error:', {
      message: error?.message || 'Internal server error',
      details: error?.stack || String(error)
    })
    // Return empty categories array to allow page to load
    return NextResponse.json({
      categories: [],
      total: 0,
      limit: 50,
      offset: 0,
      message: 'Service temporarily unavailable - using fallback data'
    })
  }
}

export async function POST(request: NextRequest) {
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
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Build insert object
    const insertData: any = {
      name: body.name,
      description: body.description || null,
      is_active: body.is_active !== undefined ? body.is_active : true,
      sort_order: body.sort_order || 0,
      image_url: body.image_url || null,
      tags: body.tags || null
    }

    // Insert category
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Category creation error:', error)
      
      // Handle duplicate name error
      if (error.code === '23505' && error.message?.includes('name')) {
        return NextResponse.json({ 
          error: 'Category name already exists',
          message: `A category with the name "${body.name}" already exists. Please choose a different name.`,
          details: error.details || error.message
        }, { status: 409 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to create category',
        message: error.message || 'Failed to create category',
        details: error.details || error.message
      }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })

  } catch (error) {
    console.error('Admin category creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}