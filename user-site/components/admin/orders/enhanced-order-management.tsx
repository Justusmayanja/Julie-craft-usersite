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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Star,
  MoreHorizontal,
  ArrowUpDown,
  RefreshCw
} from "lucide-react"
import { useEnhancedOrders } from "@/hooks/admin/use-enhanced-orders"
import { useToast } from "@/hooks/admin/use-toast"

interface EnhancedOrderManagementProps {
  initialFilters?: {
    status?: string
    payment_status?: string
    fulfillment_status?: string
    priority?: string
  }
}

export function EnhancedOrderManagement({ initialFilters = {} }: EnhancedOrderManagementProps) {
  const { addToast } = useToast()
  
  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || "All")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(initialFilters.payment_status || "All")
  const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState(initialFilters.fulfillment_status || "All")
  const [priorityFilter, setPriorityFilter] = useState(initialFilters.priority || "All")
  const [sourceFilter, setSourceFilter] = useState("All")
  const [sortBy, setSortBy] = useState("order_date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Enhanced orders hook
  const {
    data,
    loading,
    error,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    reserveInventory,
    releaseInventory,
    fulfillItem,
    getOrder
  } = useEnhancedOrders({
    search: searchTerm,
    status: statusFilter !== "All" ? statusFilter : undefined,
    payment_status: paymentStatusFilter !== "All" ? paymentStatusFilter : undefined,
    fulfillment_status: fulfillmentStatusFilter !== "All" ? fulfillmentStatusFilter : undefined,
    priority: priorityFilter !== "All" ? priorityFilter : undefined,
    source: sourceFilter !== "All" ? sourceFilter : undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    page: currentPage,
    limit: 20,
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  })

  // Status and priority options
  const statusOptions = [
    { value: "All", label: "All Orders", icon: Package },
    { value: "pending", label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    { value: "processing", label: "Processing", icon: Loader2, color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "shipped", label: "Shipped", icon: Truck, color: "bg-purple-100 text-purple-700 border-purple-200" },
    { value: "delivered", label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-700 border-green-200" },
    { value: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-700 border-red-200" }
  ]

  const paymentStatusOptions = [
    { value: "All", label: "All Payments", icon: CreditCard },
    { value: "pending", label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
    { value: "paid", label: "Paid", icon: CheckCircle, color: "bg-green-100 text-green-700" },
    { value: "failed", label: "Failed", icon: XCircle, color: "bg-red-100 text-red-700" },
    { value: "refunded", label: "Refunded", icon: RefreshCw, color: "bg-orange-100 text-orange-700" }
  ]

  const fulfillmentStatusOptions = [
    { value: "All", label: "All Fulfillment", icon: Package },
    { value: "unfulfilled", label: "Unfulfilled", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
    { value: "partially_fulfilled", label: "Partially Fulfilled", icon: TrendingUp, color: "bg-blue-100 text-blue-700" },
    { value: "fulfilled", label: "Fulfilled", icon: CheckCircle, color: "bg-green-100 text-green-700" }
  ]

  const priorityOptions = [
    { value: "All", label: "All Priorities", icon: Star },
    { value: "low", label: "Low", icon: Star, color: "bg-gray-100 text-gray-700" },
    { value: "normal", label: "Normal", icon: Star, color: "bg-blue-100 text-blue-700" },
    { value: "high", label: "High", icon: Star, color: "bg-orange-100 text-orange-700" },
    { value: "urgent", label: "Urgent", icon: Star, color: "bg-red-100 text-red-700" }
  ]

  const sourceOptions = [
    { value: "All", label: "All Sources", icon: ShoppingCart },
    { value: "web", label: "Website", icon: ShoppingCart, color: "bg-blue-100 text-blue-700" },
    { value: "phone", label: "Phone", icon: Phone, color: "bg-green-100 text-green-700" },
    { value: "email", label: "Email", icon: Mail, color: "bg-purple-100 text-purple-700" },
    { value: "walk_in", label: "Walk-in", icon: User, color: "bg-orange-100 text-orange-700" },
    { value: "marketplace", label: "Marketplace", icon: Package, color: "bg-indigo-100 text-indigo-700" },
    { value: "admin", label: "Admin", icon: Edit, color: "bg-gray-100 text-gray-700" }
  ]

  // Helper functions
  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option?.color || "bg-gray-100 text-gray-700 border-gray-200"
  }

  const getPriorityColor = (priority: string) => {
    const option = priorityOptions.find(opt => opt.value === priority)
    return option?.color || "bg-gray-100 text-gray-700"
  }

  const formatCurrency = (amount: number, currency: string = 'UGX') => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Event handlers
  const handleOrderAction = async (orderId: string, action: string, data?: any) => {
    try {
      switch (action) {
        case 'reserve_inventory':
          await reserveInventory(orderId)
          addToast({
            title: 'Inventory Reserved',
            description: 'Inventory has been successfully reserved for this order.',
            type: 'success'
          })
          break
        case 'release_inventory':
          await releaseInventory(orderId)
          addToast({
            title: 'Inventory Released',
            description: 'Inventory reservations have been released.',
            type: 'success'
          })
          break
        case 'update_status':
          await updateOrder(orderId, { status: data.status, version: data.version })
          addToast({
            title: 'Order Updated',
            description: `Order status updated to ${data.status}.`,
            type: 'success'
          })
          break
        case 'delete':
          await deleteOrder(orderId)
          addToast({
            title: 'Order Deleted',
            description: 'Order has been successfully deleted.',
            type: 'success'
          })
          break
      }
    } catch (error) {
      addToast({
        title: 'Action Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        type: 'error'
      })
    }
  }

  const handleViewOrder = async (orderId: string) => {
    const order = await getOrder(orderId)
    if (order) {
      setSelectedOrder(order)
      setShowOrderDetails(true)
    }
  }

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("All")
    setPaymentStatusFilter("All")
    setFulfillmentStatusFilter("All")
    setPriorityFilter("All")
    setSourceFilter("All")
    setSortBy("order_date")
    setSortOrder("desc")
    setCurrentPage(1)
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-slate-600">Loading orders...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-red-600">
            <AlertTriangle className="w-6 h-6 mr-2" />
            <span>Error loading orders: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
          <p className="text-slate-600">Manage orders, inventory, and fulfillment</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchOrders()}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateOrder(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-900">{data.stats.totalOrders}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(data.stats.totalRevenue)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-slate-900">{data.stats.pendingOrders}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Unfulfilled</p>
                  <p className="text-2xl font-bold text-slate-900">{data.stats.unfulfilledOrders}</p>
                </div>
                <Package className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters & Search</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search orders, customers, or order numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {statusOptions.slice(1).map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(option.value)}
                className="h-8"
              >
                <option.icon className="w-3 h-3 mr-1" />
                {option.label}
              </Button>
            ))}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Payment Status</label>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <option.icon className="w-4 h-4 mr-2" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Fulfillment Status</label>
                <Select value={fulfillmentStatusFilter} onValueChange={setFulfillmentStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fulfillmentStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <option.icon className="w-4 h-4 mr-2" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <option.icon className="w-4 h-4 mr-2" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Source</label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <option.icon className="w-4 h-4 mr-2" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Orders ({data?.pagination.total || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Fulfillment</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{order.order_number}</div>
                        <div className="text-sm text-slate-500">{order.source}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{order.customer_name}</div>
                        <div className="text-sm text-slate-500">{order.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.fulfillment_status)}>
                        {order.fulfillment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total_amount, order.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(order.order_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {order.status === 'pending' && !order.inventory_reserved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOrderAction(order.id, 'reserve_inventory')}
                          >
                            <Package className="w-4 h-4" />
                          </Button>
                        )}
                        {order.inventory_reserved && order.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOrderAction(order.id, 'release_inventory')}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-600">
                Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                {data.pagination.total} orders
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Complete order information and management
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Order Number:</span>
                        <span className="font-medium">{selectedOrder.order_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <Badge className={getStatusColor(selectedOrder.status)}>
                          {selectedOrder.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Priority:</span>
                        <Badge className={getPriorityColor(selectedOrder.priority)}>
                          {selectedOrder.priority}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total:</span>
                        <span className="font-medium">
                          {formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Name:</span>
                        <span className="font-medium">{selectedOrder.customer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Email:</span>
                        <span className="font-medium">{selectedOrder.customer_email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Source:</span>
                        <Badge variant="outline">{selectedOrder.source}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="items" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.order_items?.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell>{item.product_sku}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.unit_price, selectedOrder.currency)}</TableCell>
                            <TableCell>{formatCurrency(item.total_price, selectedOrder.currency)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fulfillItem(selectedOrder.id, item.id, item.quantity)}
                              >
                                Fulfill
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrder.order_status_history?.map((history: any) => (
                        <div key={history.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">
                              {history.change_reason || 'Status updated'}
                            </div>
                            <div className="text-sm text-slate-600">
                              {history.previous_status && `${history.previous_status} → `}
                              {history.new_status}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatDate(history.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tasks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrder.order_tasks?.map((task: any) => (
                        <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{task.title}</div>
                            <div className="text-sm text-slate-600">{task.description}</div>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge variant="outline" className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
