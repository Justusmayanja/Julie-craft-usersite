"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  DollarSign,
  Activity,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Eye,
  RefreshCw
} from "lucide-react"

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  pendingOrders: number
  lowStockProducts: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('julie-crafts-token')
      if (!token) {
        console.error('No token found in localStorage')
        setIsLoading(false)
        return
      }

      console.log('Fetching dashboard stats with token:', token.substring(0, 20) + '...')

      // Fetch dashboard statistics
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies in the request
      })

      // Check content type before parsing
      const contentType = response.headers.get('content-type') || ''
      
      if (!response.ok) {
        // Check if response is JSON or HTML
        if (contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            console.error('Dashboard API error:', errorData)
          } catch (e) {
            console.error('Failed to parse error response as JSON')
          }
        } else {
          // Response is HTML (likely an error page or redirect)
          const text = await response.text()
          console.error('Dashboard API returned HTML instead of JSON:', text.substring(0, 200))
          console.error('Response status:', response.status, response.statusText)
          console.error('Response URL:', response.url)
        }
        // Don't try to parse as JSON if it's not JSON
        return
      }

      // Only parse as JSON if content type indicates JSON
      if (!contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Expected JSON but got:', contentType, text.substring(0, 200))
        throw new Error(`API returned non-JSON response (${contentType})`)
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Set default stats on error to prevent UI breaking
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        lowStockProducts: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const handleRefresh = () => {
    setIsLoading(true)
    fetchDashboardStats()
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: "Products in catalog",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100/50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      link: "/admin/products"
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: "All time orders",
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100/50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      link: "/admin/orders"
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      description: "Registered customers",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100/50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      link: "/admin/customers"
    },
    {
      title: "Total Revenue",
      value: `UGX ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "All time revenue",
      gradient: "from-amber-500 to-amber-600",
      bgGradient: "from-amber-50 to-amber-100/50",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      link: "/admin/analytics"
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: Clock,
      description: "Orders awaiting processing",
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100/50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      link: "/admin/orders?status=pending",
      alert: stats.pendingOrders > 0
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockProducts,
      icon: AlertTriangle,
      description: "Products with low inventory",
      gradient: "from-red-500 to-red-600",
      bgGradient: "from-red-50 to-red-100/50",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      link: "/admin/products?filter=low_stock",
      alert: stats.lowStockProducts > 0
    }
  ]


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm h-32 sm:h-40"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Welcome to the admin panel. Here's an overview of your store.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Link key={index} href={stat.link || "#"} className="block">
                <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                    <CardTitle className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.iconBg} p-2 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                      <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                      {stat.alert && (
                        <Badge variant="destructive" className="text-xs animate-pulse">
                          Alert
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.description}
                    </p>
                    <div className="mt-3 flex items-center text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                      View details
                      <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Pending Orders Alert */}
          {stats.pendingOrders > 0 && (
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/30 shadow-md">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-orange-900 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      Pending Orders
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-orange-700 mt-1">
                      {stats.pendingOrders} order{stats.pendingOrders !== 1 ? 's' : ''} need{stats.pendingOrders === 1 ? 's' : ''} your attention
                    </CardDescription>
                  </div>
                  <Badge className="bg-orange-600 text-white text-sm px-3 py-1">
                    {stats.pendingOrders}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  <Link href="/admin/orders?status=pending">
                    View Pending Orders
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Low Stock Alert */}
          {stats.lowStockProducts > 0 && (
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100/30 shadow-md">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-red-900 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Low Stock Alert
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-red-700 mt-1">
                      {stats.lowStockProducts} product{stats.lowStockProducts !== 1 ? 's' : ''} need{stats.lowStockProducts === 1 ? 's' : ''} restocking
                    </CardDescription>
                  </div>
                  <Badge className="bg-red-600 text-white text-sm px-3 py-1">
                    {stats.lowStockProducts}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <Button asChild variant="destructive" className="w-full">
                  <Link href="/admin/products?filter=low_stock">
                    View Low Stock Items
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* All Good Status */}
          {stats.pendingOrders === 0 && stats.lowStockProducts === 0 && (
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/30 shadow-md lg:col-span-2">
              <CardContent className="px-4 sm:px-6 py-6 sm:py-8">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
                  <div className="bg-emerald-100 p-4 rounded-full">
                    <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-emerald-900 mb-1">
                      All Systems Operational
                    </h3>
                    <p className="text-sm sm:text-base text-emerald-700">
                      No pending orders or low stock items. Everything is running smoothly!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Button asChild variant="outline" className="flex flex-col h-auto py-4 sm:py-6 hover:bg-blue-50 hover:border-blue-300 transition-colors">
                <Link href="/admin/products/new" className="flex flex-col items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  <span className="text-xs sm:text-sm font-medium">Add Product</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex flex-col h-auto py-4 sm:py-6 hover:bg-green-50 hover:border-green-300 transition-colors">
                <Link href="/admin/orders" className="flex flex-col items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  <span className="text-xs sm:text-sm font-medium">View Orders</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex flex-col h-auto py-4 sm:py-6 hover:bg-purple-50 hover:border-purple-300 transition-colors">
                <Link href="/admin/customers" className="flex flex-col items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-xs sm:text-sm font-medium">Customers</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex flex-col h-auto py-4 sm:py-6 hover:bg-amber-50 hover:border-amber-300 transition-colors">
                <Link href="/admin/analytics" className="flex flex-col items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  <span className="text-xs sm:text-sm font-medium">Analytics</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
