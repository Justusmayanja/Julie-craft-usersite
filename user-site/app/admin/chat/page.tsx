"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MessageCircle,
  Send,
  Search,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Archive,
  UserPlus
} from "lucide-react"
import { useChat } from "@/hooks/admin/use-chat"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

const statusColors = {
  open: "bg-blue-100 text-blue-700 border-blue-200",
  active: "bg-green-100 text-green-700 border-green-200",
  waiting: "bg-yellow-100 text-yellow-700 border-yellow-200",
  resolved: "bg-gray-100 text-gray-700 border-gray-200",
  closed: "bg-red-100 text-red-700 border-red-200"
}

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"
}

export default function AdminChatPage() {
  const {
    conversations,
    messages,
    selectedConversation,
    setSelectedConversation,
    loading,
    sending,
    unreadCount,
    error,
    sendMessage,
    updateConversationStatus
  } = useChat()

  const [message, setMessage] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter((conv) => {
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter
    const matchesSearch = 
      !searchQuery ||
      conv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !selectedConversation || sending) return

    try {
      await sendMessage(selectedConversation.id, message)
      setMessage("")
    } catch (err) {
      console.error("Failed to send message:", err)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!selectedConversation) return
    try {
      await updateConversationStatus(selectedConversation.id, status as any)
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm")
    } catch {
      return ""
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return ""
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Chat Support</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage customer conversations and provide support
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {unreadCount} Unread
        </Badge>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <Badge>{conversations.length}</Badge>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <MessageCircle className="h-12 w-12 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No conversations found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-slate-50 transition-colors",
                        selectedConversation?.id === conv.id && "bg-amber-50 border-l-4 border-amber-500"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {conv.customer_name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">
                              {conv.customer_name || "Guest"}
                            </p>
                            <p className="text-xs text-slate-500">{conv.customer_email}</p>
                          </div>
                        </div>
                        {conv.unread_count > 0 && (
                          <Badge className="bg-amber-500">{conv.unread_count}</Badge>
                        )}
                      </div>
                      {conv.subject && (
                        <p className="text-xs text-slate-600 mb-2 line-clamp-1">{conv.subject}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cn("text-xs", statusColors[conv.status])}>
                          {conv.status}
                        </Badge>
                        <Badge className={cn("text-xs", priorityColors[conv.priority])}>
                          {conv.priority}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {formatDate(conv.last_message_at)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {selectedConversation.customer_name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedConversation.customer_name || "Guest"}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-xs", statusColors[selectedConversation.status])}>
                          {selectedConversation.status}
                        </Badge>
                        <Badge className={cn("text-xs", priorityColors[selectedConversation.priority])}>
                          {selectedConversation.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Select
                    value={selectedConversation.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {selectedConversation.customer_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{selectedConversation.customer_email}</span>
                    </div>
                  )}
                  {selectedConversation.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{selectedConversation.customer_phone}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isAdmin = msg.sender_type === "admin"
                      const isSystem = msg.sender_type === "system"

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center">
                            <div className="bg-slate-100 px-3 py-1.5 rounded-full text-xs text-slate-600">
                              {msg.message}
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isAdmin ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-4 py-2",
                              isAdmin
                                ? "bg-amber-500 text-white"
                                : "bg-slate-100 text-slate-900"
                            )}
                          >
                            {!isAdmin && (
                              <div className="text-xs font-semibold mb-1 opacity-75">
                                {msg.sender_name || "Customer"}
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.message}
                            </p>
                            <div
                              className={cn(
                                "text-xs mt-1",
                                isAdmin ? "text-amber-100" : "text-slate-500"
                              )}
                            >
                              {formatTime(msg.created_at)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      disabled={!message.trim() || sending}
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Select a conversation to start chatting</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

