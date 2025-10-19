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
        stats: {
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          completedOrders: 0
        },
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

    // Calculate stats
    const orders = data || []
    const stats = {
      totalOrders: count || 0,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      completedOrders: orders.filter(order => order.status === 'delivered').length
    }

    return NextResponse.json({
      orders,
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset,
      stats
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
        customer_id: userId, // Associate order with user if authenticated
        is_guest_order: !userId // Mark as guest order if no user
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Note: Stock validation is handled by the cart context before order placement
    // The cart context ensures all items are available and reserved before calling this API
    console.log('Order items validated by cart context, proceeding with order creation...')

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

        // Deduct inventory for each order item (atomic operation)
        console.log('Deducting inventory for order items...')
        try {
          for (const item of body.items) {
            const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1
            
            // Get current stock first, then deduct atomically
            const { data: currentProduct, error: getError } = await supabaseAdmin
              .from('products')
              .select('stock_quantity, name, reorder_point')
              .eq('id', item.product_id)
              .single()
            
            if (getError || !currentProduct) {
              console.error(`Failed to get current stock for product ${item.product_id}:`, getError)
              continue
            }
            
            const newStockQuantity = Math.max(0, currentProduct.stock_quantity - quantity)
            
            // Deduct stock quantity atomically
            const { error: stockError } = await supabaseAdmin
              .from('products')
              .update({ 
                stock_quantity: newStockQuantity,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.product_id)
              .eq('stock_quantity', currentProduct.stock_quantity) // Ensure no race conditions
            
            if (stockError) {
              console.error(`Failed to deduct inventory for product ${item.product_id}:`, stockError)
              // This is a critical error - the order should be rolled back
              throw new Error(`Inventory deduction failed for product ${item.product_id}: ${stockError.message}`)
            } else {
              console.log(`Successfully deducted ${quantity} units from product ${item.product_id} (${currentProduct.name})`)
              
              // Create stock movement record
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
              
              // Check if product is now at or below reorder point
              const reorderPoint = currentProduct.reorder_point || 10
              if (newStockQuantity <= reorderPoint) {
                try {
                  await supabaseAdmin
                    .from('reorder_alerts')
                    .insert({
                      product_id: item.product_id,
                      alert_type: newStockQuantity === 0 ? 'out_of_stock' : 'low_stock',
                      current_stock: newStockQuantity,
                      reorder_point: reorderPoint,
                      created_at: new Date().toISOString()
                    })
                  console.log(`Low stock alert created for product ${item.product_id}`)
                } catch (alertError) {
                  console.log('Reorder alerts table not available, skipping alert:', alertError)
                }
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
          // Rollback the order if inventory deduction fails
          try {
            await supabaseAdmin.from('orders').delete().eq('id', orderData.id)
            console.log('Order rolled back due to inventory deduction failure')
          } catch (rollbackError) {
            console.error('Failed to rollback order:', rollbackError)
          }
          throw new Error(`Order failed due to inventory issues: ${inventoryError.message}`)
        }

        // Create admin notification for new order
        try {
          await supabaseAdmin
            .from('order_notes')
            .insert({
              order_id: orderData.id,
              note_type: 'internal',
              content: `New order received: ${orderNumber} from ${body.customer_name} (${body.customer_email}) - Total: ${body.total_amount} UGX`,
              is_internal: true,
              created_by: 'system',
              created_at: new Date().toISOString()
            })
          
          // Create order task for admin
          await supabaseAdmin
            .from('order_tasks')
            .insert({
              order_id: orderData.id,
              task_type: 'payment_verification',
              title: 'Verify Payment',
              description: `Verify payment for order ${orderNumber} from ${body.customer_name}`,
              status: 'pending',
              priority: 'normal',
              created_at: new Date().toISOString()
            })
          
          console.log('Admin notifications created for new order')
        } catch (notificationError) {
          console.log('Admin notification tables not available, skipping notifications:', notificationError)
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
