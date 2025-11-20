"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Package, Search, Truck, CheckCircle, Clock } from "lucide-react"
import { getOrderByNumber } from "@/lib/api-user"

interface OrderTrackingProps {
  orderNumber?: string
  onOrderFound?: (order: any) => void
}

export function OrderTracking({ orderNumber: initialOrderNumber, onOrderFound }: OrderTrackingProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber || "")
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNumber.trim()) return

    try {
      setLoading(true)
      setError(null)
      
      const orderData = await getOrderByNumber(orderNumber.trim())
      setOrder(orderData)
      onOrderFound?.(orderData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track order')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return `UGX ${price.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'processing':
        return <Clock className="h-5 w-5" />
      case 'shipped':
        return <Truck className="h-5 w-5" />
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />
      case 'cancelled':
        return <Package className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your order number to track your package
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleTrackOrder} className="flex gap-4">
              <Input
                placeholder="Enter order number (e.g., ORD-1234567890)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !orderNumber.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Track Order
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">
                    Order #{order.order_number}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Placed on {formatDate(order.order_date)}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <Badge className={`${getStatusColor(order.status)} border text-sm px-3 py-1`}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </Badge>
                  <p className="text-lg font-semibold">
                    {formatPrice(order.total_amount)}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-4">Order Items</h3>
                <div className="grid gap-3">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.product_name}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/placeholder.svg'
                              target.onerror = null
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × {formatPrice(item.unit_price || item.price || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Shipping Information */}
              <div>
                <h3 className="font-semibold mb-4">Shipping Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Customer</p>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                    <div className="text-sm">
                      {order.shipping_address && (
                        <>
                          <p>{order.shipping_address.name}</p>
                          <p>{order.shipping_address.address_line1}</p>
                          {order.shipping_address.address_line2 && (
                            <p>{order.shipping_address.address_line2}</p>
                          )}
                          <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                          <p>{order.shipping_address.country}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking Information */}
              {order.tracking_number && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-4">Tracking Information</h3>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                      <p className="font-mono font-medium">{order.tracking_number}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Order Timeline */}
              <Separator />
              <div>
                <h3 className="font-semibold mb-4">Order Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-muted-foreground">{formatDate(order.order_date)}</p>
                    </div>
                  </div>
                  
                  {order.shipped_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Order Shipped</p>
                        <p className="text-sm text-muted-foreground">{formatDate(order.shipped_date)}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.delivered_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Order Delivered</p>
                        <p className="text-sm text-muted-foreground">{formatDate(order.delivered_date)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
