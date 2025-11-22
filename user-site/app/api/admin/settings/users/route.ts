import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/admin/settings/users - Fetch users and permissions settings
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

    // Fetch all admin users
    const { data: adminUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, first_name, last_name, is_admin, created_at, avatar_url')
      .eq('is_admin', true)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching admin users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Fetch permission settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('setting_type', 'permissions')
      .order('setting_key', { ascending: true })

    if (settingsError) {
      console.error('Error fetching permission settings:', settingsError)
    }

    // Convert settings array to object
    const permissionSettings: Record<string, any> = {}
    if (settings) {
      settings.forEach(setting => {
        permissionSettings[setting.setting_key] = setting.setting_value
      })
    }

    return NextResponse.json({
      users: adminUsers || [],
      permissions: {
        allowUserRegistration: permissionSettings.allow_user_registration === 'true' || true,
        requireEmailVerification: permissionSettings.require_email_verification === 'true' || false,
        defaultUserRole: permissionSettings.default_user_role || 'customer',
        adminRoles: permissionSettings.admin_roles ? JSON.parse(permissionSettings.admin_roles) : ['super_admin', 'admin', 'manager']
      },
      roles: permissionSettings.roles ? JSON.parse(permissionSettings.roles) : [
        {
          name: 'super_admin',
          label: 'Super Admin',
          permissions: ['all']
        },
        {
          name: 'admin',
          label: 'Admin',
          permissions: ['products', 'orders', 'customers', 'analytics']
        },
        {
          name: 'manager',
          label: 'Manager',
          permissions: ['orders', 'customers']
        }
      ]
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/settings/users - Update users and permissions settings
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
        setting_key: 'allow_user_registration',
        setting_value: String(body.permissions?.allowUserRegistration || true),
        setting_type: 'permissions',
        description: 'Allow user registration'
      },
      {
        setting_key: 'require_email_verification',
        setting_value: String(body.permissions?.requireEmailVerification || false),
        setting_type: 'permissions',
        description: 'Require email verification'
      },
      {
        setting_key: 'default_user_role',
        setting_value: body.permissions?.defaultUserRole || 'customer',
        setting_type: 'permissions',
        description: 'Default user role'
      },
      {
        setting_key: 'admin_roles',
        setting_value: JSON.stringify(body.permissions?.adminRoles || []),
        setting_type: 'permissions',
        description: 'Admin role names'
      },
      {
        setting_key: 'roles',
        setting_value: JSON.stringify(body.roles || []),
        setting_type: 'permissions',
        description: 'User roles and permissions'
      }
    ]

    // Upsert all settings
    const { error: upsertError } = await supabaseAdmin
      .from('site_settings')
      .upsert(settingsToUpsert, {
        onConflict: 'setting_key'
      })

    if (upsertError) {
      console.error('Error updating user settings:', upsertError)
      return NextResponse.json({ error: 'Failed to update user settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'User and permission settings updated successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

