"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import type { CartOrder } from "@/lib/types/order"
import { Loader2, ShoppingCart, MapPin, User, Mail, Phone } from "lucide-react"

interface OrderFormProps {
  onSuccess: (orderConfirmation: any) => void
  onError: (error: string) => void
}

export function OrderForm({ onSuccess, onError }: OrderFormProps) {
  const { state, placeOrder } = useCart()
  const { user, isAuthenticated } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useDifferentBilling, setUseDifferentBilling] = useState(false)

  const [formData, setFormData] = useState<CartOrder>({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: {
      name: "",
      email: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip_code: "",
      country: "Uganda"
    },
    billing_address: {
      name: "",
      email: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip_code: "",
      country: "Uganda"
    },
    notes: ""
  })

  // Load user profile data when authenticated user opens form
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isAuthenticated || !user) return

      try {
        const token = localStorage.getItem('julie-crafts-token')
        if (!token) return

        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const profile = data.profile || data
          
          if (profile) {
            // Get first and last name from profile (API returns first_name and last_name)
            const firstName = profile.first_name || ''
            const lastName = profile.last_name || ''
            const fullName = firstName && lastName 
              ? `${firstName} ${lastName}` 
              : (profile.name || user.email?.split('@')[0] || '')

            setFormData(prev => ({
              ...prev,
              customer_name: fullName,
              customer_email: profile.email || user.email || prev.customer_email,
              customer_phone: profile.phone || prev.customer_phone,
              shipping_address: {
                ...prev.shipping_address,
                name: fullName,
                email: profile.email || user.email || prev.shipping_address.email,
                phone: profile.phone || prev.shipping_address.phone,
                address_line1: profile.address || prev.shipping_address.address_line1,
                city: profile.city || prev.shipping_address.city,
                state: profile.state || prev.shipping_address.state,
                zip_code: profile.zip_code || prev.shipping_address.zip_code,
                country: profile.country || prev.shipping_address.country || "Uganda"
              },
              billing_address: {
                ...prev.billing_address,
                name: fullName,
                email: profile.email || user.email || prev.billing_address.email,
                phone: profile.phone || prev.billing_address.phone,
              }
            }))
          } else {
            // Fallback to user email
            setFormData(prev => ({
              ...prev,
              customer_email: user.email || prev.customer_email,
              customer_name: prev.customer_name || user.email?.split('@')[0] || '',
            }))
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
        // Don't show error, just use empty form
      }
    }

    loadUserProfile()
  }, [isAuthenticated, user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddressChange = (type: 'shipping' | 'billing', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_address`]: {
        ...prev[`${type}_address`],
        [field]: value
      }
    }))
  }

  const calculateTotals = () => {
    const subtotal = state.total
    // Product price is the final price - no shipping or tax charges
    const shipping = 0
    const tax = 0
    const total = subtotal

    return { subtotal, shipping, tax, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (state.items.length === 0) {
      onError("Your cart is empty. Please add items before placing an order.")
      return
    }

    try {
      setIsSubmitting(true)
      const orderConfirmation = await placeOrder(formData)
      onSuccess(orderConfirmation)
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to place order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Full Name *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => handleInputChange('customer_name', e.target.value)}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Phone Number</Label>
                    <Input
                      id="customer_phone"
                      type="tel"
                      value={formData.customer_phone || ""}
                      onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_email">Email Address *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    required
                    placeholder="Enter your email address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping_name">Full Name *</Label>
                    <Input
                      id="shipping_name"
                      value={formData.shipping_address.name}
                      onChange={(e) => handleAddressChange('shipping', 'name', e.target.value)}
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_phone">Phone Number</Label>
                    <Input
                      id="shipping_phone"
                      type="tel"
                      value={formData.shipping_address.phone || ""}
                      onChange={(e) => handleAddressChange('shipping', 'phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="shipping_address1">Address Line 1 *</Label>
                  <Input
                    id="shipping_address1"
                    value={formData.shipping_address.address_line1}
                    onChange={(e) => handleAddressChange('shipping', 'address_line1', e.target.value)}
                    required
                    placeholder="Street address, P.O. box, company name"
                  />
                </div>
                <div>
                  <Label htmlFor="shipping_address2">Address Line 2</Label>
                  <Input
                    id="shipping_address2"
                    value={formData.shipping_address.address_line2 || ""}
                    onChange={(e) => handleAddressChange('shipping', 'address_line2', e.target.value)}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="shipping_city">City *</Label>
                    <Input
                      id="shipping_city"
                      value={formData.shipping_address.city}
                      onChange={(e) => handleAddressChange('shipping', 'city', e.target.value)}
                      required
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_state">State/Region *</Label>
                    <Input
                      id="shipping_state"
                      value={formData.shipping_address.state}
                      onChange={(e) => handleAddressChange('shipping', 'state', e.target.value)}
                      required
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_zip">Postal Code</Label>
                    <Input
                      id="shipping_zip"
                      value={formData.shipping_address.zip_code}
                      onChange={(e) => handleAddressChange('shipping', 'zip_code', e.target.value)}
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any special instructions or notes for your order..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || state.items.length === 0}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Place Order
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {state.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder.svg'
                          target.onerror = null
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} × UGX {item.price.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      UGX {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>UGX {totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>UGX {totals.shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (18%)</span>
                  <span>UGX {totals.tax.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>UGX {totals.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                <p>Payment will be collected upon delivery</p>
                <p>Estimated delivery: 3-7 business days</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
