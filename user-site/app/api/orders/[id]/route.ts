import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        error: 'Database not configured',
        message: 'Order lookup not available'
      }, { status: 503 })
    }

    // Verify JWT token if provided (for authenticated users)
    const authHeader = request.headers.get('authorization')
    let authenticatedUserId: string | null = null
    let authenticatedUserEmail: string | null = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
        if (!error && user) {
          authenticatedUserId = user.id
          authenticatedUserEmail = user.email || null
        }
      } catch (error) {
        console.error('Token verification failed:', error)
      }
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }

    // Verify order ownership for authenticated users
    if (authenticatedUserId || authenticatedUserEmail) {
      const isOwner = 
        (authenticatedUserId && data.customer_id === authenticatedUserId) ||
        (authenticatedUserEmail && data.customer_email === authenticatedUserEmail)
      
      if (!isOwner) {
        return NextResponse.json({ 
          error: 'Unauthorized',
          message: 'You do not have access to this order' 
        }, { status: 403 })
      }
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
      if (url.includes('products/') && !url.startsWith('http') && !url.startsWith('/')) {
        if (url.startsWith('products/')) {
          return `${supabaseUrl}/storage/v1/object/public/${url}`
        }
      }
      
      // Return as is if we can't normalize (might be a valid relative path)
      return url
    }

    // Normalize product images in order items
    if (data.order_items && Array.isArray(data.order_items)) {
      data.order_items = data.order_items.map((item: any) => ({
        ...item,
        product_image: normalizeImageUrl(item.product_image) || '/placeholder.svg'
      }))
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const body = await request.json()

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        error: 'Database not configured',
        message: 'Order updates not available'
      }, { status: 503 })
    }

    // Only allow updating certain fields
    const allowedUpdates = ['status', 'payment_status', 'tracking_number', 'notes']
    const updates: any = {}

    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select(`
        *,
        order_items:order_items(*)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
