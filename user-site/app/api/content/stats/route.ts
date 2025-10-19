import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export interface ContentStats {
  totalPages: number
  publishedPages: number
  draftPages: number
  archivedPages: number
  homepagePages: number
  customPages: number
  recentPages: number
  pageTypes: Array<{ type: string; count: number }>
  recentActivity: Array<{ id: string; title: string; updated_at: string }>
}

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        totalPages: 6,
        publishedPages: 5,
        draftPages: 1,
        archivedPages: 0,
        homepagePages: 1,
        customPages: 1,
        recentPages: 2,
        pageTypes: [
          { type: 'homepage', count: 1 },
          { type: 'about', count: 1 },
          { type: 'contact', count: 1 },
          { type: 'privacy', count: 1 },
          { type: 'terms', count: 1 },
          { type: 'custom', count: 1 }
        ],
        recentActivity: [
          { id: 'CONTENT-006', title: 'Crafting Techniques Guide', updated_at: '2023-09-20T15:00:00Z' },
          { id: 'CONTENT-001', title: 'Welcome to JulieCraft', updated_at: '2023-09-15T10:00:00Z' },
          { id: 'CONTENT-002', title: 'About Our Story', updated_at: '2023-09-10T10:00:00Z' }
        ],
        message: 'Mock data - database not configured'
      })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found for content stats, returning mock data')
      return NextResponse.json({
        totalPages: 6,
        publishedPages: 5,
        draftPages: 1,
        archivedPages: 0,
        homepagePages: 1,
        customPages: 1,
        recentPages: 2,
        pageTypes: [
          { type: 'homepage', count: 1 },
          { type: 'about', count: 1 },
          { type: 'contact', count: 1 }
        ],
        recentActivity: [
          { id: 'CONTENT-001', title: 'Welcome to JulieCraft', updated_at: '2023-09-15T10:00:00Z' }
        ],
        message: 'Mock data - no authentication'
      })
    }

    const token = authHeader.substring(7)
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        console.log('Token verification failed for content stats, returning mock data')
        return NextResponse.json({
          totalPages: 3,
          publishedPages: 2,
          draftPages: 1,
          archivedPages: 0,
          homepagePages: 1,
          customPages: 0,
          recentPages: 1,
          pageTypes: [
            { type: 'homepage', count: 1 },
            { type: 'about', count: 1 }
          ],
          recentActivity: [],
          message: 'Mock data - authentication failed'
        })
      }
    } catch (error) {
      console.log('Token verification error for content stats, returning mock data')
      return NextResponse.json({
        totalPages: 2,
        publishedPages: 1,
        draftPages: 1,
        archivedPages: 0,
        homepagePages: 1,
        customPages: 0,
        recentPages: 1,
        pageTypes: [
          { type: 'homepage', count: 1 }
        ],
        recentActivity: [],
        message: 'Mock data - token verification error'
      })
    }

    // Get all content pages
    const { data: allPages, error: allPagesError } = await supabaseAdmin
      .from('content_pages')
      .select('*')

    if (allPagesError) {
      console.error('Error fetching content stats:', allPagesError)
      return NextResponse.json({
        totalPages: 6,
        publishedPages: 5,
        draftPages: 1,
        archivedPages: 0,
        homepagePages: 1,
        customPages: 1,
        recentPages: 2,
        pageTypes: [
          { type: 'homepage', count: 1 }
        ],
        recentActivity: [],
        message: 'Mock data - database error'
      })
    }

    const pages = allPages || []

    // Calculate stats
    const stats: ContentStats = {
      totalPages: pages.length,
      publishedPages: pages.filter(p => p.status === 'published').length,
      draftPages: pages.filter(p => p.status === 'draft').length,
      archivedPages: pages.filter(p => p.status === 'archived').length,
      homepagePages: pages.filter(p => p.type === 'homepage').length,
      customPages: pages.filter(p => p.type === 'custom').length,
      recentPages: pages.filter(p => {
        const dayAgo = new Date()
        dayAgo.setDate(dayAgo.getDate() - 7)
        return new Date(p.updated_at) > dayAgo
      }).length,
      pageTypes: [],
      recentActivity: pages
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          title: p.title,
          updated_at: p.updated_at
        }))
    }

    // Calculate page type counts
    const typeMap = new Map<string, number>()
    pages.forEach(page => {
      const count = typeMap.get(page.type) || 0
      typeMap.set(page.type, count + 1)
    })
    stats.pageTypes = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count
    }))

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Content stats API error:', error)
    return NextResponse.json({
      totalPages: 6,
      publishedPages: 5,
      draftPages: 1,
      archivedPages: 0,
      homepagePages: 1,
      customPages: 1,
      recentPages: 2,
      pageTypes: [],
      recentActivity: [],
      message: 'Mock data - API error'
    })
  }
}
