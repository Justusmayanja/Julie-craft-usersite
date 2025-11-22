import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/admin/settings/shipping - Fetch shipping settings
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

    // Fetch shipping settings
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('setting_type', 'shipping')
      .order('setting_key', { ascending: true })

    if (error) {
      console.error('Error fetching shipping settings:', error)
      return NextResponse.json({ error: 'Failed to fetch shipping settings' }, { status: 500 })
    }

    // Convert array to object
    const shippingSettings: Record<string, any> = {}
    if (settings) {
      settings.forEach(setting => {
        shippingSettings[setting.setting_key] = setting.setting_value
      })
    }

    // Fetch shipping zones if they exist in a separate table
    // For now, return default structure
    return NextResponse.json({
      zones: shippingSettings.shipping_zones ? JSON.parse(shippingSettings.shipping_zones) : [
        {
          id: 'domestic',
          name: 'Domestic Shipping',
          countries: ['US'],
          rates: {
            min: 23400,
            max: 50700,
            currency: 'UGX'
          },
          status: 'active'
        },
        {
          id: 'international',
          name: 'International Shipping',
          countries: ['CA', 'GB', 'AU', 'FR', 'DE'],
          rates: {
            min: 62400,
            max: 140400,
            currency: 'UGX'
          },
          status: 'limited'
        }
      ],
      packaging: {
        defaultBoxSize: shippingSettings.default_box_size || 'medium',
        packagingMaterial: shippingSettings.packaging_material || 'eco',
        weightLimit: shippingSettings.weight_limit || '5',
        dimensionsLimit: shippingSettings.dimensions_limit || '12x12x12'
      },
      freeShippingThreshold: shippingSettings.free_shipping_threshold || null,
      handlingFee: shippingSettings.handling_fee || 0
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/settings/shipping - Update shipping settings
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
        setting_key: 'shipping_zones',
        setting_value: JSON.stringify(body.zones || []),
        setting_type: 'shipping',
        description: 'Shipping zones configuration'
      },
      {
        setting_key: 'default_box_size',
        setting_value: body.packaging?.defaultBoxSize || 'medium',
        setting_type: 'shipping',
        description: 'Default packaging box size'
      },
      {
        setting_key: 'packaging_material',
        setting_value: body.packaging?.packagingMaterial || 'eco',
        setting_type: 'shipping',
        description: 'Default packaging material'
      },
      {
        setting_key: 'free_shipping_threshold',
        setting_value: body.freeShippingThreshold || null,
        setting_type: 'shipping',
        description: 'Free shipping order threshold'
      },
      {
        setting_key: 'handling_fee',
        setting_value: body.handlingFee || 0,
        setting_type: 'shipping',
        description: 'Order handling fee'
      }
    ]

    // Upsert all settings
    const { error: upsertError } = await supabaseAdmin
      .from('site_settings')
      .upsert(settingsToUpsert, {
        onConflict: 'setting_key'
      })

    if (upsertError) {
      console.error('Error updating shipping settings:', upsertError)
      return NextResponse.json({ error: 'Failed to update shipping settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Shipping settings updated successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

