"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, User, ShoppingBag, Settings, LogOut, ArrowLeft, Camera, Upload } from 'lucide-react'
import Link from 'next/link'
import { getUserOrders, updateUserProfile } from '@/lib/api-user'
import type { UserOrder } from '@/lib/types/order'

export default function ProfilePage() {
  const { user, logout, isAuthenticated, isLoading } = useAuth()
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return

      try {
        setOrdersLoading(true)
        const response = await getUserOrders(user.id)
        // Extract orders array from the response object
        setOrders(response.orders || [])
      } catch (error) {
        console.error('Failed to fetch orders:', error)
        setOrders([]) // Set empty array on error
      } finally {
        setOrdersLoading(false)
      }
    }

    if (user?.id) {
      fetchOrders()
    }
  }, [user?.id])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Create a preview URL
      const imageUrl = URL.createObjectURL(file)
      setProfileImage(imageUrl)

      // In a real app, you would upload to a cloud service like Cloudinary or AWS S3
      // For now, we'll just store the preview URL in localStorage
      localStorage.setItem(`profile_image_${user?.id}`, imageUrl)

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // TODO: Implement actual file upload to server/cloud storage
      console.log('Profile image uploaded:', file.name)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setProfileImage(null)
    if (user?.id) {
      localStorage.removeItem(`profile_image_${user.id}`)
    }
  }

  // Load profile image from localStorage on component mount
  useEffect(() => {
    if (user?.id) {
      const savedImage = localStorage.getItem(`profile_image_${user.id}`)
      if (savedImage) {
        setProfileImage(savedImage)
      }
    }
  }, [user?.id])

  // Initialize edit form with user data
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to original values when canceling
      setEditForm({
        name: user?.name || '',
        phone: user?.phone || ''
      })
    }
    setIsEditing(!isEditing)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return

    // Clear any previous messages
    setSaveMessage(null)

    // Basic validation
    if (!editForm.name.trim()) {
      setSaveMessage({ type: 'error', text: 'Name is required' })
      return
    }

    if (editForm.name.trim().length < 2) {
      setSaveMessage({ type: 'error', text: 'Name must be at least 2 characters long' })
      return
    }

    setIsSaving(true)
    try {
      // Call the API to update user profile
      const response = await updateUserProfile(user.id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || undefined
      })
      
      console.log('Profile updated:', response)
      setIsEditing(false)
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' })
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      setSaveMessage({ type: 'error', text: errorMessage })
    } finally {
      setIsSaving(false)
    }
  }

  const formatPrice = (price: number) => `UGX ${price.toLocaleString()}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="ghost" size="icon" className="hover:bg-gray-200">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-lg text-gray-600 mt-1">Manage your account and orders</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Orders ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your account details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={profileImage || undefined} alt={user.name || 'Profile'} />
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2"
                          >
                            <Camera className="h-4 w-4" />
                            {profileImage ? 'Change Photo' : 'Upload Photo'}
                          </Button>
                          {profileImage && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveImage}
                              disabled={isUploading}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={isEditing ? editForm.name : (user.name || '')} 
                        onChange={handleInputChange}
                        disabled={!isEditing} 
                        className={isEditing ? "bg-white border-gray-300" : "bg-gray-50"} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" value={user.email} disabled className="bg-gray-50" />
                      <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={isEditing ? editForm.phone : (user.phone || '')} 
                        onChange={handleInputChange}
                        disabled={!isEditing} 
                        placeholder="Enter your phone number"
                        className={isEditing ? "bg-white border-gray-300" : "bg-gray-50"} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="member-since">Member Since</Label>
                      <Input 
                        id="member-since" 
                        value={formatDate(user.created_at)} 
                        disabled 
                        className="bg-gray-50" 
                      />
                    </div>
                  </div>

                  {/* Success/Error Message */}
                  {saveMessage && (
                    <div className={`p-3 rounded-md ${
                      saveMessage.type === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      {saveMessage.text}
                    </div>
                  )}

                  {/* Edit/Save Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    {!isEditing ? (
                      <Button onClick={handleEditToggle} variant="outline">
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button onClick={handleEditToggle} variant="outline" disabled={isSaving}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={isSaving}>
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </>
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Account Status</h3>
                      <p className="text-sm text-gray-600">Your account is active and verified</p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>Track your past and current orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                      <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
                      <Link href="/products">
                        <Button>Start Shopping</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.order_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">Order #{order.order_number}</h4>
                              <p className="text-sm text-gray-600">{formatDate(order.order_date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(order.total_amount)}</p>
                              <Badge variant={order.status === 'delivered' ? 'default' : 'outline'} className="capitalize">
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>{order.item_count} item(s)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences and security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Security</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Keep your account secure by managing your password and login settings.
                      </p>
                      <Button variant="outline">
                        Change Password
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold mb-2">Notifications</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose how you want to be notified about your orders and promotions.
                      </p>
                      <Button variant="outline">
                        Notification Settings
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold mb-2 text-red-600">Danger Zone</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Permanently delete your account and all associated data.
                      </p>
                      <Button variant="destructive">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Logout Button */}
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
