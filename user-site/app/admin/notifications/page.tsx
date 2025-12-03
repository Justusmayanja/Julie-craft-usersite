"use client"

import { useState } from "react"
import { useNotifications } from "@/contexts/notification-context"
import { NotificationItem } from "@/components/notifications/notification-item"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCheck, Bell, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminNotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { notifications, unreadCount, loading, markAllAsRead, refreshNotifications } = useNotifications()

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    // Refresh to update the list
    await refreshNotifications()
  }

  // Filter notifications based on selected filter
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Notifications</h1>
          <p className="text-gray-600">Manage and view all system notifications</p>
        </div>

        <Card className="bg-white border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-3">
                  {unreadCount > 0 ? (
                    <span>
                      All Notifications <span className="text-orange-600">({unreadCount} unread)</span>
                    </span>
                  ) : (
                    "All Notifications"
                  )}
                </CardTitle>
                
                {/* Filter Buttons */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <div className="flex gap-2">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('all')}
                      className="h-8"
                    >
                      All
                    </Button>
                    <Button
                      variant={filter === 'unread' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('unread')}
                      className="h-8"
                      disabled={unreadCount === 0}
                    >
                      Unread {unreadCount > 0 && `(${unreadCount})`}
                    </Button>
                  </div>
                </div>
              </div>
              
              {unreadCount > 0 && filter === 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
                <p className="text-sm text-gray-500">
                  {filter === 'unread' 
                    ? 'You have no unread notifications. Switch to "All" to view your notification history.'
                    : "You're all caught up! New notifications will appear here."}
                </p>
                {filter === 'unread' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="mt-4"
                  >
                    View All Notifications
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => {}}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

