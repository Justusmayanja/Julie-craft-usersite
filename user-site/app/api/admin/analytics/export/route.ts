import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

/**
 * Analytics Export API Route
 * 
 * Exports analytics data as CSV
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    // Get authorization token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid token' 
      }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required' 
      }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'csv'

    // Build date filter
    let ordersQuery = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        payment_status,
        created_at,
        customer_email,
        customer_name,
        order_items:order_items(
          product_name,
          quantity,
          price,
          total_price
        )
      `)
      .order('created_at', { ascending: false })

    if (startDate && endDate) {
      ordersQuery = ordersQuery
        .gte('created_at', startDate)
        .lte('created_at', endDate)
    }

    const { data: orders, error: ordersError } = await ordersQuery

    if (ordersError) {
      console.error('Orders fetch error:', ordersError)
      return NextResponse.json({ 
        error: 'Failed to fetch orders',
        details: ordersError.message 
      }, { status: 500 })
    }

    // Generate CSV
    if (format === 'csv') {
      const csvHeaders = [
        'Order Number',
        'Date',
        'Customer Email',
        'Customer Name',
        'Status',
        'Payment Status',
        'Total Amount',
        'Items',
        'Item Details'
      ]

      const csvRows = orders?.map(order => {
        const orderDate = new Date(order.created_at).toLocaleDateString()
        const items = order.order_items || []
        const itemDetails = items.map((item: any) => 
          `${item.product_name} (Qty: ${item.quantity}, Price: ${item.price})`
        ).join('; ')
        const itemCount = items.length

        return [
          order.order_number || order.id,
          orderDate,
          order.customer_email || '',
          order.customer_name || '',
          order.status || '',
          order.payment_status || '',
          order.total_amount || 0,
          itemCount,
          itemDetails
        ]
      }) || []

      // Escape CSV values
      const escapeCsv = (value: any): string => {
        if (value === null || value === undefined) return ''
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const csvContent = [
        csvHeaders.map(escapeCsv).join(','),
        ...csvRows.map(row => row.map(escapeCsv).join(','))
      ].join('\n')

      // Return CSV file
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // JSON format
    return NextResponse.json({
      exportDate: new Date().toISOString(),
      timeRange: {
        start: startDate,
        end: endDate
      },
      totalOrders: orders?.length || 0,
      orders: orders || []
    })

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

