"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Package,
  Calendar,
  CreditCard,
  Truck,
  MapPin,
  Phone,
  Mail,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
  User,
  Ban,
} from "lucide-react"
import { useToast } from "@/contexts/toast-context"

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  product_sku?: string
  quantity: number
  price: number
  total_price: number
  product_image?: string
}

interface Order {
  id: string
  order_number: string
  customer_id?: string
  customer_email: string
  customer_name: string
  customer_phone?: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
  payment_method?: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  shipping_address?: any
  billing_address?: any
  order_date: string
  shipped_date?: string
  delivered_date?: string
  notes?: string
  tracking_number?: string
  order_items: OrderItem[]
}

interface OrderDetailModalProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrderUpdated: () => void
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
]

const paymentStatusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'paid', label: 'Paid', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'refunded', label: 'Refunded', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'partially_refunded', label: 'Partially Refunded', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
]

export function OrderDetailModal({ order, open, onOpenChange, onOrderUpdated }: OrderDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [localOrder, setLocalOrder] = useState<Order | null>(order)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const toast = useToast()

  useEffect(() => {
    setLocalOrder(order)
    setTrackingNumber(order?.tracking_number || '')
    setNotes(order?.notes || '')
  }, [order])

  const handleStatusChange = async (newStatus: string) => {
    if (!localOrder) return

    setLoading(true)
    try {
      const token = localStorage.getItem('julie-crafts-token')
      const updates: any = { status: newStatus }

      // Auto-update dates based on status
      if (newStatus === 'shipped' && !localOrder.shipped_date) {
        updates.shipped_date = new Date().toISOString()
      }
      if (newStatus === 'delivered' && !localOrder.delivered_date) {
        updates.delivered_date = new Date().toISOString()
      }

      const response = await fetch(`/api/orders/${localOrder.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to update order status')
      }

      const updatedOrder = await response.json()
      setLocalOrder(updatedOrder)
      toast.showSuccess('Order Updated', `Order status changed to ${newStatus}`)
      onOrderUpdated()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.showError('Update Failed', 'Failed to update order status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentStatusChange = async (newPaymentStatus: string) => {
    if (!localOrder) return

    setLoading(true)
    try {
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/orders/${localOrder.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_status: newPaymentStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to update payment status')
      }

      const updatedOrder = await response.json()
      setLocalOrder(updatedOrder)
      toast.showSuccess('Payment Status Updated', `Payment status changed to ${newPaymentStatus}`)
      onOrderUpdated()
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.showError('Update Failed', 'Failed to update payment status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTracking = async () => {
    if (!localOrder) return

    setLoading(true)
    try {
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/orders/${localOrder.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tracking_number: trackingNumber }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to update tracking number')
      }

      const updatedOrder = await response.json()
      setLocalOrder(updatedOrder)
      toast.showSuccess('Tracking Updated', 'Tracking number saved successfully')
      onOrderUpdated()
    } catch (error) {
      console.error('Error updating tracking number:', error)
      toast.showError('Update Failed', 'Failed to update tracking number. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!localOrder) return

    setLoading(true)
    try {
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/orders/${localOrder.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: notes }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to update notes')
      }

      const updatedOrder = await response.json()
      setLocalOrder(updatedOrder)
      toast.showSuccess('Notes Updated', 'Order notes saved successfully')
      onOrderUpdated()
    } catch (error) {
      console.error('Error updating notes:', error)
      toast.showError('Update Failed', 'Failed to update notes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!localOrder) return

    setCancelling(true)
    try {
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/orders/${localOrder.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: cancellationReason }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to cancel order')
      }

      const result = await response.json()
      setLocalOrder(result.order)
      setShowCancelDialog(false)
      setCancellationReason('')
      
      toast.showSuccess(
        'Order Cancelled', 
        `Order has been cancelled and inventory restored. ${result.inventory_restored} item(s) restored.`
      )
      onOrderUpdated()
    } catch (error) {
      console.error('Error cancelling order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order'
      toast.showError('Cancellation Failed', errorMessage)
    } finally {
      setCancelling(false)
    }
  }

  const canCancel = localOrder && 
    localOrder.status !== 'cancelled' && 
    localOrder.status !== 'delivered'

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} ${localOrder?.currency || 'UGX'}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        address.address_line1,
        address.address_line2,
        address.city,
        address.state,
        address.zip_code,
        address.country,
      ].filter(Boolean)
      return parts.join(', ')
    }
    return 'N/A'
  }

  if (!localOrder) return null

  const currentStatus = statusOptions.find(s => s.value === localOrder.status)
  const currentPaymentStatus = paymentStatusOptions.find(s => s.value === localOrder.payment_status)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order {localOrder.order_number}</span>
            <Badge className={currentStatus?.color || 'bg-gray-100 text-gray-700'}>
              {currentStatus?.label || localOrder.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Order placed on {formatDate(localOrder.order_date)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{localOrder.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{localOrder.customer_email}</span>
              </div>
              {localOrder.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{localOrder.customer_phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status and Payment Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Order Status</Label>
                  <Select
                    value={localOrder.status}
                    onValueChange={handleStatusChange}
                    disabled={loading}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <Select
                    value={localOrder.payment_status}
                    onValueChange={handlePaymentStatusChange}
                    disabled={loading}
                  >
                    <SelectTrigger id="payment_status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentStatusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking">Tracking Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSaveTracking}
                    disabled={loading || trackingNumber === localOrder.tracking_number}
                    size="sm"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this order..."
                  rows={3}
                  disabled={loading}
                />
                <Button
                  onClick={handleSaveNotes}
                  disabled={loading || notes === (localOrder.notes || '')}
                  size="sm"
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Notes
                </Button>
              </div>

              {/* Cancel Order Button */}
              {canCancel && (
                <div className="pt-4 border-t mt-4">
                  <Button
                    onClick={() => setShowCancelDialog(true)}
                    disabled={loading || cancelling}
                    size="sm"
                    variant="destructive"
                    className="w-full"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Cancel Order
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    This will cancel the order and restore inventory for all items. Payment status will be updated accordingly.
                  </p>
                </div>
              )}

              {localOrder?.status === 'cancelled' && (
                <div className="pt-4 border-t mt-4">
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <XCircle className="w-5 h-5" />
                    <span>This order has been cancelled</span>
                  </div>
                </div>
              )}

              {localOrder?.status === 'delivered' && (
                <div className="pt-4 border-t mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span>Delivered orders cannot be cancelled. Please process a return instead.</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Items ({localOrder.order_items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {localOrder.order_items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-20 h-20 bg-gray-100 rounded border overflow-hidden flex-shrink-0 relative">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            if (target.nextElementSibling?.classList.contains('fallback-icon')) {
                              target.nextElementSibling.classList.remove('hidden')
                            }
                          }}
                        />
                      ) : null}
                      <div className={`fallback-icon w-full h-full flex items-center justify-center bg-gray-200 ${item.product_image ? 'hidden absolute inset-0' : ''}`}>
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.product_name}</div>
                      {item.product_sku && (
                        <div className="text-xs text-gray-500">SKU: {item.product_sku}</div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">
                          {item.quantity} × {formatPrice(item.price)}
                        </span>
                        <span className="font-medium text-sm">
                          {formatPrice(item.total_price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {localOrder.shipping_address && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {parseAddress(localOrder.shipping_address)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(localOrder.subtotal)}</span>
                </div>
                {localOrder.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatPrice(localOrder.tax_amount)}</span>
                  </div>
                )}
                {localOrder.shipping_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span>{formatPrice(localOrder.shipping_amount)}</span>
                  </div>
                )}
                {localOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-emerald-600">-{formatPrice(localOrder.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(localOrder.total_amount)}</span>
                </div>
                {localOrder.payment_method && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <CreditCard className="w-4 h-4" />
                    <span>Payment Method: {localOrder.payment_method}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Order Date:</span>{' '}
                <span className="font-medium">{formatDate(localOrder.order_date)}</span>
              </div>
              {localOrder.shipped_date && (
                <div>
                  <span className="text-gray-600">Shipped Date:</span>{' '}
                  <span className="font-medium">{formatDate(localOrder.shipped_date)}</span>
                </div>
              )}
              {localOrder.delivered_date && (
                <div>
                  <span className="text-gray-600">Delivered Date:</span>{' '}
                  <span className="font-medium">{formatDate(localOrder.delivered_date)}</span>
                </div>
              )}
              {localOrder.tracking_number && (
                <div className="flex items-center gap-2 mt-3">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Tracking:</span>
                  <span className="font-medium font-mono">{localOrder.tracking_number}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* Cancellation Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" />
              Cancel Order {localOrder?.order_number}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-2">
              <p>
                Are you sure you want to cancel this order? This action will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Change order status to <strong>Cancelled</strong></li>
                <li>Restore inventory for all items in this order</li>
                <li>
                  Update payment status to{' '}
                  <strong>
                    {localOrder?.payment_status === 'paid' ? 'Refunded' : 'Failed'}
                  </strong>
                </li>
                <li>Add a cancellation note to the order</li>
              </ul>
              <div className="space-y-2 pt-2">
                <Label htmlFor="cancel-reason">Cancellation Reason (Optional)</Label>
                <Textarea
                  id="cancel-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                  rows={3}
                  disabled={cancelling}
                />
              </div>
              <p className="text-xs text-red-600 font-medium pt-2">
                This action cannot be undone. The order cannot be uncancelled.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Cancel Order
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

