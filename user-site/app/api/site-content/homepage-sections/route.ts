import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/site-content/homepage-sections - Fetch all homepage sections
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data, error } = await supabaseAdmin
      .from('homepage_sections')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching homepage sections:', error)
      return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
    }

    return NextResponse.json({ sections: data || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/site-content/homepage-sections - Create a new section
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
    const { section_type, title, content, is_active, sort_order, display_settings } = body

    if (!section_type || !title) {
      return NextResponse.json({ error: 'Section type and title are required' }, { status: 400 })
    }

    const sectionData: any = {
      section_type,
      title,
      content: content || {},
      is_active: is_active !== undefined ? is_active : true,
      sort_order: sort_order || 0,
      display_settings: display_settings || {}
    }

    const { data: section, error } = await supabaseAdmin
      .from('homepage_sections')
      .insert(sectionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating section:', error)
      return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
    }

    return NextResponse.json({ section }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

