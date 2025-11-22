import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { createOrderNotifications } from '@/lib/notifications'

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

    // Verify order ownership for authenticated users (allow admin access to all orders)
    if (authenticatedUserId || authenticatedUserEmail) {
      // Check if user is admin
      let isAdmin = false
      if (authenticatedUserId) {
        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role, is_admin')
            .eq('id', authenticatedUserId)
            .single()
          
          if (profile) {
            isAdmin = profile.role === 'admin' || profile.role === 'super_admin' || profile.is_admin === true
          }
        } catch (error) {
          console.error('Error checking admin status:', error)
        }
      }
      
      // If not admin, check ownership
      if (!isAdmin) {
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

    // Get current order to check existing status and dates
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('status, payment_status, shipped_date, delivered_date, customer_id, user_id, tracking_number')
      .eq('id', orderId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      console.error('Database error fetching order:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }

    // Only allow updating certain fields
    const allowedUpdates = ['status', 'payment_status', 'tracking_number', 'notes', 'shipped_date', 'delivered_date']
    const updates: any = {}

    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    // Auto-update dates based on status changes
    if (body.status && body.status !== currentOrder.status) {
      const now = new Date().toISOString()
      
      // If status is changing to 'shipped' and shipped_date is not set, set it now
      if (body.status === 'shipped' && !currentOrder.shipped_date && !body.shipped_date) {
        updates.shipped_date = now
      }
      
      // If status is changing to 'delivered' and delivered_date is not set, set it now
      if (body.status === 'delivered' && !currentOrder.delivered_date && !body.delivered_date) {
        updates.delivered_date = now
      }
    }

    // Always update updated_at timestamp
    updates.updated_at = new Date().toISOString()

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

    // Create notifications for status/payment changes (async, don't wait)
    const previousStatus = currentOrder.status
    const previousPaymentStatus = currentOrder.payment_status
    const statusChanged = body.status && body.status !== previousStatus
    const paymentStatusChanged = body.payment_status && body.payment_status !== previousPaymentStatus
    const trackingUpdated = body.tracking_number && body.tracking_number !== currentOrder.tracking_number

    if (statusChanged || paymentStatusChanged || trackingUpdated) {
      console.log(`[Orders API] Order #${data.order_number} updated: status=${statusChanged ? `${previousStatus}->${data.status}` : 'unchanged'}, payment=${paymentStatusChanged ? `${previousPaymentStatus}->${data.payment_status}` : 'unchanged'}, tracking=${trackingUpdated ? 'updated' : 'unchanged'}`)
      
      createOrderNotifications({
        id: data.id,
        order_number: data.order_number,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        status: data.status,
        payment_status: data.payment_status || previousPaymentStatus,
        tracking_number: data.tracking_number || currentOrder.tracking_number,
        customer_id: data.customer_id,
        user_id: data.user_id || data.customer_id
      }, previousStatus, previousPaymentStatus).catch(err => {
        console.error('[Orders API] Error creating order notifications:', err)
        // Don't fail the request if notification creation fails
      })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
