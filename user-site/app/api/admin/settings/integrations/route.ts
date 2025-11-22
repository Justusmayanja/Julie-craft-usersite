import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/admin/settings/integrations - Fetch integration settings
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

    // Fetch integration settings
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('setting_type', 'integration')
      .order('setting_key', { ascending: true })

    if (error) {
      console.error('Error fetching integration settings:', error)
      return NextResponse.json({ error: 'Failed to fetch integration settings' }, { status: 500 })
    }

    // Convert array to object
    const integrationSettings: Record<string, any> = {}
    if (settings) {
      settings.forEach(setting => {
        integrationSettings[setting.setting_key] = setting.setting_value
      })
    }

    return NextResponse.json({
      payment: {
        stripe: {
          enabled: integrationSettings.stripe_enabled === 'true' || false,
          publishableKey: integrationSettings.stripe_publishable_key ? '***' : null,
          secretKey: integrationSettings.stripe_secret_key ? '***' : null,
          webhookSecret: integrationSettings.stripe_webhook_secret ? '***' : null
        },
        paypal: {
          enabled: integrationSettings.paypal_enabled === 'true' || false,
          clientId: integrationSettings.paypal_client_id ? '***' : null,
          clientSecret: integrationSettings.paypal_client_secret ? '***' : null,
          mode: integrationSettings.paypal_mode || 'sandbox'
        }
      },
      analytics: {
        googleAnalytics: {
          enabled: integrationSettings.google_analytics_enabled === 'true' || false,
          trackingId: integrationSettings.google_analytics_id || ''
        },
        facebookPixel: {
          enabled: integrationSettings.facebook_pixel_enabled === 'true' || false,
          pixelId: integrationSettings.facebook_pixel_id || ''
        }
      },
      email: {
        sendgrid: {
          enabled: integrationSettings.sendgrid_enabled === 'true' || false,
          apiKey: integrationSettings.sendgrid_api_key ? '***' : null
        },
        mailchimp: {
          enabled: integrationSettings.mailchimp_enabled === 'true' || false,
          apiKey: integrationSettings.mailchimp_api_key ? '***' : null,
          listId: integrationSettings.mailchimp_list_id || ''
        }
      },
      social: {
        facebook: {
          enabled: integrationSettings.facebook_enabled === 'true' || false,
          pageUrl: integrationSettings.facebook_page_url || ''
        },
        instagram: {
          enabled: integrationSettings.instagram_enabled === 'true' || false,
          username: integrationSettings.instagram_username || ''
        },
        twitter: {
          enabled: integrationSettings.twitter_enabled === 'true' || false,
          username: integrationSettings.twitter_username || ''
        }
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/settings/integrations - Update integration settings
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
    const settingsToUpsert = []

    // Payment integrations
    if (body.payment?.stripe) {
      settingsToUpsert.push(
        {
          setting_key: 'stripe_enabled',
          setting_value: String(body.payment.stripe.enabled || false),
          setting_type: 'integration',
          description: 'Stripe payment enabled'
        },
        {
          setting_key: 'stripe_publishable_key',
          setting_value: body.payment.stripe.publishableKey || '',
          setting_type: 'integration',
          description: 'Stripe publishable key'
        },
        {
          setting_key: 'stripe_secret_key',
          setting_value: body.payment.stripe.secretKey || '',
          setting_type: 'integration',
          description: 'Stripe secret key'
        },
        {
          setting_key: 'stripe_webhook_secret',
          setting_value: body.payment.stripe.webhookSecret || '',
          setting_type: 'integration',
          description: 'Stripe webhook secret'
        }
      )
    }

    if (body.payment?.paypal) {
      settingsToUpsert.push(
        {
          setting_key: 'paypal_enabled',
          setting_value: String(body.payment.paypal.enabled || false),
          setting_type: 'integration',
          description: 'PayPal payment enabled'
        },
        {
          setting_key: 'paypal_client_id',
          setting_value: body.payment.paypal.clientId || '',
          setting_type: 'integration',
          description: 'PayPal client ID'
        },
        {
          setting_key: 'paypal_client_secret',
          setting_value: body.payment.paypal.clientSecret || '',
          setting_type: 'integration',
          description: 'PayPal client secret'
        },
        {
          setting_key: 'paypal_mode',
          setting_value: body.payment.paypal.mode || 'sandbox',
          setting_type: 'integration',
          description: 'PayPal mode (sandbox/live)'
        }
      )
    }

    // Analytics integrations
    if (body.analytics?.googleAnalytics) {
      settingsToUpsert.push(
        {
          setting_key: 'google_analytics_enabled',
          setting_value: String(body.analytics.googleAnalytics.enabled || false),
          setting_type: 'integration',
          description: 'Google Analytics enabled'
        },
        {
          setting_key: 'google_analytics_id',
          setting_value: body.analytics.googleAnalytics.trackingId || '',
          setting_type: 'integration',
          description: 'Google Analytics tracking ID'
        }
      )
    }

    if (body.analytics?.facebookPixel) {
      settingsToUpsert.push(
        {
          setting_key: 'facebook_pixel_enabled',
          setting_value: String(body.analytics.facebookPixel.enabled || false),
          setting_type: 'integration',
          description: 'Facebook Pixel enabled'
        },
        {
          setting_key: 'facebook_pixel_id',
          setting_value: body.analytics.facebookPixel.pixelId || '',
          setting_type: 'integration',
          description: 'Facebook Pixel ID'
        }
      )
    }

    // Email integrations
    if (body.email?.sendgrid) {
      settingsToUpsert.push(
        {
          setting_key: 'sendgrid_enabled',
          setting_value: String(body.email.sendgrid.enabled || false),
          setting_type: 'integration',
          description: 'SendGrid email enabled'
        },
        {
          setting_key: 'sendgrid_api_key',
          setting_value: body.email.sendgrid.apiKey || '',
          setting_type: 'integration',
          description: 'SendGrid API key'
        }
      )
    }

    if (body.email?.mailchimp) {
      settingsToUpsert.push(
        {
          setting_key: 'mailchimp_enabled',
          setting_value: String(body.email.mailchimp.enabled || false),
          setting_type: 'integration',
          description: 'Mailchimp enabled'
        },
        {
          setting_key: 'mailchimp_api_key',
          setting_value: body.email.mailchimp.apiKey || '',
          setting_type: 'integration',
          description: 'Mailchimp API key'
        },
        {
          setting_key: 'mailchimp_list_id',
          setting_value: body.email.mailchimp.listId || '',
          setting_type: 'integration',
          description: 'Mailchimp list ID'
        }
      )
    }

    // Social integrations
    if (body.social) {
      if (body.social.facebook) {
        settingsToUpsert.push(
          {
            setting_key: 'facebook_enabled',
            setting_value: String(body.social.facebook.enabled || false),
            setting_type: 'integration',
            description: 'Facebook integration enabled'
          },
          {
            setting_key: 'facebook_page_url',
            setting_value: body.social.facebook.pageUrl || '',
            setting_type: 'integration',
            description: 'Facebook page URL'
          }
        )
      }

      if (body.social.instagram) {
        settingsToUpsert.push(
          {
            setting_key: 'instagram_enabled',
            setting_value: String(body.social.instagram.enabled || false),
            setting_type: 'integration',
            description: 'Instagram integration enabled'
          },
          {
            setting_key: 'instagram_username',
            setting_value: body.social.instagram.username || '',
            setting_type: 'integration',
            description: 'Instagram username'
          }
        )
      }

      if (body.social.twitter) {
        settingsToUpsert.push(
          {
            setting_key: 'twitter_enabled',
            setting_value: String(body.social.twitter.enabled || false),
            setting_type: 'integration',
            description: 'Twitter integration enabled'
          },
          {
            setting_key: 'twitter_username',
            setting_value: body.social.twitter.username || '',
            setting_type: 'integration',
            description: 'Twitter username'
          }
        )
      }
    }

    // Upsert all settings
    if (settingsToUpsert.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('site_settings')
        .upsert(settingsToUpsert, {
          onConflict: 'setting_key'
        })

      if (upsertError) {
        console.error('Error updating integration settings:', upsertError)
        return NextResponse.json({ error: 'Failed to update integration settings' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Integration settings updated successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

