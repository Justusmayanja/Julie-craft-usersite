import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { Product, FrontendProduct } from '@/lib/types/product'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock product')
      
      // Mock product data based on ID
      const mockProducts: Record<string, any> = {
        '1': {
          id: '1',
          name: 'Handmade Ceramic Vase',
          price: 45000,
          description: 'Beautiful handcrafted ceramic vase with traditional Ugandan patterns',
          image: '/placeholder.svg',
          category: 'ceramics',
          stock_quantity: 10,
          featured: true,
          status: 'active',
          sku: 'CER-VASE-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          materials: 'Natural clay, traditional dyes',
          dimensions: 'Height: 30cm, Width: 20cm',
          care: 'Handle with care, wipe with damp cloth',
          cultural: 'Handcrafted with traditional techniques',
          isNew: true,
          onSale: false,
          inStock: true
        },
        '2': {
          id: '2',
          name: 'Traditional Beaded Necklace',
          price: 25000,
          description: 'Exquisite beaded necklace made with traditional techniques',
          image: '/placeholder.svg',
          category: 'jewelry',
          stock_quantity: 15,
          featured: true,
          status: 'active',
          sku: 'JEW-NECK-002',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          materials: 'Glass beads, cotton thread',
          dimensions: 'Length: 45cm',
          care: 'Avoid water, store in dry place',
          cultural: 'Traditional Maasai-inspired design',
          isNew: true,
          onSale: false,
          inStock: true
        },
        '0c3ba67f-d763-4827-a0e1-ae906d0c2663': {
          id: '0c3ba67f-d763-4827-a0e1-ae906d0c2663',
          name: 'Charger',
          price: 2500,
          description: 'Electronics',
          image: '/placeholder.svg',
          category: 'candles-&-soaps',
          stock_quantity: 10,
          featured: false,
          status: 'active',
          sku: 'CHARGER-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          materials: 'Handmade materials',
          dimensions: 'Various sizes available',
          care: 'Handle with care, see product description for details',
          cultural: 'Handcrafted with traditional techniques',
          isNew: true,
          onSale: false,
          inStock: true
        },
        '9436f4b3-0d2d-4130-87ac-01152d01c165': {
          id: '9436f4b3-0d2d-4130-87ac-01152d01c165',
          name: 'Laptop',
          price: 25000,
          description: 'Home',
          image: '/placeholder.svg',
          category: 'woodwork',
          stock_quantity: 10,
          featured: false,
          status: 'active',
          sku: 'LAPTOP-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          materials: 'Handmade materials',
          dimensions: 'Various sizes available',
          care: 'Handle with care, see product description for details',
          cultural: 'Handcrafted with traditional techniques',
          isNew: true,
          onSale: false,
          inStock: true
        }
      }

      const mockProduct = mockProducts[productId] || mockProducts['1']
      
      return NextResponse.json({
        product: {
          id: mockProduct.id,
          name: mockProduct.name,
          price: mockProduct.price,
          image: mockProduct.image,
          category: mockProduct.category,
          description: mockProduct.description,
          stock_quantity: mockProduct.stock_quantity,
          featured: mockProduct.featured,
          materials: mockProduct.materials,
          dimensions: mockProduct.dimensions,
          care: mockProduct.care,
          cultural: mockProduct.cultural,
          isNew: mockProduct.isNew,
          onSale: mockProduct.onSale,
          inStock: mockProduct.inStock
        },
        message: 'Mock data - database not configured'
      })
    }

    // Helper function to normalize image URLs
    const normalizeImageUrl = (url: string | null | undefined): string | null => {
      if (!url) return null
      
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      
      if (url.startsWith('/uploads/')) {
        return url
      }
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        return url
      }
      
      if (url.startsWith('/storage/')) {
        return `${supabaseUrl}${url}`
      }
      
      if (url.includes('products/') && !url.startsWith('http') && !url.startsWith('/')) {
        if (url.startsWith('products/')) {
          return `${supabaseUrl}/storage/v1/object/public/${url}`
        }
      }
      
      return url
    }

    // Helper function to normalize an array of image URLs
    const normalizeImageArray = (images: string[] | null | undefined): string[] => {
      if (!images || !Array.isArray(images)) return []
      return images.map(img => normalizeImageUrl(img)).filter((img): img is string => img !== null)
    }

    // Fetch product from database - only show active products with stock
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', productId)
      .eq('status', 'active') // Only show active products to public
      .gt('stock_quantity', 0) // Only show products that are in stock
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = data as Product

    // Check if product is in stock - don't show out-of-stock products on user site
    if (product.stock_quantity <= 0 || product.status !== 'active') {
      return NextResponse.json(
        { error: 'Product not available' },
        { status: 404 }
      )
    }

    // Normalize image URLs
    const normalizedFeaturedImage = normalizeImageUrl(product.featured_image)
    const normalizedImages = normalizeImageArray(product.images)
    
    // Select image: prioritize featured_image, then first image from images array, then placeholder
    let imageUrl = normalizedFeaturedImage || (normalizedImages.length > 0 ? normalizedImages[0] : null) || '/placeholder.svg'

    // Transform product to frontend format
    const transformedProduct: FrontendProduct & {
      stock_quantity: number
      featured: boolean
      materials?: string
      dimensions?: string
      care?: string
      cultural?: string
    } = {
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.cost_price && product.cost_price > product.price ? product.cost_price : undefined,
      image: imageUrl,
      category: product.category?.name?.toLowerCase().replace(/\s+/g, '-') || 'uncategorized',
      description: product.description || '',
      materials: product.tags?.join(', ') || 'Handmade materials',
      dimensions: product.dimensions ? 
        `${product.dimensions.width || 0}cm × ${product.dimensions.height || 0}cm` : 
        'Various sizes available',
      care: 'Handle with care, see product description for details',
      cultural: product.seo_description || 'Handcrafted with traditional techniques',
      isNew: new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      onSale: product.cost_price && product.cost_price > product.price,
      inStock: product.stock_quantity > 0,
      stock_quantity: product.stock_quantity,
      featured: product.featured
    }

    return NextResponse.json({ product: transformedProduct })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

