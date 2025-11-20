"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2, 
  Package, 
  Calendar, 
  CreditCard, 
  Truck, 
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Printer,
  Download
} from "lucide-react"
import jsPDF from "jspdf"

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  price: number
  product_image?: string
  product_id?: string
}

interface Order {
  id: string
  order_number: string
  order_date: string
  status: string
  payment_status: string
  total_amount: number
  subtotal?: number
  shipping_cost?: number
  tax?: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  shipping_address?: any
  billing_address?: any
  tracking_number?: string
  notes?: string
  order_items: OrderItem[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const orderId = params.id as string
  const activeTab = searchParams.get('tab') || 'details'
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.push(`/login?redirect=/orders/${orderId}`)
        return
      }
      loadOrder()
    }
  }, [orderId, isAuthenticated, authLoading, user, router])

  const loadOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found')
        }
        throw new Error('Failed to load order')
      }

      const data = await response.json()
      
      // Verify the order belongs to the current user
      if (data.customer_id !== user?.id && data.customer_email !== user?.email) {
        throw new Error('Unauthorized access to this order')
      }
      
      setOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order')
      console.error('Error loading order:', err)
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

  const parseAddress = (address: any): string => {
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address)
      } catch {
        return address
      }
    }
    if (typeof address === 'object' && address !== null) {
      const parts = [
        address.name,
        address.address_line1,
        address.address_line2,
        address.city,
        address.state,
        address.zip_code || address.postal_code,
        address.country,
      ].filter(Boolean)
      return parts.join('\n')
    }
    return 'N/A'
  }

  const downloadPDF = () => {
    if (!order) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxWidth = pageWidth - (margin * 2)
    let yPosition = margin

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
      doc.setFontSize(fontSize)
      doc.setTextColor(color[0], color[1], color[2])
      if (isBold) {
        doc.setFont(undefined, 'bold')
      } else {
        doc.setFont(undefined, 'normal')
      }
      
      const lines = doc.splitTextToSize(text, maxWidth)
      doc.text(lines, margin, yPosition)
      yPosition += lines.length * (fontSize * 0.4) + 5
    }

    // Header
    doc.setFillColor(59, 130, 246) // Blue color
    doc.rect(0, 0, pageWidth, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont(undefined, 'bold')
    doc.text('JULIE CRAFTS', margin, 25)
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text('Order Invoice', pageWidth - margin, 25, { align: 'right' })
    
    yPosition = 50

    // Order Information
    addText(`Order #${order.order_number}`, 18, true)
    addText(`Date: ${formatDate(order.order_date)}`, 10)
    yPosition += 5

    // Status Information
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPosition, maxWidth, 20, 'F')
    yPosition += 8
    addText(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 11, true)
    addText(`Payment: ${order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}`, 11)
    yPosition += 5

    // Customer Information
    addText('CUSTOMER INFORMATION', 14, true, [59, 130, 246])
    yPosition += 2
    addText(`Name: ${order.customer_name}`, 10)
    addText(`Email: ${order.customer_email}`, 10)
    if (order.customer_phone) {
      addText(`Phone: ${order.customer_phone}`, 10)
    }
    yPosition += 5

    // Shipping Address
    if (order.shipping_address) {
      addText('SHIPPING ADDRESS', 14, true, [59, 130, 246])
      yPosition += 2
      const addressLines = parseAddress(order.shipping_address).split('\n')
      addressLines.forEach(line => {
        if (line.trim()) {
          addText(line, 10)
        }
      })
      yPosition += 5
    }

    // Order Items Header
    addText('ORDER ITEMS', 14, true, [59, 130, 246])
    yPosition += 5

    // Table Header
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPosition - 5, maxWidth, 10, 'F')
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('Item', margin + 5, yPosition)
    doc.text('Qty', margin + 100, yPosition)
    doc.text('Price', margin + 130, yPosition)
    doc.text('Total', pageWidth - margin - 30, yPosition, { align: 'right' })
    yPosition += 8

    // Order Items
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    order.order_items.forEach((item) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = margin
      }

      const itemName = item.product_name.length > 35 
        ? item.product_name.substring(0, 32) + '...' 
        : item.product_name
      
      const startY = yPosition
      const itemLines = doc.splitTextToSize(itemName, 80)
      doc.text(itemLines, margin + 5, yPosition)
      const itemHeight = itemLines.length * 5
      
      // Quantity, Price, Total aligned
      doc.text(`${item.quantity}`, margin + 100, startY + (itemHeight > 5 ? itemHeight / 2 : 0))
      doc.text(formatPrice(item.price), margin + 130, startY + (itemHeight > 5 ? itemHeight / 2 : 0))
      doc.text(formatPrice(item.price * item.quantity), pageWidth - margin - 30, startY + (itemHeight > 5 ? itemHeight / 2 : 0), { align: 'right' })
      
      yPosition += Math.max(itemHeight, 8) + 3
    })

    yPosition += 5

    // Order Summary
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    addText('ORDER SUMMARY', 12, true)
    yPosition += 2

    const subtotal = order.subtotal || order.total_amount
    addText(`Subtotal: ${formatPrice(subtotal)}`, 10)
    
    if (order.shipping_cost) {
      addText(`Shipping: ${formatPrice(order.shipping_cost)}`, 10)
    }
    
    if (order.tax) {
      addText(`Tax: ${formatPrice(order.tax)}`, 10)
    }

    yPosition += 3
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 5

    // Total
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(59, 130, 246)
    doc.text(`TOTAL: ${formatPrice(order.total_amount)}`, pageWidth - margin, yPosition, { align: 'right' })

    // Footer
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
      doc.text(
        'Thank you for your order!',
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      )
    }

    // Save the PDF
    doc.save(`order-${order.order_number}.pdf`)
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

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
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
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Order Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'The order you\'re looking for doesn\'t exist or you don\'t have access to it.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/orders">Back to Orders</Link>
            </Button>
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/orders">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order #{order.order_number}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(order.order_date)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Status</p>
                  <Badge className={`${getStatusColor(order.status)} border font-medium`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  <Badge className={`${getPaymentStatusColor(order.payment_status)} border font-medium`}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </Badge>
                </div>
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={activeTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Order Details</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
          </TabsList>

          {/* Order Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.order_items.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-20 h-20 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
                        {item.product_image ? (
                          <Link href={item.product_id ? `/product/${item.product_id}` : '#'}>
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/placeholder.svg'
                                target.onerror = null
                              }}
                            />
                          </Link>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Package className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={item.product_id ? `/product/${item.product_id}` : '#'}
                          className="font-medium text-sm hover:text-primary"
                        >
                          {item.product_name}
                        </Link>
                        <p className="text-xs text-gray-600 mt-1">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-xs text-gray-600">
                          Unit Price: {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(order.subtotal || order.total_amount)}</span>
                  </div>
                  {order.shipping_cost && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">{formatPrice(order.shipping_cost)}</span>
                    </div>
                  )}
                  {order.tax && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">{formatPrice(order.tax)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Name</p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {order.customer_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Email</p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {order.customer_email}
                  </p>
                </div>
                {order.customer_phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Phone</p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {order.customer_phone}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shipping_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {parseAddress(order.shipping_address)}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Order Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.tracking_number ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Tracking Number</p>
                      <p className="text-lg font-mono font-semibold">{order.tracking_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Current Status</p>
                      <Badge className={`${getStatusColor(order.status)} border`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Track your package using the tracking number above on the shipping carrier's website.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Truck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                      Tracking information will be available once your order ships.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Tab */}
          <TabsContent value="invoice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold mb-2">Invoice</h2>
                      <p className="text-sm text-gray-600">Order #{order.order_number}</p>
                      <p className="text-sm text-gray-600">{formatDate(order.order_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">Julie Crafts</p>
                      <p className="text-xs text-gray-600">Ntinda View Apartments, Kampala</p>
                      <p className="text-xs text-gray-600">+256 700 123 456</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Invoice Items */}
                  <div className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm py-2 border-b">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Invoice Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(order.subtotal || order.total_amount)}</span>
                    </div>
                    {order.shipping_cost && (
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>{formatPrice(order.shipping_cost)}</span>
                      </div>
                    )}
                    {order.tax && (
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>{formatPrice(order.tax)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

