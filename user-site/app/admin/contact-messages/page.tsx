"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Search, 
  Mail,
  Phone,
  User,
  Clock,
  CheckCircle,
  MessageSquare,
  Loader2,
  RefreshCw,
  Eye,
  Reply,
  Archive,
  Trash2
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/contexts/toast-context"

const statusOptions = ["All", "new", "read", "replied", "archived"]

const getStatusColor = (status: string) => {
  switch (status) {
    case "new": return "bg-blue-100 text-blue-700 border-blue-200"
    case "read": return "bg-gray-100 text-gray-700 border-gray-200"
    case "replied": return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "archived": return "bg-slate-100 text-slate-700 border-slate-200"
    default: return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: string
  admin_notes?: string
  replied_at?: string
  replied_by?: string
  created_at: string
  updated_at: string
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [updating, setUpdating] = useState(false)
  const [total, setTotal] = useState(0)
  const [unread, setUnread] = useState(0)
  const toast = useToast()

  const fetchMessages = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('julie-crafts-token')
      if (!token) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const params = new URLSearchParams()
      if (selectedStatus !== "All") {
        params.append('status', selectedStatus)
      }
      params.append('limit', '100')
      params.append('offset', '0')

      const response = await fetch(`/api/admin/contact-messages?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch contact messages')
      }

      const data = await response.json()
      setMessages(data.messages || [])
      setTotal(data.total || 0)
      setUnread(data.unread || 0)
    } catch (err) {
      console.error('Error fetching contact messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load contact messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [selectedStatus])

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message)
    setAdminNotes(message.admin_notes || "")
    setShowDetailModal(true)
    
    // Mark as read if it's new
    if (message.status === 'new') {
      updateMessageStatus(message.id, 'read')
    }
  }

  const updateMessageStatus = async (id: string, status: string, notes?: string) => {
    setUpdating(true)
    try {
      const token = localStorage.getItem('julie-crafts-token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/admin/contact-messages', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          status,
          admin_notes: notes !== undefined ? notes : undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update message')
      }

      const data = await response.json()
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, ...data.message } : msg
      ))
      
      if (selectedMessage?.id === id) {
        setSelectedMessage(data.message)
      }

      toast.showSuccess('Message Updated', `Message marked as ${status}`)
      fetchMessages() // Refresh to update counts
    } catch (err) {
      console.error('Error updating message:', err)
      toast.showError('Update Failed', err instanceof Error ? err.message : 'Failed to update message')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveNotes = () => {
    if (!selectedMessage) return
    updateMessageStatus(selectedMessage.id, selectedMessage.status, adminNotes)
  }

  // Filter messages by search term
  const filteredMessages = messages.filter(msg => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      msg.name.toLowerCase().includes(search) ||
      msg.email.toLowerCase().includes(search) ||
      msg.subject.toLowerCase().includes(search) ||
      msg.message.toLowerCase().includes(search) ||
      (msg.phone && msg.phone.includes(search))
    )
  })

  return (
    <div className="min-h-0 w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Contact Messages</h1>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-1">Manage customer inquiries and messages</p>
            </div>
            <div className="flex flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchMessages}
                disabled={loading}
                className="h-9 sm:h-10 px-3 sm:px-4"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-xs sm:text-sm">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Messages</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{total}</p>
                  </div>
                  <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Unread</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{unread}</p>
                  </div>
                  <Mail className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-amber-600 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Replied</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      {messages.filter(m => m.status === 'replied').length}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-emerald-600 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">This Month</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      {messages.filter(m => {
                        const msgDate = new Date(m.created_at)
                        const now = new Date()
                        return msgDate.getMonth() === now.getMonth() && msgDate.getFullYear() === now.getFullYear()
                      }).length}
                    </p>
                  </div>
                  <Clock className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-purple-600 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Messages Table */}
          <Card className="bg-white border border-slate-200/60 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold text-slate-900">Contact Messages</CardTitle>
                  <p className="text-slate-600 text-sm font-medium">View and manage customer inquiries</p>
                </div>
              
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="relative flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, email, subject..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-3 py-2 w-full sm:w-80 bg-white border-slate-300 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder-slate-500 font-medium rounded-lg shadow-sm"
                    />
                  </div>
                
                  <div className="flex flex-wrap gap-2">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-[140px] bg-white border-slate-300 text-slate-900 focus:ring-blue-500/20 focus:border-blue-500 font-medium rounded-lg shadow-sm">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option} value={option.toLowerCase()}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Loading State */}
              {loading && (
                <div className="text-center py-16 px-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Messages</h3>
                  <p className="text-gray-600">Fetching contact messages...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="text-center py-16 px-4">
                  <div className="text-red-600 mb-4">
                    <Mail className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">Failed to load messages</p>
                    <p className="text-sm text-gray-600 mt-1">{error}</p>
                  </div>
                  <Button onClick={fetchMessages} variant="outline" size="lg">
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}

              {/* Table Content */}
              {!loading && !error && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b-2 border-slate-200">
                        <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider">From</TableHead>
                        <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider">Subject</TableHead>
                        <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider">Message</TableHead>
                        <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider">Status</TableHead>
                        <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider">Date</TableHead>
                        <TableHead className="w-32 font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMessages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages found</h3>
                            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMessages.map((message) => (
                          <TableRow 
                            key={message.id} 
                            className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${
                              message.status === 'new' ? 'bg-blue-50/20' : ''
                            }`}
                            onClick={() => handleViewMessage(message)}
                          >
                            <TableCell className="py-5 px-6">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-900 text-sm">{message.name}</div>
                                <div className="text-xs text-slate-600">{message.email}</div>
                                {message.phone && (
                                  <div className="text-xs text-slate-500">{message.phone}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-5 px-6">
                              <div className="font-medium text-slate-900 text-sm">{message.subject}</div>
                            </TableCell>
                            <TableCell className="py-5 px-6">
                              <div className="text-sm text-slate-700 line-clamp-2 max-w-md">
                                {message.message}
                              </div>
                            </TableCell>
                            <TableCell className="py-5 px-6">
                              <Badge className={`${getStatusColor(message.status)} font-semibold px-2.5 py-1 rounded-full`}>
                                {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-5 px-6">
                              <div className="text-sm text-slate-700">
                                {format(new Date(message.created_at), "MMM dd, yyyy")}
                              </div>
                              <div className="text-xs text-slate-500">
                                {format(new Date(message.created_at), "h:mm a")}
                              </div>
                            </TableCell>
                            <TableCell className="py-5 px-6">
                              <div className="flex items-center justify-center space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewMessage(message)
                                  }}
                                  title="View Message"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Message Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Contact Message</span>
              {selectedMessage && (
                <Badge className={getStatusColor(selectedMessage.status)}>
                  {selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedMessage && format(new Date(selectedMessage.created_at), "MMMM dd, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">{selectedMessage.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedMessage.email}</span>
                  </div>
                  {selectedMessage.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedMessage.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Message Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-gray-600">Subject:</span>
                      <p className="text-sm font-medium text-gray-900">{selectedMessage.subject}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-600">Message:</span>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{selectedMessage.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Admin Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this message..."
                    rows={4}
                    disabled={updating}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveNotes}
                      disabled={updating}
                      size="sm"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Notes'
                      )}
                    </Button>
                    <Button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'replied')}
                      disabled={updating || selectedMessage.status === 'replied'}
                      size="sm"
                      variant="outline"
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      Mark as Replied
                    </Button>
                    <Button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'archived')}
                      disabled={updating || selectedMessage.status === 'archived'}
                      size="sm"
                      variant="outline"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
