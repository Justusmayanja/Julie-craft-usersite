import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { playNotificationSound, isSoundEnabled } from '@/lib/sound-notification'

export function useChatUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const previousUnreadCountRef = useRef(0)
  const isInitialLoadRef = useRef(true)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('julie-crafts-token') 
          : null

        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/chat/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const totalUnread = (data.conversations || []).reduce(
            (sum: number, conv: any) => sum + (conv.unread_count || 0),
            0
          )
          
          // Play sound if:
          // 1. Sound is enabled
          // 2. Not the initial load (skip sound on first fetch)
          // 3. Unread count increased (new message arrived)
          if (!isInitialLoadRef.current && isSoundEnabled() && totalUnread > previousUnreadCountRef.current) {
            playNotificationSound('chat')
          }
          
          // Mark initial load as complete after first fetch
          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false
          }
          
          // Update ref for next comparison
          previousUnreadCountRef.current = totalUnread
          setUnreadCount(totalUnread)
        } else {
          console.error('Failed to fetch unread count:', response.status, response.statusText)
          setUnreadCount(0)
        }
      } catch (error) {
        console.error('Error fetching unread chat count:', error)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchUnreadCount()

    // Listen for custom event when messages are read
    const handleMessagesRead = () => {
      fetchUnreadCount()
    }
    window.addEventListener('chatMessagesRead', handleMessagesRead)

    // Set up real-time subscription for admin chat updates
    let subscription: any = null
    if (supabase) {
      subscription = supabase
        .channel('admin-chat-unread-count')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_conversations'
          },
          () => {
            // Refresh count when any conversation is updated
            fetchUnreadCount()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages'
          },
          (payload) => {
            const newMessage = payload.new as any
            // If message is from customer, refresh admin count
            if (newMessage.sender_type === 'customer') {
              fetchUnreadCount()
            }
          }
        )
        .subscribe()
    }

    // Poll every 30 seconds as fallback
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => {
      window.removeEventListener('chatMessagesRead', handleMessagesRead)
      if (subscription) {
        subscription.unsubscribe()
      }
      clearInterval(interval)
    }
  }, [])

  return { unreadCount, loading }
}

