import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Verify JWT token using Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid or expired token' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { session_id, guest_cart_data } = body

    if (!session_id || !guest_cart_data) {
      return NextResponse.json({ 
        error: 'Session ID and guest cart data are required' 
      }, { status: 400 })
    }

    // Check if user already has a cart
    const { data: existingCart } = await supabaseAdmin
      .from('user_carts')
      .select('cart_data')
      .eq('user_id', user.id)
      .single()

    if (existingCart && existingCart.cart_data && Array.isArray(existingCart.cart_data) && existingCart.cart_data.length > 0) {
      // User already has items in cart, merge guest cart with user cart
      const mergedCart = [...existingCart.cart_data]
      
      guest_cart_data.forEach((guestItem: any) => {
        const existingItemIndex = mergedCart.findIndex((item: any) => item.id === guestItem.id)
        
        if (existingItemIndex >= 0) {
          // Item exists, add quantities
          mergedCart[existingItemIndex].quantity += guestItem.quantity
        } else {
          // New item, add to cart
          mergedCart.push(guestItem)
        }
      })

      // Update user cart with merged data
      await supabaseAdmin
        .from('user_carts')
        .update({
          cart_data: mergedCart,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      // Delete guest cart
      await supabaseAdmin
        .from('user_carts')
        .delete()
        .eq('session_id', session_id)

      return NextResponse.json({
        success: true,
        message: 'Guest cart merged with user cart',
        cart_data: mergedCart
      })
    } else {
      // User has no existing cart, transfer guest cart to user
      await supabaseAdmin
        .from('user_carts')
        .update({
          user_id: user.id,
          session_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', session_id)

      return NextResponse.json({
        success: true,
        message: 'Guest cart transferred to user',
        cart_data: guest_cart_data
      })
    }

  } catch (error) {
    console.error('Cart migration error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
