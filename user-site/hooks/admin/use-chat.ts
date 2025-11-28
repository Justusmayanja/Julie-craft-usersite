import { useState, useEffect, useCallback } from 'react'

export interface ChatConversation {
  id: string
  user_id: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  subject: string | null
  status: 'open' | 'active' | 'waiting' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assigned_to: string | null
  last_message_at: string
  last_message_by: string | null
  unread_count: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_type: 'customer' | 'admin' | 'system'
  sender_name: string | null
  message: string
  message_type: 'text' | 'image' | 'file' | 'system'
  attachments: any[]
  is_read: boolean
  read_at: string | null
  created_at: string
}

export function useChat() {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const getToken = () => {
    return typeof window !== 'undefined' 
      ? localStorage.getItem('julie-crafts-token') 
      : null
  }

  const fetchConversations = useCallback(async () => {
    try {
      setError(null)
      const token = getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data.conversations || [])
      
      // Calculate total unread count
      const totalUnread = (data.conversations || []).reduce(
        (sum: number, conv: ChatConversation) => sum + (conv.unread_count || 0),
        0
      )
      setUnreadCount(totalUnread)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setError(null)
      const token = getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`/api/chat/messages?conversation_id=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch messages')
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
    }
  }, [])

  const sendMessage = useCallback(async (conversationId: string, message: string) => {
    try {
      setSending(true)
      setError(null)
      const token = getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: message.trim(),
          message_type: 'text'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()
      setMessages((prev) => [...prev, data.message])
      
      // Refresh conversations to update last_message_at
      await fetchConversations()
      
      return data.message
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      throw err
    } finally {
      setSending(false)
    }
  }, [fetchConversations])

  const updateConversationStatus = useCallback(async (
    conversationId: string,
    status: ChatConversation['status'],
    assignedTo?: string | null
  ) => {
    try {
      setError(null)
      const token = getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`/api/admin/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          assigned_to: assignedTo
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update conversation')
      }

      await fetchConversations()
      if (selectedConversation?.id === conversationId) {
        const updated = await response.json()
        setSelectedConversation(updated.conversation)
      }
    } catch (err) {
      console.error('Error updating conversation:', err)
      setError(err instanceof Error ? err.message : 'Failed to update conversation')
      throw err
    }
  }, [fetchConversations, selectedConversation])

  useEffect(() => {
    fetchConversations()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchConversations, 30000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        if (selectedConversation) {
          fetchMessages(selectedConversation.id)
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedConversation, fetchMessages])

  return {
    conversations,
    messages,
    selectedConversation,
    setSelectedConversation,
    loading,
    sending,
    unreadCount,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    updateConversationStatus
  }
}

