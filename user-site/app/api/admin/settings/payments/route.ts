import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/admin/settings/payments - Fetch payment settings
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

    // Fetch payment settings
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('setting_type', 'payment')
      .order('setting_key', { ascending: true })

    if (error) {
      console.error('Error fetching payment settings:', error)
      return NextResponse.json({ error: 'Failed to fetch payment settings' }, { status: 500 })
    }

    // Convert array to object
    const paymentSettings: Record<string, any> = {}
    if (settings) {
      settings.forEach(setting => {
        paymentSettings[setting.setting_key] = setting.setting_value
      })
    }

    // Parse payment methods if stored as JSON
    const paymentMethods = paymentSettings.payment_methods 
      ? JSON.parse(paymentSettings.payment_methods) 
      : [
          {
            id: 'stripe',
            name: 'Stripe',
            type: 'credit_card',
            status: 'connected',
            enabled: true
          },
          {
            id: 'paypal',
            name: 'PayPal',
            type: 'paypal',
            status: 'connected',
            enabled: true
          }
        ]

    return NextResponse.json({
      paymentMethods,
      tax: {
        rate: parseFloat(paymentSettings.tax_rate || '8.5'),
        collection: paymentSettings.tax_collection || 'automatic',
        enabled: paymentSettings.tax_enabled === 'true' || true
      },
      currency: paymentSettings.currency || 'UGX',
      allowPartialPayments: paymentSettings.allow_partial_payments === 'true' || false,
      requirePaymentConfirmation: paymentSettings.require_payment_confirmation === 'true' || false
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/settings/payments - Update payment settings
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
        setting_key: 'payment_methods',
        setting_value: JSON.stringify(body.paymentMethods || []),
        setting_type: 'payment',
        description: 'Enabled payment methods'
      },
      {
        setting_key: 'tax_rate',
        setting_value: String(body.tax?.rate || 8.5),
        setting_type: 'payment',
        description: 'Default tax rate percentage'
      },
      {
        setting_key: 'tax_collection',
        setting_value: body.tax?.collection || 'automatic',
        setting_type: 'payment',
        description: 'Tax collection method'
      },
      {
        setting_key: 'tax_enabled',
        setting_value: String(body.tax?.enabled || true),
        setting_type: 'payment',
        description: 'Tax collection enabled'
      },
      {
        setting_key: 'allow_partial_payments',
        setting_value: String(body.allowPartialPayments || false),
        setting_type: 'payment',
        description: 'Allow partial payments'
      },
      {
        setting_key: 'require_payment_confirmation',
        setting_value: String(body.requirePaymentConfirmation || false),
        setting_type: 'payment',
        description: 'Require payment confirmation'
      }
    ]

    // Upsert all settings
    const { error: upsertError } = await supabaseAdmin
      .from('site_settings')
      .upsert(settingsToUpsert, {
        onConflict: 'setting_key'
      })

    if (upsertError) {
      console.error('Error updating payment settings:', upsertError)
      return NextResponse.json({ error: 'Failed to update payment settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Payment settings updated successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

