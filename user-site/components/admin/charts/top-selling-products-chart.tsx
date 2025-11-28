"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useRealtimeAnalytics } from "@/hooks/admin/use-realtime-analytics"
import { sortTopSelling, formatCurrency } from "@/lib/analytics-helpers"
import { Loader2 } from "lucide-react"

interface TopSellingProductsChartProps {
  height?: number
  limit?: number
  sortBy?: 'quantity' | 'revenue'
  timeRange?: {
    start: Date
    end: Date
  }
}

/**
 * Top Selling Products Chart
 * 
 * Real-time horizontal bar chart showing top selling products
 * by quantity sold or revenue generated.
 */
export function TopSellingProductsChart({ 
  height = 400, 
  limit = 10,
  sortBy = 'quantity',
  timeRange 
}: TopSellingProductsChartProps) {
  const { orders, orderItems, products, loading, error } = useRealtimeAnalytics({ 
    timeRange, 
    enableRealtime: true 
  })

  const chartData = useMemo(() => {
    if (!orderItems || orderItems.length === 0) return []

    // Only include completed/paid orders
    const completedOrderIds = new Set(
      orders
        .filter(o => o.status === 'delivered' || o.status === 'completed' || o.payment_status === 'paid')
        .map(o => o.id)
    )

    // Aggregate product sales
    const productSales = new Map<string, {
      id: string
      name: string
      quantity: number
      revenue: number
      image?: string
    }>()

    orderItems.forEach(item => {
      if (!completedOrderIds.has(item.order_id)) return

      const productId = item.product_id
      const existing = productSales.get(productId) || {
        id: productId,
        name: item.product_name || 'Unknown Product',
        quantity: 0,
        revenue: 0,
        image: undefined
      }

      existing.quantity += item.quantity || 0
      existing.revenue += Number(item.price || item.total_price || item.unit_price || 0) * (item.quantity || 0)

      // Get product image if available
      const product = products.find(p => p.id === productId)
      if (product && !existing.image) {
        // Image would be in product data if available
      }

      productSales.set(productId, existing)
    })

    // Sort and limit
    const sorted = sortTopSelling(Array.from(productSales.values()), sortBy, limit)

    return sorted.map(item => ({
      name: item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name,
      quantity: item.quantity,
      revenue: item.revenue
    }))
  }, [orders, orderItems, products, limit, sortBy])

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
        <p>No product sales data available</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            type="number"
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => sortBy === 'quantity' ? value.toString() : formatCurrency(value)}
          />
          <YAxis 
            type="category"
            dataKey="name"
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number) => 
              sortBy === 'quantity' 
                ? [`${value} units`, 'Quantity']
                : [formatCurrency(value), 'Revenue']
            }
          />
          <Bar 
            dataKey={sortBy === 'quantity' ? 'quantity' : 'revenue'} 
            fill="#3B82F6"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

