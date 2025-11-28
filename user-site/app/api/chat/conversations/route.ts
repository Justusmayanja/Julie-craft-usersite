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

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin || false

    // Get conversations
    let query = supabaseAdmin
      .from('chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false })

    if (!isAdmin) {
      // Customers can only see their own conversations
      query = query.eq('user_id', user.id)
    }

    const { data: conversations, error } = await query

    if (error) throw error

    return NextResponse.json({ conversations: conversations || [] })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error instanceof Error ? error.message : 'Unknown error' },
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
    const { subject, customer_name, customer_email, customer_phone, metadata } = body

    // Get user profile for name/email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', user.id)
      .single()

    const { data: conversation, error } = await supabaseAdmin
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        customer_name: customer_name || (profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Guest'),
        customer_email: customer_email || profile?.email || user.email,
        customer_phone: customer_phone || profile?.phone,
        subject: subject || 'General Inquiry',
        status: 'open',
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

