"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useAuth } from "./auth-context"

export interface Notification {
  id: string
  user_id?: string
  recipient_type: 'admin' | 'customer'
  notification_type: string
  title: string
  message: string
  order_id?: string
  order_number?: string
  is_read: boolean
  read_at?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  refreshNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  isAdmin: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children, isAdmin = false }: { children: ReactNode; isAdmin?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuth()

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null)
      const token = typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null
      
      if (!token && !isAdmin) {
        setNotifications([])
        setUnreadCount(0)
        setLoading(false)
        return
      }

      const recipientType = isAdmin ? 'admin' : 'customer'
      const response = await fetch(`/api/notifications?recipient_type=${recipientType}&limit=50`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  const refreshNotifications = useCallback(async () => {
    setLoading(true)
    await fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null
      
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_read: true })
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null
      const recipientType = isAdmin ? 'admin' : 'customer'
      
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipient_type: recipientType })
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }, [isAdmin])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null
      
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      // Update local state - remove deleted notification
      setNotifications(prev => {
        const deleted = prev.find(n => n.id === notificationId)
        const newNotifications = prev.filter(notif => notif.id !== notificationId)
        // If deleted notification was unread, decrease unread count
        if (deleted && !deleted.is_read) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1))
        }
        return newNotifications
      })
    } catch (err) {
      console.error('Error deleting notification:', err)
      throw err
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    if (isAdmin || isAuthenticated) {
      fetchNotifications()
    } else {
      setLoading(false)
    }
  }, [fetchNotifications, isAdmin, isAuthenticated])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!isAdmin && !isAuthenticated) return

    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [fetchNotifications, isAdmin, isAuthenticated])

  // Listen for logout events to clear notifications
  useEffect(() => {
    const handleLogout = (event: CustomEvent) => {
      console.log('User logged out, clearing notifications')
      setNotifications([])
      setUnreadCount(0)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('userLogout', handleLogout as EventListener)
      
      return () => {
        window.removeEventListener('userLogout', handleLogout as EventListener)
      }
    }
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        isAdmin
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

