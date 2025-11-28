import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

/**
 * Inventory Export API Route
 * 
 * Exports inventory data as CSV
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
    const format = searchParams.get('format') || 'csv'
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    // Build query for products with inventory data
    let productsQuery = supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        sku,
        description,
        price,
        stock_quantity,
        category_name,
        category_id,
        created_at,
        updated_at,
        image_url,
        status
      `)
      .order('name', { ascending: true })

    // Apply status filter
    if (status !== 'all') {
      if (status === 'low_stock') {
        // Low stock: stock_quantity <= 10 (or reorder_point if available)
        productsQuery = productsQuery.lte('stock_quantity', 10)
      } else if (status === 'out_of_stock') {
        productsQuery = productsQuery.eq('stock_quantity', 0)
      } else if (status === 'in_stock') {
        productsQuery = productsQuery.gt('stock_quantity', 10)
      }
    }

    // Apply search filter
    if (search) {
      productsQuery = productsQuery.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: products, error: productsError } = await productsQuery

    if (productsError) {
      console.error('Products fetch error:', productsError)
      return NextResponse.json({ 
        error: 'Failed to fetch inventory data',
        details: productsError.message 
      }, { status: 500 })
    }

    // Get product IDs to fetch reserved stock
    const productIds = products?.map(p => p.id) || []
    let reservedStockMap: Record<string, number> = {}

    if (productIds.length > 0) {
      // Fetch active reservations from order_item_reservations table
      const { data: reservations } = await supabaseAdmin
        .from('order_item_reservations')
        .select('product_id, reserved_quantity')
        .eq('status', 'active')
        .in('product_id', productIds)

      if (reservations) {
        reservations.forEach((res: any) => {
          const productId = res.product_id
          const quantity = Number(res.reserved_quantity) || 0
          reservedStockMap[productId] = (reservedStockMap[productId] || 0) + quantity
        })
      }
    }

    // Calculate stock status for each product
    const inventoryData = products?.map(product => {
      const stockQty = Number(product.stock_quantity) || 0
      const reservedQty = reservedStockMap[product.id] || 0
      const availableQty = Math.max(0, stockQty - reservedQty)
      
      let stockStatus = 'in_stock'
      if (stockQty <= 0) {
        stockStatus = 'out_of_stock'
      } else if (availableQty <= 0) {
        stockStatus = 'reserved'
      } else if (availableQty <= 10) {
        stockStatus = 'low_stock'
      }

      const totalValue = stockQty * (Number(product.price) || 0)
      const availableValue = availableQty * (Number(product.price) || 0)

      return {
        ...product,
        stock_status: stockStatus,
        total_value: totalValue,
        available_value: availableValue,
        available_stock: availableQty,
        reserved_stock: reservedQty,
        physical_stock: stockQty,
        reorder_point: 10 // Default, could be from database if available
      }
    }) || []

    // Generate CSV
    if (format === 'csv') {
      const csvHeaders = [
        'SKU',
        'Product Name',
        'Category',
        'Physical Stock',
        'Reserved Stock',
        'Available Stock',
        'Stock Status',
        'Unit Price (UGX)',
        'Total Value (UGX)',
        'Available Value (UGX)',
        'Reorder Point',
        'Product Status',
        'Created Date',
        'Last Updated'
      ]

      const csvRows = inventoryData.map(item => {
        const createdDate = item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
        const updatedDate = item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ''

        return [
          item.sku || 'N/A',
          item.name || '',
          item.category_name || 'Uncategorized',
          item.physical_stock || 0,
          item.reserved_stock || 0,
          item.available_stock || 0,
          item.stock_status || 'unknown',
          item.price || 0,
          item.total_value || 0,
          item.available_value || 0,
          item.reorder_point || 10,
          item.status || 'active',
          createdDate,
          updatedDate
        ]
      })

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
          'Content-Disposition': `attachment; filename="inventory-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // JSON format
    return NextResponse.json({
      exportDate: new Date().toISOString(),
      filters: {
        status,
        search
      },
      totalItems: inventoryData.length,
      inventory: inventoryData
    })

  } catch (error) {
    console.error('Inventory export API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

