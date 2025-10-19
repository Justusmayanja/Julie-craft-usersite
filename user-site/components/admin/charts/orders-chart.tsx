"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface OrdersChartProps {
  data: Array<{
    month: string
    revenue: number
    orders: number
    customers: number
  }>
  height?: number
}

export function OrdersChart({ data, height = 300 }: OrdersChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => [
              value,
              name === 'orders' ? 'Orders' : name === 'customers' ? 'Customers' : name
            ]}
            labelStyle={{ color: '#374151', fontWeight: '600' }}
          />
          <Bar 
            dataKey="orders" 
            fill="#10B981"
            radius={[4, 4, 0, 0]}
            name="Orders"
          />
          <Bar 
            dataKey="customers" 
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            name="Customers"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
