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
      console.log('Supabase not configured, returning mock category')
      
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

    // Fetch category from database
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .eq('is_active', true) // Only show active categories to public
      .single()

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

