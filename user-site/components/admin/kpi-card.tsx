"use client"

import { memo } from "react"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { Sparkline } from "./sparkline"

/**
 * KPI Card Component
 * 
 * Displays a single KPI metric with:
 * - Title and icon
 * - Main numeric value (formatted)
 * - Trend indicator (up/down)
 * - Percentage change vs previous period
 * - Sparkline chart
 * - Smooth animations on data updates
 */
export interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number // Percentage change
    period: string // e.g., "vs last week"
  }
  sparklineData?: number[] // Array of values for sparkline chart
  description?: string
  color?: "blue" | "emerald" | "purple" | "amber" | "orange" | "red"
  isLoading?: boolean
  className?: string
}

const colorConfig = {
  blue: {
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    border: "border-blue-200",
    gradient: "from-blue-500/10 to-blue-600/5",
    trendUp: "text-blue-600",
    trendDown: "text-blue-600"
  },
  emerald: {
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    border: "border-emerald-200",
    gradient: "from-emerald-500/10 to-emerald-600/5",
    trendUp: "text-emerald-600",
    trendDown: "text-emerald-600"
  },
  purple: {
    bg: "bg-purple-50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    border: "border-purple-200",
    gradient: "from-purple-500/10 to-purple-600/5",
    trendUp: "text-purple-600",
    trendDown: "text-purple-600"
  },
  amber: {
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    border: "border-amber-200",
    gradient: "from-amber-500/10 to-amber-600/5",
    trendUp: "text-amber-600",
    trendDown: "text-amber-600"
  },
  orange: {
    bg: "bg-orange-50",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    border: "border-orange-200",
    gradient: "from-orange-500/10 to-orange-600/5",
    trendUp: "text-orange-600",
    trendDown: "text-orange-600"
  },
  red: {
    bg: "bg-red-50",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    border: "border-red-200",
    gradient: "from-red-500/10 to-red-600/5",
    trendUp: "text-red-600",
    trendDown: "text-red-600"
  }
}

export const KpiCard = memo(function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  sparklineData,
  description,
  color = "blue",
  isLoading = false,
  className = ""
}: KpiCardProps) {
  const colors = colorConfig[color]
  const isPositive = trend ? trend.value >= 0 : true
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border ${colors.border} p-6 animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className={`h-10 w-10 rounded-xl ${colors.bg}`}></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
        {sparklineData && (
          <div className="mt-4 h-12 bg-gray-200 rounded"></div>
        )}
      </div>
    )
  }

  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border ${colors.border} p-6 hover:shadow-md transition-all duration-300 group relative overflow-hidden ${className}`}
    >
      {/* Gradient Background on Hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      <div className="relative">
        {/* Header: Title and Icon */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {title}
          </h3>
          <div className={`${colors.iconBg} p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-5 w-5 ${colors.iconColor}`} />
          </div>
        </div>

        {/* Main Value */}
        <div className="mb-3">
          <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center gap-2 mb-3">
            <div className={`flex items-center text-xs font-semibold ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendIcon className="h-3 w-3 mr-1" />
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
            </div>
            <span className="text-xs text-gray-500">{trend.period}</span>
          </div>
        )}

        {/* Sparkline Chart */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 h-12">
            <Sparkline 
              data={sparklineData} 
              color={colors.iconColor.replace('text-', '')}
              isPositive={isPositive}
            />
          </div>
        )}
      </div>
    </div>
  )
})

