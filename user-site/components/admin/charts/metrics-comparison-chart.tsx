"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface MetricsComparisonChartProps {
  data: Array<{
    month: string
    revenue: number
    orders: number
    customers: number
  }>
  height?: number
}

export function MetricsComparisonChart({ data, height = 300 }: MetricsComparisonChartProps) {
  // Normalize data for comparison (convert to percentages of max values)
  const maxRevenue = Math.max(...data.map(d => d.revenue))
  const maxOrders = Math.max(...data.map(d => d.orders))
  const maxCustomers = Math.max(...data.map(d => d.customers))

  const normalizedData = data.map(item => ({
    ...item,
    revenueNormalized: (item.revenue / maxRevenue) * 100,
    ordersNormalized: (item.orders / maxOrders) * 100,
    customersNormalized: (item.customers / maxCustomers) * 100,
  }))

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="month" 
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
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}%`,
              name === 'revenueNormalized' ? 'Revenue' : 
              name === 'ordersNormalized' ? 'Orders' : 'Customers'
            ]}
            labelStyle={{ color: '#374151', fontWeight: '600' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="revenueNormalized" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            name="Revenue"
          />
          <Line 
            type="monotone" 
            dataKey="ordersNormalized" 
            stroke="#10B981" 
            strokeWidth={3}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            name="Orders"
          />
          <Line 
            type="monotone" 
            dataKey="customersNormalized" 
            stroke="#F59E0B" 
            strokeWidth={3}
            dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
            name="Customers"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
