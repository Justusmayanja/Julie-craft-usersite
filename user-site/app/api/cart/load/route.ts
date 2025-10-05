import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const sessionId = searchParams.get('session_id')

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning empty cart')
      return NextResponse.json({
        cart_data: null,
        message: 'Database not configured'
      })
    }

    if (!userId && !sessionId) {
      return NextResponse.json({ error: 'User ID or Session ID required' }, { status: 400 })
    }

    // Build query to get cart for user or session
    let query = supabaseAdmin
      .from('user_carts')
      .select('cart_data, updated_at')

    if (userId) {
      query = query.eq('user_id', userId)
    } else if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Cart load error:', error)
      return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 })
    }

    return NextResponse.json({
      cart_data: data?.cart_data || null,
      updated_at: data?.updated_at || null
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
