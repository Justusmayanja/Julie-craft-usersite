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

    // For now, allow access without authentication for admin analytics
    // In production, you might want to check for admin role
    if (!authenticatedUserId) {
      console.log('No authentication provided, allowing access to analytics')
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

    // Get overall metrics
    const [
      totalRevenueResult,
      totalOrdersResult,
      totalCustomersResult,
      avgOrderValueResult,
      topProductsResult,
      categoryPerformanceResult,
      salesTrendResult
    ] = await Promise.all([
      // Total Revenue
      supabaseAdmin
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered')
        .gte('order_date', dateFrom.toISOString())
        .lte('order_date', dateTo.toISOString()),

      // Total Orders
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact' })
        .gte('order_date', dateFrom.toISOString())
        .lte('order_date', dateTo.toISOString()),

      // Total Customers
      supabaseAdmin
        .from('customers')
        .select('id', { count: 'exact' })
        .gte('join_date', dateFrom.toISOString())
        .lte('join_date', dateTo.toISOString()),

      // Average Order Value
      supabaseAdmin
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered')
        .gte('order_date', dateFrom.toISOString())
        .lte('order_date', dateTo.toISOString()),

      // Top Products
      supabaseAdmin
        .from('order_items')
        .select(`
          product_name,
          quantity,
          unit_price,
          total_price,
          order:orders!inner(status, order_date)
        `)
        .eq('order.status', 'delivered')
        .gte('order.order_date', dateFrom.toISOString())
        .lte('order.order_date', dateTo.toISOString()),

      // Category Performance
      supabaseAdmin
        .from('order_items')
        .select(`
          product_name,
          total_price,
          order:orders!inner(status, order_date)
        `)
        .eq('order.status', 'delivered')
        .gte('order.order_date', dateFrom.toISOString())
        .lte('order.order_date', dateTo.toISOString()),

      // Sales Trend (monthly data)
      supabaseAdmin
        .from('orders')
        .select('total_amount, order_date')
        .eq('status', 'delivered')
        .gte('order_date', dateFrom.toISOString())
        .lte('order_date', dateTo.toISOString())
        .order('order_date', { ascending: true })
    ])

    // Calculate total revenue
    const totalRevenue = totalRevenueResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0

    // Calculate total orders
    const totalOrders = totalOrdersResult.count || 0

    // Calculate total customers
    const totalCustomers = totalCustomersResult.count || 0

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Process top products
    const productSales = new Map<string, { sales: number; revenue: number; name: string }>()
    topProductsResult.data?.forEach(item => {
      const productName = item.product_name
      if (productSales.has(productName)) {
        const existing = productSales.get(productName)!
        existing.sales += item.quantity
        existing.revenue += Number(item.total_price)
      } else {
        productSales.set(productName, {
          sales: item.quantity,
          revenue: Number(item.total_price),
          name: productName
        })
      }
    })

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Process category performance (simplified - using product names as categories)
    const categoryMap = new Map<string, number>()
    categoryPerformanceResult.data?.forEach(item => {
      // Simple category mapping based on product name keywords
      let category = 'Other'
      const productName = item.product_name.toLowerCase()
      
      if (productName.includes('ceramic') || productName.includes('bowl') || productName.includes('vase')) {
        category = 'Pottery'
      } else if (productName.includes('bracelet') || productName.includes('earring') || productName.includes('necklace')) {
        category = 'Jewelry'
      } else if (productName.includes('blanket') || productName.includes('scarf') || productName.includes('textile')) {
        category = 'Textiles'
      } else if (productName.includes('wood') || productName.includes('carved') || productName.includes('cutting')) {
        category = 'Woodwork'
      }

      categoryMap.set(category, (categoryMap.get(category) || 0) + Number(item.total_price))
    })

    const categoryPerformance = Array.from(categoryMap.entries())
      .map(([name, revenue]) => ({
        name,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
        growth: 0 // Would need historical data to calculate growth
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // Process sales trend (monthly aggregation)
    const monthlySales = new Map<string, { revenue: number; orders: number; customers: number }>()
    salesTrendResult.data?.forEach(order => {
      const month = new Date(order.order_date).toISOString().substring(0, 7) // YYYY-MM format
      if (monthlySales.has(month)) {
        const existing = monthlySales.get(month)!
        existing.revenue += Number(order.total_amount)
        existing.orders += 1
      } else {
        monthlySales.set(month, {
          revenue: Number(order.total_amount),
          orders: 1,
          customers: 0 // Would need more complex logic to track unique customers per month
        })
      }
    })

    const salesTrend = Array.from(monthlySales.entries())
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        revenue: data.revenue,
        orders: data.orders,
        customers: data.customers
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    // Calculate growth rates (simplified - would need historical data for accurate calculation)
    const previousPeriodRevenue = totalRevenue * 0.85 // Mock previous period data
    const revenueGrowth = previousPeriodRevenue > 0 ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : 0

    const previousPeriodOrders = totalOrders * 0.9
    const ordersGrowth = previousPeriodOrders > 0 ? ((totalOrders - previousPeriodOrders) / previousPeriodOrders) * 100 : 0

    const previousPeriodCustomers = totalCustomers * 0.88
    const customersGrowth = previousPeriodCustomers > 0 ? ((totalCustomers - previousPeriodCustomers) / previousPeriodCustomers) * 100 : 0

    const previousPeriodAOV = avgOrderValue * 0.95
    const aovGrowth = previousPeriodAOV > 0 ? ((avgOrderValue - previousPeriodAOV) / previousPeriodAOV) * 100 : 0

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
