import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { Category } from '@/lib/types/product'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning empty categories array')
      return NextResponse.json({
        categories: [],
        total: 0,
        limit: 50,
        offset: 0,
        message: 'Database not configured - using fallback data'
      })
    }
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0

    // Build query - only fetch active categories
    let query = supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({
      categories: data || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
