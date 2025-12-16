import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/site-content/about - Fetch about page content
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data, error } = await supabaseAdmin
      .from('about_page_content')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No content found, return null
        return NextResponse.json({ content: null })
      }
      console.error('Error fetching about page content:', error)
      return NextResponse.json({ error: 'Failed to fetch about page content' }, { status: 500 })
    }

    return NextResponse.json({ content: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/site-content/about - Update about page content
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
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    const body = await request.json()
    
    // Check if content exists
    const { data: existing } = await supabaseAdmin
      .from('about_page_content')
      .select('id')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('about_page_content')
        .update(body)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating about page content:', error)
        return NextResponse.json({ error: 'Failed to update about page content' }, { status: 500 })
      }

      result = data
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('about_page_content')
        .insert({ ...body, is_active: true })
        .select()
        .single()

      if (error) {
        console.error('Error creating about page content:', error)
        return NextResponse.json({ error: 'Failed to create about page content' }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({ content: result })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

