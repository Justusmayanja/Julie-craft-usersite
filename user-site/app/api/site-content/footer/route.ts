import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/site-content/footer - Fetch footer content
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data, error } = await supabaseAdmin
      .from('footer_content')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching footer content:', error)
      return NextResponse.json({ error: 'Failed to fetch footer content' }, { status: 500 })
    }

    return NextResponse.json({ footer: data || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/site-content/footer - Update footer content
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
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (!user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    const body = await request.json()
    const { sections } = body

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'Sections array is required' }, { status: 400 })
    }

    // Delete all existing footer content
    await supabaseAdmin.from('footer_content').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert new footer content
    const { data, error } = await supabaseAdmin
      .from('footer_content')
      .insert(sections)
      .select()

    if (error) {
      console.error('Error updating footer:', error)
      return NextResponse.json({ error: 'Failed to update footer' }, { status: 500 })
    }

    return NextResponse.json({ footer: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

