import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export interface ContentPage {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  type: 'homepage' | 'about' | 'contact' | 'privacy' | 'terms' | 'custom'
  status: 'published' | 'draft' | 'archived'
  meta_title?: string
  meta_description?: string
  featured_image?: string
  author_id: string
  author_name: string
  published_at?: string
  created_at: string
  updated_at: string
}

export interface ContentFilters {
  search?: string
  type?: string
  status?: 'published' | 'draft' | 'archived'
  author_id?: string
  sort_by?: 'created_at' | 'updated_at' | 'published_at' | 'title'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Mock content pages
const mockContentPages: ContentPage[] = [
  {
    id: 'CONTENT-001',
    title: 'Welcome to JulieCraft',
    slug: 'homepage',
    content: '<h1>Welcome to JulieCraft</h1><p>Discover authentic handmade crafts from the heart of Uganda...</p>',
    excerpt: 'Discover authentic handmade crafts from the heart of Uganda',
    type: 'homepage',
    status: 'published',
    meta_title: 'JulieCraft - Authentic Handmade Crafts from Uganda',
    meta_description: 'Shop authentic handmade crafts including pottery, jewelry, textiles, and woodwork from skilled Ugandan artisans.',
    featured_image: '/images/homepage-hero.jpg',
    author_id: 'admin-001',
    author_name: 'Julie Anderson',
    published_at: '2023-09-01T10:00:00Z',
    created_at: '2023-09-01T09:00:00Z',
    updated_at: '2023-09-15T10:00:00Z'
  },
  {
    id: 'CONTENT-002',
    title: 'About Our Story',
    slug: 'about',
    content: '<h1>Our Story</h1><p>JulieCraft was founded with a passion for preserving traditional Ugandan craftsmanship...</p>',
    excerpt: 'Learn about our mission to preserve traditional Ugandan craftsmanship',
    type: 'about',
    status: 'published',
    meta_title: 'About JulieCraft - Our Story and Mission',
    meta_description: 'Learn about JulieCraft\'s mission to preserve traditional Ugandan craftsmanship and support local artisans.',
    featured_image: '/images/about-hero.jpg',
    author_id: 'admin-001',
    author_name: 'Julie Anderson',
    published_at: '2023-09-02T10:00:00Z',
    created_at: '2023-09-02T09:00:00Z',
    updated_at: '2023-09-10T10:00:00Z'
  },
  {
    id: 'CONTENT-003',
    title: 'Contact Us',
    slug: 'contact',
    content: '<h1>Get in Touch</h1><p>We\'d love to hear from you. Contact us for any questions about our products...</p>',
    excerpt: 'Get in touch with us for any questions about our products',
    type: 'contact',
    status: 'published',
    meta_title: 'Contact JulieCraft - Get in Touch',
    meta_description: 'Contact JulieCraft for questions about our handmade products, custom orders, or general inquiries.',
    featured_image: '/images/contact-hero.jpg',
    author_id: 'admin-001',
    author_name: 'Julie Anderson',
    published_at: '2023-09-03T10:00:00Z',
    created_at: '2023-09-03T09:00:00Z',
    updated_at: '2023-09-05T10:00:00Z'
  },
  {
    id: 'CONTENT-004',
    title: 'Privacy Policy',
    slug: 'privacy',
    content: '<h1>Privacy Policy</h1><p>Your privacy is important to us. This policy explains how we collect and use your information...</p>',
    excerpt: 'Learn how we protect your privacy and handle your data',
    type: 'privacy',
    status: 'published',
    meta_title: 'Privacy Policy - JulieCraft',
    meta_description: 'JulieCraft\'s privacy policy explaining how we collect, use, and protect your personal information.',
    author_id: 'admin-001',
    author_name: 'Julie Anderson',
    published_at: '2023-09-04T10:00:00Z',
    created_at: '2023-09-04T09:00:00Z',
    updated_at: '2023-09-04T10:00:00Z'
  },
  {
    id: 'CONTENT-005',
    title: 'Terms of Service',
    slug: 'terms',
    content: '<h1>Terms of Service</h1><p>These terms govern your use of our website and services...</p>',
    excerpt: 'Terms and conditions for using our website and services',
    type: 'terms',
    status: 'published',
    meta_title: 'Terms of Service - JulieCraft',
    meta_description: 'Terms and conditions for using JulieCraft\'s website and services.',
    author_id: 'admin-001',
    author_name: 'Julie Anderson',
    published_at: '2023-09-05T10:00:00Z',
    created_at: '2023-09-05T09:00:00Z',
    updated_at: '2023-09-05T10:00:00Z'
  },
  {
    id: 'CONTENT-006',
    title: 'Crafting Techniques Guide',
    slug: 'crafting-techniques',
    content: '<h1>Crafting Techniques</h1><p>Learn about the traditional techniques used in our handmade products...</p>',
    excerpt: 'Discover the traditional techniques behind our handmade products',
    type: 'custom',
    status: 'draft',
    meta_title: 'Crafting Techniques - JulieCraft',
    meta_description: 'Learn about the traditional crafting techniques used in JulieCraft products.',
    featured_image: '/images/techniques-hero.jpg',
    author_id: 'admin-001',
    author_name: 'Julie Anderson',
    created_at: '2023-09-20T09:00:00Z',
    updated_at: '2023-09-20T15:00:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock content pages')
      
      const { searchParams } = new URL(request.url)
      const filters: ContentFilters = {
        search: searchParams.get('search') || undefined,
        type: searchParams.get('type') || undefined,
        status: searchParams.get('status') as any || undefined,
        author_id: searchParams.get('author_id') || undefined,
        sort_by: (searchParams.get('sort_by') as any) || 'created_at',
        sort_order: (searchParams.get('sort_order') as any) || 'desc',
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
        offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
      }
      
      let filtered = [...mockContentPages]
      
      // Apply filters
      if (filters.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter(page => 
          page.title.toLowerCase().includes(search) ||
          page.content.toLowerCase().includes(search) ||
          page.excerpt?.toLowerCase().includes(search)
        )
      }
      
      if (filters.type) {
        filtered = filtered.filter(page => page.type === filters.type)
      }
      
      if (filters.status) {
        filtered = filtered.filter(page => page.status === filters.status)
      }
      
      if (filters.author_id) {
        filtered = filtered.filter(page => page.author_id === filters.author_id)
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
        pages: paginated,
        total: filtered.length,
        limit: filters.limit,
        offset: filters.offset,
        message: 'Mock data - database not configured'
      })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found for content, returning mock data')
      return NextResponse.json({
        pages: mockContentPages.slice(0, 5),
        total: mockContentPages.length,
        limit: 5,
        offset: 0,
        message: 'Mock data - no authentication'
      })
    }

    const token = authHeader.substring(7)
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        console.log('Token verification failed for content, returning mock data')
        return NextResponse.json({
          pages: mockContentPages.slice(0, 3),
          total: mockContentPages.length,
          limit: 3,
          offset: 0,
          message: 'Mock data - authentication failed'
        })
      }
    } catch (error) {
      console.log('Token verification error for content, returning mock data')
      return NextResponse.json({
        pages: mockContentPages.slice(0, 3),
        total: mockContentPages.length,
        limit: 3,
        offset: 0,
        message: 'Mock data - token verification error'
      })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filters: ContentFilters = {
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') as any || undefined,
      author_id: searchParams.get('author_id') || undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (searchParams.get('sort_order') as any) || 'desc',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
    }

    // Build query
    let query = supabaseAdmin
      .from('content_pages')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`)
    }

    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.author_id) {
      query = query.eq('author_id', filters.author_id)
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        pages: mockContentPages.slice(0, 5),
        total: mockContentPages.length,
        limit: 5,
        offset: 0,
        message: 'Mock data - database error fallback'
      })
    }

    return NextResponse.json({
      pages: data || [],
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset
    })

  } catch (error) {
    console.error('Content API error:', error)
    return NextResponse.json({
      pages: mockContentPages.slice(0, 5),
      total: mockContentPages.length,
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
      console.log('Supabase not configured, simulating content page creation')
      const body = await request.json()
      const newPage: ContentPage = {
        id: `CONTENT-${Date.now()}`,
        ...body,
        author_name: body.author_name || 'Julie Anderson',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json({ page: newPage, message: 'Mock data - content page simulated' }, { status: 201 })
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

    // Create new content page
    const { data, error } = await supabaseAdmin
      .from('content_pages')
      .insert({
        ...body,
        author_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating content page:', error)
      return NextResponse.json({ error: 'Failed to create content page' }, { status: 500 })
    }

    return NextResponse.json({ page: data }, { status: 201 })

  } catch (error) {
    console.error('Content creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
