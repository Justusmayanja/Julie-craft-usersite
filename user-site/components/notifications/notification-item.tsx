"use client"

import { useState, useEffect } from "react"
import { useNotifications } from "@/contexts/notification-context"
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  AlertCircle,
  MapPin,
  Check,
  Trash2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShoppingBag,
  DollarSign,
  Calendar,
  User
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NotificationItemProps {
  notification: {
    id: string
    notification_type: string
    title: string
    message: string
    order_id?: string
    order_number?: string
    is_read: boolean
    created_at: string
    metadata?: Record<string, any>
    customer_avatar_url?: string
    customer_name?: string
  }
  onClose: () => void
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order_placed':
    case 'order_processing':
      return Package
    case 'order_shipped':
    case 'tracking_updated':
      return Truck
    case 'order_delivered':
      return CheckCircle
    case 'order_cancelled':
      return XCircle
    case 'payment_received':
    case 'payment_failed':
      return CreditCard
    default:
      return AlertCircle
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'order_placed':
    case 'order_processing':
      return 'bg-blue-100 text-blue-600'
    case 'order_shipped':
    case 'tracking_updated':
      return 'bg-purple-100 text-purple-600'
    case 'order_delivered':
      return 'bg-green-100 text-green-600'
    case 'order_cancelled':
      return 'bg-red-100 text-red-600'
    case 'payment_received':
      return 'bg-emerald-100 text-emerald-600'
    case 'payment_failed':
      return 'bg-orange-100 text-orange-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

interface OrderDetails {
  id: string
  order_number: string
  total_amount: number
  subtotal?: number
  shipping_amount?: number
  tax_amount?: number
  status: string
  payment_status: string
  order_date: string
  customer_name: string
  customer_email: string
  order_items: Array<{
    id: string
    product_name: string
    quantity: number
    price: number
    product_image?: string
  }>
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { markAsRead, deleteNotification, isAdmin } = useNotifications()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const Icon = getNotificationIcon(notification.notification_type)
  const colorClasses = getNotificationColor(notification.notification_type)
  
  // Check if this is an order notification
  const isOrderNotification = notification.order_id && (
    notification.notification_type?.includes('order') || 
    notification.notification_type?.includes('payment')
  )

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isDeleting) return
    
    setIsDeleting(true)
    try {
      await deleteNotification(notification.id)
    } catch (error) {
      console.error('Error deleting notification:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Fetch order details when expanded
  useEffect(() => {
    if (isExpanded && isOrderNotification && notification.order_id && !orderDetails && !loadingOrder) {
      fetchOrderDetails()
    }
  }, [isExpanded, notification.order_id])

  const fetchOrderDetails = async () => {
    if (!notification.order_id) return
    
    setLoadingOrder(true)
    setOrderError(null)
    
    try {
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/orders/${notification.order_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load order details')
      }

      const data = await response.json()
      setOrderDetails(data)
    } catch (err) {
      console.error('Error fetching order details:', err)
      setOrderError(err instanceof Error ? err.message : 'Failed to load order details')
    } finally {
      setLoadingOrder(false)
    }
  }

  const handleToggleExpand = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isExpanded && !notification.is_read) {
      await markAsRead(notification.id)
    }
    
    setIsExpanded(!isExpanded)
  }

  const handleClick = async () => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    if (!isOrderNotification) {
      onClose()
    }
  }

  const href = notification.order_id 
    ? (isAdmin 
        ? `/admin/orders/${notification.order_id}` 
        : `/orders/${notification.order_id}`)
    : undefined

  const formatPrice = (price: number) => {
    return `UGX ${price.toLocaleString()}`
  }

  // Get customer info - prefer from API, fallback to metadata
  const customerAvatarUrl = notification.customer_avatar_url || null
  const customerName = notification.customer_name || notification.metadata?.customer_name || null
  const showCustomerAvatar = isOrderNotification && customerAvatarUrl

  // Get color scheme based on notification type
  const getColorScheme = () => {
    switch (notification.notification_type) {
      case 'order_placed':
      case 'order_processing':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
          border: 'border-blue-200',
          accent: 'text-blue-600',
          accentBg: 'bg-blue-100',
          badge: 'bg-blue-500'
        }
      case 'order_shipped':
      case 'tracking_updated':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
          border: 'border-purple-200',
          accent: 'text-purple-600',
          accentBg: 'bg-purple-100',
          badge: 'bg-purple-500'
        }
      case 'order_delivered':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-green-100/50',
          border: 'border-green-200',
          accent: 'text-green-600',
          accentBg: 'bg-green-100',
          badge: 'bg-green-500'
        }
      case 'order_cancelled':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-red-100/50',
          border: 'border-red-200',
          accent: 'text-red-600',
          accentBg: 'bg-red-100',
          badge: 'bg-red-500'
        }
      case 'payment_received':
        return {
          bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
          border: 'border-emerald-200',
          accent: 'text-emerald-600',
          accentBg: 'bg-emerald-100',
          badge: 'bg-emerald-500'
        }
      case 'payment_failed':
        return {
          bg: 'bg-gradient-to-br from-orange-50 to-orange-100/50',
          border: 'border-orange-200',
          accent: 'text-orange-600',
          accentBg: 'bg-orange-100',
          badge: 'bg-orange-500'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-gray-100/50',
          border: 'border-gray-200',
          accent: 'text-gray-600',
          accentBg: 'bg-gray-100',
          badge: 'bg-gray-500'
        }
    }
  }

  const colors = getColorScheme()

  return (
    <div
      className={cn(
        "group relative transition-all duration-200",
        !notification.is_read && "bg-orange-50/30",
        isExpanded && colors.bg
      )}
    >
      {/* Main Notification Content */}
      <div
        className={cn(
          "p-3 sm:p-4 hover:bg-gray-50/50 transition-colors",
          isExpanded && "border-b border-gray-200"
        )}
      >
        <div className="flex items-start gap-3">
        {showCustomerAvatar ? (
          <Avatar className="flex-shrink-0 w-10 h-10 border-2 border-white shadow-sm">
            <AvatarImage 
              src={customerAvatarUrl} 
              alt={customerName || 'Customer'} 
            />
            <AvatarFallback className={cn("text-xs font-medium", colorClasses)}>
              {customerName 
                ? customerName.charAt(0).toUpperCase()
                : <Icon className="h-5 w-5" />
              }
            </AvatarFallback>
          </Avatar>
        ) : isOrderNotification && customerName ? (
          <Avatar className="flex-shrink-0 w-10 h-10 border-2 border-white shadow-sm">
            <AvatarFallback className={cn("text-xs font-medium", colorClasses)}>
              {customerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center", colorClasses)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={cn(
                "text-sm font-semibold text-gray-900",
                !notification.is_read && "font-bold"
              )}>
                {notification.title}
              </h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-orange-600" />
                )}
                {/* Action Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 sm:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {!notification.is_read && (
                      <DropdownMenuItem onClick={handleMarkAsRead}>
                        <Check className="h-4 w-4 mr-2" />
                        Mark as read
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div onClick={isOrderNotification ? handleToggleExpand : handleClick} className={cn(
              "cursor-pointer",
              !isOrderNotification && "block"
            )}>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              {notification.order_number && (
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  Order #{notification.order_number}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
                {isOrderNotification && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleToggleExpand}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Hide details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        View details
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Order Details */}
      {isExpanded && isOrderNotification && (
        <div className={cn(
          "px-4 pb-4 border-t transition-all duration-300",
          colors.border
        )}>
          {loadingOrder ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading order details...</span>
            </div>
          ) : orderError ? (
            <div className="py-4 text-center">
              <p className="text-sm text-red-600">{orderError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrderDetails}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : orderDetails ? (
            <div className="pt-4 space-y-3">
              {/* Order Summary Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className={cn("p-3 rounded-lg border", colors.border, colors.bg)}>
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className={cn("h-4 w-4", colors.accent)} />
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                  <p className={cn("text-sm font-bold", colors.accent)}>
                    {formatPrice(orderDetails.total_amount)}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg border", colors.border, colors.bg)}>
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className={cn("h-4 w-4", colors.accent)} />
                    <p className="text-xs text-gray-600">Items</p>
                  </div>
                  <p className={cn("text-sm font-bold", colors.accent)}>
                    {orderDetails.order_items?.length || 0}
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn("text-xs", colors.accentBg, colors.accent, "border-0")}>
                  {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                </Badge>
                <Badge className={cn("text-xs", colors.accentBg, colors.accent, "border-0")}>
                  Payment: {orderDetails.payment_status.charAt(0).toUpperCase() + orderDetails.payment_status.slice(1)}
                </Badge>
              </div>

              {/* Order Items */}
              {orderDetails.order_items && orderDetails.order_items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Order Items:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {orderDetails.order_items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg border",
                          colors.border,
                          "bg-white/60"
                        )}
                      >
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-10 h-10 rounded object-cover border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className={cn("w-10 h-10 rounded flex items-center justify-center", colors.accentBg)}>
                            <Package className={cn("h-5 w-5", colors.accent)} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                        <p className={cn("text-xs font-bold", colors.accent)}>
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className={cn("p-3 rounded-lg border", colors.border, colors.bg)}>
                <div className="flex items-center gap-2 mb-2">
                  <User className={cn("h-4 w-4", colors.accent)} />
                  <p className="text-xs font-semibold text-gray-700">Customer</p>
                </div>
                <p className="text-xs text-gray-600">{orderDetails.customer_name}</p>
                <p className="text-xs text-gray-500">{orderDetails.customer_email}</p>
              </div>

              {/* View Full Order Link */}
              {href && (
                <Link href={href} onClick={onClose}>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("w-full text-xs", colors.border, "hover:" + colors.accentBg)}
                  >
                    View Full Order Details
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-500">Click to load order details</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

