import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/admin/settings/notifications - Fetch notification settings
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

    // Fetch notification settings
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('setting_type', 'notification')
      .order('setting_key', { ascending: true })

    if (error) {
      console.error('Error fetching notification settings:', error)
      return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 })
    }

    // Convert array to object
    const notificationSettings: Record<string, any> = {}
    if (settings) {
      settings.forEach(setting => {
        notificationSettings[setting.setting_key] = setting.setting_value
      })
    }

    return NextResponse.json({
      email: {
        enabled: notificationSettings.email_notifications_enabled === 'true' || true,
        orderConfirmation: notificationSettings.email_order_confirmation === 'true' || true,
        orderShipped: notificationSettings.email_order_shipped === 'true' || true,
        orderDelivered: notificationSettings.email_order_delivered === 'true' || true,
        lowStock: notificationSettings.email_low_stock === 'true' || true,
        newCustomer: notificationSettings.email_new_customer === 'true' || true
      },
      sms: {
        enabled: notificationSettings.sms_notifications_enabled === 'true' || false,
        orderConfirmation: notificationSettings.sms_order_confirmation === 'true' || false,
        orderShipped: notificationSettings.sms_order_shipped === 'true' || false
      },
      push: {
        enabled: notificationSettings.push_notifications_enabled === 'true' || true,
        orderUpdates: notificationSettings.push_order_updates === 'true' || true,
        systemAlerts: notificationSettings.push_system_alerts === 'true' || true
      },
      admin: {
        newOrder: notificationSettings.admin_new_order === 'true' || true,
        lowStock: notificationSettings.admin_low_stock === 'true' || true,
        paymentReceived: notificationSettings.admin_payment_received === 'true' || true,
        customerRegistered: notificationSettings.admin_customer_registered === 'true' || true
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/settings/notifications - Update notification settings
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
        setting_key: 'email_notifications_enabled',
        setting_value: String(body.email?.enabled || true),
        setting_type: 'notification',
        description: 'Email notifications enabled'
      },
      {
        setting_key: 'email_order_confirmation',
        setting_value: String(body.email?.orderConfirmation || true),
        setting_type: 'notification',
        description: 'Email order confirmation'
      },
      {
        setting_key: 'email_order_shipped',
        setting_value: String(body.email?.orderShipped || true),
        setting_type: 'notification',
        description: 'Email order shipped'
      },
      {
        setting_key: 'email_order_delivered',
        setting_value: String(body.email?.orderDelivered || true),
        setting_type: 'notification',
        description: 'Email order delivered'
      },
      {
        setting_key: 'email_low_stock',
        setting_value: String(body.email?.lowStock || true),
        setting_type: 'notification',
        description: 'Email low stock alerts'
      },
      {
        setting_key: 'email_new_customer',
        setting_value: String(body.email?.newCustomer || true),
        setting_type: 'notification',
        description: 'Email new customer registration'
      },
      {
        setting_key: 'sms_notifications_enabled',
        setting_value: String(body.sms?.enabled || false),
        setting_type: 'notification',
        description: 'SMS notifications enabled'
      },
      {
        setting_key: 'sms_order_confirmation',
        setting_value: String(body.sms?.orderConfirmation || false),
        setting_type: 'notification',
        description: 'SMS order confirmation'
      },
      {
        setting_key: 'sms_order_shipped',
        setting_value: String(body.sms?.orderShipped || false),
        setting_type: 'notification',
        description: 'SMS order shipped'
      },
      {
        setting_key: 'push_notifications_enabled',
        setting_value: String(body.push?.enabled || true),
        setting_type: 'notification',
        description: 'Push notifications enabled'
      },
      {
        setting_key: 'push_order_updates',
        setting_value: String(body.push?.orderUpdates || true),
        setting_type: 'notification',
        description: 'Push order updates'
      },
      {
        setting_key: 'push_system_alerts',
        setting_value: String(body.push?.systemAlerts || true),
        setting_type: 'notification',
        description: 'Push system alerts'
      },
      {
        setting_key: 'admin_new_order',
        setting_value: String(body.admin?.newOrder || true),
        setting_type: 'notification',
        description: 'Admin notification for new orders'
      },
      {
        setting_key: 'admin_low_stock',
        setting_value: String(body.admin?.lowStock || true),
        setting_type: 'notification',
        description: 'Admin notification for low stock'
      },
      {
        setting_key: 'admin_payment_received',
        setting_value: String(body.admin?.paymentReceived || true),
        setting_type: 'notification',
        description: 'Admin notification for payments'
      },
      {
        setting_key: 'admin_customer_registered',
        setting_value: String(body.admin?.customerRegistered || true),
        setting_type: 'notification',
        description: 'Admin notification for new customers'
      }
    ]

    // Upsert all settings
    const { error: upsertError } = await supabaseAdmin
      .from('site_settings')
      .upsert(settingsToUpsert, {
        onConflict: 'setting_key'
      })

    if (upsertError) {
      console.error('Error updating notification settings:', upsertError)
      return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Notification settings updated successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

