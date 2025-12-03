"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  RefreshCw,
  CheckSquare,
  Square,
  MoreVertical
} from "lucide-react"
import { useOrders } from "@/hooks/admin/use-orders"
import { OrderDetailModal } from "@/components/admin/order-detail-modal"
import { useToast } from "@/contexts/toast-context"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

const statusOptions = ["All", "pending", "processing", "shipped", "delivered", "cancelled", "archived"]

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
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [bulkAction, setBulkAction] = useState<'status' | 'payment_status' | 'archive' | 'unarchive' | null>(null)
  const [bulkStatusValue, setBulkStatusValue] = useState<string>('')
  const [bulkPaymentStatusValue, setBulkPaymentStatusValue] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const toast = useToast()

  const [showArchived, setShowArchived] = useState(false)
  
  const { data: ordersData, loading, error, refresh, updateOrder } = useOrders({
    search: searchTerm || undefined,
    status: selectedStatus === "All" || selectedStatus === "archived" ? undefined : selectedStatus,
    includeArchived: selectedStatus === "archived" || showArchived,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  })

  // Reset to page 1 when filters change - MUST be before any early returns
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedStatus])

  const handleViewOrder = async (order: any) => {
    try {
      // Fetch full order details
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/orders/${order.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch order details')
      }

      const orderDetails = await response.json()
      setSelectedOrder(orderDetails)
      setShowOrderDetail(true)
    } catch (error) {
      console.error('Error fetching order details:', error)
    }
  }

  const handleOrderUpdated = () => {
    refresh()
    setSelectedOrderIds(new Set())
  }

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (!ordersData?.orders) return
    
    if (selectedOrderIds.size === ordersData.orders.length) {
      setSelectedOrderIds(new Set())
    } else {
      setSelectedOrderIds(new Set(ordersData.orders.map(o => o.id)))
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedOrderIds.size === 0) {
      toast.showError('No Orders Selected', 'Please select at least one order to update.')
      return
    }

    if (!bulkAction) {
      toast.showError('No Action Selected', 'Please select an action to perform.')
      return
    }

    if (bulkAction === 'status' && !bulkStatusValue) {
      toast.showError('No Status Selected', 'Please select a status to apply.')
      return
    }

    if (bulkAction === 'payment_status' && !bulkPaymentStatusValue) {
      toast.showError('No Payment Status Selected', 'Please select a payment status to apply.')
      return
    }

    setBulkUpdating(true)
    try {
      const token = localStorage.getItem('julie-crafts-token')
      const updates: any = {
        order_ids: Array.from(selectedOrderIds),
        updates: {}
      }

      if (bulkAction === 'status') {
        updates.updates.status = bulkStatusValue
        // Auto-update dates based on status
        const now = new Date().toISOString()
        if (bulkStatusValue === 'shipped') {
          updates.updates.shipped_date = now
        }
        if (bulkStatusValue === 'delivered') {
          updates.updates.delivered_date = now
        }
      } else if (bulkAction === 'payment_status') {
        updates.updates.payment_status = bulkPaymentStatusValue
      } else if (bulkAction === 'archive') {
        updates.updates.is_archived = true
        updates.updates.archived_at = new Date().toISOString()
      } else if (bulkAction === 'unarchive') {
        updates.updates.is_archived = false
        updates.updates.archived_at = null
      }

      const response = await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to update orders')
      }

      const result = await response.json()
      
      toast.showSuccess(
        'Bulk Update Successful',
        `Successfully updated ${result.updated_count} of ${result.total_count} orders.`
      )

      // Clear selection and reset bulk action
      setSelectedOrderIds(new Set())
      setBulkAction(null)
      setBulkStatusValue('')
      setBulkPaymentStatusValue('')
      
      // Refresh orders
      refresh()
    } catch (error) {
      console.error('Error performing bulk update:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update orders'
      toast.showError('Bulk Update Failed', errorMessage)
    } finally {
      setBulkUpdating(false)
    }
  }

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

  // Pagination calculations
  const totalPages = Math.ceil(orders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = orders.slice(startIndex, endIndex)

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

              {/* Bulk Actions Toolbar */}
              {selectedOrderIds.size > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        {selectedOrderIds.size} order{selectedOrderIds.size !== 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrderIds(new Set())}
                        className="h-7 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <Select
                        value={bulkAction || ''}
                        onValueChange={(value) => {
                          setBulkAction(value as 'status' | 'payment_status' | null)
                          setBulkStatusValue('')
                          setBulkPaymentStatusValue('')
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-40 h-8 text-xs">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="status">Update Status</SelectItem>
                          <SelectItem value="payment_status">Update Payment Status</SelectItem>
                          <SelectItem value="archive">Archive Orders</SelectItem>
                          <SelectItem value="unarchive">Unarchive Orders</SelectItem>
                        </SelectContent>
                      </Select>

                      {bulkAction === 'status' && (
                        <Select
                          value={bulkStatusValue}
                          onValueChange={setBulkStatusValue}
                        >
                          <SelectTrigger className="w-full sm:w-40 h-8 text-xs">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {bulkAction === 'payment_status' && (
                        <Select
                          value={bulkPaymentStatusValue}
                          onValueChange={setBulkPaymentStatusValue}
                        >
                          <SelectTrigger className="w-full sm:w-40 h-8 text-xs">
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      <Button
                        onClick={handleBulkUpdate}
                        disabled={bulkUpdating || !bulkAction || (bulkAction === 'status' && !bulkStatusValue) || (bulkAction === 'payment_status' && !bulkPaymentStatusValue)}
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        {bulkUpdating ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
        
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12 px-3 sm:px-6">
                        <Checkbox
                          checked={ordersData && selectedOrderIds.size === ordersData.orders.length && ordersData.orders.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all orders"
                        />
                      </TableHead>
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
                    {paginatedOrders.map((order) => (
                      <TableRow key={order.id} className={`hover:bg-gray-50 ${selectedOrderIds.has(order.id) ? 'bg-blue-50' : ''}`}>
                        <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                          <Checkbox
                            checked={selectedOrderIds.has(order.id)}
                            onCheckedChange={() => handleSelectOrder(order.id)}
                            aria-label={`Select order ${order.order_number}`}
                          />
                        </TableCell>
                        <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="font-medium text-xs sm:text-sm">{order.order_number}</div>
                          <div className="text-xs text-gray-500 sm:hidden mt-1">{order.customer_name}</div>
                          <div className="text-xs text-gray-500 sm:hidden mt-1">{order.total_amount.toLocaleString()} UGX</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0">
                              <AvatarImage 
                                src={order.customer_avatar_url || undefined} 
                                alt={order.customer_name}
                              />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                                {order.customer_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="View Order" 
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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

              {/* Pagination */}
              {orders.length > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} orders
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage > 1) setCurrentPage(currentPage - 1)
                          }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setCurrentPage(page)
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )
                        }
                        return null
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                          }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          open={showOrderDetail}
          onOpenChange={setShowOrderDetail}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </div>
  )
}
