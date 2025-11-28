import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

/**
 * KPI Data API Route
 * 
 * Fetches KPI metrics using admin privileges (bypasses RLS)
 * Used by the KPI data hook for fetching metrics
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
    const lowStockThreshold = searchParams.get('lowStockThreshold') 
      ? parseInt(searchParams.get('lowStockThreshold')!) 
      : 5

    // Calculate date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(thisWeekStart)
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)

    // Last 7 days for sparklines
    const sparklineDays: Date[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      sparklineDays.push(date)
    }

    // Fetch all orders
    const { data: allOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount, status, created_at, user_id')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Orders fetch error:', ordersError)
      return NextResponse.json({ 
        error: 'Failed to fetch orders',
        details: ordersError.message 
      }, { status: 500 })
    }

    // Fetch today's orders
    const { data: todayOrders } = await supabaseAdmin
      .from('orders')
      .select('total_amount, status')
      .gte('created_at', today.toISOString())
      .eq('status', 'delivered')

    // Fetch yesterday's orders
    const { data: yesterdayOrders } = await supabaseAdmin
      .from('orders')
      .select('total_amount, status')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString())
      .eq('status', 'delivered')

    // Fetch this month's orders
    const { data: thisMonthOrders } = await supabaseAdmin
      .from('orders')
      .select('total_amount, status')
      .gte('created_at', thisMonthStart.toISOString())
      .eq('status', 'delivered')

    // Fetch last month's orders
    const { data: lastMonthOrders } = await supabaseAdmin
      .from('orders')
      .select('total_amount, status')
      .gte('created_at', lastMonthStart.toISOString())
      .lt('created_at', thisMonthStart.toISOString())
      .eq('status', 'delivered')

    // Fetch this week's orders
    const { data: thisWeekOrders } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .gte('created_at', thisWeekStart.toISOString())

    // Fetch last week's orders
    const { data: lastWeekOrders } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .gte('created_at', lastWeekStart.toISOString())
      .lt('created_at', thisWeekStart.toISOString())

    // Fetch pending orders
    const { data: pendingOrders } = await supabaseAdmin
      .from('orders')
      .select('id, status, created_at')
      .in('status', ['pending', 'processing'])

    // Fetch last week's pending orders
    const { data: lastWeekPending } = await supabaseAdmin
      .from('orders')
      .select('id, status, created_at')
      .in('status', ['pending', 'processing'])
      .gte('created_at', lastWeekStart.toISOString())
      .lt('created_at', thisWeekStart.toISOString())

    // Fetch products for low stock
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, stock_quantity')

    // Calculate metrics
    const todaySales = todayOrders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0
    const yesterdaySales = yesterdayOrders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0
    const monthlySales = thisMonthOrders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0
    const lastMonthSales = lastMonthOrders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0

    const totalOrders = allOrders?.length || 0
    const completedOrders = allOrders?.filter(o => o.status === 'delivered').length || 0
    const thisWeekOrdersCount = thisWeekOrders?.length || 0
    const lastWeekOrdersCount = lastWeekOrders?.length || 0

    const pendingCount = pendingOrders?.length || 0
    const lastWeekPendingCount = lastWeekPending?.length || 0

    const lowStockCount = products?.filter(p => (Number(p.stock_quantity) || 0) < lowStockThreshold).length || 0
    const lastWeekLowStock = products?.filter(p => (Number(p.stock_quantity) || 0) < lowStockThreshold).length || 0 // Simplified

    // Calculate AOV
    const totalRevenue = allOrders
      ?.filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0
    const aov = completedOrders > 0 ? totalRevenue / completedOrders : 0

    // Calculate last month AOV for comparison
    const lastMonthCompleted = lastMonthOrders?.length || 0
    const lastMonthRevenue = lastMonthOrders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0
    const lastMonthAov = lastMonthCompleted > 0 ? lastMonthRevenue / lastMonthCompleted : 0

    // Calculate returning customers
    const customerIds = new Set(allOrders?.map(o => o.user_id).filter(Boolean) || [])
    const returningCustomerIds = new Set<string>()
    
    allOrders?.forEach(order => {
      if (order.user_id) {
        const userOrders = allOrders.filter(o => o.user_id === order.user_id)
        if (userOrders.length > 1) {
          returningCustomerIds.add(order.user_id)
        }
      }
    })

    const totalCustomers = customerIds.size
    const returningCustomers = returningCustomerIds.size
    const returningCustomersPercent = totalCustomers > 0 
      ? (returningCustomers / totalCustomers) * 100 
      : 0

    // Calculate last month returning customers (simplified - using same calculation)
    const lastMonthReturningPercent = returningCustomersPercent // Simplified

    // Generate sparkline data (last 7 days)
    const salesSparkline: number[] = []
    const ordersSparkline: number[] = []

    for (const day of sparklineDays) {
      const dayStart = new Date(day)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      const dayOrders = allOrders?.filter(o => {
        const orderDate = new Date(o.created_at)
        return orderDate >= dayStart && orderDate <= dayEnd && o.status === 'delivered'
      }) || []

      const daySales = dayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
      salesSparkline.push(daySales)
      ordersSparkline.push(dayOrders.length)
    }

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const todaySalesChange = calculateChange(todaySales, yesterdaySales)
    const monthlySalesChange = calculateChange(monthlySales, lastMonthSales)
    const ordersChange = calculateChange(thisWeekOrdersCount, lastWeekOrdersCount)
    const aovChange = calculateChange(aov, lastMonthAov)
    const returningCustomersChange = calculateChange(returningCustomersPercent, lastMonthReturningPercent)
    const pendingOrdersChange = calculateChange(pendingCount, lastWeekPendingCount)
    const lowStockItemsChange = 0 // Simplified

    return NextResponse.json({
      todaySales,
      monthlySales,
      todaySalesChange,
      monthlySalesChange,
      totalOrders,
      ordersChange,
      averageOrderValue: aov,
      aovChange,
      returningCustomersPercent,
      returningCustomersChange,
      pendingOrders: pendingCount,
      pendingOrdersChange,
      lowStockItems: lowStockCount,
      lowStockItemsChange,
      salesSparkline,
      ordersSparkline
    })

  } catch (error) {
    console.error('KPI API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

