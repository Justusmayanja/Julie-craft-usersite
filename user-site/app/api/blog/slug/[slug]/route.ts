import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock blog post')
      const mockPost = {
        id: 'mock-1',
        title: 'Sample Blog Post',
        slug: slug,
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
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    // Increment view count
    await supabaseAdmin
      .from('blog_posts')
      .update({ views: (post.views || 0) + 1 })
      .eq('id', post.id)

    return NextResponse.json({ post: { ...post, views: (post.views || 0) + 1 } })

  } catch (error) {
    console.error('Blog fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

