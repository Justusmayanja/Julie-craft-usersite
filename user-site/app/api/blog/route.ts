import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  status: 'published' | 'draft' | 'scheduled'
  category: string
  author_id: string
  author_name: string
  publish_date: string | null
  scheduled_date: string | null
  featured_image: string | null
  featured: boolean
  views: number
  likes: number
  comments_count: number
  meta_title?: string
  meta_description?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface BlogFilters {
  search?: string
  status?: 'published' | 'draft' | 'scheduled'
  category?: string
  author_id?: string
  featured?: boolean
  sort_by?: 'created_at' | 'updated_at' | 'publish_date' | 'views' | 'title'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Mock blog posts
const mockBlogPosts: BlogPost[] = [
  {
    id: 'BLOG-001',
    title: 'The Art of Handmade Ceramics: A Journey Through Clay',
    slug: 'art-of-handmade-ceramics',
    content: '<p>Discover the ancient techniques and modern innovations that make our ceramic pieces truly special. From shaping the clay to the final glaze, each step is a testament to the artisan\'s skill...</p>',
    excerpt: 'Discover the ancient techniques and modern innovations that make our ceramic pieces truly special...',
    status: 'published',
    category: 'Craft Stories',
    author_id: 'admin-001',
    author_name: 'Julie Anderson',
    publish_date: '2023-09-15T10:00:00Z',
    scheduled_date: null,
    featured_image: '/blog/ceramics-blog.jpg',
    featured: true,
    views: 1240,
    likes: 89,
    comments_count: 12,
    meta_title: 'The Art of Handmade Ceramics - JulieCraft Blog',
    meta_description: 'Learn about the ancient techniques and modern innovations in ceramic crafting',
    tags: ['ceramics', 'handmade', 'craft'],
    created_at: '2023-09-15T09:00:00Z',
    updated_at: '2023-09-15T10:00:00Z'
  },
  {
    id: 'BLOG-002',
    title: 'Sustainable Crafting: Our Commitment to the Environment',
    slug: 'sustainable-crafting',
    content: '<p>Learn about our eco-friendly practices and commitment to sustainable artisanal creation. We source materials responsibly and minimize waste...</p>',
    excerpt: 'Learn about our eco-friendly practices and commitment to sustainable artisanal creation...',
    status: 'published',
    category: 'Sustainability',
    author_id: 'admin-001',
    author_name: 'Julie Anderson',
    publish_date: '2023-09-10T10:00:00Z',
    scheduled_date: null,
    featured_image: '/blog/sustainability-blog.jpg',
    featured: false,
    views: 890,
    likes: 67,
    comments_count: 8,
    meta_title: 'Sustainable Crafting - JulieCraft Blog',
    meta_description: 'Our commitment to eco-friendly and sustainable craft practices',
    tags: ['sustainability', 'environment', 'eco-friendly'],
    created_at: '2023-09-10T09:00:00Z',
    updated_at: '2023-09-11T10:00:00Z'
  },
  {
    id: 'BLOG-003',
    title: 'Behind the Scenes: A Day in the JulieCraft Studio',
    slug: 'behind-the-scenes-studio',
    content: '<p>Take a peek into our creative process and see how each piece comes to life. From morning preparation to the final touches...</p>',
    excerpt: 'Take a peek into our creative process and see how each piece comes to life...',
    status: 'draft',
    category: 'Studio Life',
    author_id: 'admin-001',
    author_name: 'Julie Anderson',
    publish_date: null,
    scheduled_date: null,
    featured_image: '/blog/studio-blog.jpg',
    featured: false,
    views: 0,
    likes: 0,
    comments_count: 0,
    meta_title: 'Behind the Scenes at JulieCraft Studio',
    meta_description: 'A day in the life at our craft studio',
    tags: ['studio', 'behind-the-scenes', 'process'],
    created_at: '2023-09-12T09:00:00Z',
    updated_at: '2023-09-12T15:00:00Z'
  },
  {
    id: 'BLOG-004',
    title: 'Traditional Weaving Techniques of Uganda',
    slug: 'traditional-weaving-techniques',
    content: '<p>Explore the rich history of Ugandan weaving and how these techniques are preserved in our modern textiles...</p>',
    excerpt: 'Explore the rich history of Ugandan weaving and how these techniques are preserved...',
    status: 'published',
    category: 'Craft Stories',
    author_id: 'admin-001',
    author_name: 'Julie Anderson',
    publish_date: '2023-09-05T10:00:00Z',
    scheduled_date: null,
    featured_image: '/blog/weaving-blog.jpg',
    featured: true,
    views: 1567,
    likes: 132,
    comments_count: 23,
    meta_title: 'Traditional Weaving Techniques of Uganda',
    meta_description: 'Discover the ancient weaving traditions of Uganda',
    tags: ['weaving', 'textiles', 'uganda', 'tradition'],
    created_at: '2023-09-05T09:00:00Z',
    updated_at: '2023-09-05T10:00:00Z'
  },
  {
    id: 'BLOG-005',
    title: 'Gift Guide: Unique Handmade Presents for Every Occasion',
    slug: 'gift-guide-handmade-presents',
    content: '<p>Looking for the perfect gift? Our handmade crafts make memorable presents that show you care...</p>',
    excerpt: 'Looking for the perfect gift? Our handmade crafts make memorable presents...',
    status: 'scheduled',
    category: 'Gift Ideas',
    author_id: 'admin-001',
    author_name: 'Julie Anderson',
    publish_date: null,
    scheduled_date: '2024-12-01T10:00:00Z',
    featured_image: '/blog/gift-guide-blog.jpg',
    featured: false,
    views: 0,
    likes: 0,
    comments_count: 0,
    meta_title: 'Handmade Gift Guide - JulieCraft',
    meta_description: 'Unique handmade presents for every occasion',
    tags: ['gifts', 'guide', 'shopping'],
    created_at: '2023-11-15T09:00:00Z',
    updated_at: '2023-11-15T10:00:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock blog posts')
      
      const { searchParams } = new URL(request.url)
      const filters: BlogFilters = {
        search: searchParams.get('search') || undefined,
        status: searchParams.get('status') as any || undefined,
        category: searchParams.get('category') || undefined,
        author_id: searchParams.get('author_id') || undefined,
        featured: searchParams.get('featured') === 'true' ? true : undefined,
        sort_by: (searchParams.get('sort_by') as any) || 'created_at',
        sort_order: (searchParams.get('sort_order') as any) || 'desc',
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
        offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
      }
      
      let filtered = [...mockBlogPosts]
      
      // Apply filters
      if (filters.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter(post => 
          post.title.toLowerCase().includes(search) ||
          post.excerpt.toLowerCase().includes(search) ||
          post.content.toLowerCase().includes(search)
        )
      }
      
      if (filters.status) {
        filtered = filtered.filter(post => post.status === filters.status)
      }
      
      if (filters.category) {
        filtered = filtered.filter(post => post.category === filters.category)
      }
      
      if (filters.author_id) {
        filtered = filtered.filter(post => post.author_id === filters.author_id)
      }
      
      if (filters.featured !== undefined) {
        filtered = filtered.filter(post => post.featured === filters.featured)
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        const aVal = a[filters.sort_by!] || ''
        const bVal = b[filters.sort_by!] || ''
        if (filters.sort_order === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
      
      // Apply pagination
      const paginated = filtered.slice(filters.offset, filters.offset! + filters.limit!)
      
      return NextResponse.json({
        posts: paginated,
        total: filtered.length,
        limit: filters.limit,
        offset: filters.offset,
        message: 'Mock data - database not configured'
      })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const requestedStatus = searchParams.get('status')
    const isPublicRequest = requestedStatus === 'published'
    
    // For published posts, allow public access without authentication
    // For admin operations (drafts, all posts), require authentication
    let isAuthenticated = false
    if (!isPublicRequest) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No authorization header found for blog, returning published posts only')
        // Return only published posts for unauthenticated requests
        const { data, error: queryError } = await supabaseAdmin
          .from('blog_posts')
          .select('*', { count: 'exact' })
          .eq('status', 'published')
          .order('publish_date', { ascending: false })
          .limit(50)
        
        if (queryError || !data) {
          return NextResponse.json({
            posts: mockBlogPosts.filter(p => p.status === 'published').slice(0, 5),
            total: mockBlogPosts.filter(p => p.status === 'published').length,
            limit: 5,
            offset: 0,
            message: 'Mock data - no authentication (public posts only)'
          })
        }
        
        return NextResponse.json({
          posts: data || [],
          total: data?.length || 0,
          limit: 50,
          offset: 0
        })
      }

      const token = authHeader.substring(7)
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
        if (error || !user) {
          console.log('Token verification failed for blog, returning published posts only')
          // Return only published posts for failed auth
          const { data, error: queryError } = await supabaseAdmin
            .from('blog_posts')
            .select('*', { count: 'exact' })
            .eq('status', 'published')
            .order('publish_date', { ascending: false })
            .limit(50)
          
          if (queryError || !data) {
            return NextResponse.json({
              posts: mockBlogPosts.filter(p => p.status === 'published').slice(0, 5),
              total: mockBlogPosts.filter(p => p.status === 'published').length,
              limit: 5,
              offset: 0,
              message: 'Mock data - authentication failed'
            })
          }
          
          return NextResponse.json({
            posts: data || [],
            total: data?.length || 0,
            limit: 50,
            offset: 0
          })
        }
        isAuthenticated = true
      } catch (error) {
        console.log('Token verification error for blog, returning published posts only')
        // Try to return published posts even on auth error
        const { data, error: queryError } = await supabaseAdmin
          .from('blog_posts')
          .select('*', { count: 'exact' })
          .eq('status', 'published')
          .order('publish_date', { ascending: false })
          .limit(50)
        
        if (queryError || !data) {
          return NextResponse.json({
            posts: mockBlogPosts.filter(p => p.status === 'published').slice(0, 5),
            total: mockBlogPosts.filter(p => p.status === 'published').length,
            limit: 5,
            offset: 0,
            message: 'Mock data - token verification error'
          })
        }
        
        return NextResponse.json({
          posts: data || [],
          total: data?.length || 0,
          limit: 50,
          offset: 0
        })
      }
    }
    const filters: BlogFilters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as any || undefined,
      category: searchParams.get('category') || undefined,
      author_id: searchParams.get('author_id') || undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (searchParams.get('sort_order') as any) || 'desc',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
    }

    // Build query
    let query = supabaseAdmin
      .from('blog_posts')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.author_id) {
      query = query.eq('author_id', filters.author_id)
    }

    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured)
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        posts: mockBlogPosts.slice(0, 5),
        total: mockBlogPosts.length,
        limit: 5,
        offset: 0,
        message: 'Mock data - database error fallback'
      })
    }

    return NextResponse.json({
      posts: data || [],
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset
    })

  } catch (error) {
    console.error('Blog API error:', error)
    return NextResponse.json({
      posts: mockBlogPosts.slice(0, 5),
      total: mockBlogPosts.length,
      limit: 5,
      offset: 0,
      message: 'Mock data - API error'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating blog post creation')
      const body = await request.json()
      const newPost: BlogPost = {
        id: `BLOG-${Date.now()}`,
        ...body,
        author_name: body.author_name || 'Julie Anderson',
        views: 0,
        likes: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json({ post: newPost, message: 'Mock data - blog post simulated' }, { status: 201 })
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

    // Create new blog post
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        ...body,
        author_id: user.id,
        views: 0,
        likes: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating blog post:', error)
      return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 })
    }

    return NextResponse.json({ post: data }, { status: 201 })

  } catch (error) {
    console.error('Blog creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

