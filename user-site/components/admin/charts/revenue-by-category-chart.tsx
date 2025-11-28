"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useRealtimeAnalytics } from "@/hooks/admin/use-realtime-analytics"
import { formatCurrency } from "@/lib/analytics-helpers"
import { Loader2 } from "lucide-react"

interface RevenueByCategoryChartProps {
  height?: number
  timeRange?: {
    start: Date
    end: Date
  }
}

/**
 * Revenue by Category Chart
 * 
 * Real-time donut chart showing revenue breakdown by product category.
 * Calculates revenue from order_items joined with products.
 */
export function RevenueByCategoryChart({ height = 300, timeRange }: RevenueByCategoryChartProps) {
  const { orders, orderItems, products, loading, error } = useRealtimeAnalytics({ 
    timeRange, 
    enableRealtime: true 
  })

  const chartData = useMemo(() => {
    if (!orderItems || orderItems.length === 0 || !products || products.length === 0) return []

    // Create product category map
    // Use category_name if available, otherwise fallback to 'Uncategorized'
    const productCategoryMap = new Map<string, string>()
    products.forEach(p => {
      if (p.id) {
        const category = (p as any).category_name || 'Uncategorized'
        productCategoryMap.set(p.id, category)
      }
    })

    // Calculate revenue by category
    const categoryRevenue = new Map<string, number>()

    // Only include completed/paid orders
    const completedOrderIds = new Set(
      orders
        .filter(o => o.status === 'delivered' || o.status === 'completed' || o.payment_status === 'paid')
        .map(o => o.id)
    )

    orderItems.forEach(item => {
      if (!completedOrderIds.has(item.order_id)) return

      const category = productCategoryMap.get(item.product_id) || 'Uncategorized'
      const revenue = Number(item.price || item.total_price || item.unit_price || 0) * (item.quantity || 0)
      
      const current = categoryRevenue.get(category) || 0
      categoryRevenue.set(category, current + revenue)
    })

    // Convert to array and calculate percentages
    const total = Array.from(categoryRevenue.values()).reduce((sum, val) => sum + val, 0)
    
    const data = Array.from(categoryRevenue.entries())
      .map(([category, revenue]) => ({
        name: category,
        value: revenue,
        percentage: total > 0 ? (revenue / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)

    // Generate colors
    const colors = [
      '#3B82F6', // blue
      '#10B981', // emerald
      '#8B5CF6', // purple
      '#F59E0B', // amber
      '#EF4444', // red
      '#06B6D4', // cyan
      '#EC4899', // pink
      '#84CC16', // lime
    ]

    return data.map((item, index) => ({
      ...item,
      color: colors[index % colors.length]
    }))
  }, [orders, orderItems, products])

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
        <p>No revenue data available</p>
      </div>
    )
  }

  // Calculate responsive radius based on height
  const chartHeight = height || 300
  const outerRadius = Math.min(80, (chartHeight - 100) / 2) // Reserve space for legend and padding
  const innerRadius = outerRadius * 0.4 // Donut hole

  return (
    <div className="w-full h-full min-h-0 overflow-visible" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, bottom: 60, left: 10 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={({ name, percentage }) => {
              // Only show label if percentage is significant (> 5%)
              if (percentage < 5) return ''
              return `${name}: ${percentage.toFixed(1)}%`
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
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend 
            verticalAlign="bottom"
            height={50}
            iconType="circle"
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

