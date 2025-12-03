import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

/**
 * Cleanup expired reservations
 * This endpoint can be called by a cron job or manually
 * Releases expired reservations and marks them as expired
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 })
    }

    // Optional: Check for admin authentication or cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET

    // Allow access if:
    // 1. Valid cron secret is provided
    // 2. Or in development mode (for testing)
    if (expectedSecret && cronSecret !== expectedSecret && process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const now = new Date().toISOString()

    // Find all expired active reservations
    const { data: expiredReservations, error: fetchError } = await supabaseAdmin
      .from('order_item_reservations')
      .select('id, product_id, reserved_quantity, expires_at')
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', now)

    if (fetchError) {
      console.error('Error fetching expired reservations:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch expired reservations',
        details: fetchError.message
      }, { status: 500 })
    }

    if (!expiredReservations || expiredReservations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired reservations found',
        expired_count: 0,
        released_count: 0
      })
    }

    const expiredIds = expiredReservations.map(r => r.id)

    // Mark expired reservations as expired (not just released)
    const { error: updateError } = await supabaseAdmin
      .from('order_item_reservations')
      .update({
        status: 'expired',
        released_at: now,
        notes: `Automatically expired at ${now}`
      })
      .in('id', expiredIds)
      .eq('status', 'active')

    if (updateError) {
      console.error('Error updating expired reservations:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update expired reservations',
        details: updateError.message
      }, { status: 500 })
    }

    console.log(`Cleaned up ${expiredIds.length} expired reservations`)

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${expiredIds.length} expired reservations`,
      expired_count: expiredIds.length,
      released_count: expiredIds.length,
      reservation_ids: expiredIds
    })

  } catch (error) {
    console.error('Reservation cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET endpoint to check expired reservations (for monitoring)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 })
    }

    const now = new Date().toISOString()

    // Count expired reservations
    const { count, error: countError } = await supabaseAdmin
      .from('order_item_reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', now)

    if (countError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to count expired reservations'
      }, { status: 500 })
    }

    // Count all active reservations
    const { count: activeCount, error: activeError } = await supabaseAdmin
      .from('order_item_reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    return NextResponse.json({
      success: true,
      expired_count: count || 0,
      active_count: activeCount || 0,
      timestamp: now
    })

  } catch (error) {
    console.error('Reservation status check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

