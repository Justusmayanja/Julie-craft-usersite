import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/site-content/settings - Fetch all settings
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let query = supabaseAdmin
      .from('site_settings')
      .select('*')
      .order('setting_key', { ascending: true })

    if (type) {
      query = query.eq('setting_type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Convert array to object for easier access
    const settings: Record<string, any> = {}
    if (data) {
      data.forEach(setting => {
        settings[setting.setting_key] = {
          value: setting.setting_value,
          type: setting.setting_type,
          description: setting.description
        }
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/site-content/settings - Update settings (bulk)
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (!user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 })
    }

    // Update each setting
    const updates = Object.entries(settings).map(([key, value]: [string, any]) => {
      return supabaseAdmin
        .from('site_settings')
        .upsert({
          setting_key: key,
          setting_value: value.value || value,
          setting_type: value.type || 'general',
          description: value.description || null
        }, {
          onConflict: 'setting_key'
        })
    })

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

