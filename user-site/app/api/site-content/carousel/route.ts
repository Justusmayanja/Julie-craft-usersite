import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/site-content/carousel - Fetch all carousel slides
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') === 'true'

    let query = supabaseAdmin
      .from('carousel_slides')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching carousel slides:', error)
      return NextResponse.json({ error: 'Failed to fetch carousel slides' }, { status: 500 })
    }

    return NextResponse.json({ slides: data || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/site-content/carousel - Create a new carousel slide
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
    const { image_url, title, subtitle, description, cta_text, cta_link, is_active, sort_order } = body

    if (!image_url || !title) {
      return NextResponse.json({ error: 'Image URL and title are required' }, { status: 400 })
    }

    // Get max sort_order to set default if not provided
    let finalSortOrder = sort_order
    if (finalSortOrder === undefined) {
      const { data: maxData } = await supabaseAdmin
        .from('carousel_slides')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()
      finalSortOrder = maxData?.sort_order !== undefined ? maxData.sort_order + 1 : 0
    }

    const slideData: any = {
      image_url,
      title,
      subtitle: subtitle || null,
      description: description || null,
      cta_text: cta_text || null,
      cta_link: cta_link || null,
      is_active: is_active !== undefined ? is_active : true,
      sort_order: finalSortOrder
    }

    const { data: slide, error } = await supabaseAdmin
      .from('carousel_slides')
      .insert(slideData)
      .select()
      .single()

    if (error) {
      console.error('Error creating carousel slide:', error)
      return NextResponse.json({ error: 'Failed to create carousel slide' }, { status: 500 })
    }

    return NextResponse.json({ slide }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

