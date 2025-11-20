"use client"

import { useState } from "react"
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
  Eye,
  Edit,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Banknote,
  Loader2,
  RefreshCw
} from "lucide-react"
import { useOrders } from "@/hooks/admin/use-orders"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")

  const { data: ordersData, loading, error, refresh } = useOrders({
    search: searchTerm || undefined,
    status: selectedStatus === "All" ? undefined : selectedStatus,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  })

  if (loading && !ordersData) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4 text-blue-600" />
          <p className="text-sm sm:text-base text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2" />
            <p className="font-semibold text-sm sm:text-base">Failed to load orders</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <Button onClick={refresh} variant="outline" className="h-9 sm:h-10 px-4 sm:px-6">
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="text-sm">Try Again</span>
          </Button>
        </div>
      </div>
    )
  }

  if (!ordersData) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600">No orders data available</p>
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


  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Page Header - Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-1">Manage customer orders and track fulfillment</p>
            </div>
            <div className="flex flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refresh}
                disabled={loading}
                className="h-9 sm:h-10 px-3 sm:px-4"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-xs sm:text-sm">Refresh</span>
              </Button>
            </div>
          </div>


          {/* Stats Cards - Simplified */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Orders</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{safeStats.totalOrders}</p>
                  </div>
                  <Package className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Revenue</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{safeStats.totalRevenue.toLocaleString()}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">UGX</p>
                  </div>
                  <Banknote className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-emerald-600 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pending</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{safeStats.pendingOrders}</p>
                  </div>
                  <Clock className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-orange-600 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Completed</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{safeStats.completedOrders}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-emerald-600 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="shadow-sm">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl mb-3 sm:mb-4">Order Management</CardTitle>
              
              {/* Search and Filters - Responsive */}
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full h-9 sm:h-10 text-sm"
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
                      className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
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
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs sm:text-sm font-semibold px-3 sm:px-6">Order</TableHead>
                      <TableHead className="hidden sm:table-cell text-xs sm:text-sm font-semibold px-3 sm:px-6">Customer</TableHead>
                      <TableHead className="hidden md:table-cell text-xs sm:text-sm font-semibold px-3 sm:px-6">Items</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold px-3 sm:px-6">Total</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold px-3 sm:px-6">Status</TableHead>
                      <TableHead className="hidden lg:table-cell text-xs sm:text-sm font-semibold px-3 sm:px-6">Payment</TableHead>
                      <TableHead className="hidden md:table-cell text-xs sm:text-sm font-semibold px-3 sm:px-6">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold px-3 sm:px-6 w-16 sm:w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="font-medium text-xs sm:text-sm">{order.order_number}</div>
                          <div className="text-xs text-gray-500 sm:hidden mt-1">{order.customer_name}</div>
                          <div className="text-xs text-gray-500 sm:hidden mt-1">{order.total_amount.toLocaleString()} UGX</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium flex-shrink-0">
                              {order.customer_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-xs sm:text-sm truncate">{order.customer_name}</div>
                              <div className="text-xs text-gray-500 hidden md:block truncate">{order.customer_email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm">
                            {order.order_items.slice(0, 2).map((item, index) => (
                              <div key={index} className="truncate">
                                <span className="font-medium">{item.quantity}x</span> {item.product_name}
                              </div>
                            ))}
                            {order.order_items.length > 2 && (
                              <div className="text-gray-500 text-xs">+{order.order_items.length - 2} more</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="font-medium text-xs sm:text-sm">{order.total_amount.toLocaleString()} UGX</div>
                        </TableCell>
                        <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                          <Badge className={`${getStatusColor(order.status)} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1`}>
                            <div className="flex items-center space-x-1">
                              <span className="flex-shrink-0">{getStatusIcon(order.status)}</span>
                              <span className="hidden sm:inline truncate">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <Badge 
                            className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 ${
                              order.payment_status === 'paid' 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : 'bg-red-100 text-red-700 border-red-200'
                            }`}
                          >
                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm">
                            <div className="font-medium">{new Date(order.order_date).toLocaleDateString()}</div>
                            {order.shipped_date && (
                              <div className="text-gray-500 text-[10px] sm:text-xs">Shipped: {new Date(order.shipped_date).toLocaleDateString()}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm" title="View Order" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Edit Order" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {orders.length === 0 && (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-sm sm:text-base text-gray-600">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
