"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Banknote,
  ShoppingCart,
  Users,
  Package,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Loader2
} from "lucide-react"
import { useAnalytics } from "@/hooks/admin/use-analytics"
import { RevenueChart } from "@/components/admin/charts/revenue-chart"
import { CategoryPieChart } from "@/components/admin/charts/category-pie-chart"
import { OrdersChart } from "@/components/admin/charts/orders-chart"
import { TopProductsChart } from "@/components/admin/charts/top-products-chart"
import { MetricsComparisonChart } from "@/components/admin/charts/metrics-comparison-chart"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6months")

  const timeRangeOptions = [
    { value: "7days", label: "Last 7 Days" },
    { value: "30days", label: "Last 30 Days" },
    { value: "3months", label: "Last 3 Months" },
    { value: "6months", label: "Last 6 Months" },
    { value: "1year", label: "Last Year" },
  ]

  const { data: analyticsData, loading, error, refresh } = useAnalytics({
    timeRange,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  })

  const handleExport = () => {
    if (!analyticsData) return

    // Create CSV content
    const csvRows: string[] = []
    
    // Metrics section
    csvRows.push('Analytics Report')
    csvRows.push(`Period: ${timeRangeOptions.find(o => o.value === timeRange)?.label || timeRange}`)
    csvRows.push(`Generated: ${new Date().toLocaleString()}`)
    csvRows.push('')
    csvRows.push('METRICS')
    csvRows.push('Metric,Value,Growth')
    csvRows.push(`Total Revenue,${analyticsData.metrics.totalRevenue},${analyticsData.metrics.revenueGrowth.toFixed(2)}%`)
    csvRows.push(`Total Orders,${analyticsData.metrics.totalOrders},${analyticsData.metrics.ordersGrowth.toFixed(2)}%`)
    csvRows.push(`Total Customers,${analyticsData.metrics.totalCustomers},${analyticsData.metrics.customersGrowth.toFixed(2)}%`)
    csvRows.push(`Average Order Value,${analyticsData.metrics.avgOrderValue.toFixed(2)},${analyticsData.metrics.aovGrowth.toFixed(2)}%`)
    csvRows.push('')
    
    // Top Products section
    csvRows.push('TOP PRODUCTS')
    csvRows.push('Rank,Product Name,Sales,Revenue')
    analyticsData.topProducts.forEach((product, index) => {
      csvRows.push(`${index + 1},"${product.name}",${product.sales},${product.revenue}`)
    })
    csvRows.push('')
    
    // Category Performance section
    csvRows.push('CATEGORY PERFORMANCE')
    csvRows.push('Category,Revenue,Percentage')
    analyticsData.categoryPerformance.forEach(category => {
      csvRows.push(`"${category.name}",${category.revenue},${category.percentage.toFixed(2)}%`)
    })
    csvRows.push('')
    
    // Sales Trend section
    csvRows.push('SALES TREND')
    csvRows.push('Month,Revenue,Orders,Customers')
    analyticsData.salesTrend.forEach(trend => {
      csvRows.push(`"${trend.month}",${trend.revenue},${trend.orders},${trend.customers}`)
    })

    // Create blob and download
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading && !analyticsData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <TrendingDown className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">Failed to load analytics</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    )
  }

  const { metrics, topProducts, categoryPerformance, salesTrend } = analyticsData

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">JulieCraft Analytics</h1>
                <p className="text-gray-600 text-lg">Track performance and gain insights into your craft business</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-wrap gap-2">
                  {timeRangeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={timeRange === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeRange(option.value)}
                      className={timeRange === option.value 
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                        : "bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300 text-gray-700"
                      }
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                    onClick={refresh}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                    onClick={handleExport}
                    disabled={!analyticsData || loading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                    <Banknote className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +{metrics.revenueGrowth.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalRevenue.toLocaleString()} UGX</p>
                  <p className="text-xs text-gray-500">+{(metrics.totalRevenue * metrics.revenueGrowth / 100).toLocaleString()} UGX from last period</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                    <ShoppingCart className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +{metrics.ordersGrowth.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</p>
                  <p className="text-xs text-gray-500">+{Math.round(metrics.totalOrders * metrics.ordersGrowth / 100)} new orders this period</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +{metrics.customersGrowth.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">New Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalCustomers}</p>
                  <p className="text-xs text-gray-500">+{Math.round(metrics.totalCustomers * metrics.customersGrowth / 100)} new customers this period</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +{metrics.aovGrowth.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.avgOrderValue.toLocaleString()} UGX</p>
                  <p className="text-xs text-gray-500">+{(metrics.avgOrderValue * metrics.aovGrowth / 100).toLocaleString()} UGX from last period</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Trend Chart */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <span>Revenue Trend</span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">Monthly revenue performance over time</p>
              </CardHeader>
              <CardContent className="p-6">
                <RevenueChart data={salesTrend} height={320} />
              </CardContent>
            </Card>

            {/* Category Performance Pie Chart */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <Package className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span>Category Performance</span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">Revenue distribution by product category</p>
              </CardHeader>
              <CardContent className="p-6">
                <CategoryPieChart data={categoryPerformance} height={320} />
              </CardContent>
            </Card>
          </div>

          {/* Additional Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Orders & Customers Chart */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span>Orders & Customers</span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">Order volume and customer acquisition trends</p>
              </CardHeader>
              <CardContent className="p-6">
                <OrdersChart data={salesTrend} height={320} />
              </CardContent>
            </Card>

            {/* Top Products Chart */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
                  <div className="p-2.5 bg-purple-100 rounded-xl">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <span>Top Products by Revenue</span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">Best performing products by sales volume</p>
              </CardHeader>
              <CardContent className="p-6">
                <TopProductsChart data={topProducts} height={320} />
              </CardContent>
            </Card>
          </div>

          {/* Metrics Comparison Chart */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="border-b border-gray-100 pb-6">
              <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <span>Performance Comparison</span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">Normalized comparison of revenue, orders, and customers over time</p>
            </CardHeader>
            <CardContent className="p-6">
              <MetricsComparisonChart data={salesTrend} height={380} />
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Performance Metrics */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="text-xl font-semibold text-gray-900">Performance Metrics</CardTitle>
                <p className="text-sm text-gray-600 mt-2">Key business performance indicators</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-blue-50/50 rounded-xl border border-blue-100 hover:bg-blue-50/70 transition-colors">
                    <div>
                      <div className="font-semibold text-gray-900">Conversion Rate</div>
                      <div className="text-sm text-gray-600">Visitors to customers</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 text-lg">{metrics.conversionRate}%</div>
                      <div className="flex items-center justify-end">
                        <ArrowUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">+{metrics.conversionGrowth}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-emerald-50/50 rounded-xl border border-emerald-100 hover:bg-emerald-50/70 transition-colors">
                    <div>
                      <div className="font-semibold text-gray-900">Return Rate</div>
                      <div className="text-sm text-gray-600">Customer returns</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 text-lg">{metrics.returnRate}%</div>
                      <div className="flex items-center justify-end">
                        <ArrowDown className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">{metrics.returnGrowth}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-purple-50/50 rounded-xl border border-purple-100 hover:bg-purple-50/70 transition-colors">
                    <div>
                      <div className="font-semibold text-gray-900">Repeat Customers</div>
                      <div className="text-sm text-gray-600">Customer loyalty</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 text-lg">68%</div>
                      <div className="flex items-center justify-end">
                        <ArrowUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">+3.2%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Insights */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="text-xl font-semibold text-gray-900">Business Insights</CardTitle>
                <p className="text-sm text-gray-600 mt-2">Key insights and trends from your data</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-5 bg-blue-50/50 rounded-xl border-l-4 border-blue-500 hover:bg-blue-50/70 transition-colors">
                    <div className="font-semibold text-gray-900 text-sm">Peak Sales Day</div>
                    <div className="text-gray-600 text-sm mt-1">Saturdays generate 23% more revenue</div>
                  </div>

                  <div className="p-5 bg-emerald-50/50 rounded-xl border-l-4 border-emerald-500 hover:bg-emerald-50/70 transition-colors">
                    <div className="font-semibold text-gray-900 text-sm">Top Customer Segment</div>
                    <div className="text-gray-600 text-sm mt-1">Women 25-45 represent 68% of sales</div>
                  </div>

                  <div className="p-5 bg-purple-50/50 rounded-xl border-l-4 border-purple-500 hover:bg-purple-50/70 transition-colors">
                    <div className="font-semibold text-gray-900 text-sm">Seasonal Trend</div>
                    <div className="text-gray-600 text-sm mt-1">Holiday season shows 45% increase</div>
                  </div>

                  <div className="p-5 bg-orange-50/50 rounded-xl border-l-4 border-orange-500 hover:bg-orange-50/70 transition-colors">
                    <div className="font-semibold text-gray-900 text-sm">Popular Price Range</div>
                    <div className="text-gray-600 text-sm mt-1">195,000-585,000 UGX items sell the most</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Products Summary */}
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="text-xl font-semibold text-gray-900">Top Products</CardTitle>
                <p className="text-sm text-gray-600 mt-2">Best performing products by revenue</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {topProducts.slice(0, 5).map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-blue-50/30 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name}</div>
                          <div className="text-xs text-gray-500">{product.sales} sales</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 text-sm">{(product.revenue / 1000000).toFixed(1)}M</div>
                        {product.growth !== undefined && (
                          <div className="flex items-center justify-end">
                            {product.growth > 0 ? (
                              <ArrowUp className="w-3 h-3 text-green-500" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-red-500" />
                            )}
                            <span className={`text-xs font-medium ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {Math.abs(product.growth).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
