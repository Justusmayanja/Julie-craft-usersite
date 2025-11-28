"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useRealtimeAnalytics } from "@/hooks/admin/use-realtime-analytics"
import { groupByDay, groupByWeek, detectTimeGrouping, getStatusColor } from "@/lib/analytics-helpers"
import { Loader2 } from "lucide-react"

interface OrdersOverTimeChartProps {
  height?: number
  timeRange?: {
    start: Date
    end: Date
  }
}

/**
 * Orders Over Time Chart
 * 
 * Real-time bar chart showing order volume over time,
 * color-coded by status (pending, processing, completed, cancelled).
 */
export function OrdersOverTimeChart({ height = 300, timeRange }: OrdersOverTimeChartProps) {
  const { orders, loading, error } = useRealtimeAnalytics({ timeRange, enableRealtime: true })

  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) return []

    // Detect grouping
    const grouping = detectTimeGrouping(orders)
    
    // Group by date and status
    const grouped = new Map<string, {
      date: string
      pending: number
      processing: number
      completed: number
      cancelled: number
      shipped: number
      delivered: number
    }>()

    orders.forEach(order => {
      const date = new Date(order.created_at)
      let dateKey: string
      
      if (grouping === 'day') {
        dateKey = date.toISOString().split('T')[0]
      } else {
        // Week grouping
        const weekStart = new Date(date)
        const day = weekStart.getDay()
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
        weekStart.setDate(diff)
        dateKey = weekStart.toISOString().split('T')[0]
      }

      const existing = grouped.get(dateKey) || {
        date: dateKey,
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        shipped: 0,
        delivered: 0
      }

      const status = order.status?.toLowerCase() || 'pending'
      
      if (status === 'pending') existing.pending++
      else if (status === 'processing') existing.processing++
      else if (status === 'completed' || status === 'delivered') existing.completed++
      else if (status === 'cancelled') existing.cancelled++
      else if (status === 'shipped') existing.shipped++
      else if (status === 'delivered') existing.delivered++

      grouped.set(dateKey, existing)
    })

    return Array.from(grouped.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }))
  }, [orders])

  const statusColors = {
    pending: getStatusColor('pending'),
    processing: getStatusColor('processing'),
    completed: getStatusColor('delivered'),
    cancelled: getStatusColor('cancelled'),
    shipped: getStatusColor('shipped'),
    delivered: getStatusColor('delivered')
  }

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

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend />
          <Bar dataKey="pending" stackId="a" fill={statusColors.pending} name="Pending" />
          <Bar dataKey="processing" stackId="a" fill={statusColors.processing} name="Processing" />
          <Bar dataKey="shipped" stackId="a" fill={statusColors.shipped} name="Shipped" />
          <Bar dataKey="delivered" stackId="a" fill={statusColors.delivered} name="Delivered" />
          <Bar dataKey="completed" stackId="a" fill={statusColors.completed} name="Completed" />
          <Bar dataKey="cancelled" stackId="a" fill={statusColors.cancelled} name="Cancelled" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

