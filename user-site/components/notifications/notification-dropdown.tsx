"use client"

import { useState, useEffect } from "react"
import { useNotifications } from "@/contexts/notification-context"
import { NotificationItem } from "./notification-item"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCheck, Volume2, VolumeX } from "lucide-react"
import Link from "next/link"
import { isSoundEnabled, setSoundEnabled, playNotificationSound } from "@/lib/sound-notification"

interface NotificationDropdownProps {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, unreadCount, loading, markAllAsRead, isAdmin } = useNotifications()
  const [soundEnabled, setSoundEnabledState] = useState(true)

  // Filter out read notifications - only show unread in the dropdown
  const unreadNotifications = notifications.filter(notification => !notification.is_read)

  // Load sound preference on mount
  useEffect(() => {
    setSoundEnabledState(isSoundEnabled())
  }, [])

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleToggleSound = () => {
    const newState = !soundEnabled
    setSoundEnabledState(newState)
    setSoundEnabled(newState)
    // Play a test sound when enabling
    if (newState) {
      playNotificationSound('notification')
    }
  }

  return (
    <div className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 lg:w-[420px] max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 max-h-[calc(100vh-8rem)] sm:max-h-[600px] lg:max-h-[650px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleSound}
            className="text-xs text-gray-600 hover:text-gray-900"
            title={soundEnabled ? "Disable sound notifications" : "Enable sound notifications"}
          >
            {soundEnabled ? (
              <Volume2 className="h-3 w-3" />
            ) : (
              <VolumeX className="h-3 w-3" />
            )}
          </Button>
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
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : unreadNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No unread notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {unreadNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer - Always visible and accessible */}
      {unreadNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 text-center bg-white flex-shrink-0 sticky bottom-0 z-10">
          <Link
            href={isAdmin ? "/admin/notifications" : "/notifications"}
            onClick={onClose}
            className="inline-block text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-orange-50"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}

