import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useChatUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

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
          setUnreadCount(totalUnread)
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

