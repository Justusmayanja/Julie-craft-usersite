"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  DollarSign,
  Activity
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

  useEffect(() => {
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

    fetchDashboardStats()
  }, [])

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: "Products in catalog",
      color: "text-blue-600"
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: "All time orders",
      color: "text-green-600"
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      description: "Registered customers",
      color: "text-purple-600"
    },
    {
      title: "Total Revenue",
      value: `UGX ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "All time revenue",
      color: "text-yellow-600"
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: Activity,
      description: "Orders awaiting processing",
      color: "text-orange-600"
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockProducts,
      icon: Package,
      description: "Products with low inventory",
      color: "text-red-600"
    }
  ]

  if (isLoading) {
    return (
      <div className="animate-pulse px-4 sm:px-6">
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 sm:w-1/4 mb-4 sm:mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-24 sm:h-32"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Header */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Welcome to the admin panel. Here's an overview of your store.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate pr-2">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color} flex-shrink-0`} />
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">Recent Orders</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Latest orders that need attention</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-4">
                <div className="text-center text-gray-500 py-6 sm:py-8">
                  <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-sm sm:text-base">No recent orders to display</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">Low Stock Alert</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Products that need restocking</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-4">
                <div className="text-center text-gray-500 py-6 sm:py-8">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-sm sm:text-base">All products are well stocked</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
