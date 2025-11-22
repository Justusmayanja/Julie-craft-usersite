import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/admin/settings/business - Fetch business settings
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

    // Fetch business settings from site_settings table
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('setting_type', 'business')
      .order('setting_key', { ascending: true })

    if (error) {
      console.error('Error fetching business settings:', error)
      return NextResponse.json({ error: 'Failed to fetch business settings' }, { status: 500 })
    }

    // Convert array to object for easier access
    const businessSettings: Record<string, any> = {}
    if (settings) {
      settings.forEach(setting => {
        businessSettings[setting.setting_key] = setting.setting_value
      })
    }

    // Return with defaults if no settings exist
    return NextResponse.json({
      businessName: businessSettings.business_name || 'JulieCraft',
      email: businessSettings.business_email || 'julie@juliecraft.com',
      phone: businessSettings.business_phone || '',
      address: businessSettings.business_address || '',
      city: businessSettings.business_city || '',
      state: businessSettings.business_state || '',
      zipCode: businessSettings.business_zip_code || '',
      country: businessSettings.business_country || 'United States',
      website: businessSettings.business_website || 'https://juliecraft.com',
      description: businessSettings.business_description || '',
      logo: businessSettings.logo_url || '/julie-logo.jpeg',
      timezone: businessSettings.timezone || 'America/Los_Angeles',
      currency: businessSettings.currency || 'UGX'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/settings/business - Update business settings
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
        setting_key: 'business_name',
        setting_value: body.businessName || '',
        setting_type: 'business',
        description: 'Business name'
      },
      {
        setting_key: 'business_email',
        setting_value: body.email || '',
        setting_type: 'business',
        description: 'Business email address'
      },
      {
        setting_key: 'business_phone',
        setting_value: body.phone || '',
        setting_type: 'business',
        description: 'Business phone number'
      },
      {
        setting_key: 'business_address',
        setting_value: body.address || '',
        setting_type: 'business',
        description: 'Business street address'
      },
      {
        setting_key: 'business_city',
        setting_value: body.city || '',
        setting_type: 'business',
        description: 'Business city'
      },
      {
        setting_key: 'business_state',
        setting_value: body.state || '',
        setting_type: 'business',
        description: 'Business state/province'
      },
      {
        setting_key: 'business_zip_code',
        setting_value: body.zipCode || '',
        setting_type: 'business',
        description: 'Business ZIP/postal code'
      },
      {
        setting_key: 'business_country',
        setting_value: body.country || '',
        setting_type: 'business',
        description: 'Business country'
      },
      {
        setting_key: 'business_website',
        setting_value: body.website || '',
        setting_type: 'business',
        description: 'Business website URL'
      },
      {
        setting_key: 'business_description',
        setting_value: body.description || '',
        setting_type: 'business',
        description: 'Business description'
      },
      {
        setting_key: 'timezone',
        setting_value: body.timezone || 'America/Los_Angeles',
        setting_type: 'business',
        description: 'Business timezone'
      },
      {
        setting_key: 'currency',
        setting_value: body.currency || 'UGX',
        setting_type: 'business',
        description: 'Default currency'
      }
    ]

    // Upsert all settings
    const { error: upsertError } = await supabaseAdmin
      .from('site_settings')
      .upsert(settingsToUpsert, {
        onConflict: 'setting_key'
      })

    if (upsertError) {
      console.error('Error updating business settings:', upsertError)
      return NextResponse.json({ error: 'Failed to update business settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Business settings updated successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

