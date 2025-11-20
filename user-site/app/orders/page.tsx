"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Loader2, 
  Package, 
  Calendar, 
  CreditCard, 
  Truck, 
  Search,
  Eye,
  ArrowLeft,
  RefreshCw
} from "lucide-react"
import { getUserOrders } from "@/lib/api-user"
import type { UserOrderHistory } from "@/lib/types/user"

export default function OrdersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<UserOrderHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [filteredOrders, setFilteredOrders] = useState<UserOrderHistory[]>([])

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.push('/login?redirect=/orders')
        return
      }
      loadOrders()
    }
  }, [isAuthenticated, authLoading, user, router])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use user ID from auth context
      const response = await getUserOrders(user?.id)
      
      setOrders(response.orders || [])
      setFilteredOrders(response.orders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter orders based on search and status
  useEffect(() => {
    let filtered = orders

    // Filter by search term (order number)
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(order =>
        order.status.toLowerCase() === statusFilter.toLowerCase()
      )
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  const formatPrice = (price: number) => {
    return `UGX ${price.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Orders</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={loadOrders}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-gray-600">
            Track your orders and view past purchases
          </p>
        </div>

        {/* Filters */}
        {orders.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by order number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={loadOrders} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4">No Orders Yet</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                You haven't placed any orders yet. Start shopping to see your order history here.
              </p>
              <Button asChild>
                <Link href="/products">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-bold mb-2">No Orders Found</h2>
              <p className="text-gray-600 mb-4">
                No orders match your current filters.
              </p>
              <Button variant="outline" onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <Card key={order.order_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg mb-2">
                        Order #{order.order_number}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.order_date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <Badge className={`${getStatusColor(order.status)} border font-medium`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Order Items */}
                    <div className="grid gap-3">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-16 h-16 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/placeholder.svg'
                                  target.onerror = null
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.product_name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Qty: {item.quantity} × {formatPrice(item.price || 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">
                              {formatPrice((item.price || 0) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-600 text-center py-2 bg-gray-50 rounded-lg">
                          +{order.items.length - 3} more {order.items.length - 3 === 1 ? 'item' : 'items'}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Order Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/orders/${order.order_id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                        {(order.status === 'shipped' || order.status === 'delivered') && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/orders/${order.order_id}?tab=tracking`}>
                              <Truck className="h-4 w-4 mr-2" />
                              Track Package
                            </Link>
                          </Button>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // TODO: Implement reorder functionality
                          console.log('Reorder order:', order.order_id)
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Reorder
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {orders.length > 0 && (
          <Card className="mt-6 bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Showing {filteredOrders.length} of {orders.length} orders
                </span>
                <span className="font-semibold text-gray-900">
                  Total: {formatPrice(orders.reduce((sum, order) => sum + order.total_amount, 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

