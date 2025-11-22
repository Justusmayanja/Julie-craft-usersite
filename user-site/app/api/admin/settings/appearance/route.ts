import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/admin/settings/appearance - Fetch appearance settings
export async function GET(request: NextRequest) {
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
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    // Fetch appearance settings
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('setting_type', 'appearance')
      .order('setting_key', { ascending: true })

    if (error) {
      console.error('Error fetching appearance settings:', error)
      return NextResponse.json({ error: 'Failed to fetch appearance settings' }, { status: 500 })
    }

    // Convert array to object
    const appearanceSettings: Record<string, any> = {}
    if (settings) {
      settings.forEach(setting => {
        appearanceSettings[setting.setting_key] = setting.setting_value
      })
    }

    return NextResponse.json({
      theme: {
        primaryColor: appearanceSettings.primary_color || '#3b82f6',
        secondaryColor: appearanceSettings.secondary_color || '#8b5cf6',
        accentColor: appearanceSettings.accent_color || '#f59e0b',
        mode: appearanceSettings.theme_mode || 'light'
      },
      branding: {
        logo: appearanceSettings.logo_url || '/julie-logo.jpeg',
        favicon: appearanceSettings.favicon_url || '/favicon.ico',
        siteName: appearanceSettings.site_name || 'JulieCraft',
        tagline: appearanceSettings.tagline || ''
      },
      layout: {
        headerStyle: appearanceSettings.header_style || 'default',
        footerStyle: appearanceSettings.footer_style || 'default',
        sidebarStyle: appearanceSettings.sidebar_style || 'default'
      },
      fonts: {
        headingFont: appearanceSettings.heading_font || 'Inter',
        bodyFont: appearanceSettings.body_font || 'Inter',
        fontSize: appearanceSettings.font_size || 'medium'
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/settings/appearance - Update appearance settings
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
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }

    const body = await request.json()

    // Prepare settings to upsert
    const settingsToUpsert = [
      {
        setting_key: 'primary_color',
        setting_value: body.theme?.primaryColor || '#3b82f6',
        setting_type: 'appearance',
        description: 'Primary theme color'
      },
      {
        setting_key: 'secondary_color',
        setting_value: body.theme?.secondaryColor || '#8b5cf6',
        setting_type: 'appearance',
        description: 'Secondary theme color'
      },
      {
        setting_key: 'accent_color',
        setting_value: body.theme?.accentColor || '#f59e0b',
        setting_type: 'appearance',
        description: 'Accent theme color'
      },
      {
        setting_key: 'theme_mode',
        setting_value: body.theme?.mode || 'light',
        setting_type: 'appearance',
        description: 'Theme mode (light/dark)'
      },
      {
        setting_key: 'logo_url',
        setting_value: body.branding?.logo || '/julie-logo.jpeg',
        setting_type: 'appearance',
        description: 'Site logo URL'
      },
      {
        setting_key: 'favicon_url',
        setting_value: body.branding?.favicon || '/favicon.ico',
        setting_type: 'appearance',
        description: 'Favicon URL'
      },
      {
        setting_key: 'site_name',
        setting_value: body.branding?.siteName || 'JulieCraft',
        setting_type: 'appearance',
        description: 'Site name'
      },
      {
        setting_key: 'tagline',
        setting_value: body.branding?.tagline || '',
        setting_type: 'appearance',
        description: 'Site tagline'
      },
      {
        setting_key: 'header_style',
        setting_value: body.layout?.headerStyle || 'default',
        setting_type: 'appearance',
        description: 'Header style'
      },
      {
        setting_key: 'footer_style',
        setting_value: body.layout?.footerStyle || 'default',
        setting_type: 'appearance',
        description: 'Footer style'
      },
      {
        setting_key: 'heading_font',
        setting_value: body.fonts?.headingFont || 'Inter',
        setting_type: 'appearance',
        description: 'Heading font family'
      },
      {
        setting_key: 'body_font',
        setting_value: body.fonts?.bodyFont || 'Inter',
        setting_type: 'appearance',
        description: 'Body font family'
      },
      {
        setting_key: 'font_size',
        setting_value: body.fonts?.fontSize || 'medium',
        setting_type: 'appearance',
        description: 'Base font size'
      }
    ]

    // Upsert all settings
    const { error: upsertError } = await supabaseAdmin
      .from('site_settings')
      .upsert(settingsToUpsert, {
        onConflict: 'setting_key'
      })

    if (upsertError) {
      console.error('Error updating appearance settings:', upsertError)
      return NextResponse.json({ error: 'Failed to update appearance settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Appearance settings updated successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

