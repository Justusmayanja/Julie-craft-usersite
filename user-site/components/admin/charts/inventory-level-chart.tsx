"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useRealtimeAnalytics } from "@/hooks/admin/use-realtime-analytics"
import { getInventoryStatus } from "@/lib/analytics-helpers"
import { Loader2 } from "lucide-react"

interface InventoryLevelChartProps {
  height?: number
  threshold?: number
  limit?: number
}

/**
 * Inventory Level Chart
 * 
 * Real-time bar chart showing product inventory levels.
 * Highlights: in-stock (green), low stock < threshold (amber), out of stock (red).
 */
export function InventoryLevelChart({ 
  height = 400, 
  threshold = 5,
  limit = 20 
}: InventoryLevelChartProps) {
  const { products, loading, error } = useRealtimeAnalytics({ enableRealtime: true })

  const chartData = useMemo(() => {
    if (!products || products.length === 0) return []

    return products
      .map(product => {
        const quantity = product.stock_quantity || 0
        const status = getInventoryStatus(quantity, threshold)
        
        return {
          name: product.name?.length > 25 ? product.name.substring(0, 25) + '...' : product.name || 'Unknown',
          quantity,
          status: status.status,
          color: status.color
        }
      })
      .sort((a, b) => a.quantity - b.quantity) // Sort by quantity ascending
      .slice(0, limit) // Limit to top N
  }, [products, threshold, limit])

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
        <p>No inventory data available</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} units (${props.payload.status})`,
              'Stock'
            ]}
          />
          <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

