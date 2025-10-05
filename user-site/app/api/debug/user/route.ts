import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const userId = searchParams.get('userId')

    if (!email && !userId) {
      return NextResponse.json({ 
        error: 'Email or userId parameter required' 
      }, { status: 400 })
    }

    let query = supabaseAdmin.from('users').select('*')
    
    if (userId) {
      query = query.eq('id', userId)
    } else if (email) {
      query = query.eq('email', email.toLowerCase())
    }

    const { data: users, error } = await query

    if (error) {
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      found: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        is_guest: user.is_guest,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login
      }))
    })

  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    const body = await request.json()
    const { action, email, userId } = body

    if (action === 'create_test_user') {
      // Create a test user to verify registration works
      const testEmail = email || `test-${Date.now()}@example.com`
      
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: testEmail,
          name: 'Test User',
          phone: '+1234567890',
          password_hash: 'test_hash',
          role: 'customer',
          is_guest: false,
          email_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ 
          error: 'Failed to create test user',
          details: error.message 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Test user created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          is_guest: newUser.is_guest,
          email_verified: newUser.email_verified,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at
        }
      })
    }

    if (action === 'delete_test_user') {
      if (!userId) {
        return NextResponse.json({ 
          error: 'userId required for delete action' 
        }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        return NextResponse.json({ 
          error: 'Failed to delete test user',
          details: error.message 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Test user deleted successfully'
      })
    }

    return NextResponse.json({ 
      error: 'Invalid action. Supported actions: create_test_user, delete_test_user' 
    }, { status: 400 })

  } catch (error) {
    console.error('Debug user POST error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
