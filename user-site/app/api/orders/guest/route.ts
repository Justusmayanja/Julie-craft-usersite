import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { GuestCheckoutData } from '@/lib/types/user'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guest_info, order_data }: { guest_info: GuestCheckoutData, order_data: any } = body

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating guest order creation')
      
      // Generate a mock order number
      const orderNumber = `ORD-${Date.now()}`
      
      return NextResponse.json({
        id: `mock-${Date.now()}`,
        order_number: orderNumber,
        message: 'Guest order created successfully (simulated - database not configured)',
        status: 'pending',
        guest_email: guest_info.email
      }, { status: 201 })
    }

    // Validate required fields
    if (!guest_info.email || !guest_info.name || !order_data.items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Create order with guest information
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: guest_info.email,
        customer_name: guest_info.name,
        customer_phone: guest_info.phone,
        status: 'pending',
        payment_status: 'pending',
        subtotal: order_data.subtotal || 0,
        tax_amount: order_data.tax_amount || 0,
        shipping_amount: order_data.shipping_amount || 0,
        discount_amount: order_data.discount_amount || 0,
        total_amount: order_data.total_amount || 0,
        currency: order_data.currency || 'UGX',
        shipping_address: guest_info.shipping_address,
        billing_address: guest_info.billing_address || guest_info.shipping_address,
        notes: order_data.notes,
        order_date: new Date().toISOString(),
        is_guest_order: true // Flag to identify guest orders
      })
      .select()
      .single()

    if (orderError) {
      console.error('Guest order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create guest order' }, { status: 500 })
    }

    // Validate stock availability before creating order items
    console.log('Validating stock availability for guest order items...')
    
    try {
      for (const item of order_data.items) {
        const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1
        const productId = item.product_id || item.id.toString()
        
        console.log(`Guest order - Looking for product with ID: ${productId} (type: ${typeof productId})`)
        
        // Check current stock for this product
        const { data: product, error: productError } = await supabaseAdmin
          .from('products')
          .select('id, name, stock_quantity, status')
          .eq('id', productId)
          .single()
        
        if (productError || !product) {
          console.log(`Guest order - Product not found with ID ${productId}:`, productError)
          console.log(`Guest order - Attempting to find by name: ${item.product_name || item.name}`)
          
          // Try to find by name if ID lookup fails (for fallback products)
          const { data: productByName, error: nameError } = await supabaseAdmin
            .from('products')
            .select('id, name, stock_quantity, status')
            .ilike('name', `%${item.product_name || item.name}%`)
            .limit(1)
            .single()
          
          if (productByName && !nameError) {
            console.log(`Guest order - Found product by name: ${productByName.name} (ID: ${productByName.id})`)
            // Update the item with the correct database ID
            item.product_id = productByName.id
            // Continue with the found product
            const foundProduct = productByName
            const isInStock = foundProduct.stock_quantity > 0 && foundProduct.status === 'active'
            if (!isInStock) {
              console.log(`Guest order - Product out of stock: ${foundProduct.name} (stock: ${foundProduct.stock_quantity}, status: ${foundProduct.status})`)
              return NextResponse.json({ 
                error: `We're sorry, "${foundProduct.name}" is currently out of stock. Please remove it from your cart or try again later.`,
                code: 'OUT_OF_STOCK'
              }, { status: 400 })
            }
            
            if (foundProduct.stock_quantity < quantity) {
              console.log(`Guest order - Insufficient stock for ${foundProduct.name}: ${foundProduct.stock_quantity} available, ${quantity} requested`)
              return NextResponse.json({ 
                error: `We only have ${foundProduct.stock_quantity} "${foundProduct.name}" available, but you're trying to order ${quantity}. Please adjust the quantity and try again.`,
                code: 'INSUFFICIENT_STOCK',
                available_quantity: foundProduct.stock_quantity,
                requested_quantity: quantity,
                product_name: foundProduct.name
              }, { status: 400 })
            }
            
            console.log(`Guest order - Stock check passed for ${foundProduct.name}: ${foundProduct.stock_quantity} available, ${quantity} requested`)
            continue // Skip to next item
          }
          
          return NextResponse.json({ 
            error: `Sorry, we couldn't find the product "${item.product_name || item.name || 'Unknown Product'}". It may have been removed or is temporarily unavailable.`,
            code: 'PRODUCT_NOT_FOUND'
          }, { status: 400 })
        }
        
        const isInStock = product.stock_quantity > 0 && product.status === 'active'
        if (!isInStock) {
          console.log(`Guest order - Product out of stock: ${product.name} (stock: ${product.stock_quantity}, status: ${product.status})`)
          return NextResponse.json({ 
            error: `We're sorry, "${product.name}" is currently out of stock. Please remove it from your cart or try again later.`,
            code: 'OUT_OF_STOCK'
          }, { status: 400 })
        }
        
        if (product.stock_quantity < quantity) {
          console.log(`Insufficient stock for ${product.name}: ${product.stock_quantity} available, ${quantity} requested`)
          return NextResponse.json({ 
            error: `We only have ${product.stock_quantity} "${product.name}" available, but you're trying to order ${quantity}. Please adjust the quantity and try again.`,
            code: 'INSUFFICIENT_STOCK',
            available_quantity: product.stock_quantity,
            requested_quantity: quantity,
            product_name: product.name
          }, { status: 400 })
        }
        
        console.log(`Stock check passed for ${product.name}: ${product.stock_quantity} available, ${quantity} requested`)
      }
    } catch (stockValidationError) {
      console.error('Stock validation error:', stockValidationError)
      return NextResponse.json({ 
        error: 'There was an issue checking product availability. Please try again or contact support if the problem persists.',
        code: 'STOCK_VALIDATION_ERROR'
      }, { status: 500 })
    }

    // Create order items
    const orderItems = order_data.items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.product_id || item.id.toString(),
      product_name: item.product_name || item.name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      price: item.unit_price || item.price, // Database column is 'price', not 'unit_price'
      total_price: item.total_price || (item.price * item.quantity),
      product_image: item.product_image || item.image
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Guest order items creation error:', itemsError)
      // Try to clean up the order
      try {
        await supabaseAdmin.from('orders').delete().eq('id', orderData.id)
        console.log('Guest order cleanup completed after items creation failure')
      } catch (cleanupError) {
        console.error('Failed to cleanup guest order after items creation failure:', cleanupError)
      }
      
      // Provide more specific error message
      let errorMessage = 'Failed to create guest order items'
      if (itemsError.message.includes('check constraint')) {
        errorMessage = 'Order failed due to insufficient stock. Please check product availability.'
      } else if (itemsError.message.includes('foreign key')) {
        errorMessage = 'Order failed due to invalid product references.'
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // Optionally save guest info for future orders if requested
    if (guest_info.save_for_future) {
      // Store guest info for potential future orders
      await supabaseAdmin
        .from('guest_customers')
        .upsert({
          email: guest_info.email,
          name: guest_info.name,
          phone: guest_info.phone,
          default_shipping_address: guest_info.shipping_address,
          default_billing_address: guest_info.billing_address,
          last_order_date: new Date().toISOString(),
          order_count: 1 // This would be incremented on subsequent orders
        }, {
          onConflict: 'email'
        })
    }

    // Return the complete order
    const { data: completeOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `)
      .eq('id', orderData.id)
      .single()

        if (fetchError) {
          console.error('Error fetching complete guest order:', fetchError)
          return NextResponse.json({ error: 'Order created but failed to fetch details' }, { status: 500 })
        }

        // Deduct inventory for each order item
        console.log('Deducting inventory for guest order items...')
        try {
          for (const item of order_data.items) {
            const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1
            const productId = item.product_id || item.id.toString()
            
            // Get current stock first, then deduct
            const { data: currentProduct, error: getError } = await supabaseAdmin
              .from('products')
              .select('stock_quantity')
              .eq('id', productId)
              .single()
            
            if (getError || !currentProduct) {
              console.error(`Failed to get current stock for product ${productId}:`, getError)
              continue
            }
            
            const newStockQuantity = Math.max(0, currentProduct.stock_quantity - quantity)
            
            // Deduct stock quantity
            const { error: stockError } = await supabaseAdmin
              .from('products')
              .update({ 
                stock_quantity: newStockQuantity,
                updated_at: new Date().toISOString()
              })
              .eq('id', productId)
            
            if (stockError) {
              console.error(`Failed to deduct inventory for product ${productId}:`, stockError)
              // Don't fail the order, just log the error
            } else {
              console.log(`Successfully deducted ${quantity} units from product ${productId}`)
            }
          }
          
          // Mark order as having reserved inventory
          await supabaseAdmin
            .from('orders')
            .update({ 
              inventory_reserved: true,
              reserved_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', orderData.id)
            
          console.log('Guest order inventory deduction completed successfully')
        } catch (inventoryError) {
          console.error('Error during guest order inventory deduction:', inventoryError)
          // Don't fail the order, just log the error
        }

        // Add success message and metadata
        const response = {
          ...completeOrder,
          message: 'Guest order created successfully! Your beautiful handcrafted items are being prepared with care.',
          success: true,
          estimated_delivery: '3-5 business days',
          tracking_info: 'You will receive tracking information via email once your order ships.'
        }

        return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
