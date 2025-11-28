"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useRealtimeAnalytics } from "@/hooks/admin/use-realtime-analytics"
import { getStatusColor } from "@/lib/analytics-helpers"
import { Loader2 } from "lucide-react"

interface OrderStatusDistributionChartProps {
  height?: number
  timeRange?: {
    start: Date
    end: Date
  }
}

/**
 * Order Status Distribution Chart
 * 
 * Real-time donut chart showing distribution of orders by status.
 * Categories: pending, processing, shipped, delivered, cancelled.
 */
export function OrderStatusDistributionChart({ height = 300, timeRange }: OrderStatusDistributionChartProps) {
  const { orders, loading, error } = useRealtimeAnalytics({ timeRange, enableRealtime: true })

  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) return []

    // Count orders by status
    const statusCounts = new Map<string, number>()
    const statusRevenue = new Map<string, number>()

    orders.forEach(order => {
      const status = order.status?.toLowerCase() || 'pending'
      const revenue = Number(order.total_amount) || 0

      statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
      statusRevenue.set(status, (statusRevenue.get(status) || 0) + revenue)
    })

    // Normalize status names
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled'
    }

    const data = Array.from(statusCounts.entries())
      .map(([status, count]) => ({
        name: statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        revenue: statusRevenue.get(status) || 0,
        color: getStatusColor(status)
      }))
      .sort((a, b) => b.value - a.value)

    return data
  }, [orders])

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
        <p>No orders data available</p>
      </div>
    )
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  // Calculate responsive radius based on height
  const chartHeight = height || 300
  const outerRadius = Math.min(80, (chartHeight - 100) / 2) // Reserve space for legend and padding
  const innerRadius = outerRadius * 0.5 // Donut hole

  return (
    <div className="w-full h-full min-h-0 overflow-visible" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, bottom: 60, left: 10 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={({ name, percent }) => {
              // Only show label if percentage is significant (> 5%)
              if (percent < 0.05) return ''
              return `${name}: ${(percent * 100).toFixed(1)}%`
            }}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} orders (${((value / total) * 100).toFixed(1)}%)`,
              props.payload.name
            ]}
          />
          <Legend 
            verticalAlign="bottom"
            height={50}
            iconType="circle"
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

