"use client"

import { useState } from "react"
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
  MoreVertical
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { markAsRead, deleteNotification, isAdmin } = useNotifications()
  const [isDeleting, setIsDeleting] = useState(false)
  const Icon = getNotificationIcon(notification.notification_type)
  const colorClasses = getNotificationColor(notification.notification_type)

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

  const handleClick = async () => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    onClose()
  }

  const href = notification.order_id 
    ? (isAdmin 
        ? `/admin/orders/${notification.order_id}` 
        : `/orders/${notification.order_id}`)
    : undefined

  const content = (
    <div
      className={cn(
        "group relative p-3 sm:p-4 hover:bg-gray-50 transition-colors",
        !notification.is_read && "bg-orange-50/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center", colorClasses)}>
          <Icon className="h-5 w-5" />
        </div>
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
          {href ? (
            <Link href={href} onClick={handleClick} className="block">
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              {notification.order_number && (
                <p className="text-xs text-gray-500 mt-1">
                  Order #{notification.order_number}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </Link>
          ) : (
            <div onClick={handleClick} className="cursor-pointer">
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              {notification.order_number && (
                <p className="text-xs text-gray-500 mt-1">
                  Order #{notification.order_number}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return content
}

