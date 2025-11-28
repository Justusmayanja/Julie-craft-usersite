"use client"

import { LineChart, Line, Area, ResponsiveContainer, Tooltip, AreaChart } from "recharts"

/**
 * Sparkline Chart Component
 * 
 * A minimal, elegant sparkline chart for KPI cards.
 * Shows trend data in a compact format without axes or labels.
 */
interface SparklineProps {
  data: number[]
  color?: string
  isPositive?: boolean
  height?: number
}

export function Sparkline({ 
  data, 
  color = "blue-600", 
  isPositive = true,
  height = 48 
}: SparklineProps) {
  // Transform data for Recharts
  const chartData = data.map((value, index) => ({
    value,
    index
  }))

  // Determine stroke color based on trend
  const strokeColor = isPositive 
    ? (color.includes('blue') ? '#2563eb' : 
       color.includes('emerald') ? '#059669' :
       color.includes('purple') ? '#9333ea' :
       color.includes('amber') ? '#d97706' :
       color.includes('orange') ? '#ea580c' :
       color.includes('red') ? '#dc2626' : '#2563eb')
    : '#dc2626' // Red for negative trends

  // Calculate gradient stops based on trend
  const gradientId = `sparkline-gradient-${color}-${isPositive ? 'up' : 'down'}`
  
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 shadow-lg">
                    {payload[0].value?.toLocaleString()}
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={true}
            animationDuration={800}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

