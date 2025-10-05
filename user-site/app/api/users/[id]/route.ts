import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await request.json()
    const { name, phone } = body

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured',
        message: 'Profile update not available' 
      }, { status: 503 })
    }

    // Validate input
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Name must be at least 2 characters long' 
      }, { status: 400 })
    }

    // Update user profile
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        name: name.trim(),
        phone: phone?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to update profile' 
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Return updated user data (without password hash)
    const { password_hash, ...userData } = data

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured',
        message: 'User lookup not available' 
      }, { status: 503 })
    }

    // Get user data
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, phone, role, email_verified, created_at, updated_at, last_login')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    return NextResponse.json({ user: data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
