import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// Helper function to verify Supabase JWT token
async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('julie-crafts-token')?.value
  
  let token: string | null = null
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else if (cookieToken) {
    token = cookieToken
  }
  
  if (!token) {
    return null
  }

  if (!supabaseAdmin) {
    return null
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) {
      return null
    }
    return { userId: user.id, user, token }
  } catch (error) {
    return null
  }
}

// DELETE - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    const decoded = await verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const userId = decoded.userId

    // Check if user is an admin - prevent admins from deleting their account through this endpoint
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, role')
      .eq('id', userId)
      .single()

    if (profile?.is_admin) {
      return NextResponse.json({ 
        error: 'Admin accounts cannot be deleted through this endpoint. Please contact an administrator.' 
      }, { status: 403 })
    }

    // Soft delete: Mark profile as inactive
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error deactivating profile:', updateError)
      return NextResponse.json({ 
        error: 'Failed to delete account',
        details: updateError.message 
      }, { status: 500 })
    }

    // Hard delete: Delete from Supabase Auth (this will cascade delete profile due to foreign key)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      // Even if auth deletion fails, profile is already deactivated
      // Return success but log the error
    }

    return NextResponse.json({
      message: 'Account deleted successfully'
    })

  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

