import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cart_data, user_id, session_id } = body

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating cart save')
      return NextResponse.json({
        success: true,
        message: 'Cart saved successfully (simulated - database not configured)'
      })
    }

    if (!cart_data) {
      return NextResponse.json({ error: 'Cart data required' }, { status: 400 })
    }

    // Save cart to database
    const { error } = await supabaseAdmin
      .from('user_carts')
      .upsert({
        user_id: user_id || null,
        session_id: session_id || null,
        cart_data: cart_data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: user_id ? 'user_id' : 'session_id'
      })

    if (error) {
      console.error('Cart save error:', error)
      return NextResponse.json({ error: 'Failed to save cart' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Cart saved successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
