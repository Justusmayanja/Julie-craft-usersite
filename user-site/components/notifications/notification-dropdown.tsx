"use client"

import { useNotifications } from "@/contexts/notification-context"
import { NotificationItem } from "./notification-item"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCheck } from "lucide-react"
import Link from "next/link"

interface NotificationDropdownProps {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, unreadCount, loading, markAllAsRead, isAdmin } = useNotifications()

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  return (
    <div className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 max-h-[calc(100vh-8rem)] sm:max-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs text-orange-600 hover:text-orange-700"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-12rem)] sm:max-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <Link
            href={isAdmin ? "/admin/notifications" : "/notifications"}
            onClick={onClose}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}

