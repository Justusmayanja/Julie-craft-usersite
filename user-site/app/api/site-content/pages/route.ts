import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/site-content/pages - Fetch all pages
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('site_pages')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching pages:', error)
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
    }

    return NextResponse.json({ pages: data || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/site-content/pages - Create a new page
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
    let userId: string | null = null
    
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      userId = user?.id || null
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { title, slug, content, excerpt, type, status, meta_title, meta_description, featured_image, template, sort_order } = body

    if (!title || !slug || !type) {
      return NextResponse.json({ error: 'Title, slug, and type are required' }, { status: 400 })
    }

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('site_pages')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 400 })
    }

    const pageData: any = {
      title,
      slug,
      content: content || null,
      excerpt: excerpt || null,
      type,
      status: status || 'draft',
      meta_title: meta_title || null,
      meta_description: meta_description || null,
      featured_image: featured_image || null,
      template: template || 'default',
      sort_order: sort_order || 0,
      author_id: userId,
      published_at: status === 'published' ? new Date().toISOString() : null
    }

    const { data: page, error } = await supabaseAdmin
      .from('site_pages')
      .insert(pageData)
      .select()
      .single()

    if (error) {
      console.error('Error creating page:', error)
      return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
    }

    return NextResponse.json({ page }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

