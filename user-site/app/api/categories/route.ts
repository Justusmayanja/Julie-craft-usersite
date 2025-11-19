import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { Category } from '@/lib/types/product'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning empty categories array')
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

    // Build query - only fetch active categories
    let query = supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Helper function to normalize image URLs
    const normalizeImageUrl = (url: string | null | undefined): string | null => {
      if (!url) return null
      
      // If already a full URL, return as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      
      // If it's a relative path starting with /uploads/, it's a local file
      if (url.startsWith('/uploads/')) {
        return url
      }
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        return url
      }
      
      // If it starts with /storage/, prepend base URL
      if (url.startsWith('/storage/')) {
        return `${supabaseUrl}${url}`
      }
      
      // If it looks like a storage path without leading slash
      if (url.includes('categories/') && !url.startsWith('http') && !url.startsWith('/')) {
        if (url.startsWith('categories/')) {
          return `${supabaseUrl}/storage/v1/object/public/${url}`
        }
      }
      
      // Return as is if we can't normalize (might be a valid relative path)
      return url
    }

    // Normalize image URLs for all categories
    const categoriesWithNormalizedImages = (data || []).map((category: Category) => ({
      ...category,
      image_url: normalizeImageUrl(category.image_url) || null
    }))

    return NextResponse.json({
      categories: categoriesWithNormalizedImages,
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
