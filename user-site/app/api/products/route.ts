import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { Product, ProductFilters, FrontendProduct } from '@/lib/types/product'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock products')
      
      // Get query parameters for mock data
      const { searchParams } = new URL(request.url)
      const featured = searchParams.get('featured') === 'true'
      const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50
      
      // Mock featured products
      const mockProducts = [
        {
          id: '1',
          name: 'Handmade Ceramic Vase',
          price: 45000,
          description: 'Beautiful handcrafted ceramic vase with traditional Ugandan patterns',
          image: '/placeholder-product.jpg',
          category: 'ceramics',
          stock_quantity: 10,
          featured: true,
          status: 'active',
          sku: 'CER-VASE-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Traditional Beaded Necklace',
          price: 25000,
          description: 'Exquisite beaded necklace made with traditional techniques',
          image: '/placeholder-product.jpg',
          category: 'jewelry',
          stock_quantity: 15,
          featured: true,
          status: 'active',
          sku: 'JEW-NECK-002',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Woven Textile Wall Hanging',
          price: 35000,
          description: 'Colorful woven textile perfect for home decoration',
          image: '/placeholder-product.jpg',
          category: 'textiles',
          stock_quantity: 8,
          featured: true,
          status: 'active',
          sku: 'TEX-HANG-003',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Wooden Carved Bowl',
          price: 30000,
          description: 'Hand-carved wooden bowl from local artisans',
          image: '/placeholder-product.jpg',
          category: 'woodwork',
          stock_quantity: 12,
          featured: true,
          status: 'active',
          sku: 'WD-BOWL-004',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Batik Print Scarf',
          price: 20000,
          description: 'Beautiful batik print scarf with African motifs',
          image: '/placeholder-product.jpg',
          category: 'textiles',
          stock_quantity: 20,
          featured: true,
          status: 'active',
          sku: 'TEX-SCARF-005',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '6',
          name: 'Clay Pottery Set',
          price: 55000,
          description: 'Complete set of traditional clay pottery for cooking',
          image: '/placeholder-product.jpg',
          category: 'ceramics',
          stock_quantity: 6,
          featured: true,
          status: 'active',
          sku: 'CER-SET-006',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      
      // Filter by featured if requested
      const filteredProducts = featured ? mockProducts.filter(p => p.featured) : mockProducts
      const limitedProducts = filteredProducts.slice(0, limit)
      
      return NextResponse.json({
        products: limitedProducts,
        total: filteredProducts.length,
        limit,
        offset: 0,
        message: 'Mock data - database not configured',
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

    let data, error, count
    try {
      const result = await query
      data = result.data
      error = result.error
      count = result.count
    } catch (networkError) {
      console.error('Network error during database query:', networkError)
      // Return mock data for network errors
      const { searchParams } = new URL(request.url)
      const featured = searchParams.get('featured') === 'true'
      const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50
      
      if (featured) {
        return NextResponse.json({
          products: [
            {
              id: '1',
              name: 'Handmade Ceramic Vase',
              price: 45000,
              description: 'Beautiful handcrafted ceramic vase with traditional Ugandan patterns',
              image: '/placeholder-product.jpg',
              category: 'ceramics',
              stock_quantity: 10,
              featured: true,
              status: 'active',
              sku: 'CER-VASE-001',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              name: 'Traditional Beaded Necklace',
              price: 25000,
              description: 'Exquisite beaded necklace made with traditional techniques',
              image: '/placeholder-product.jpg',
              category: 'jewelry',
              stock_quantity: 15,
              featured: true,
              status: 'active',
              sku: 'JEW-NECK-002',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '3',
              name: 'Woven Textile Wall Hanging',
              price: 35000,
              description: 'Colorful woven textile perfect for home decoration',
              image: '/placeholder-product.jpg',
              category: 'textiles',
              stock_quantity: 8,
              featured: true,
              status: 'active',
              sku: 'TEX-WALL-003',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '4',
              name: 'Carved Wooden Bowl',
              price: 30000,
              description: 'Hand-carved wooden bowl with intricate patterns',
              image: '/placeholder-product.jpg',
              category: 'woodwork',
              stock_quantity: 12,
              featured: true,
              status: 'active',
              sku: 'WOO-BOWL-004',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '5',
              name: 'Traditional Pottery Set',
              price: 55000,
              description: 'Complete set of traditional Ugandan pottery',
              image: '/placeholder-product.jpg',
              category: 'ceramics',
              stock_quantity: 5,
              featured: true,
              status: 'active',
              sku: 'CER-SET-005',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '6',
              name: 'Beaded Bracelet Collection',
              price: 20000,
              description: 'Set of three beaded bracelets in different colors',
              image: '/placeholder-product.jpg',
              category: 'jewelry',
              stock_quantity: 20,
              featured: true,
              status: 'active',
              sku: 'JEW-BRAC-006',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ].slice(0, limit),
          total: 6,
          limit: limit,
          offset: 0,
          message: 'Mock data - network error fallback'
        })
      }
      
      return NextResponse.json({
        products: [
          {
            id: '1',
            name: 'Handmade Ceramic Vase',
            price: 45000,
            description: 'Beautiful handcrafted ceramic vase with traditional Ugandan patterns',
            image: '/placeholder-product.jpg',
            category: 'ceramics',
            stock_quantity: 10,
            featured: true,
            status: 'active',
            sku: 'CER-VASE-001',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Traditional Beaded Necklace',
            price: 25000,
            description: 'Exquisite beaded necklace made with traditional techniques',
            image: '/placeholder-product.jpg',
            category: 'jewelry',
            stock_quantity: 15,
            featured: true,
            status: 'active',
            sku: 'JEW-NECK-002',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ].slice(0, limit),
        total: 2,
        limit: limit,
        offset: 0,
        message: 'Mock data - network error fallback'
      })
    }

    if (error) {
      console.error('Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // Return mock data instead of error when database fails
      console.log('Database query failed, returning mock products as fallback')
      const { searchParams } = new URL(request.url)
      const featured = searchParams.get('featured') === 'true'
      const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50
      
      // Return appropriate mock data based on request
      if (featured) {
        return NextResponse.json({
          products: [
            {
              id: '1',
              name: 'Handmade Ceramic Vase',
              price: 45000,
              description: 'Beautiful handcrafted ceramic vase with traditional Ugandan patterns',
              image: '/placeholder-product.jpg',
              category: 'ceramics',
              stock_quantity: 10,
              featured: true,
              status: 'active',
              sku: 'CER-VASE-001',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              name: 'Traditional Beaded Necklace',
              price: 25000,
              description: 'Exquisite beaded necklace made with traditional techniques',
              image: '/placeholder-product.jpg',
              category: 'jewelry',
              stock_quantity: 15,
              featured: true,
              status: 'active',
              sku: 'JEW-NECK-002',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '3',
              name: 'Woven Textile Wall Hanging',
              price: 35000,
              description: 'Colorful woven textile perfect for home decoration',
              image: '/placeholder-product.jpg',
              category: 'textiles',
              stock_quantity: 8,
              featured: true,
              status: 'active',
              sku: 'TEX-WALL-003',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '4',
              name: 'Carved Wooden Bowl',
              price: 30000,
              description: 'Hand-carved wooden bowl with intricate patterns',
              image: '/placeholder-product.jpg',
              category: 'woodwork',
              stock_quantity: 12,
              featured: true,
              status: 'active',
              sku: 'WOO-BOWL-004',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '5',
              name: 'Traditional Pottery Set',
              price: 55000,
              description: 'Complete set of traditional Ugandan pottery',
              image: '/placeholder-product.jpg',
              category: 'ceramics',
              stock_quantity: 5,
              featured: true,
              status: 'active',
              sku: 'CER-SET-005',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '6',
              name: 'Beaded Bracelet Collection',
              price: 20000,
              description: 'Set of three beaded bracelets in different colors',
              image: '/placeholder-product.jpg',
              category: 'jewelry',
              stock_quantity: 20,
              featured: true,
              status: 'active',
              sku: 'JEW-BRAC-006',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ].slice(0, limit),
          total: 6,
          limit: limit,
          offset: 0,
          message: 'Mock data - database error fallback'
        })
      }
      
      // Return general mock products for non-featured requests
      return NextResponse.json({
        products: [
          {
            id: '1',
            name: 'Handmade Ceramic Vase',
            price: 45000,
            description: 'Beautiful handcrafted ceramic vase with traditional Ugandan patterns',
            image: '/placeholder-product.jpg',
            category: 'ceramics',
            stock_quantity: 10,
            featured: true,
            status: 'active',
            sku: 'CER-VASE-001',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Traditional Beaded Necklace',
            price: 25000,
            description: 'Exquisite beaded necklace made with traditional techniques',
            image: '/placeholder-product.jpg',
            category: 'jewelry',
            stock_quantity: 15,
            featured: true,
            status: 'active',
            sku: 'JEW-NECK-002',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ].slice(0, limit),
        total: 2,
        limit: limit,
        offset: 0,
        message: 'Mock data - database error fallback'
      })
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
