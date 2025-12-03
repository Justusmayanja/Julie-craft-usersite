"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  Edit,
  Mail,
  Phone,
  MapPin,
  Users,
  Banknote,
  ShoppingCart,
  Calendar,
  Star,
  RefreshCw,
  UserPlus,
  CheckSquare,
  Square,
  Archive,
  ArchiveRestore
} from "lucide-react"
import { useCustomers, useCustomerStats, useCustomer, type Customer } from "@/hooks/admin/use-customers"
import { useToast } from "@/contexts/toast-context"
import { useAuth } from "@/contexts/auth-context"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [bulkAction, setBulkAction] = useState<'archive' | 'unarchive' | null>(null)
  
  // Form states for edit
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive' | 'blocked'
  })
  
  // Form states for add
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  const { toast } = useToast()
  const { user } = useAuth()

  // Calculate offset based on current page
  const offset = (currentPage - 1) * itemsPerPage

  const { customers, loading, error, total: totalCustomers, fetchCustomers, refresh } = useCustomers()

  const { stats, loading: statsLoading } = useCustomerStats()

  // Fetch customers with server-side pagination
  useEffect(() => {
    fetchCustomers({
      search: searchTerm || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: itemsPerPage,
      offset: offset,
      sort_by: 'created_at',
      sort_order: 'desc'
    })
  }, [searchTerm, statusFilter, currentPage, itemsPerPage, offset, fetchCustomers])

  // Pagination calculations using total from API (server-side pagination)
  const totalPages = Math.ceil((totalCustomers || customers.length) / itemsPerPage)
  const startIndex = offset
  const endIndex = Math.min(startIndex + customers.length, totalCustomers || customers.length)
  
  // Use customers directly (already paginated by API)
  const paginatedCustomers = customers

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsViewModalOpen(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      status: customer.status
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return

    try {
      setIsSaving(true)
      
      const token = user?.token || localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          status: editForm.status,
          address: selectedCustomer.address
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update customer')
      }

      toast.showSuccess('Customer Updated', 'Customer information has been updated successfully.')
      setIsEditModalOpen(false)
      refresh() // Refresh the customer list
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.showError('Update Failed', error instanceof Error ? error.message : 'Failed to update customer')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCustomer = async () => {
    if (!addForm.firstName || !addForm.lastName || !addForm.email) {
      toast.showError('Validation Error', 'Please fill in all required fields')
      return
    }

    try {
      setIsSaving(true)
      
      const token = user?.token || localStorage.getItem('julie-crafts-token')
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: addForm.firstName,
          last_name: addForm.lastName,
          email: addForm.email,
          phone: addForm.phone || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create customer')
      }

      toast.showSuccess('Customer Created', 'New customer has been created successfully.')
      setAddForm({ firstName: '', lastName: '', email: '', phone: '' })
      setIsAddModalOpen(false)
      refresh() // Refresh the customer list
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.showError('Creation Failed', error instanceof Error ? error.message : 'Failed to create customer')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    fetchCustomers({
      search: value || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      limit: 50
    })
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    fetchCustomers({
      search: searchTerm || undefined,
      status: status !== 'all' ? status : undefined,
      limit: 50,
      includeArchived: status === 'archived'
    })
  }

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString('en-US')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'blocked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(customerId)) {
        newSet.delete(customerId)
      } else {
        newSet.add(customerId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedCustomerIds.size === filteredCustomers.length) {
      setSelectedCustomerIds(new Set())
    } else {
      setSelectedCustomerIds(new Set(filteredCustomers.map(c => c.id)))
    }
  }

  const handleBulkArchive = async () => {
    if (selectedCustomerIds.size === 0) {
      toast.showError('No Customers Selected', 'Please select at least one customer to archive.')
      return
    }

    if (!bulkAction) {
      toast.showError('No Action Selected', 'Please select an action to perform.')
      return
    }

    setBulkUpdating(true)
    try {
      const token = user?.token || localStorage.getItem('julie-crafts-token')
      const isArchiving = bulkAction === 'archive'
      
      // Update each customer
      const updatePromises = Array.from(selectedCustomerIds).map(customerId =>
        fetch(`/api/customers/${customerId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            is_archived: isArchiving
          })
        })
      )

      const results = await Promise.allSettled(updatePromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        toast.showSuccess(
          `${isArchiving ? 'Archive' : 'Unarchive'} Successful`,
          `Successfully ${isArchiving ? 'archived' : 'unarchived'} ${successful} customer${successful !== 1 ? 's' : ''}.`
        )
      }

      if (failed > 0) {
        toast.showError(
          'Partial Failure',
          `Failed to ${isArchiving ? 'archive' : 'unarchive'} ${failed} customer${failed !== 1 ? 's' : ''}.`
        )
      }

      // Clear selection and reset bulk action
      setSelectedCustomerIds(new Set())
      setBulkAction(null)
      
      // Refresh customers
      refresh()
    } catch (error) {
      console.error('Error performing bulk archive:', error)
      toast.showError('Bulk Archive Failed', error instanceof Error ? error.message : 'Failed to archive customers')
    } finally {
      setBulkUpdating(false)
    }
  }

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage customer accounts and view analytics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refresh}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline">Add Customer</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalCustomers || 0}
                  </p>
                )}
              </div>
              <Users className="h-8 w-8 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">VIP Customers</p>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.vipCustomers || 0}
                  </p>
                )}
              </div>
              <Star className="h-8 w-8 text-yellow-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.newCustomersThisMonth || 0}
                  </p>
                )}
              </div>
              <Calendar className="h-8 w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                {statsLoading ? (
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </p>
                )}
              </div>
              <Banknote className="h-8 w-8 text-purple-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search customers by name or email..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'vip' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('vip')}
                >
                  VIP
                </Button>
                <Button
                  variant={statusFilter === 'archived' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('archived')}
                >
                  Archived
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedCustomerIds.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedCustomerIds.size} customer{selectedCustomerIds.size !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomerIds(new Set())
                    setBulkAction(null)
                  }}
                  className="h-7 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Select
                  value={bulkAction || ''}
                  onValueChange={(value) => setBulkAction(value as 'archive' | 'unarchive' | null)}
                >
                  <SelectTrigger className="w-full sm:w-40 h-8 text-xs">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="archive">Archive Customers</SelectItem>
                    <SelectItem value="unarchive">Unarchive Customers</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleBulkArchive}
                  disabled={bulkUpdating || !bulkAction}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  {bulkUpdating ? 'Processing...' : 'Apply'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customer List ({totalCustomers || customers.length})</span>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center justify-center h-32 mb-4">
              <div className="text-center">
                <p className="text-red-600 mb-4">Failed to load customers</p>
                <Button onClick={refresh} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCustomerIds.size > 0 && selectedCustomerIds.size === filteredCustomers.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Orders</TableHead>
                  <TableHead className="hidden lg:table-cell">Total Spent</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Join Date</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {loading ? (
                    // Skeleton loaders
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="space-y-2">
                            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCustomerIds.has(customer.id)}
                            onCheckedChange={() => handleSelectCustomer(customer.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {customer.avatar_url ? (
                                <Image
                                  src={customer.avatar_url}
                                  alt={customer.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover rounded-full"
                                  onError={(e) => {
                                    // Fallback to initials if image fails to load
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    const parent = target.parentElement
                                    if (parent) {
                                      const fallback = parent.querySelector('.avatar-fallback')
                                      if (fallback) {
                                        (fallback as HTMLElement).style.display = 'flex'
                                      }
                                    }
                                  }}
                                />
                              ) : null}
                              <span className={`text-sm font-semibold text-white ${customer.avatar_url ? 'avatar-fallback hidden' : ''}`}>
                                {customer.avatar}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-500 sm:hidden">{customer.email}</div>
                              {customer.isVip && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  VIP
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="w-3 h-3 mr-2 text-gray-400" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Phone className="w-3 h-3 mr-2" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center">
                            <ShoppingCart className="w-4 h-4 mr-2 text-gray-400" />
                            {customer.totalOrders}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="font-medium">
                            {formatCurrency(customer.totalSpent)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge className={getStatusColor(customer.status)}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-3 h-3 mr-2" />
                            {formatDate(customer.joinDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => handleViewCustomer(customer)}
                              title="View Customer Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => handleEditCustomer(customer)}
                              title="Edit Customer"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {(totalCustomers || customers.length) > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {endIndex} of {totalCustomers || customers.length} customers
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-4">
                    {/* Items per page selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Show:</span>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value))
                          setCurrentPage(1) // Reset to first page when changing page size
                        }}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Pagination controls */}
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault()
                              if (currentPage > 1) setCurrentPage(currentPage - 1)
                            }}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setCurrentPage(page)
                                  }}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          }
                          return null
                        })}
                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault()
                              if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                            }}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
        </CardContent>
      </Card>

      {/* View Customer Modal */}
      {selectedCustomer && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>View detailed information about {selectedCustomer.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedCustomer.avatar_url ? (
                    <Image
                      src={selectedCustomer.avatar_url}
                      alt={selectedCustomer.name}
                      fill
                      sizes="64px"
                      className="object-cover rounded-full"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          const fallback = parent.querySelector('.avatar-fallback-modal')
                          if (fallback) {
                            (fallback as HTMLElement).style.display = 'flex'
                          }
                        }
                      }}
                    />
                  ) : null}
                  <span className={`text-xl font-semibold text-white ${selectedCustomer.avatar_url ? 'avatar-fallback-modal hidden' : ''}`}>
                    {selectedCustomer.avatar}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                  <p className="text-gray-600">{selectedCustomer.email}</p>
                  {selectedCustomer.isVip && (
                    <Badge variant="secondary" className="mt-1">
                      <Star className="w-3 h-3 mr-1" />
                      VIP Customer
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="text-sm">{selectedCustomer.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedCustomer.status)}>
                    {selectedCustomer.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Total Orders</Label>
                  <p className="text-sm font-semibold">{selectedCustomer.totalOrders}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Total Spent</Label>
                  <p className="text-sm font-semibold">{formatCurrency(selectedCustomer.totalSpent)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Join Date</Label>
                  <p className="text-sm">{formatDate(selectedCustomer.joinDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Order</Label>
                  <p className="text-sm">
                    {selectedCustomer.lastOrderDate ? formatDate(selectedCustomer.lastOrderDate) : 'No orders'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Address</Label>
                <div className="flex items-start mt-1">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                  <div className="text-sm">
                    {selectedCustomer.address.street && (
                      <p>{selectedCustomer.address.street}</p>
                    )}
                    <p>
                      {selectedCustomer.address.city && `${selectedCustomer.address.city}, `}
                      {selectedCustomer.address.state && `${selectedCustomer.address.state} `}
                      {selectedCustomer.address.zip}
                    </p>
                  </div>
                </div>
              </div>

              {selectedCustomer.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedCustomer.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
              <Button onClick={() => { setIsViewModalOpen(false); handleEditCustomer(selectedCustomer); }}>
                Edit Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Customer Modal */}
      {selectedCustomer && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update customer information for {selectedCustomer.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input 
                    id="edit-name" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input 
                    id="edit-email" 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input 
                  id="edit-phone" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select 
                  id="edit-status" 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' | 'blocked' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCustomer} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Customer Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Create a new customer account</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-firstName">First Name *</Label>
                <Input 
                  id="add-firstName" 
                  placeholder="Enter first name"
                  value={addForm.firstName}
                  onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="add-lastName">Last Name *</Label>
                <Input 
                  id="add-lastName" 
                  placeholder="Enter last name"
                  value={addForm.lastName}
                  onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="add-email">Email *</Label>
              <Input 
                id="add-email" 
                type="email" 
                placeholder="Enter email address"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="add-phone">Phone</Label>
              <Input 
                id="add-phone" 
                placeholder="Enter phone number"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false)
              setAddForm({ firstName: '', lastName: '', email: '', phone: '' })
            }} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomer} disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  )
}