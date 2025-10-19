"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TopProductsChartProps {
  data: Array<{
    name: string
    sales: number
    revenue: number
    growth?: number
  }>
  height?: number
}

export function TopProductsChart({ data, height = 300 }: TopProductsChartProps) {
  const chartData = data.map((product, index) => ({
    ...product,
    shortName: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
    rank: index + 1
  }))

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            type="number"
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          <YAxis 
            type="category"
            dataKey="shortName"
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => [
              name === 'revenue' ? `${value.toLocaleString()} UGX` : value,
              name === 'revenue' ? 'Revenue' : name === 'sales' ? 'Sales' : name
            ]}
            labelStyle={{ color: '#374151', fontWeight: '600' }}
            labelFormatter={(label) => `Product: ${label}`}
          />
          <Bar 
            dataKey="revenue" 
            fill="#8B5CF6"
            radius={[0, 4, 4, 0]}
            name="Revenue"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
