import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { recipient_type } = body

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

    // Determine recipient type
    const finalRecipientType = recipient_type || (userId ? 'customer' : 'admin')

    // Mark all as read using the database function
    const { data: count, error: rpcError } = await supabaseAdmin.rpc('mark_all_notifications_read', {
      p_user_id: userId,
      p_recipient_type: finalRecipientType
    })

    if (rpcError) {
      console.error('RPC function error:', rpcError)
      return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      marked_count: count || 0 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

