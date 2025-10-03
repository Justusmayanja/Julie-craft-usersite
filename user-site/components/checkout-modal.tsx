"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCart } from "@/contexts/cart-context"
import { CreditCard, Smartphone, MapPin, CheckCircle } from "lucide-react"

interface CheckoutModalProps {
  onClose: () => void
}

export function CheckoutModal({ onClose }: CheckoutModalProps) {
  const { state, clearCart } = useCart()
  const [currentStep, setCurrentStep] = useState<"details" | "payment" | "confirmation">("details")
  const [formData, setFormData] = useState({
    // Customer Details
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    // Delivery Address
    address: "",
    city: "Kampala",
    district: "",
    deliveryNotes: "",
    // Payment
    paymentMethod: "",
  })

  const formatPrice = (price: number) => {
    return `UGX ${price.toLocaleString()}`
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep("payment")
  }

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault()
    // Process payment logic would go here
    setCurrentStep("confirmation")
    // Clear cart after successful order
    setTimeout(() => {
      clearCart()
      onClose()
    }, 3000)
  }

  const ugandanDistricts = [
    "Kampala",
    "Wakiso",
    "Mukono",
    "Entebbe",
    "Jinja",
    "Mbale",
    "Gulu",
    "Mbarara",
    "Fort Portal",
    "Masaka",
  ]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {currentStep === "details" && (
              <form onSubmit={handleSubmitDetails} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Customer & Delivery Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          required
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          required
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+256 700 123 456"
                        required
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="address">Delivery Address *</Label>
                      <Textarea
                        id="address"
                        placeholder="Street address, building name, apartment number"
                        required
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="district">District *</Label>
                        <Select
                          value={formData.district}
                          onValueChange={(value) => handleInputChange("district", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            {ugandanDistricts.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="deliveryNotes">Delivery Notes (Optional)</Label>
                      <Textarea
                        id="deliveryNotes"
                        placeholder="Special instructions for delivery"
                        value={formData.deliveryNotes}
                        onChange={(e) => handleInputChange("deliveryNotes", e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" className="w-full" size="lg">
                  Continue to Payment
                </Button>
              </form>
            )}

            {currentStep === "payment" && (
              <form onSubmit={handleSubmitPayment} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs
                      value={formData.paymentMethod}
                      onValueChange={(value) => handleInputChange("paymentMethod", value)}
                    >
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="mobile-money">Mobile Money</TabsTrigger>
                        <TabsTrigger value="card">Card</TabsTrigger>
                        <TabsTrigger value="cash">Cash on Delivery</TabsTrigger>
                      </TabsList>

                      <TabsContent value="mobile-money" className="space-y-4 mt-4">
                        <div className="flex items-center gap-2 p-4 border rounded-lg">
                          <Smartphone className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Mobile Money</p>
                            <p className="text-sm text-muted-foreground">Pay with MTN Mobile Money or Airtel Money</p>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="mobileNumber">Mobile Money Number</Label>
                          <Input id="mobileNumber" placeholder="+256 700 123 456" required />
                        </div>
                      </TabsContent>

                      <TabsContent value="card" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input id="cardNumber" placeholder="1234 5678 9012 3456" required />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expiry">Expiry Date</Label>
                              <Input id="expiry" placeholder="MM/YY" required />
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV</Label>
                              <Input id="cvv" placeholder="123" required />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="cash" className="space-y-4 mt-4">
                        <div className="p-4 border rounded-lg bg-muted/50">
                          <p className="font-medium mb-2">Cash on Delivery</p>
                          <p className="text-sm text-muted-foreground">
                            Pay with cash when your order is delivered. Please have the exact amount ready.
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep("details")} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" size="lg" disabled={!formData.paymentMethod}>
                    Place Order
                  </Button>
                </div>
              </form>
            )}

            {currentStep === "confirmation" && (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
                  <p className="text-muted-foreground mb-4">
                    Thank you for your order. We'll send you a confirmation email shortly.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <p className="font-medium">Order #JC-{Date.now().toString().slice(-6)}</p>
                    <p className="text-sm text-muted-foreground">
                      Estimated delivery: 2-3 business days within Kampala
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You'll receive updates via SMS and email. For questions, contact us at +256 700 123 456.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:sticky lg:top-0">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-sm">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(state.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(state.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
