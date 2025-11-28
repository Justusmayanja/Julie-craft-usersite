"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  BarChart3,
  TrendingUp,
  Download,
  RefreshCw,
  Calendar,
  FileDown,
  Loader2
} from "lucide-react"
import { HeaderSummary } from "@/components/admin/header-summary"
import { SalesOverTimeChart } from "@/components/admin/charts/sales-over-time-chart"
import { OrdersOverTimeChart } from "@/components/admin/charts/orders-over-time-chart"
import { RevenueByCategoryChart } from "@/components/admin/charts/revenue-by-category-chart"
import { OrderStatusDistributionChart } from "@/components/admin/charts/order-status-distribution-chart"
import { TopSellingProductsChart } from "@/components/admin/charts/top-selling-products-chart"
import { InventoryLevelChart } from "@/components/admin/charts/inventory-level-chart"

/**
 * Analytics Dashboard Page
 * 
 * Comprehensive real-time analytics dashboard with:
 * - KPI Header Summary
 * - Sales and Orders charts
 * - Revenue by Category
 * - Order Status Distribution
 * - Top Selling Products
 * - Inventory Levels
 */
export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<{
    start: Date
    end: Date
  }>(() => {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 1) // Last month by default
    return { start, end }
  })

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState("30")

  const timeRangeOptions = [
    { label: "Last 7 Days", days: 7, value: "7" },
    { label: "Last 30 Days", days: 30, value: "30" },
    { label: "Last 90 Days", days: 90, value: "90" },
    { label: "Last 6 Months", days: 180, value: "180" },
    { label: "Last Year", days: 365, value: "365" },
  ]

  const handleTimeRangeChange = (value: string) => {
    const days = parseInt(value)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setTimeRange({ start, end })
    setSelectedTimeRange(value)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Force re-render by updating time range slightly
    setTimeRange(prev => ({ ...prev }))
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('julie-crafts-token') 
        : null

      if (!token) {
        alert('Authentication required. Please log in again.')
        setIsExporting(false)
        return
      }

      const params = new URLSearchParams()
      params.append('startDate', timeRange.start.toISOString())
      params.append('endDate', timeRange.end.toISOString())
      params.append('format', 'csv')

      const response = await fetch(`/api/admin/analytics/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to export data')
      }

      // Get the CSV content
      const csvContent = await response.text()
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `analytics-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert(error instanceof Error ? error.message : 'Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600 text-lg">
                  Real-time insights into your business performance
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live data updates enabled</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Time Range Selector - Dropdown */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeRangeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Header Summary */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
            <HeaderSummary />
          </div>

          {/* First Row: Sales + Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <span>Sales Over Time</span>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-2">
                  Revenue trends from completed orders
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <SalesOverTimeChart height={320} timeRange={timeRange} />
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span>Orders Over Time</span>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-2">
                  Order volume by status
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <OrdersOverTimeChart height={320} timeRange={timeRange} />
              </CardContent>
            </Card>
          </div>

          {/* Second Row: Revenue by Category + Order Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
                  <div className="p-2.5 bg-purple-100 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <span>Revenue by Category</span>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-2">
                  Revenue distribution across product categories
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pb-8">
                <div className="w-full" style={{ minHeight: '360px' }}>
                  <RevenueByCategoryChart height={360} timeRange={timeRange} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
                  <div className="p-2.5 bg-orange-100 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                  </div>
                  <span>Order Status Distribution</span>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-2">
                  Current distribution of order statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pb-8">
                <div className="w-full" style={{ minHeight: '360px' }}>
                  <OrderStatusDistributionChart height={360} timeRange={timeRange} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Third Row: Top Selling Products + Inventory Levels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
                  <div className="p-2.5 bg-amber-100 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <span>Top Selling Products</span>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-2">
                  Best performing products by sales volume
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <TopSellingProductsChart height={400} limit={10} sortBy="quantity" timeRange={timeRange} />
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
                  <div className="p-2.5 bg-red-100 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-red-600" />
                  </div>
                  <span>Inventory Levels</span>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-2">
                  Product stock levels and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <InventoryLevelChart height={400} threshold={5} limit={20} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
