"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  UserPlus,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/toast-context"

interface User {
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  isAdmin: boolean
  isVerified: boolean
  status: 'active' | 'inactive' | 'blocked'
  avatarUrl?: string | null
  createdAt: string
  updatedAt: string
  lastLogin?: string | null
}

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager', color: 'bg-blue-100 text-blue-800' },
  { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  { value: 'super_admin', label: 'Super Admin', color: 'bg-red-100 text-red-800' }
]

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { token } = useAuth()
  const toast = useToast()

  // Form states
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin',
    isAdmin: true
  })

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'admin',
    isAdmin: true,
    status: 'active' as 'active' | 'inactive' | 'blocked',
    password: ''
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }

      const data = await response.json()
      setUsers(data.users || [])

    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, roleFilter, statusFilter, token])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAddUser = async () => {
    if (!addForm.firstName || !addForm.lastName || !addForm.email || !addForm.password) {
      toast.showError('Validation Error', 'Please fill in all required fields')
      return
    }

    try {
      setIsSaving(true)

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: addForm.firstName,
          lastName: addForm.lastName,
          email: addForm.email,
          phone: addForm.phone || null,
          password: addForm.password,
          role: addForm.role,
          isAdmin: true // All users created here are admins
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      toast.showSuccess('Admin User Created', 'New admin user has been created successfully.')
      setAddForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'admin', isAdmin: true })
      setIsAddModalOpen(false)
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      toast.showError('Creation Failed', error instanceof Error ? error.message : 'Failed to create user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isAdmin: user.isAdmin,
      status: user.status,
      password: ''
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      setIsSaving(true)

      const updateData: any = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone || null,
        role: editForm.role,
        isAdmin: true, // All users managed here are admins
        status: editForm.status
      }

      // Only include password if it's provided
      if (editForm.password) {
        updateData.password = editForm.password
      }

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      toast.showSuccess('Admin User Updated', 'Admin user information has been updated successfully.')
      setIsEditModalOpen(false)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.showError('Update Failed', error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async (user: User, hardDelete: boolean = false) => {
    if (!confirm(`Are you sure you want to ${hardDelete ? 'permanently delete' : 'deactivate'} this user?`)) {
      return
    }

    try {
      const url = hardDelete 
        ? `/api/admin/users/${user.id}?hard=true`
        : `/api/admin/users/${user.id}`

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      toast.showSuccess('Admin User Deleted', `Admin user has been ${hardDelete ? 'deleted' : 'deactivated'} successfully.`)
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete user')
    }
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsViewModalOpen(true)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadge = (role: string) => {
    const roleOption = ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[0]
    return (
      <Badge className={roleOption.color}>
        {roleOption.label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      blocked: 'bg-red-100 text-red-800'
    }
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.inactive}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Admin Users & Permissions</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage admin user accounts and access permissions</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchUsers}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
            </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Roles</option>
                    {ROLE_OPTIONS.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={fetchUsers} variant="outline">Try Again</Button>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No admin users found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add First Admin User
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead className="hidden md:table-cell">Role</TableHead>
                        <TableHead className="hidden lg:table-cell">Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Created</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {user.avatarUrl ? (
                                  <Image
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    fill
                                    sizes="40px"
                                    className="object-cover rounded-full"
                                    onError={(e) => {
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
                                <span className={`text-sm font-semibold text-white ${user.avatarUrl ? 'avatar-fallback hidden' : ''}`}>
                                  {getInitials(user.name)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-gray-500 sm:hidden">{user.email}</div>
                                {user.isAdmin && (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center text-sm">
                              <Mail className="w-3 h-3 mr-2 text-gray-400" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {getRoleBadge(user.role)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {getStatusBadge(user.status)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-3 h-3 mr-2" />
                              {formatDate(user.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                onClick={() => handleViewUser(user)}
                                title="View User"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                onClick={() => handleEditUser(user)}
                                title="Edit User"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleDeleteUser(user, false)}
                                title="Deactivate User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </div>
              )}
            </CardContent>
          </Card>

          {/* Add User Modal */}
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 m-4">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-lg sm:text-xl">Add New Admin User</DialogTitle>
                <DialogDescription className="text-sm">
                  Create a new admin user account with specific privileges
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2 sm:py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-firstName" className="text-sm font-semibold">First Name *</Label>
                    <Input
                      id="add-firstName"
                      value={addForm.firstName}
                      onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                      placeholder="Enter first name"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-lastName" className="text-sm font-semibold">Last Name *</Label>
                    <Input
                      id="add-lastName"
                      value={addForm.lastName}
                      onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                      placeholder="Enter last name"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-email" className="text-sm font-semibold">Email *</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-phone" className="text-sm font-semibold">Phone</Label>
                  <Input
                    id="add-phone"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-password" className="text-sm font-semibold">Password *</Label>
                  <div className="relative">
                    <Input
                      id="add-password"
                      type={showPassword ? "text" : "password"}
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      placeholder="Enter password"
                      className="w-full pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-role" className="text-sm font-semibold">Role *</Label>
                  <select
                    id="add-role"
                    value={addForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value
                      setAddForm({ 
                        ...addForm, 
                        role: newRole,
                        isAdmin: true // All users here are admins
                      })
                    }}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {ROLE_OPTIONS.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddModalOpen(false)
                      setAddForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'admin', isAdmin: true })
                      setShowPassword(false)
                    }} 
                    disabled={isSaving}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddUser} 
                    disabled={isSaving}
                    className="w-full sm:w-auto"
                  >
                    {isSaving ? 'Creating...' : 'Create Admin User'}
                  </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit User Modal */}
          {selectedUser && (
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 m-4">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-lg sm:text-xl">Edit User</DialogTitle>
                  <DialogDescription className="text-sm">
                    Update user information and privileges for {selectedUser.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2 sm:py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstName" className="text-sm font-semibold">First Name *</Label>
                      <Input
                        id="edit-firstName"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-lastName" className="text-sm font-semibold">Last Name *</Label>
                      <Input
                        id="edit-lastName"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email" className="text-sm font-semibold">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="text-sm font-semibold">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-password" className="text-sm font-semibold">
                      New Password <span className="text-xs font-normal text-gray-500">(leave blank to keep current)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="edit-password"
                        type={showPassword ? "text" : "password"}
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        placeholder="Enter new password"
                        className="w-full pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role" className="text-sm font-semibold">Role *</Label>
                    <select
                      id="edit-role"
                      value={editForm.role}
                      onChange={(e) => {
                        const newRole = e.target.value
                        setEditForm({ 
                          ...editForm, 
                          role: newRole,
                          isAdmin: true // All users here are admins
                        })
                      }}
                      className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {ROLE_OPTIONS.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="text-sm font-semibold">Status *</Label>
                    <select
                      id="edit-status"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' | 'blocked' })} 
                      className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditModalOpen(false)} 
                    disabled={isSaving}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateUser} 
                    disabled={isSaving}
                    className="w-full sm:w-auto"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* View User Modal */}
          {selectedUser && (
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
              <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 m-4">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-lg sm:text-xl">User Details</DialogTitle>
                  <DialogDescription className="text-sm">
                    View detailed information about {selectedUser.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2 sm:py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {selectedUser.avatarUrl ? (
                        <Image
                          src={selectedUser.avatarUrl}
                          alt={selectedUser.name}
                          fill
                          sizes="64px"
                          className="object-cover rounded-full"
                          onError={(e) => {
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
                      <span className={`text-xl font-semibold text-white ${selectedUser.avatarUrl ? 'avatar-fallback-modal hidden' : ''}`}>
                        {getInitials(selectedUser.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate">{selectedUser.name}</h3>
                      <p className="text-gray-600 text-sm truncate">{selectedUser.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getRoleBadge(selectedUser.role)}
                        {getStatusBadge(selectedUser.status)}
                        {selectedUser.isAdmin && (
                          <Badge variant="secondary">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <p className="text-sm">{selectedUser.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Verified</Label>
                      <p className="text-sm">{selectedUser.isVerified ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Created</Label>
                      <p className="text-sm">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Last Login</Label>
                      <p className="text-sm">{selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}</p>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsViewModalOpen(false)
                      handleEditUser(selectedUser)
                    }}
                    className="w-full sm:w-auto"
                  >
                    Edit User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  )
}
