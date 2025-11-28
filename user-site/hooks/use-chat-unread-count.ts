import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

export function useChatUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setUnreadCount(0)
      setLoading(false)
      return
    }

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

    // Set up real-time subscription for conversation updates
    let subscription: any = null
    if (supabase && user?.id) {
      subscription = supabase
        .channel(`chat-unread-count-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_conversations',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Refresh count when conversation is updated
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
            // If message is for this user's conversation, refresh count
            if (newMessage.sender_type === 'admin') {
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
  }, [isAuthenticated, user?.id])

  return { unreadCount, loading }
}

