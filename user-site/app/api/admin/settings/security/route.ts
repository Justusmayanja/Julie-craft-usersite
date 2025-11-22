import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/admin/settings/security - Fetch security settings
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

    // Fetch security settings
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('setting_type', 'security')
      .order('setting_key', { ascending: true })

    if (error) {
      console.error('Error fetching security settings:', error)
      return NextResponse.json({ error: 'Failed to fetch security settings' }, { status: 500 })
    }

    // Convert array to object
    const securitySettings: Record<string, any> = {}
    if (settings) {
      settings.forEach(setting => {
        securitySettings[setting.setting_key] = setting.setting_value
      })
    }

    return NextResponse.json({
      password: {
        minLength: parseInt(securitySettings.password_min_length || '8'),
        requireUppercase: securitySettings.password_require_uppercase === 'true' || true,
        requireLowercase: securitySettings.password_require_lowercase === 'true' || true,
        requireNumbers: securitySettings.password_require_numbers === 'true' || true,
        requireSpecialChars: securitySettings.password_require_special === 'true' || false,
        expirationDays: parseInt(securitySettings.password_expiration_days || '0')
      },
      session: {
        timeoutMinutes: parseInt(securitySettings.session_timeout_minutes || '30'),
        maxConcurrentSessions: parseInt(securitySettings.max_concurrent_sessions || '3')
      },
      twoFactor: {
        enabled: securitySettings.two_factor_enabled === 'true' || false,
        requiredForAdmin: securitySettings.two_factor_required_admin === 'true' || false
      },
      api: {
        rateLimitEnabled: securitySettings.api_rate_limit_enabled === 'true' || true,
        rateLimitRequests: parseInt(securitySettings.api_rate_limit_requests || '100'),
        rateLimitWindow: parseInt(securitySettings.api_rate_limit_window || '60')
      },
      ipWhitelist: {
        enabled: securitySettings.ip_whitelist_enabled === 'true' || false,
        addresses: securitySettings.ip_whitelist_addresses ? JSON.parse(securitySettings.ip_whitelist_addresses) : []
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/settings/security - Update security settings
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
        setting_key: 'password_min_length',
        setting_value: String(body.password?.minLength || 8),
        setting_type: 'security',
        description: 'Minimum password length'
      },
      {
        setting_key: 'password_require_uppercase',
        setting_value: String(body.password?.requireUppercase || true),
        setting_type: 'security',
        description: 'Require uppercase in password'
      },
      {
        setting_key: 'password_require_lowercase',
        setting_value: String(body.password?.requireLowercase || true),
        setting_type: 'security',
        description: 'Require lowercase in password'
      },
      {
        setting_key: 'password_require_numbers',
        setting_value: String(body.password?.requireNumbers || true),
        setting_type: 'security',
        description: 'Require numbers in password'
      },
      {
        setting_key: 'password_require_special',
        setting_value: String(body.password?.requireSpecialChars || false),
        setting_type: 'security',
        description: 'Require special characters in password'
      },
      {
        setting_key: 'session_timeout_minutes',
        setting_value: String(body.session?.timeoutMinutes || 30),
        setting_type: 'security',
        description: 'Session timeout in minutes'
      },
      {
        setting_key: 'max_concurrent_sessions',
        setting_value: String(body.session?.maxConcurrentSessions || 3),
        setting_type: 'security',
        description: 'Maximum concurrent sessions per user'
      },
      {
        setting_key: 'two_factor_enabled',
        setting_value: String(body.twoFactor?.enabled || false),
        setting_type: 'security',
        description: 'Two-factor authentication enabled'
      },
      {
        setting_key: 'two_factor_required_admin',
        setting_value: String(body.twoFactor?.requiredForAdmin || false),
        setting_type: 'security',
        description: 'Two-factor required for admin users'
      },
      {
        setting_key: 'api_rate_limit_enabled',
        setting_value: String(body.api?.rateLimitEnabled || true),
        setting_type: 'security',
        description: 'API rate limiting enabled'
      },
      {
        setting_key: 'api_rate_limit_requests',
        setting_value: String(body.api?.rateLimitRequests || 100),
        setting_type: 'security',
        description: 'API rate limit requests per window'
      },
      {
        setting_key: 'api_rate_limit_window',
        setting_value: String(body.api?.rateLimitWindow || 60),
        setting_type: 'security',
        description: 'API rate limit window in seconds'
      },
      {
        setting_key: 'ip_whitelist_enabled',
        setting_value: String(body.ipWhitelist?.enabled || false),
        setting_type: 'security',
        description: 'IP whitelist enabled'
      },
      {
        setting_key: 'ip_whitelist_addresses',
        setting_value: JSON.stringify(body.ipWhitelist?.addresses || []),
        setting_type: 'security',
        description: 'IP whitelist addresses'
      }
    ]

    // Upsert all settings
    const { error: upsertError } = await supabaseAdmin
      .from('site_settings')
      .upsert(settingsToUpsert, {
        onConflict: 'setting_key'
      })

    if (upsertError) {
      console.error('Error updating security settings:', upsertError)
      return NextResponse.json({ error: 'Failed to update security settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Security settings updated successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

