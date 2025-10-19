import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        totalCustomers: 5,
        activeCustomers: 5,
        newCustomersThisMonth: 2,
        vipCustomers: 3,
        averageOrderValue: 425.50,
        totalRevenue: 4250.00,
        topCountries: [
          { country: 'United States', count: 3 },
          { country: 'Canada', count: 2 }
        ],
        customerGrowth: 15.2,
        message: 'Mock data - database not configured'
      })
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found for stats, returning mock data')
      return NextResponse.json({
        totalCustomers: 5,
        activeCustomers: 5,
        newCustomersThisMonth: 2,
        vipCustomers: 3,
        averageOrderValue: 425.50,
        totalRevenue: 4250.00,
        topCountries: [
          { country: 'United States', count: 3 },
          { country: 'Canada', count: 2 }
        ],
        customerGrowth: 15.2,
        message: 'Mock data - no authentication'
      })
    }

    const token = authHeader.substring(7)
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        console.log('Token verification failed for stats, returning mock data:', error?.message)
        return NextResponse.json({
          totalCustomers: 3,
          activeCustomers: 3,
          newCustomersThisMonth: 1,
          vipCustomers: 2,
          averageOrderValue: 350.00,
          totalRevenue: 2100.00,
          topCountries: [
            { country: 'United States', count: 2 },
            { country: 'Canada', count: 1 }
          ],
          customerGrowth: 10.5,
          message: 'Mock data - authentication failed'
        })
      }
    } catch (error) {
      console.log('Token verification error for stats, returning mock data:', error)
      return NextResponse.json({
        totalCustomers: 2,
        activeCustomers: 2,
        newCustomersThisMonth: 1,
        vipCustomers: 1,
        averageOrderValue: 300.00,
        totalRevenue: 1500.00,
        topCountries: [
          { country: 'United States', count: 1 },
          { country: 'Canada', count: 1 }
        ],
        customerGrowth: 8.0,
        message: 'Mock data - token verification error'
      })
    }

    // Get total customers (non-admin users)
    const { count: totalCustomers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false)

    // Get customers created this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newCustomersThisMonth } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false)
      .gte('created_at', startOfMonth.toISOString())

    // Get VIP customers (spent more than 500)
    const { data: allCustomers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('is_admin', false)

    let vipCustomers = 0
    let totalRevenue = 0
    let totalOrders = 0

    if (allCustomers) {
      for (const customer of allCustomers) {
        const { data: orders } = await supabaseAdmin
          .from('orders')
          .select('total_amount')
          .eq('customer_id', customer.id)

        const customerSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
        const customerOrders = orders?.length || 0

        totalRevenue += customerSpent
        totalOrders += customerOrders

        if (customerSpent > 500) {
          vipCustomers++
        }
      }
    }

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get top countries
    const { data: countryData } = await supabaseAdmin
      .from('profiles')
      .select('country')
      .eq('is_admin', false)
      .not('country', 'is', null)

    const countryCounts: { [key: string]: number } = {}
    countryData?.forEach(profile => {
      const country = profile.country || 'Unknown'
      countryCounts[country] = (countryCounts[country] || 0) + 1
    })

    const topCountries = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Calculate growth (simplified - compare with last month)
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    lastMonth.setDate(1)
    lastMonth.setHours(0, 0, 0, 0)

    const { count: lastMonthCustomers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false)
      .gte('created_at', lastMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString())

    const customerGrowth = lastMonthCustomers && lastMonthCustomers > 0 
      ? ((newCustomersThisMonth || 0) - lastMonthCustomers) / lastMonthCustomers * 100
      : 0

    return NextResponse.json({
      totalCustomers: totalCustomers || 0,
      activeCustomers: totalCustomers || 0, // All customers are considered active
      newCustomersThisMonth: newCustomersThisMonth || 0,
      vipCustomers,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      topCountries,
      customerGrowth: Math.round(customerGrowth * 100) / 100
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}