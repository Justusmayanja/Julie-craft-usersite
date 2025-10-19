import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { Product, ProductFilters } from '@/lib/types/product'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock products for admin')
      const mockProducts = [
        {
          id: '1',
          name: 'Handcrafted Ceramic Bowl',
          price: 45000,
          description: 'Beautiful handcrafted ceramic bowl with traditional patterns',
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
          images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop'],
          featured_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
          category: 'Ceramics',
          stock_quantity: 15,
          featured: true,
          inStock: true,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sku: 'CER-001',
          weight: 0.5,
          dimensions: '15cm x 15cm x 8cm',
          tags: ['handmade', 'ceramic', 'traditional'],
          meta_title: 'Handcrafted Ceramic Bowl',
          meta_description: 'Beautiful handcrafted ceramic bowl',
          seo_keywords: 'ceramic, bowl, handmade'
        },
        {
          id: '2',
          name: 'Wooden Carving Art',
          price: 75000,
          description: 'Intricate wooden carving showcasing traditional craftsmanship',
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
          images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'],
          featured_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
          category: 'Woodwork',
          stock_quantity: 8,
          featured: false,
          inStock: true,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sku: 'WOD-002',
          weight: 1.2,
          dimensions: '25cm x 20cm x 15cm',
          tags: ['wooden', 'carving', 'art'],
          meta_title: 'Wooden Carving Art',
          meta_description: 'Intricate wooden carving art',
          seo_keywords: 'wooden, carving, art'
        },
        {
          id: '3',
          name: 'Textile Wall Hanging',
          price: 35000,
          description: 'Colorful textile wall hanging with geometric patterns',
          image: null, // This one has no image to test the placeholder
          images: [],
          featured_image: null,
          category: 'Textiles',
          stock_quantity: 0,
          featured: false,
          inStock: false,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sku: 'TEX-003',
          weight: 0.3,
          dimensions: '60cm x 40cm',
          tags: ['textile', 'wall hanging', 'geometric'],
          meta_title: 'Textile Wall Hanging',
          meta_description: 'Colorful textile wall hanging',
          seo_keywords: 'textile, wall hanging, geometric'
        }
      ]
      
      return NextResponse.json({
        products: mockProducts,
        total: mockProducts.length,
        limit: 50,
        offset: 0,
        message: 'Using mock data - database not configured'
      })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filters: ProductFilters = {
      search: searchParams.get('search') || undefined,
      category_id: searchParams.get('category_id') || undefined,
      status: searchParams.get('status') as 'active' | 'inactive' | 'draft' || undefined, // No default status filter for admin
      featured: searchParams.get('featured') === 'true' ? true : searchParams.get('featured') === 'false' ? false : undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      low_stock: searchParams.get('low_stock') === 'true' ? true : undefined,
      sort_by: searchParams.get('sort_by') as 'name' | 'price' | 'stock_quantity' | 'created_at' | 'updated_at' || 'created_at',
      sort_order: searchParams.get('sort_order') as 'asc' | 'desc' || 'desc',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
    }

    // Build query - admin can see ALL products (active, inactive, draft)
    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        category:categories(name)
      `, { count: 'exact' })

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured)
    }

    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price)
    }

    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price)
    }

    if (filters.low_stock) {
      query = query.lte('stock_quantity', 5)
    }

    // Apply sorting
    query = query.order(filters.sort_by || 'created_at', { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Transform data for admin view
    const adminProducts = (data || []).map(product => {
      // Handle image selection - prioritize featured_image, then first image from images array
      let imageUrl = null
      if (product.featured_image) {
        imageUrl = product.featured_image
      } else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        imageUrl = product.images[0]
      }

      console.log(`Product ${product.name}:`, {
        featured_image: product.featured_image,
        images: product.images,
        selected_image: imageUrl
      })

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: imageUrl,
        images: product.images || [],
        featured_image: product.featured_image,
        category: product.category?.name || product.category_name || 'Uncategorized',
        stock_quantity: product.stock_quantity || 0,
        featured: product.featured || false,
        inStock: (product.stock_quantity || 0) > 0,
        status: product.status || 'active',
        created_at: product.created_at,
        updated_at: product.updated_at,
        // Additional admin-specific fields
        sku: product.sku,
        weight: product.weight,
        dimensions: product.dimensions,
        tags: product.tags,
        meta_title: product.meta_title,
        meta_description: product.meta_description,
        seo_keywords: product.seo_keywords
      }
    })

    return NextResponse.json({
      products: adminProducts,
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset,
      filters: filters
    })

  } catch (error) {
    console.error('Admin products API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.price) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

    // Create product
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        name: body.name,
        description: body.description || '',
        price: body.price,
        image_url: body.image || null,
        category_id: body.category_id || null,
        stock_quantity: body.stock_quantity || 0,
        featured: body.featured || false,
        status: body.status || 'active',
        sku: body.sku || null,
        weight: body.weight || null,
        dimensions: body.dimensions || null,
        tags: body.tags || null,
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
        seo_keywords: body.seo_keywords || null
      })
      .select()
      .single()

    if (error) {
      console.error('Product creation error:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    return NextResponse.json(product, { status: 201 })

  } catch (error) {
    console.error('Admin product creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
