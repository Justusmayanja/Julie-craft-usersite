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
    // Handle JSONB values - they may be stored as JSON strings or already parsed
    const settings: Record<string, any> = {}
    if (data) {
      data.forEach(setting => {
        let value = setting.setting_value
        
        // If value is a string that looks like JSON, try to parse it
        if (typeof value === 'string' && (value.startsWith('"') || value.startsWith('{') || value.startsWith('['))) {
          try {
            value = JSON.parse(value)
          } catch {
            // If parsing fails, use the string as-is
          }
        }
        
        settings[setting.setting_key] = {
          value: value,
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

    // Verify admin authentication - check both header and cookies
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('julie-crafts-token')?.value
    
    let token: string | null = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
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
    // Handle JSONB values - ensure they're stored correctly
    const updatePromises = Object.entries(settings).map(async ([key, value]: [string, any]) => {
      let settingValue = value.value !== undefined ? value.value : value
      
      // If the value is a string, number, boolean, or null, store it as JSONB
      // JSONB will handle the conversion automatically
      const updateData: any = {
        setting_key: key,
        setting_value: settingValue,
        setting_type: value.type || 'general',
        description: value.description || null,
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabaseAdmin
        .from('site_settings')
        .upsert(updateData, {
          onConflict: 'setting_key'
        })
      
      if (error) {
        console.error(`Error updating setting ${key}:`, error)
        throw error
      }
    })

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

