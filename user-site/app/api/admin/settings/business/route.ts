import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/admin/settings/business - Fetch business settings
export async function GET(request: NextRequest) {
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

    // Fetch business settings from business_settings table
    // Use .maybeSingle() to handle case where no record exists yet
    const { data: businessSettings, error } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('Error fetching business settings:', error)
      return NextResponse.json({ error: 'Failed to fetch business settings' }, { status: 500 })
    }

    // Return with defaults if no settings exist
    // If no record exists, create a default one
    if (!businessSettings) {
      // Create default record
      const { data: newSettings, error: createError } = await supabaseAdmin
        .from('business_settings')
        .insert({
          business_name: 'Julie Crafts',
          country: 'Uganda',
          currency: 'UGX',
          timezone: 'Africa/Kampala'
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating default business settings:', createError)
        // Return defaults even if creation fails
        return NextResponse.json({
          businessName: 'Julie Crafts',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Uganda',
          website: '',
          description: '',
          logo: '/julie-logo.jpeg',
          timezone: 'Africa/Kampala',
          currency: 'UGX'
        })
      }

      // Return the newly created settings
      return NextResponse.json({
        businessName: newSettings.business_name || 'Julie Crafts',
        email: newSettings.email || '',
        phone: newSettings.phone || '',
        address: newSettings.address_line1 || '',
        city: newSettings.city || '',
        state: newSettings.state || '',
        zipCode: newSettings.zip_code || '',
        country: newSettings.country || 'Uganda',
        website: newSettings.website || '',
        description: newSettings.description || '',
        logo: newSettings.logo_url || '/julie-logo.jpeg',
        timezone: newSettings.timezone || 'Africa/Kampala',
        currency: newSettings.currency || 'UGX'
      })
    }

    // Return settings from business_settings table
    return NextResponse.json({
      businessName: businessSettings.business_name || 'Julie Crafts',
      email: businessSettings.email || '',
      phone: businessSettings.phone || '',
      address: businessSettings.address_line1 || '',
      city: businessSettings.city || '',
      state: businessSettings.state || '',
      zipCode: businessSettings.zip_code || '',
      country: businessSettings.country || 'Uganda',
      website: businessSettings.website || '',
      description: businessSettings.description || '',
      logo: businessSettings.logo_url || '/julie-logo.jpeg',
      timezone: businessSettings.timezone || 'Africa/Kampala',
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

    // Prepare update data for business_settings table
    const updateData: any = {
      business_name: body.businessName || 'Julie Crafts',
      email: body.email || null,
      phone: body.phone || null,
      website: body.website || null,
      description: body.description || null,
      address_line1: body.address || null,
      city: body.city || null,
      state: body.state || null,
      zip_code: body.zipCode || null,
      country: body.country || 'Uganda',
      currency: body.currency || 'UGX',
      timezone: body.timezone || 'Africa/Kampala',
      updated_at: new Date().toISOString()
    }

    // Check if business_settings record exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('business_settings')
      .select('id')
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking business settings:', checkError)
      return NextResponse.json({ error: 'Failed to check business settings' }, { status: 500 })
    }

    let result
    if (existing) {
      // Update existing record
      const { error: updateError } = await supabaseAdmin
        .from('business_settings')
        .update(updateData)
        .eq('id', existing.id)

      if (updateError) {
        console.error('Error updating business settings:', updateError)
        return NextResponse.json({ error: 'Failed to update business settings' }, { status: 500 })
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabaseAdmin
        .from('business_settings')
        .insert(updateData)

      if (insertError) {
        console.error('Error creating business settings:', insertError)
        return NextResponse.json({ error: 'Failed to create business settings' }, { status: 500 })
      }
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

