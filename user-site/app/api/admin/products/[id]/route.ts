import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { storageService } from '@/lib/admin/services/storage'

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

