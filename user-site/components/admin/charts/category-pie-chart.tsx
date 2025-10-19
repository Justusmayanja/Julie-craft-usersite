"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface CategoryPieChartProps {
  data: Array<{
    name: string
    revenue: number
    percentage: number
    growth: number
  }>
  height?: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export function CategoryPieChart({ data, height = 300 }: CategoryPieChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length]
  }))

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="revenue"
            stroke="#fff"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => [
              `${value.toLocaleString()} UGX`,
              'Revenue'
            ]}
            labelStyle={{ color: '#374151', fontWeight: '600' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: '#374151', fontSize: '12px' }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
