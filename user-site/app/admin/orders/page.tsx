"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  Edit,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Banknote,
  Calendar,
  User,
  Loader2,
  Settings,
  Database,
  BarChart3,
  RefreshCw
} from "lucide-react"
import { useOrders } from "@/hooks/admin/use-orders"
import { EnhancedOrderManagement } from "@/components/admin/orders/enhanced-order-management"
import { useToast } from "@/hooks/admin/use-toast"

const statusOptions = ["All", "pending", "processing", "shipped", "delivered", "cancelled"]

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered": return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "shipped": return "bg-blue-100 text-blue-700 border-blue-200"
    case "processing": return "bg-blue-100 text-blue-700 border-blue-200"
    case "pending": return "bg-gray-100 text-gray-700 border-gray-200"
    case "cancelled": return "bg-red-100 text-red-700 border-red-200"
    default: return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "delivered": return <CheckCircle className="w-4 h-4" />
    case "shipped": return <Truck className="w-4 h-4" />
    case "processing": return <Clock className="w-4 h-4" />
    case "pending": return <Package className="w-4 h-4" />
    case "cancelled": return <XCircle className="w-4 h-4" />
    default: return <Package className="w-4 h-4" />
  }
}

export default function OrdersPage() {
  const { addToast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [showEnhancedOrders, setShowEnhancedOrders] = useState(false)
  const [isSettingUpEnhanced, setIsSettingUpEnhanced] = useState(false)
  const [enhancedSetupComplete, setEnhancedSetupComplete] = useState(false)

  const { data: ordersData, loading, error, refresh } = useOrders({
    search: searchTerm || undefined,
    status: selectedStatus === "All" ? undefined : selectedStatus,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  })

  // Check if enhanced orders are available
  useEffect(() => {
    const checkEnhancedOrders = async () => {
      try {
        const response = await fetch('/api/orders/enhanced?limit=1')
        if (response.ok) {
          setEnhancedSetupComplete(true)
        }
      } catch (error) {
        // Enhanced orders not available
      }
    }
    checkEnhancedOrders()
  }, [])

  // Setup enhanced orders
  const handleSetupEnhancedOrders = async () => {
    setIsSettingUpEnhanced(true)
    try {
      const response = await fetch('/api/admin/setup-enhanced-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok) {
        addToast({
          title: 'Enhanced Orders Setup Complete',
          description: result.message || 'Enhanced order management system is now ready!',
          type: 'success',
        })
        setEnhancedSetupComplete(true)
        setShowEnhancedOrders(true)
      } else {
        addToast({
          title: 'Setup Failed',
          description: result.error || 'Failed to setup enhanced order management',
          type: 'error',
        })
      }
    } catch (error) {
      addToast({
        title: 'Setup Error',
        description: 'Failed to setup enhanced order management',
        type: 'error',
      })
    } finally {
      setIsSettingUpEnhanced(false)
    }
  }

  if (loading && !ordersData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Package className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">Failed to load orders</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <Button onClick={refresh} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!ordersData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No orders data available</p>
        </div>
      </div>
    )
  }

  const { orders, stats } = ordersData
  
  // Provide default values for stats to prevent undefined errors
  const safeStats = stats || {
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  }

  // Show enhanced order management if available and enabled
  if (showEnhancedOrders && enhancedSetupComplete) {
    return <EnhancedOrderManagement />
  }

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">JulieCraft Orders</h1>
              <p className="text-gray-600 mt-1 text-base">Manage customer orders and track fulfillment</p>
            </div>
            <div className="flex gap-3">
              {enhancedSetupComplete && (
                <Button 
                  onClick={() => setShowEnhancedOrders(true)}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Enhanced Orders
                </Button>
              )}
              {!enhancedSetupComplete && (
                <Button 
                  onClick={handleSetupEnhancedOrders}
                  disabled={isSettingUpEnhanced}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100"
                >
                  {isSettingUpEnhanced ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  {isSettingUpEnhanced ? 'Setting Up...' : 'Setup Enhanced Orders'}
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white hover:bg-gray-50 border-gray-300"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 border-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Enhanced Orders Setup Info */}
          {!enhancedSetupComplete && (
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Upgrade to Enhanced Order Management
                    </h3>
                    <p className="text-blue-700 mb-4">
                      Get advanced features like inventory integration, order workflows, status tracking, 
                      task management, and comprehensive analytics for your handmade business.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-blue-700">Inventory Integration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-blue-700">Order Workflows</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-blue-700">Task Management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-blue-700">Status History</span>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSetupEnhancedOrders}
                      disabled={isSettingUpEnhanced}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSettingUpEnhanced ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4 mr-2" />
                      )}
                      {isSettingUpEnhanced ? 'Setting Up Enhanced System...' : 'Setup Enhanced Order Management'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Total Orders</p>
                  <p className="text-xl font-bold text-gray-900">{safeStats.totalOrders}</p>
                  <p className="text-xs text-gray-500">All time orders</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{safeStats.totalRevenue.toLocaleString()} UGX</p>
                  <p className="text-xs text-gray-500">Total sales value</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Pending Orders</p>
                  <p className="text-xl font-bold text-gray-900">{safeStats.pendingOrders}</p>
                  <p className="text-xs text-gray-500">Need attention</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Completed</p>
                  <p className="text-xl font-bold text-gray-900">{safeStats.completedOrders}</p>
                  <p className="text-xs text-gray-500">Successfully fulfilled</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-4">Order Management</CardTitle>
              
              {/* Search and Filters Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Search */}
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-80 bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Status Filter */}
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStatus(status)}
                      className={selectedStatus === status 
                        ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm" 
                        : "bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300 text-gray-700"
                      }
                    >
                      {status === "All" ? status : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
        
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">Order</TableHead>
                      <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                      <TableHead className="font-semibold text-gray-700">Items</TableHead>
                      <TableHead className="font-semibold text-gray-700">Total</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Payment</TableHead>
                      <TableHead className="font-semibold text-gray-700">Date</TableHead>
                      <TableHead className="w-24 font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="py-4">
                          <div className="font-semibold text-gray-900">{order.order_number}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
                              {order.customer_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{order.customer_name}</div>
                              <div className="text-sm text-gray-500">{order.customer_email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            {order.order_items.map((item, index) => (
                              <div key={index} className="text-sm text-gray-700">
                                <span className="font-semibold">{item.quantity}x</span> {item.product_name}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 font-semibold text-gray-900">{order.total_amount.toLocaleString()} UGX</TableCell>
                        <TableCell className="py-4">
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge 
                            className={order.payment_status === 'paid' 
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                              : 'bg-red-100 text-red-700 border-red-200'
                            }
                          >
                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm">
                            <div className="font-semibold text-gray-900">{new Date(order.order_date).toLocaleDateString()}</div>
                            {order.shipped_date && (
                              <div className="text-gray-500">Shipped: {new Date(order.shipped_date).toLocaleDateString()}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-blue-50 hover:text-blue-700">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-blue-50 hover:text-blue-700">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {orders.length === 0 && (
                <div className="text-center py-12 px-4">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
