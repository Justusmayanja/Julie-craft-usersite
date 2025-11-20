import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/notifications - Get notifications for current user or admin
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ notifications: [], unread_count: 0 })
    }

    const { searchParams } = new URL(request.url)
    const recipientType = searchParams.get('recipient_type') || 'customer'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unread_only') === 'true'

    // Get auth token
    const authHeader = request.headers.get('authorization')
    let userId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)
        userId = user?.id
      } catch (error) {
        console.log('Could not verify user token:', error)
      }
    }

    // Build query
    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })

    // Filter by recipient type
    if (recipientType === 'admin') {
      query = query.eq('recipient_type', 'admin').is('user_id', null)
    } else {
      query = query.eq('recipient_type', 'customer')
      if (userId) {
        query = query.eq('user_id', userId)
      } else {
        // For guest users, return empty (they can't have notifications)
        return NextResponse.json({ notifications: [], unread_count: 0 })
      }
    }

    // Filter unread only if requested
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    // Order by created_at descending (newest first)
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      // If table doesn't exist, return empty array instead of error
      if (error.code === 'PGRST205' || error.message?.includes('not found') || error.message?.includes('schema cache')) {
        console.log('Notifications table does not exist yet. Returning empty notifications.')
        return NextResponse.json({ notifications: [], unread_count: 0, total: 0 })
      }
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get unread count
    let unreadQuery = supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)

    if (recipientType === 'admin') {
      unreadQuery = unreadQuery.eq('recipient_type', 'admin').is('user_id', null)
    } else {
      unreadQuery = unreadQuery.eq('recipient_type', 'customer')
      if (userId) {
        unreadQuery = unreadQuery.eq('user_id', userId)
      }
    }

    const { count: unreadCount, error: unreadError } = await unreadQuery

    // Handle missing table for unread count query too
    if (unreadError && (unreadError.code === 'PGRST205' || unreadError.message?.includes('not found') || unreadError.message?.includes('schema cache'))) {
      return NextResponse.json({
        notifications: data || [],
        unread_count: 0,
        total: count || 0
      })
    }

    return NextResponse.json({
      notifications: data || [],
      unread_count: unreadCount || 0,
      total: count || 0
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifications - Create a notification (admin only)
export async function POST(request: NextRequest) {
  try {
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
    const {
      recipient_type,
      notification_type,
      title,
      message,
      order_id,
      order_number,
      user_id,
      metadata
    } = body

    // Validate required fields
    if (!recipient_type || !notification_type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create notification using the database function
    const { data: notificationId, error: rpcError } = await supabaseAdmin.rpc('create_notification', {
      p_recipient_type: recipient_type,
      p_notification_type: notification_type,
      p_title: title,
      p_message: message,
      p_order_id: order_id || null,
      p_order_number: order_number || null,
      p_user_id: user_id || null,
      p_metadata: metadata || {}
    })

    if (rpcError) {
      console.error('RPC function error:', rpcError)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    // Fetch the created notification
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()

    if (fetchError) {
      console.error('Error fetching notification:', fetchError)
      return NextResponse.json({ error: 'Notification created but failed to fetch' }, { status: 500 })
    }

    return NextResponse.json(notification, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

