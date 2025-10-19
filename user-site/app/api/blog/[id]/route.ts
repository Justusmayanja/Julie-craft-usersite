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
      console.log('Supabase not configured, returning mock blog post')
      const mockPost = {
        id: id,
        title: 'Sample Blog Post',
        slug: 'sample-blog-post',
        content: '<p>This is a sample blog post content...</p>',
        excerpt: 'This is a sample blog post...',
        status: 'published',
        category: 'Craft Stories',
        author_id: 'admin-001',
        author_name: 'Julie Anderson',
        publish_date: new Date().toISOString(),
        scheduled_date: null,
        featured_image: '/blog/sample-blog.jpg',
        featured: false,
        views: 0,
        likes: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json({ post: mockPost, message: 'Mock data - database not configured' })
    }

    // For public access (no auth required for published posts)
    const { data: post, error } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    // Increment view count
    await supabaseAdmin
      .from('blog_posts')
      .update({ views: post.views + 1 })
      .eq('id', id)

    return NextResponse.json({ post: { ...post, views: post.views + 1 } })

  } catch (error) {
    console.error('Blog fetch error:', error)
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
      console.log('Supabase not configured, simulating blog post update')
      const body = await request.json()
      return NextResponse.json({ 
        post: { id, ...body, updated_at: new Date().toISOString() }, 
        message: 'Mock data - blog post update simulated' 
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

    // Update blog post
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating blog post:', error)
      return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 })
    }

    return NextResponse.json({ post: data })

  } catch (error) {
    console.error('Blog update error:', error)
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
      console.log('Supabase not configured, simulating blog post deletion')
      return NextResponse.json({ message: 'Blog post deleted (simulated)' })
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

    // Delete blog post
    const { error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting blog post:', error)
      return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Blog post deleted successfully' })

  } catch (error) {
    console.error('Blog deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

