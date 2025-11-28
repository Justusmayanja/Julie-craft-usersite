"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { useChatUnreadCount } from '@/hooks/use-chat-unread-count'
import { X, Send, Minimize2, Maximize2, MessageCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
// Toast notifications - using a simple alert for now
const showError = (message: string) => {
  console.error(message)
  // You can replace this with your preferred toast/notification system
}
import { format } from 'date-fns'

interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_type: 'customer' | 'admin' | 'system'
  sender_name: string | null
  message: string
  message_type: 'text' | 'image' | 'file' | 'system'
  created_at: string
  is_read: boolean
}

interface ChatConversation {
  id: string
  user_id: string | null
  customer_name: string | null
  customer_email: string | null
  status: string
  last_message_at: string
  unread_count: number
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Listen for custom event to open chat from header
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true)
      setIsMinimized(false)
    }
    window.addEventListener('openChatWidget', handleOpenChat)
    return () => window.removeEventListener('openChatWidget', handleOpenChat)
  }, [])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (chatWidgetRef.current && !chatWidgetRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // Add slight delay to prevent immediate close when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversation, setConversation] = useState<ChatConversation | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatWidgetRef = useRef<HTMLDivElement>(null)
  const { user, isAuthenticated } = useAuth()
  const { unreadCount } = useChatUnreadCount()

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize conversation and load messages
  useEffect(() => {
    if (!isOpen) return

    const initializeChat = async () => {
      setIsInitializing(true)
      setError(null)
      try {
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('julie-crafts-token') 
          : null

        // Check if user is authenticated
        if (!token && !isAuthenticated) {
          setError('Please sign in to use chat support')
          setIsInitializing(false)
          return
        }

        if (!token) {
          setError('Authentication required. Please sign in.')
          setIsInitializing(false)
          return
        }

        // Get existing conversations
        const convResponse = await fetch('/api/chat/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        let convId: string | null = null
        let existingConv: ChatConversation | null = null

        if (convResponse.ok) {
          const convData = await convResponse.json()
          if (convData.conversations && convData.conversations.length > 0) {
            existingConv = convData.conversations[0]
            if (existingConv) {
              convId = existingConv.id
              setConversation(existingConv)
            }
          }
        } else if (convResponse.status === 401) {
          setError('Please sign in to use chat support')
          setIsInitializing(false)
          return
        }

        // Create new conversation if none exists
        if (!existingConv || !convId) {
          const createResponse = await fetch('/api/chat/conversations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              customer_name: user?.name || 'Guest',
              customer_email: user?.email || null
            })
          })

          if (createResponse.ok) {
            const newConv = await createResponse.json()
            if (newConv.conversation) {
              convId = newConv.conversation.id
              setConversation(newConv.conversation)
            } else {
              setError('Failed to create conversation. Please try again.')
              setIsInitializing(false)
              return
            }
          } else {
            const errorData = await createResponse.json().catch(() => ({}))
            if (createResponse.status === 401) {
              setError('Please sign in to use chat support')
            } else {
              setError(errorData.error || errorData.details || 'Failed to create conversation. Please try again.')
            }
            setIsInitializing(false)
            return
          }
        }

        // Load messages if we have a conversation ID
        if (convId) {
          await loadMessages(convId)

          // Subscribe to new messages using Supabase real-time
          if (supabase) {
          const subscription = supabase
            .channel(`chat:${convId}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `conversation_id=eq.${convId}`
              },
              (payload) => {
                const newMessage = payload.new as ChatMessage
                setMessages((prev) => [...prev, newMessage])
                markAsRead(convId)
              }
            )
            .subscribe()

            return () => {
              subscription.unsubscribe()
            }
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
        setError('Failed to initialize chat. Please try again or sign in if you haven\'t already.')
      } finally {
        setIsInitializing(false)
      }
    }

    initializeChat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id, isAuthenticated])

  const loadMessages = async (convId: string) => {
    try {
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('julie-crafts-token') 
        : null

      const response = await fetch(`/api/chat/messages?conversation_id=${convId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to load messages')

      const data = await response.json()
      setMessages(data.messages || [])
      await markAsRead(convId)
    } catch (error) {
      console.error('Error loading messages:', error)
      showError('Failed to load messages')
    }
  }

  const markAsRead = async (convId: string) => {
    if (!user?.id && !isAuthenticated) return
    try {
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('julie-crafts-token') 
        : null

      // Mark as read by fetching messages (API route handles marking as read)
      await fetch(`/api/chat/messages?conversation_id=${convId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !conversation || isSending) return

    setIsSending(true)
    try {
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('julie-crafts-token') 
        : null

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation_id: conversation.id,
          message: message.trim(),
          message_type: 'text'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()
      setMessage('')
      setMessages((prev) => [...prev, data.message])
    } catch (error) {
      console.error('Error sending message:', error)
      showError('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm')
    } catch {
      return ''
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg transition-all duration-300 relative"
          size="icon"
          aria-label="Open chat support"
        >
          <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white bg-red-500 border-2 border-white shadow-lg"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop for click outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <Card 
        ref={chatWidgetRef}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 w-[calc(100vw-2rem)] sm:w-80 md:w-96 lg:w-[420px] xl:w-[480px] h-[calc(100vh-8rem)] sm:h-[500px] md:h-[600px] lg:h-[650px] max-h-[90vh] flex flex-col shadow-2xl z-50 border-2 transition-all duration-300 rounded-lg overflow-hidden ${
          isMinimized ? 'h-14 sm:h-16 lg:h-16' : ''
        }`}
        style={{ maxWidth: 'calc(100vw - 2rem)' }}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 lg:p-5 border-b bg-gradient-to-r from-amber-500 to-amber-600 text-white flex-shrink-0 rounded-t-lg">
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
          <h3 className="font-semibold text-sm sm:text-base lg:text-lg truncate">Chat Support</h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 text-white hover:bg-amber-700/80 active:bg-amber-800 transition-colors flex-shrink-0"
            onClick={() => setIsMinimized(!isMinimized)}
            aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            ) : (
              <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 text-white hover:bg-amber-700/80 active:bg-amber-800 transition-colors flex-shrink-0"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-3 sm:p-4 min-h-0">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 max-w-md w-full">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                      <X className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">Unable to Start Chat</h3>
                  <p className="text-red-700 text-xs sm:text-sm mb-4">{error}</p>
                  {!isAuthenticated && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => {
                          window.location.href = '/login'
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm"
                        size="sm"
                      >
                        Sign In
                      </Button>
                      <Button
                        onClick={() => {
                          window.location.href = '/register'
                        }}
                        variant="outline"
                        className="text-xs sm:text-sm"
                        size="sm"
                      >
                        Create Account
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : isInitializing ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-amber-500 opacity-50" />
                <p className="text-sm sm:text-base">Start a conversation with our support team!</p>
                <p className="text-xs sm:text-sm mt-2">We typically respond within a few minutes.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {messages.map((msg) => {
                  const isCustomer = msg.sender_type === 'customer'
                  const isSystem = msg.sender_type === 'system'
                  
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="bg-muted px-3 py-1.5 rounded-full text-xs text-muted-foreground max-w-[90%] text-center">
                          {msg.message}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 py-2 sm:px-4 sm:py-2 ${
                          isCustomer
                            ? 'bg-amber-500 text-white'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {!isCustomer && (
                          <div className="text-xs font-semibold mb-1 opacity-75">
                            {msg.sender_name || 'Support'}
                          </div>
                        )}
                        <p className="text-sm sm:text-base whitespace-pre-wrap break-words">{msg.message}</p>
                        <div className={`text-xs mt-1 ${isCustomer ? 'text-amber-100' : 'text-muted-foreground'}`}>
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          {!error && (
            <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 text-sm sm:text-base"
                  disabled={isSending || !conversation || error !== null}
                />
                <Button
                  type="submit"
                  disabled={!message.trim() || isSending || !conversation || error !== null}
                  className="bg-amber-500 hover:bg-amber-600 h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                  size="icon"
                  aria-label="Send message"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center hidden sm:block">
                Press Enter to send
              </p>
            </form>
          )}
        </>
      )}
    </Card>
    </>
  )
}

