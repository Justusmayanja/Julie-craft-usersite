import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/site-content/carousel/[id] - Fetch a single carousel slide
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const resolvedParams = await (params as any)
    const slideId = resolvedParams.id

    const { data, error } = await supabaseAdmin
      .from('carousel_slides')
      .select('*')
      .eq('id', slideId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Carousel slide not found' }, { status: 404 })
      }
      console.error('Error fetching carousel slide:', error)
      return NextResponse.json({ error: 'Failed to fetch carousel slide' }, { status: 500 })
    }

    return NextResponse.json({ slide: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/site-content/carousel/[id] - Update a carousel slide
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const resolvedParams = await (params as any)
    const slideId = resolvedParams.id
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('carousel_slides')
      .update(body)
      .eq('id', slideId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Carousel slide not found' }, { status: 404 })
      }
      console.error('Error updating carousel slide:', error)
      return NextResponse.json({ error: 'Failed to update carousel slide' }, { status: 500 })
    }

    return NextResponse.json({ slide: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/site-content/carousel/[id] - Delete a carousel slide
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const resolvedParams = await (params as any)
    const slideId = resolvedParams.id

    const { error } = await supabaseAdmin
      .from('carousel_slides')
      .delete()
      .eq('id', slideId)

    if (error) {
      console.error('Error deleting carousel slide:', error)
      return NextResponse.json({ error: 'Failed to delete carousel slide' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

