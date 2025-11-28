"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { useRealtimeAnalytics } from "@/hooks/admin/use-realtime-analytics"
import { groupByDay, groupByWeek, groupByMonth, detectTimeGrouping, calculateTrend, formatCurrency } from "@/lib/analytics-helpers"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"

interface SalesOverTimeChartProps {
  height?: number
  timeRange?: {
    start: Date
    end: Date
  }
}

/**
 * Sales Over Time Chart
 * 
 * Real-time line chart showing sales revenue over time.
 * Only includes completed/paid orders.
 * Auto-detects grouping (day/week/month) based on data range.
 */
export function SalesOverTimeChart({ height = 300, timeRange }: SalesOverTimeChartProps) {
  const { orders, loading, error } = useRealtimeAnalytics({ timeRange, enableRealtime: true })

  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) return []

    // Filter completed/paid orders
    const completedOrders = orders.filter(o => 
      o.status === 'delivered' || 
      o.status === 'completed' || 
      o.payment_status === 'paid'
    )

    if (completedOrders.length === 0) return []

    // Detect grouping
    const grouping = detectTimeGrouping(completedOrders)
    
    // Group data
    let grouped: Array<{ date: string; sales: number; label?: string }>
    
    if (grouping === 'day') {
      grouped = groupByDay(completedOrders, o => Number(o.total_amount) || 0)
    } else if (grouping === 'week') {
      grouped = groupByWeek(completedOrders, o => Number(o.total_amount) || 0)
    } else {
      grouped = groupByMonth(completedOrders, o => Number(o.total_amount) || 0)
    }

    return grouped.map(item => ({
      date: item.label || item.date,
      sales: item.value
    }))
  }, [orders])

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return null
    
    const currentPeriod = chartData.slice(-1)[0]?.sales || 0
    const previousPeriod = chartData.slice(-2, -1)[0]?.sales || 0
    
    return calculateTrend(currentPeriod, previousPeriod)
  }, [chartData])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-red-600" style={{ height }}>
        <p>Error loading chart: {error}</p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500" style={{ height }}>
        <p>No sales data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Trend Indicator */}
      {trend && (
        <div className="flex items-center gap-2">
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value.toFixed(1)}% {trend.isPositive ? 'increase' : 'decrease'} vs previous period
          </span>
        </div>
      )}

      {/* Chart */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Sales']}
              labelStyle={{ color: '#374151', fontWeight: '600' }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="url(#salesGradient)"
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

