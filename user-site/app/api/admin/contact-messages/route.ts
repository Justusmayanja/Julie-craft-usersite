import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
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

      // Check if user is admin
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .single()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin' && !profile.is_admin)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabaseAdmin
      .from('contact_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: messages, error: messagesError, count } = await query

    if (messagesError) {
      // If table doesn't exist, return empty array
      if (messagesError.code === '42P01') {
        return NextResponse.json({
          messages: [],
          total: 0,
          unread: 0
        })
      }
      console.error('Error fetching contact messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch contact messages' }, { status: 500 })
    }

    // Get unread count
    let unreadCount = 0
    try {
      const { count } = await supabaseAdmin
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
      unreadCount = count || 0
    } catch (error) {
      // Table might not exist, default to 0
      unreadCount = 0
    }

    return NextResponse.json({
      messages: messages || [],
      total: count || 0,
      unread: unreadCount || 0
    })

  } catch (error) {
    console.error('Contact messages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    let userId: string | null = null
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      userId = user.id

      // Check if user is admin
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .single()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin' && !profile.is_admin)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, admin_notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updates.status = status
      if (status === 'replied') {
        updates.replied_at = new Date().toISOString()
        updates.replied_by = userId
      }
    }

    if (admin_notes !== undefined) {
      updates.admin_notes = admin_notes
    }

    const { data: updatedMessage, error: updateError } = await supabaseAdmin
      .from('contact_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === '42P01') {
        return NextResponse.json({ error: 'Contact messages table does not exist' }, { status: 404 })
      }
      console.error('Error updating contact message:', updateError)
      return NextResponse.json({ error: 'Failed to update contact message' }, { status: 500 })
    }

    return NextResponse.json({ message: updatedMessage })

  } catch (error) {
    console.error('Update contact message API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
