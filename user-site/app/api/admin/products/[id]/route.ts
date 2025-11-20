import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { storageService } from '@/lib/admin/services/storage'

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

    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.price) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

    // First, check if product exists
    const { data: existingProduct, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, sku')
      .eq('id', id)
      .single()

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check for duplicate SKU only if SKU is being changed to a different value
    if (body.sku && body.sku !== existingProduct.sku) {
      const { data: skuCheck, error: skuError } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('sku', body.sku)
        .neq('id', id) // Exclude current product
        .maybeSingle()

      if (skuCheck) {
        return NextResponse.json({ 
          error: 'Duplicate SKU',
          message: `A product with SKU "${body.sku}" already exists. Please use a different SKU.`,
          code: '23505'
        }, { status: 409 }) // 409 Conflict
      }
    }

    // Prepare inventory fields
    let stockQuantity = body.stock_quantity
    if (stockQuantity !== undefined && stockQuantity !== null) {
      if (typeof stockQuantity === 'string') {
        stockQuantity = parseInt(stockQuantity) || 0
      }
    }

    // Build update object - only update fields that are provided
    const updateData: any = {
      name: body.name,
      description: body.description || '',
      price: body.price,
      stock_quantity: stockQuantity,
      featured: body.featured || false,
      status: body.status || 'active',
      updated_at: new Date().toISOString()
    }

    // Only update fields that are provided
    if (body.category_id !== undefined) updateData.category_id = body.category_id || null
    if (body.sku !== undefined) updateData.sku = body.sku || null
    if (body.weight !== undefined) updateData.weight = body.weight || null
    if (body.dimensions !== undefined) updateData.dimensions = body.dimensions || null
    if (body.tags !== undefined) updateData.tags = body.tags || null
    if (body.cost_price !== undefined) updateData.cost_price = body.cost_price || null
    if (body.seo_title !== undefined) updateData.seo_title = body.seo_title || null
    if (body.seo_description !== undefined) updateData.seo_description = body.seo_description || null
    if (body.images !== undefined) {
      updateData.images = body.images && Array.isArray(body.images) ? body.images : null
      updateData.featured_image = body.images && Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : null
    }
    if (body.image !== undefined) {
      updateData.image_url = body.image || null
    }
    // Note: include_shipping and include_tax fields are not yet in the database schema
    // They will be added in a future database migration
    // if (body.include_shipping !== undefined) updateData.include_shipping = body.include_shipping || false
    // if (body.include_tax !== undefined) updateData.include_tax = body.include_tax || false

    // Update product
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Product update error:', error)
      
      // Handle duplicate SKU error
      if (error.code === '23505') {
        const isSkuError = error.message?.toLowerCase().includes('sku') || 
                          error.details?.toLowerCase().includes('sku') ||
                          error.constraint === 'products_sku_key'
        
        if (isSkuError) {
          return NextResponse.json({ 
            error: 'Duplicate SKU',
            message: `A product with SKU "${body.sku}" already exists. Please use a different SKU.`,
            details: error.details || error.message,
            code: error.code
          }, { status: 409 }) // 409 Conflict
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to update product',
        message: error.message || 'Failed to update product',
        details: error.details || error.message,
        code: error.code 
      }, { status: 500 })
    }

    return NextResponse.json(product, { status: 200 })

  } catch (error) {
    console.error('Admin product update error:', error)
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

    const { id } = await params

    // First, get the product to retrieve image URLs for deletion
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, featured_image, images')
      .eq('id', id)
      .single()

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete product images from storage if they exist
    try {
      const imagesToDelete: string[] = []
      
      if (product.featured_image) {
        imagesToDelete.push(product.featured_image)
      }
      
      if (product.images && Array.isArray(product.images)) {
        imagesToDelete.push(...product.images.filter(img => img && typeof img === 'string'))
      }

      // Delete all images (only if they are full URLs from storage)
      for (const imageUrl of imagesToDelete) {
        try {
          // Only attempt deletion if it looks like a storage URL
          if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/storage'))) {
            await storageService.deleteProductImage(imageUrl)
          }
        } catch (imageError) {
          // Log but don't fail the deletion if image deletion fails
          console.error(`Failed to delete image ${imageUrl}:`, imageError)
        }
      }
    } catch (imageError) {
      // Log but continue with product deletion even if image deletion fails
      console.error('Error deleting product images:', imageError)
    }

    // Delete the product from database
    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting product:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete product',
        details: deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Product deleted successfully',
      id: id
    })

  } catch (error) {
    console.error('Product deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
