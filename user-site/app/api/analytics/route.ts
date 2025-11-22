import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('Supabase not configured, returning mock analytics data')
      return NextResponse.json({
        metrics: {
          totalRevenue: 0,
          revenueGrowth: 0,
          totalOrders: 0,
          ordersGrowth: 0,
          totalCustomers: 0,
          customersGrowth: 0,
          avgOrderValue: 0,
          aovGrowth: 0,
          conversionRate: 0,
          conversionGrowth: 0,
          returnRate: 0,
          returnGrowth: 0
        },
        topProducts: [],
        categoryPerformance: [],
        salesTrend: [],
        timeRange: {
          from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
          period: '6months'
        },
        message: 'Database not configured'
      })
    }

    // Verify JWT token if provided
    const authHeader = request.headers.get('authorization')
    let authenticatedUserId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
        if (!error && user) {
          authenticatedUserId = user.id
        }
      } catch (error) {
        console.error('Token verification failed:', error)
      }
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '6months'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range based on timeRange parameter
    let dateFrom: Date
    let dateTo: Date = new Date()

    if (startDate && endDate) {
      dateFrom = new Date(startDate)
      dateTo = new Date(endDate)
    } else {
      switch (timeRange) {
        case '7days':
          dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30days':
          dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          break
        case '3months':
          dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          break
        case '6months':
          dateFrom = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
          break
        case '1year':
          dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          dateFrom = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      }
    }

    // Calculate previous period for growth comparison
    const periodDuration = dateTo.getTime() - dateFrom.getTime()
    const previousDateFrom = new Date(dateFrom.getTime() - periodDuration)
    const previousDateTo = dateFrom

    // Fetch current period data
    const [
      totalRevenueResult,
      totalOrdersResult,
      totalCustomersResult,
      avgOrderValueResult,
      topProductsResult,
      categoryPerformanceResult,
      salesTrendResult,
      // Previous period data for growth calculation
      previousRevenueResult,
      previousOrdersResult,
      previousCustomersResult,
      previousAOVResult
    ] = await Promise.all([
      // Current Period - Total Revenue
      supabaseAdmin
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered')
        .gte('order_date', dateFrom.toISOString())
        .lte('order_date', dateTo.toISOString()),

      // Current Period - Total Orders
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact' })
        .gte('order_date', dateFrom.toISOString())
        .lte('order_date', dateTo.toISOString()),

      // Current Period - Total Customers (using profiles)
      supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('is_admin', false)
        .gte('created_at', dateFrom.toISOString())
        .lte('created_at', dateTo.toISOString()),

      // Current Period - Average Order Value
      supabaseAdmin
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered')
        .gte('order_date', dateFrom.toISOString())
        .lte('order_date', dateTo.toISOString()),

      // Current Period - Top Products
      supabaseAdmin
        .from('order_items')
        .select(`
          product_name,
          quantity,
          price,
          total_price,
          product_id,
          order:orders!inner(status, order_date)
        `)
        .eq('order.status', 'delivered')
        .gte('order.order_date', dateFrom.toISOString())
        .lte('order.order_date', dateTo.toISOString()),

      // Current Period - Category Performance (with product categories)
      supabaseAdmin
        .from('order_items')
        .select(`
          product_id,
          total_price,
          order:orders!inner(status, order_date),
          product:products(category_id, category:categories(name))
        `)
        .eq('order.status', 'delivered')
        .gte('order.order_date', dateFrom.toISOString())
        .lte('order.order_date', dateTo.toISOString()),

      // Current Period - Sales Trend (with customer tracking)
      supabaseAdmin
        .from('orders')
        .select('total_amount, order_date, customer_id')
        .eq('status', 'delivered')
        .gte('order_date', dateFrom.toISOString())
        .lte('order_date', dateTo.toISOString())
        .order('order_date', { ascending: true }),

      // Previous Period - Revenue
      supabaseAdmin
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered')
        .gte('order_date', previousDateFrom.toISOString())
        .lte('order_date', previousDateTo.toISOString()),

      // Previous Period - Orders
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact' })
        .gte('order_date', previousDateFrom.toISOString())
        .lte('order_date', previousDateTo.toISOString()),

      // Previous Period - Customers
      supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('is_admin', false)
        .gte('created_at', previousDateFrom.toISOString())
        .lte('created_at', previousDateTo.toISOString()),

      // Previous Period - AOV
      supabaseAdmin
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered')
        .gte('order_date', previousDateFrom.toISOString())
        .lte('order_date', previousDateTo.toISOString())
    ])

    // Calculate current period metrics
    const totalRevenue = totalRevenueResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
    const totalOrders = totalOrdersResult.count || 0
    const totalCustomers = totalCustomersResult.count || 0
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate previous period metrics
    const previousRevenue = previousRevenueResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
    const previousOrders = previousOrdersResult.count || 0
    const previousCustomers = previousCustomersResult.count || 0
    const previousAOV = previousOrders > 0 ? previousRevenue / previousOrders : 0

    // Calculate growth rates
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const ordersGrowth = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0
    const customersGrowth = previousCustomers > 0 ? ((totalCustomers - previousCustomers) / previousCustomers) * 100 : 0
    const aovGrowth = previousAOV > 0 ? ((avgOrderValue - previousAOV) / previousAOV) * 100 : 0

    // Process top products
    const productSales = new Map<string, { sales: number; revenue: number; name: string }>()
    topProductsResult.data?.forEach(item => {
      const productName = item.product_name
      const itemRevenue = Number(item.total_price || item.price * item.quantity || 0)
      const itemQuantity = item.quantity || 0
      
      if (productSales.has(productName)) {
        const existing = productSales.get(productName)!
        existing.sales += itemQuantity
        existing.revenue += itemRevenue
      } else {
        productSales.set(productName, {
          sales: itemQuantity,
          revenue: itemRevenue,
          name: productName
        })
      }
    })

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(product => ({
        ...product,
        growth: 0 // Could calculate if we track historical product data
      }))

    // Process category performance using actual categories
    const categoryMap = new Map<string, number>()
    
    // Try to use actual categories from database
    if (categoryPerformanceResult.data && categoryPerformanceResult.data.length > 0) {
      categoryPerformanceResult.data.forEach(item => {
        const categoryName = item.product?.category?.name || 'Uncategorized'
        const itemRevenue = Number(item.total_price || 0)
        if (itemRevenue > 0) {
          categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + itemRevenue)
        }
      })
    }

    // If no categories found from database query, fall back to keyword-based categorization
    if (categoryMap.size === 0 && topProductsResult.data) {
      topProductsResult.data?.forEach(item => {
        let category = 'Other'
        const productName = item.product_name?.toLowerCase() || ''
        
        if (productName.includes('ceramic') || productName.includes('bowl') || productName.includes('vase')) {
          category = 'Pottery'
        } else if (productName.includes('bracelet') || productName.includes('earring') || productName.includes('necklace')) {
          category = 'Jewelry'
        } else if (productName.includes('blanket') || productName.includes('scarf') || productName.includes('textile')) {
          category = 'Textiles'
        } else if (productName.includes('wood') || productName.includes('carved') || productName.includes('cutting')) {
          category = 'Woodwork'
        }

        const itemRevenue = Number(item.total_price || item.price * item.quantity || 0)
        categoryMap.set(category, (categoryMap.get(category) || 0) + itemRevenue)
      })
    }

    const categoryPerformance = Array.from(categoryMap.entries())
      .map(([name, revenue]) => ({
        name,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
        growth: 0 // Could calculate if we track historical category data
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // Process sales trend (monthly aggregation with unique customers)
    const monthlySales = new Map<string, { revenue: number; orders: number; customers: Set<string> }>()
    salesTrendResult.data?.forEach(order => {
      const month = new Date(order.order_date).toISOString().substring(0, 7) // YYYY-MM format
      if (monthlySales.has(month)) {
        const existing = monthlySales.get(month)!
        existing.revenue += Number(order.total_amount)
        existing.orders += 1
        if (order.customer_id) {
          existing.customers.add(order.customer_id)
        }
      } else {
        const customersSet = new Set<string>()
        if (order.customer_id) {
          customersSet.add(order.customer_id)
        }
        monthlySales.set(month, {
          revenue: Number(order.total_amount),
          orders: 1,
          customers: customersSet
        })
      }
    })

    const salesTrend = Array.from(monthlySales.entries())
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: data.revenue,
        orders: data.orders,
        customers: data.customers.size
      }))
      .sort((a, b) => {
        // Sort by date properly
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })

    const analytics = {
      metrics: {
        totalRevenue,
        revenueGrowth,
        totalOrders,
        ordersGrowth,
        totalCustomers,
        customersGrowth,
        avgOrderValue,
        aovGrowth,
        conversionRate: 3.2, // Mock data - would need visitor tracking
        conversionGrowth: 0.5,
        returnRate: 2.1, // Mock data - would need return tracking
        returnGrowth: -0.3
      },
      topProducts,
      categoryPerformance,
      salesTrend,
      timeRange: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
        period: timeRange
      }
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
