import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock content page')
      const mockPage = {
        id: id,
        title: 'Sample Content Page',
        slug: 'sample-page',
        content: '<p>This is a sample content page...</p>',
        excerpt: 'This is a sample content page...',
        type: 'custom',
        status: 'published',
        meta_title: 'Sample Page - JulieCraft',
        meta_description: 'A sample content page',
        author_id: 'admin-001',
        author_name: 'Julie Anderson',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json({ page: mockPage, message: 'Mock data - database not configured' })
    }

    // For public access (no auth required for published pages)
    const { data: page, error } = await supabaseAdmin
      .from('content_pages')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !page) {
      return NextResponse.json({ error: 'Content page not found' }, { status: 404 })
    }

    return NextResponse.json({ page })

  } catch (error) {
    console.error('Content fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating content page update')
      const body = await request.json()
      return NextResponse.json({ 
        page: { id, ...body, updated_at: new Date().toISOString() }, 
        message: 'Mock data - content page update simulated' 
      })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()

    // Update content page
    const { data, error } = await supabaseAdmin
      .from('content_pages')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating content page:', error)
      return NextResponse.json({ error: 'Failed to update content page' }, { status: 500 })
    }

    return NextResponse.json({ page: data })

  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating content page deletion')
      return NextResponse.json({ message: 'Content page deleted (simulated)' })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Delete content page
    const { error } = await supabaseAdmin
      .from('content_pages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting content page:', error)
      return NextResponse.json({ error: 'Failed to delete content page' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Content page deleted successfully' })

  } catch (error) {
    console.error('Content deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
