import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { Product, ProductFilters, FrontendProduct } from '@/lib/types/product'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning empty products array')
      console.log('Environment check:', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        isConfigured: isSupabaseConfigured,
        hasAdmin: !!supabaseAdmin
      })
      return NextResponse.json({
        products: [],
        total: 0,
        limit: 50,
        offset: 0,
        message: 'Database not configured - using fallback data',
        debug: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          isConfigured: isSupabaseConfigured,
          hasAdmin: !!supabaseAdmin
        }
      })
    }
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filters: ProductFilters = {
      search: searchParams.get('search') || undefined,
      category_id: searchParams.get('category_id') || undefined,
      status: searchParams.get('status') as 'active' | 'inactive' | 'draft' || 'active',
      featured: searchParams.get('featured') === 'true' ? true : searchParams.get('featured') === 'false' ? false : undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      low_stock: searchParams.get('low_stock') === 'true' ? true : undefined,
      sort_by: searchParams.get('sort_by') as 'name' | 'price' | 'stock_quantity' | 'created_at' | 'updated_at' || 'created_at',
      sort_order: searchParams.get('sort_order') as 'asc' | 'desc' || 'desc',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
    }

    // Build query - only fetch active products for public API
    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        category:categories(*)
      `, { count: 'exact' })
      .eq('status', 'active') // Only show active products to public

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
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
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Transform products to frontend format
    const transformedProducts: FrontendProduct[] = (data || []).map((product: Product) => ({
      id: product.id, // Keep UUID as string
      name: product.name,
      price: product.price,
      originalPrice: product.cost_price && product.cost_price > product.price ? product.cost_price : undefined,
      image: product.featured_image || (product.images && product.images[0]) || '/placeholder.svg',
      category: product.category?.name?.toLowerCase().replace(/\s+/g, '-') || 'uncategorized',
      description: product.description || '',
      materials: product.tags?.join(', ') || 'Handmade materials',
      dimensions: product.dimensions ? 
        `${product.dimensions.width || 0}cm × ${product.dimensions.height || 0}cm` : 
        'Various sizes available',
      care: 'Handle with care, see product description for details',
      cultural: product.seo_description || 'Handcrafted with traditional techniques',
      isNew: new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // New if created within last 30 days
      onSale: product.cost_price && product.cost_price > product.price,
      inStock: product.stock_quantity > 0,
    }))

    return NextResponse.json({
      products: transformedProducts,
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset
    })

  } catch (error) {
    console.error('API error:', error)
    // Return a more descriptive error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage,
      products: [],
      total: 0,
      limit: 50,
      offset: 0
    }, { status: 500 })
  }
}
