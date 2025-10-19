import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  scheduledPosts: number
  totalViews: number
  totalLikes: number
  totalComments: number
  featuredPosts: number
  categories: Array<{ category: string; count: number }>
  recentPosts: number
  popularPosts: Array<{ id: string; title: string; views: number }>
}

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        totalPosts: 5,
        publishedPosts: 3,
        draftPosts: 1,
        scheduledPosts: 1,
        totalViews: 3697,
        totalLikes: 288,
        totalComments: 43,
        featuredPosts: 2,
        categories: [
          { category: 'Craft Stories', count: 2 },
          { category: 'Sustainability', count: 1 },
          { category: 'Studio Life', count: 1 },
          { category: 'Gift Ideas', count: 1 }
        ],
        recentPosts: 2,
        popularPosts: [
          { id: 'BLOG-004', title: 'Traditional Weaving Techniques of Uganda', views: 1567 },
          { id: 'BLOG-001', title: 'The Art of Handmade Ceramics', views: 1240 },
          { id: 'BLOG-002', title: 'Sustainable Crafting', views: 890 }
        ],
        message: 'Mock data - database not configured'
      })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found for blog stats, returning mock data')
      return NextResponse.json({
        totalPosts: 5,
        publishedPosts: 3,
        draftPosts: 1,
        scheduledPosts: 1,
        totalViews: 3697,
        totalLikes: 288,
        totalComments: 43,
        featuredPosts: 2,
        categories: [
          { category: 'Craft Stories', count: 2 },
          { category: 'Sustainability', count: 1 }
        ],
        recentPosts: 2,
        popularPosts: [
          { id: 'BLOG-001', title: 'The Art of Handmade Ceramics', views: 1240 }
        ],
        message: 'Mock data - no authentication'
      })
    }

    const token = authHeader.substring(7)
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        console.log('Token verification failed for blog stats, returning mock data')
        return NextResponse.json({
          totalPosts: 3,
          publishedPosts: 2,
          draftPosts: 1,
          scheduledPosts: 0,
          totalViews: 2130,
          totalLikes: 156,
          totalComments: 20,
          featuredPosts: 1,
          categories: [
            { category: 'Craft Stories', count: 2 }
          ],
          recentPosts: 1,
          popularPosts: [],
          message: 'Mock data - authentication failed'
        })
      }
    } catch (error) {
      console.log('Token verification error for blog stats, returning mock data')
      return NextResponse.json({
        totalPosts: 2,
        publishedPosts: 1,
        draftPosts: 1,
        scheduledPosts: 0,
        totalViews: 1240,
        totalLikes: 89,
        totalComments: 12,
        featuredPosts: 1,
        categories: [],
        recentPosts: 1,
        popularPosts: [],
        message: 'Mock data - token verification error'
      })
    }

    // Get all posts
    const { data: allPosts, error: allPostsError } = await supabaseAdmin
      .from('blog_posts')
      .select('*')

    if (allPostsError) {
      console.error('Error fetching blog stats:', allPostsError)
      return NextResponse.json({
        totalPosts: 5,
        publishedPosts: 3,
        draftPosts: 1,
        scheduledPosts: 1,
        totalViews: 3697,
        totalLikes: 288,
        totalComments: 43,
        featuredPosts: 2,
        categories: [
          { category: 'Craft Stories', count: 2 }
        ],
        recentPosts: 2,
        popularPosts: [],
        message: 'Mock data - database error'
      })
    }

    const posts = allPosts || []

    // Calculate stats
    const stats: BlogStats = {
      totalPosts: posts.length,
      publishedPosts: posts.filter(p => p.status === 'published').length,
      draftPosts: posts.filter(p => p.status === 'draft').length,
      scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
      totalViews: posts.reduce((sum, p) => sum + (p.views || 0), 0),
      totalLikes: posts.reduce((sum, p) => sum + (p.likes || 0), 0),
      totalComments: posts.reduce((sum, p) => sum + (p.comments_count || 0), 0),
      featuredPosts: posts.filter(p => p.featured).length,
      categories: [],
      recentPosts: posts.filter(p => {
        const dayAgo = new Date()
        dayAgo.setDate(dayAgo.getDate() - 7)
        return new Date(p.created_at) > dayAgo
      }).length,
      popularPosts: posts
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          title: p.title,
          views: p.views || 0
        }))
    }

    // Calculate category counts
    const categoryMap = new Map<string, number>()
    posts.forEach(post => {
      const count = categoryMap.get(post.category) || 0
      categoryMap.set(post.category, count + 1)
    })
    stats.categories = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    }))

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Blog stats API error:', error)
    return NextResponse.json({
      totalPosts: 5,
      publishedPosts: 3,
      draftPosts: 1,
      scheduledPosts: 1,
      totalViews: 3697,
      totalLikes: 288,
      totalComments: 43,
      featuredPosts: 2,
      categories: [],
      recentPosts: 2,
      popularPosts: [],
      message: 'Mock data - API error'
    })
  }
}

