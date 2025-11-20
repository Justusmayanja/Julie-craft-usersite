import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const notificationId = params.id
    const body = await request.json()
    const { is_read } = body

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

    // Mark as read using the database function
    if (is_read === true) {
      const { data: success, error: rpcError } = await supabaseAdmin.rpc('mark_notification_read', {
        p_notification_id: notificationId,
        p_user_id: userId
      })

      if (rpcError) {
        console.error('RPC function error:', rpcError)
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
      }

      if (!success) {
        return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 })
      }
    }

    // Fetch updated notification
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json(notification)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const notificationId = params.id

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

    // First, verify the notification exists and belongs to the user
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()

    if (fetchError || !notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Verify ownership: for customer notifications, user_id must match; for admin, user_id should be null
    if (notification.recipient_type === 'customer' && notification.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (notification.recipient_type === 'admin' && notification.user_id !== null) {
      // Admin notifications should have null user_id, but we allow admins to delete them
      // Additional check: verify user is admin (you might want to add role check here)
    }

    // Delete the notification
    const { error: deleteError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (deleteError) {
      console.error('Error deleting notification:', deleteError)
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Notification deleted successfully' })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

