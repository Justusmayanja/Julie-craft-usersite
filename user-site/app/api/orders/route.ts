import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import type { Order, OrderFilters, CreateOrderData } from '@/lib/types/order'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning empty orders array')
      return NextResponse.json({
        orders: [],
        total: 0,
        limit: 50,
        offset: 0,
        message: 'Database not configured'
      })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filters: OrderFilters = {
      status: searchParams.get('status') as any || undefined,
      payment_status: searchParams.get('payment_status') as any || undefined,
      customer_email: searchParams.get('customer_email') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      sort_by: searchParams.get('sort_by') as any || 'order_date',
      sort_order: searchParams.get('sort_order') as any || 'desc',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
    }

    // Build query
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `, { count: 'exact' })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status)
    }

    if (filters.customer_email) {
      query = query.eq('customer_email', filters.customer_email)
    }

    if (filters.date_from) {
      query = query.gte('order_date', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('order_date', filters.date_to)
    }

    // Apply sorting
    query = query.order(filters.sort_by || 'order_date', { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({
      orders: data || [],
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, simulating order creation')
      
      // Generate a mock order number
      const orderNumber = `ORD-${Date.now()}`
      
      return NextResponse.json({
        id: `mock-${Date.now()}`,
        order_number: orderNumber,
        message: 'Order created successfully (simulated - database not configured)',
        status: 'pending'
      }, { status: 201 })
    }

    const body: CreateOrderData = await request.json()

    // Validate required fields
    if (!body.customer_email || !body.customer_name || !body.shipping_address || !body.items.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Get user ID from request headers if available
    const authHeader = request.headers.get('authorization')
    let userId = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)
        userId = user?.id
      } catch (error) {
        console.log('Could not verify user token:', error)
      }
    }

    // Create order
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: body.customer_email,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        status: 'pending',
        payment_status: 'pending',
        payment_method: body.payment_method || 'cash',
        subtotal: body.subtotal,
        tax_amount: body.tax_amount || 0,
        shipping_amount: body.shipping_amount || 0,
        discount_amount: body.discount_amount || 0,
        total_amount: body.total_amount,
        currency: body.currency || 'UGX',
        shipping_address: body.shipping_address,
        billing_address: body.billing_address || body.shipping_address,
        notes: body.notes,
        order_date: new Date().toISOString(),
        user_id: userId, // Associate order with user if authenticated
        is_guest_order: !userId // Mark as guest order if no user
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Validate stock availability before creating order items
    console.log('Validating stock availability for order items...')
    
    try {
      for (const item of body.items) {
        const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1
        
        console.log(`Looking for product with ID: ${item.product_id} (type: ${typeof item.product_id})`)
        
        // Check current stock for this product
        const { data: product, error: productError } = await supabaseAdmin
          .from('products')
          .select('id, name, stock_quantity, status')
          .eq('id', item.product_id)
          .single()
        
        if (productError || !product) {
          console.log(`Product not found with ID ${item.product_id}:`, productError)
          console.log(`Attempting to find by name: ${item.product_name}`)
          
          // Try to find by name if ID lookup fails (for fallback products)
          const { data: productByName, error: nameError } = await supabaseAdmin
            .from('products')
            .select('id, name, stock_quantity, status')
            .ilike('name', `%${item.product_name}%`)
            .limit(1)
            .single()
          
          if (productByName && !nameError) {
            console.log(`Found product by name: ${productByName.name} (ID: ${productByName.id})`)
            // Update the item with the correct database ID
            item.product_id = productByName.id
            // Continue with the found product
            const foundProduct = productByName
            const isInStock = foundProduct.stock_quantity > 0 && foundProduct.status === 'active'
            if (!isInStock) {
              console.log(`Product out of stock: ${foundProduct.name} (stock: ${foundProduct.stock_quantity}, status: ${foundProduct.status})`)
              return NextResponse.json({ 
                error: `We're sorry, "${foundProduct.name}" is currently out of stock. Please remove it from your cart or try again later.`,
                code: 'OUT_OF_STOCK'
              }, { status: 400 })
            }
            
            if (foundProduct.stock_quantity < quantity) {
              console.log(`Insufficient stock for ${foundProduct.name}: ${foundProduct.stock_quantity} available, ${quantity} requested`)
              return NextResponse.json({ 
                error: `We only have ${foundProduct.stock_quantity} "${foundProduct.name}" available, but you're trying to order ${quantity}. Please adjust the quantity and try again.`,
                code: 'INSUFFICIENT_STOCK',
                available_quantity: foundProduct.stock_quantity,
                requested_quantity: quantity,
                product_name: foundProduct.name
              }, { status: 400 })
            }
            
            console.log(`Stock check passed for ${foundProduct.name}: ${foundProduct.stock_quantity} available, ${quantity} requested`)
            continue // Skip to next item
          }
          
          return NextResponse.json({ 
            error: `Sorry, we couldn't find the product "${item.product_name || 'Unknown Product'}". It may have been removed or is temporarily unavailable.`,
            code: 'PRODUCT_NOT_FOUND'
          }, { status: 400 })
        }
        
        // Check if product is active
        if (product.status !== 'active') {
          console.log(`Product inactive: ${product.name} (status: ${product.status})`)
          return NextResponse.json({ 
            error: `We're sorry, "${product.name}" is currently not available. Please remove it from your cart or try again later.`,
            code: 'PRODUCT_INACTIVE'
          }, { status: 400 })
        }
        
        // Check available stock (considering existing reservations)
        const { data: existingReservations, error: reservationError } = await supabaseAdmin
          .from('order_item_reservations')
          .select('reserved_quantity')
          .eq('product_id', product.id)
          .eq('status', 'active')

        if (reservationError) {
          console.error('Error checking existing reservations:', reservationError)
        }

        const reservedQuantity = existingReservations?.reduce((sum, r) => sum + r.reserved_quantity, 0) || 0
        const availableStock = Math.max(0, product.stock_quantity - reservedQuantity)
        
        if (availableStock < quantity) {
          console.log(`Insufficient available stock for ${product.name}: ${availableStock} available (${product.stock_quantity} total - ${reservedQuantity} reserved), ${quantity} requested`)
          return NextResponse.json({ 
            error: `We only have ${availableStock} "${product.name}" available right now, but you're trying to order ${quantity}. Please adjust the quantity and try again.`,
            code: 'INSUFFICIENT_STOCK',
            available_quantity: availableStock,
            requested_quantity: quantity,
            product_name: product.name,
            total_stock: product.stock_quantity,
            reserved_quantity: reservedQuantity
          }, { status: 400 })
        }
        
        console.log(`Stock check passed for ${product.name}: ${availableStock} available (${product.stock_quantity} total - ${reservedQuantity} reserved), ${quantity} requested`)
      }
    } catch (stockValidationError) {
      console.error('Stock validation error:', stockValidationError)
      return NextResponse.json({ 
        error: 'There was an issue checking product availability. Please try again or contact support if the problem persists.',
        code: 'STOCK_VALIDATION_ERROR'
      }, { status: 500 })
    }

    // Create order items with validation
    console.log('Creating order items from:', JSON.stringify(body.items, null, 2))
    
    const orderItems = body.items.map(item => {
      // Validate and ensure all required fields are present
      // Check both 'price' and 'unit_price' fields for compatibility
      const unitPrice = typeof item.price === 'number' ? item.price : 
                       typeof (item as any).unit_price === 'number' ? (item as any).unit_price : 
                       parseFloat(item.price || (item as any).unit_price) || 0
      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1
      const totalPrice = typeof item.total_price === 'number' ? item.total_price : (unitPrice * quantity)
      
      if (unitPrice <= 0) {
        throw new Error(`Invalid price for product ${item.product_name || item.product_id}: ${unitPrice}`)
      }
      
      if (quantity <= 0) {
        throw new Error(`Invalid quantity for product ${item.product_name || item.product_id}: ${quantity}`)
      }
      
      return {
        order_id: orderData.id,
        product_id: item.product_id,
        product_name: item.product_name || 'Unknown Product',
        product_sku: item.product_sku || `SKU-${item.product_id}`,
        quantity: quantity,
        price: unitPrice, // Database column is 'price', not 'unit_price'
        total_price: totalPrice,
        product_image: item.product_image || null
      }
    })
    
    console.log('Processed order items:', JSON.stringify(orderItems, null, 2))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items creation error:', itemsError)
      // Try to clean up the order
      try {
        await supabaseAdmin.from('orders').delete().eq('id', orderData.id)
        console.log('Order cleanup completed after items creation failure')
      } catch (cleanupError) {
        console.error('Failed to cleanup order after items creation failure:', cleanupError)
      }
      
      // Provide more specific error message
      let errorMessage = 'Failed to create order items'
      if (itemsError.message.includes('check constraint')) {
        errorMessage = 'Order failed due to insufficient stock. Please check product availability.'
      } else if (itemsError.message.includes('foreign key')) {
        errorMessage = 'Order failed due to invalid product references.'
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // Return the complete order with items
    const { data: completeOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `)
      .eq('id', orderData.id)
      .single()

        if (fetchError) {
          console.error('Error fetching complete order:', fetchError)
          return NextResponse.json({ error: 'Order created but failed to fetch details' }, { status: 500 })
        }

        // Deduct inventory for each order item
        console.log('Deducting inventory for order items...')
        try {
          for (const item of body.items) {
            const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1
            
            // Get current stock first, then deduct
            const { data: currentProduct, error: getError } = await supabaseAdmin
              .from('products')
              .select('stock_quantity, name')
              .eq('id', item.product_id)
              .single()
            
            if (getError || !currentProduct) {
              console.error(`Failed to get current stock for product ${item.product_id}:`, getError)
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
              .eq('id', item.product_id)
            
            if (stockError) {
              console.error(`Failed to deduct inventory for product ${item.product_id}:`, stockError)
              // Don't fail the order, just log the error
            } else {
              console.log(`Successfully deducted ${quantity} units from product ${item.product_id} (${currentProduct.name})`)
              
              // Create stock movement record if table exists
              try {
                await supabaseAdmin
                  .from('stock_movements')
                  .insert({
                    product_id: item.product_id,
                    movement_type: 'sale',
                    quantity: -quantity, // Negative for deduction
                    previous_quantity: currentProduct.stock_quantity,
                    new_quantity: newStockQuantity,
                    reference_type: 'order',
                    reference_id: orderData.id,
                    notes: `Order ${orderNumber} - ${quantity} units sold`,
                    created_at: new Date().toISOString()
                  })
              } catch (stockMovementError) {
                console.log('Stock movements table not available, skipping movement record:', stockMovementError)
              }
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
            
          console.log('Inventory deduction completed successfully')
        } catch (inventoryError) {
          console.error('Error during inventory deduction:', inventoryError)
          // Don't fail the order, just log the error
        }

        // Add success message and metadata
        const response = {
          ...completeOrder,
          message: 'Order created successfully! Your beautiful handcrafted items are being prepared with care.',
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
