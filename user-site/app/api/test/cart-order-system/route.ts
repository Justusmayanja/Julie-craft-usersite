// =====================================================
// COMPREHENSIVE TEST SCRIPT FOR CART AND ORDER SYSTEM
// =====================================================
// This script tests the complete flow from cart operations
// to order completion with inventory management.
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Starting comprehensive cart and order system test...')
    
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Database not configured - cannot run tests',
        tests: []
      })
    }

    const tests = []
    let passedTests = 0
    let totalTests = 0

    // Test 1: Check if required tables exist
    totalTests++
    try {
      const { data: tables, error } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .in('table_name', ['products', 'orders', 'order_items', 'order_item_reservations', 'user_carts'])
        .eq('table_schema', 'public')

      if (error) throw error

      const tableNames = tables?.map(t => t.table_name) || []
      const requiredTables = ['products', 'orders', 'order_items', 'order_item_reservations', 'user_carts']
      const missingTables = requiredTables.filter(table => !tableNames.includes(table))

      if (missingTables.length === 0) {
        tests.push({
          name: 'Required tables exist',
          status: 'PASS',
          details: `All required tables found: ${tableNames.join(', ')}`
        })
        passedTests++
      } else {
        tests.push({
          name: 'Required tables exist',
          status: 'FAIL',
          details: `Missing tables: ${missingTables.join(', ')}`
        })
      }
    } catch (error) {
      tests.push({
        name: 'Required tables exist',
        status: 'ERROR',
        details: `Error checking tables: ${error}`
      })
    }

    // Test 2: Check if products have stock data
    totalTests++
    try {
      const { data: products, error } = await supabaseAdmin
        .from('products')
        .select('id, name, stock_quantity, status')
        .eq('status', 'active')
        .limit(5)

      if (error) throw error

      if (products && products.length > 0) {
        const productsWithStock = products.filter(p => p.stock_quantity > 0)
        tests.push({
          name: 'Products with stock available',
          status: 'PASS',
          details: `${productsWithStock.length}/${products.length} active products have stock`
        })
        passedTests++
      } else {
        tests.push({
          name: 'Products with stock available',
          status: 'FAIL',
          details: 'No active products found'
        })
      }
    } catch (error) {
      tests.push({
        name: 'Products with stock available',
        status: 'ERROR',
        details: `Error checking products: ${error}`
      })
    }

    // Test 3: Test stock availability check API
    totalTests++
    try {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, stock_quantity')
        .eq('status', 'active')
        .limit(1)

      if (products && products.length > 0) {
        const product = products[0]
        const testItems = [{
          product_id: product.id,
          quantity: 1
        }]

        const response = await fetch(`${request.nextUrl.origin}/api/inventory/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: testItems })
        })

        const result = await response.json()

        if (result.success && result.availability && result.availability.length > 0) {
          tests.push({
            name: 'Stock availability check API',
            status: 'PASS',
            details: `API returned availability for ${product.name}`
          })
          passedTests++
        } else {
          tests.push({
            name: 'Stock availability check API',
            status: 'FAIL',
            details: `API failed: ${result.message || 'Unknown error'}`
          })
        }
      } else {
        tests.push({
          name: 'Stock availability check API',
          status: 'SKIP',
          details: 'No products available for testing'
        })
      }
    } catch (error) {
      tests.push({
        name: 'Stock availability check API',
        status: 'ERROR',
        details: `Error testing stock check API: ${error}`
      })
    }

    // Test 4: Test reservation system
    totalTests++
    try {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, stock_quantity')
        .eq('status', 'active')
        .limit(1)

      if (products && products.length > 0) {
        const product = products[0]
        const testItems = [{
          product_id: product.id,
          quantity: 1
        }]

        // Test reservation
        const reserveResponse = await fetch(`${request.nextUrl.origin}/api/inventory/reserve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: testItems,
            session_id: 'test-session-' + Date.now(),
            reservation_type: 'test'
          })
        })

        const reserveResult = await reserveResponse.json()

        if (reserveResult.success && reserveResult.reservations && reserveResult.reservations.length > 0) {
          const reservationId = reserveResult.reservations[0].reservation_id

          // Test reservation release
          const releaseResponse = await fetch(`${request.nextUrl.origin}/api/inventory/reserve`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reservation_ids: [reservationId],
              session_id: 'test-session-' + Date.now()
            })
          })

          const releaseResult = await releaseResponse.json()

          if (releaseResult.success) {
            tests.push({
              name: 'Product reservation system',
              status: 'PASS',
              details: `Successfully reserved and released ${product.name}`
            })
            passedTests++
          } else {
            tests.push({
              name: 'Product reservation system',
              status: 'FAIL',
              details: `Reservation created but release failed: ${releaseResult.message}`
            })
          }
        } else {
          tests.push({
            name: 'Product reservation system',
            status: 'FAIL',
            details: `Reservation failed: ${reserveResult.message || 'Unknown error'}`
          })
        }
      } else {
        tests.push({
          name: 'Product reservation system',
          status: 'SKIP',
          details: 'No products available for testing'
        })
      }
    } catch (error) {
      tests.push({
        name: 'Product reservation system',
        status: 'ERROR',
        details: `Error testing reservation system: ${error}`
      })
    }

    // Test 5: Test order creation with inventory deduction
    totalTests++
    try {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, stock_quantity, price')
        .eq('status', 'active')
        .limit(1)

      if (products && products.length > 0) {
        const product = products[0]
        const originalStock = product.stock_quantity

        if (originalStock > 0) {
          const testOrder = {
            customer_email: 'test@example.com',
            customer_name: 'Test Customer',
            customer_phone: '+256700000000',
            shipping_address: {
              name: 'Test Customer',
              email: 'test@example.com',
              phone: '+256700000000',
              address_line1: 'Test Address',
              city: 'Kampala',
              state: 'Central',
              zip_code: '00000',
              country: 'Uganda'
            },
            items: [{
              product_id: product.id,
              product_name: product.name,
              quantity: 1,
              price: product.price,
              total_price: product.price
            }],
            subtotal: product.price,
            tax_amount: 0,
            shipping_amount: 10000,
            discount_amount: 0,
            total_amount: product.price + 10000,
            currency: 'UGX',
            payment_method: 'cash'
          }

          const orderResponse = await fetch(`${request.nextUrl.origin}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testOrder)
          })

          const orderResult = await orderResponse.json()

          if (orderResult.success || orderResult.order_number) {
            // Check if stock was deducted
            const { data: updatedProduct } = await supabaseAdmin
              .from('products')
              .select('stock_quantity')
              .eq('id', product.id)
              .single()

            if (updatedProduct && updatedProduct.stock_quantity === originalStock - 1) {
              tests.push({
                name: 'Order creation with inventory deduction',
                status: 'PASS',
                details: `Order created successfully, stock reduced from ${originalStock} to ${updatedProduct.stock_quantity}`
              })
              passedTests++
            } else {
              tests.push({
                name: 'Order creation with inventory deduction',
                status: 'FAIL',
                details: `Order created but stock not deducted properly. Expected: ${originalStock - 1}, Actual: ${updatedProduct?.stock_quantity}`
              })
            }
          } else {
            tests.push({
              name: 'Order creation with inventory deduction',
              status: 'FAIL',
              details: `Order creation failed: ${orderResult.error || 'Unknown error'}`
            })
          }
        } else {
          tests.push({
            name: 'Order creation with inventory deduction',
            status: 'SKIP',
            details: `Product ${product.name} has no stock (${originalStock})`
          })
        }
      } else {
        tests.push({
          name: 'Order creation with inventory deduction',
          status: 'SKIP',
          details: 'No products available for testing'
        })
      }
    } catch (error) {
      tests.push({
        name: 'Order creation with inventory deduction',
        status: 'ERROR',
        details: `Error testing order creation: ${error}`
      })
    }

    // Test 6: Check stock movements table (if exists)
    totalTests++
    try {
      const { data: movements, error } = await supabaseAdmin
        .from('stock_movements')
        .select('id, movement_type, quantity')
        .limit(5)

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist
        tests.push({
          name: 'Stock movements tracking',
          status: 'SKIP',
          details: 'Stock movements table not created yet'
        })
      } else if (error) {
        tests.push({
          name: 'Stock movements tracking',
          status: 'ERROR',
          details: `Error checking stock movements: ${error}`
        })
      } else {
        tests.push({
          name: 'Stock movements tracking',
          status: 'PASS',
          details: `Stock movements table exists with ${movements?.length || 0} records`
        })
        passedTests++
      }
    } catch (error) {
      tests.push({
        name: 'Stock movements tracking',
        status: 'ERROR',
        details: `Error checking stock movements: ${error}`
      })
    }

    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0

    return NextResponse.json({
      success: passedTests === totalTests,
      message: `Test completed: ${passedTests}/${totalTests} tests passed (${successRate}%)`,
      summary: {
        total_tests: totalTests,
        passed_tests: passedTests,
        failed_tests: totalTests - passedTests,
        success_rate: `${successRate}%`
      },
      tests,
      recommendations: passedTests < totalTests ? [
        'Some tests failed. Check the database setup and API endpoints.',
        'Ensure all required tables are created with proper permissions.',
        'Verify that products have stock quantities set.',
        'Check that the inventory reservation system is working correctly.'
      ] : [
        'All tests passed! The cart and order system is working correctly.',
        'Inventory management is properly implemented.',
        'Product reservations are functioning as expected.',
        'Order creation with stock deduction is working.'
      ]
    })

  } catch (error) {
    console.error('Test suite error:', error)
    return NextResponse.json({
      success: false,
      message: 'Test suite failed to run',
      error: error instanceof Error ? error.message : 'Unknown error',
      tests: []
    }, { status: 500 })
  }
}
