"use client"

import { useKpiData } from "@/hooks/admin/use-kpi-data"
import { KpiCard } from "./kpi-card"
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle 
} from "lucide-react"

/**
 * Header Summary Component
 * 
 * Displays 6 KPI cards in a responsive grid:
 * 1. Total Sales (Today / This Month)
 * 2. Total Orders
 * 3. Average Order Value (AOV)
 * 4. Returning Customers %
 * 5. Pending Orders
 * 6. Low Stock Items
 * 
 * All cards update in real-time with smooth animations.
 */
export function HeaderSummary() {
  const { metrics, loading, error } = useKpiData({
    enableRealtime: true,
    pollingInterval: 30000, // 30 seconds
    lowStockThreshold: 5
  })

  if (error && !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="col-span-full bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold">Error loading KPI data</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString()}`
  }

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* 1. Total Sales (Today / This Month) */}
      <KpiCard
        title="Total Sales"
        value={metrics ? formatCurrency(metrics.monthlySales) : "UGX 0"}
        icon={DollarSign}
        description={`Today: ${metrics ? formatCurrency(metrics.todaySales) : "UGX 0"}`}
        trend={metrics ? {
          value: metrics.monthlySalesChange,
          period: "vs last month"
        } : undefined}
        sparklineData={metrics?.salesSparkline}
        color="blue"
        isLoading={loading}
      />

      {/* 2. Total Orders */}
      <KpiCard
        title="Total Orders"
        value={metrics?.totalOrders.toLocaleString() || "0"}
        icon={ShoppingCart}
        description="All time orders"
        trend={metrics ? {
          value: metrics.ordersChange,
          period: "vs last week"
        } : undefined}
        sparklineData={metrics?.ordersSparkline}
        color="emerald"
        isLoading={loading}
      />

      {/* 3. Average Order Value (AOV) */}
      <KpiCard
        title="Average Order Value"
        value={metrics ? formatCurrency(metrics.averageOrderValue) : "UGX 0"}
        icon={TrendingUp}
        description="Per completed order"
        trend={metrics ? {
          value: metrics.aovChange,
          period: "vs last month"
        } : undefined}
        sparklineData={metrics?.salesSparkline.map((_, i) => 
          metrics && metrics.ordersSparkline[i] > 0 
            ? metrics.salesSparkline[i] / metrics.ordersSparkline[i] 
            : 0
        )}
        color="purple"
        isLoading={loading}
      />

      {/* 4. Returning Customers % */}
      <KpiCard
        title="Returning Customers"
        value={metrics ? formatPercent(metrics.returningCustomersPercent) : "0%"}
        icon={Users}
        description="Customers with multiple orders"
        trend={metrics ? {
          value: metrics.returningCustomersChange,
          period: "vs last month"
        } : undefined}
        color="amber"
        isLoading={loading}
      />

      {/* 5. Pending Orders */}
      <KpiCard
        title="Pending Orders"
        value={metrics?.pendingOrders.toString() || "0"}
        icon={Clock}
        description="Awaiting processing"
        trend={metrics ? {
          value: metrics.pendingOrdersChange,
          period: "vs last week"
        } : undefined}
        color="orange"
        isLoading={loading}
      />

      {/* 6. Low Stock Items */}
      <KpiCard
        title="Low Stock Items"
        value={metrics?.lowStockItems.toString() || "0"}
        icon={AlertTriangle}
        description="Items below threshold"
        trend={metrics ? {
          value: metrics.lowStockItemsChange,
          period: "vs last week"
        } : undefined}
        color="red"
        isLoading={loading}
      />
    </div>
  )
}

