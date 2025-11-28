import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 })
    }

    // Verify user has access to this conversation
    const { data: conversation } = await supabaseAdmin
      .from('chat_conversations')
      .select('user_id, assigned_to')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin || false

    // Check access
    if (!isAdmin && conversation.user_id !== user.id && conversation.assigned_to !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get messages
    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Mark messages as read
    if (user.id) {
      await supabaseAdmin.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: user.id
      })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const body = await request.json()
    const { conversation_id, message, message_type = 'text', attachments = [] } = body

    if (!conversation_id || !message) {
      return NextResponse.json({ error: 'conversation_id and message are required' }, { status: 400 })
    }

    // Verify user has access to this conversation
    const { data: conversation } = await supabaseAdmin
      .from('chat_conversations')
      .select('user_id, assigned_to')
      .eq('id', conversation_id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, first_name, last_name')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin || false

    // Check access
    if (!isAdmin && conversation.user_id !== user.id && conversation.assigned_to !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get sender name
    const senderName = isAdmin 
      ? (profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Support' : 'Support')
      : (profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Guest')

    // Create message
    const { data: chatMessage, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        conversation_id,
        sender_id: user.id,
        sender_type: isAdmin ? 'admin' : 'customer',
        sender_name: senderName,
        message: message.trim(),
        message_type,
        attachments: attachments.length > 0 ? attachments : []
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message: chatMessage })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

