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
import { useToast, ToastContainer } from "@/components/ui/toast"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { CreditCard, Smartphone, MapPin, CheckCircle, Loader2, User, Mail, Phone, Home, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import type { CartOrder } from "@/lib/types/order"

interface CheckoutModalProps {
  onClose: () => void
}

export function CheckoutModal({ onClose }: CheckoutModalProps) {
  const { state, placeOrder } = useCart()
  const router = useRouter()
  const { showSuccess, showError, toasts, removeToast } = useToast()
  const [currentStep, setCurrentStep] = useState<"details" | "payment" | "confirmation">("details")
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
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
    paymentMethod: "mobile-money",
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

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPlacingOrder(true)
    setOrderError(null)

    try {
      // Prepare order data
      const orderData: CartOrder = {
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address_line1: formData.address,
          address_line2: "",
          city: formData.city,
          state: formData.district,
          zip_code: "",
          country: "Uganda"
        },
        notes: formData.deliveryNotes,
        payment_method: formData.paymentMethod
      }

      // Place the order
      const orderConfirmation = await placeOrder(orderData)
      
      // Show success message
      showSuccess(
        "🎉 Order Placed Successfully!",
        "Your beautiful handcrafted items are being prepared with care. Redirecting to confirmation..."
      )
      
      // Small delay to show the success message before redirecting
      setTimeout(() => {
        router.push('/order-confirmation')
        onClose()
      }, 1500)
    } catch (error) {
      let errorMessage = "Failed to place order. Please try again."
      let errorTitle = "❌ Order Failed"
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Handle specific stock-related errors
        if (error.message.includes("Insufficient stock")) {
          errorTitle = "📦 Stock Issue"
          errorMessage = error.message
        } else if (error.message.includes("out of stock")) {
          errorTitle = "🚫 Out of Stock"
          errorMessage = error.message
        } else if (error.message.includes("Product not found")) {
          errorTitle = "🔍 Product Not Available"
          errorMessage = error.message
        }
      }
      
      setOrderError(errorMessage)
      showError(errorTitle, errorMessage)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const ugandanDistricts = [
    "Abim",
    "Adjumani", 
    "Agago",
    "Alebtong",
    "Amolatar",
    "Amudat",
    "Amuria",
    "Amuru",
    "Apac",
    "Arua",
    "Budaka",
    "Bududa",
    "Bugiri",
    "Bugweri",
    "Buhweju",
    "Buikwe",
    "Bukedea",
    "Bukomansimbi",
    "Bukwo",
    "Bulambuli",
    "Buliisa",
    "Bundibugyo",
    "Bunyangabu",
    "Bushenyi",
    "Busia",
    "Butaleja",
    "Butambala",
    "Butebo",
    "Buvuma",
    "Buyende",
    "Dokolo",
    "Gomba",
    "Gulu",
    "Hoima",
    "Ibanda",
    "Iganga",
    "Isingiro",
    "Jinja",
    "Kaabong",
    "Kabale",
    "Kabarole",
    "Kaberamaido",
    "Kagadi",
    "Kakumiro",
    "Kalaki",
    "Kalangala",
    "Kaliro",
    "Kalungu",
    "Kampala",
    "Kamuli",
    "Kamwenge",
    "Kanungu",
    "Kapchorwa",
    "Kapelebyong",
    "Karenga",
    "Kasese",
    "Katakwi",
    "Kayunga",
    "Kazo",
    "Kibaale",
    "Kiboga",
    "Kibuku",
    "Kikuube",
    "Kiruhura",
    "Kiryandongo",
    "Kisoro",
    "Kitagwenda",
    "Kitgum",
    "Koboko",
    "Kole",
    "Kotido",
    "Kumi",
    "Kwania",
    "Kween",
    "Kyankwanzi",
    "Kyegegwa",
    "Kyenjojo",
    "Kyotera",
    "Lamwo",
    "Lira",
    "Luuka",
    "Luweero",
    "Lwengo",
    "Lyantonde",
    "Madi-Okollo",
    "Manafwa",
    "Maracha",
    "Masaka",
    "Masindi",
    "Mayuge",
    "Mbale",
    "Mbarara",
    "Mitooma",
    "Mityana",
    "Moroto",
    "Moyo",
    "Mpigi",
    "Mubende",
    "Mukono",
    "Nabilatuk",
    "Nakapiripirit",
    "Nakaseke",
    "Nakasongola",
    "Namayingo",
    "Namisindwa",
    "Namutumba",
    "Napak",
    "Nebbi",
    "Ngora",
    "Ntoroko",
    "Ntungamo",
    "Nwoya",
    "Obongi",
    "Omoro",
    "Otuke",
    "Oyam",
    "Pader",
    "Pakwach",
    "Pallisa",
    "Rakai",
    "Rubanda",
    "Rubirizi",
    "Rukiga",
    "Rukungiri",
    "Rwampara",
    "Sembabule",
    "Serere",
    "Sheema",
    "Sironko",
    "Soroti",
    "Tororo",
    "Wakiso",
    "Yumbe",
    "Zombo"
  ]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-full h-[98vh] max-h-[98vh] p-0 m-2 flex flex-col">
        {/* Header Section */}
        <div className="border-b bg-gradient-to-r from-primary/5 to-primary/10 px-4 lg:px-6 py-3 lg:py-4 flex-shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl lg:text-3xl font-bold text-primary">Complete Your Order</DialogTitle>
              <p className="text-sm lg:text-base text-muted-foreground mt-1">Secure checkout for your authentic Ugandan crafts</p>
            </div>
            <div className="flex items-center space-x-2 text-xs lg:text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Secure checkout</span>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex justify-center mt-3 lg:mt-4">
            <div className="flex items-center space-x-2 lg:space-x-6">
              <div className={`flex items-center space-x-2 ${currentStep === "details" ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center border-2 ${currentStep === "details" ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30"}`}>
                  <User className="h-3 w-3 lg:h-4 lg:w-4" />
                </div>
                <span className="font-medium text-xs lg:text-sm hidden sm:block">Personal Details</span>
              </div>
              <div className="w-4 lg:w-8 h-px bg-border"></div>
              <div className={`flex items-center space-x-2 ${currentStep === "payment" ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center border-2 ${currentStep === "payment" ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30"}`}>
                  <CreditCard className="h-3 w-3 lg:h-4 lg:w-4" />
                </div>
                <span className="font-medium text-xs lg:text-sm hidden sm:block">Payment Method</span>
              </div>
              <div className="w-4 lg:w-8 h-px bg-border"></div>
              <div className={`flex items-center space-x-2 ${currentStep === "confirmation" ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center border-2 ${currentStep === "confirmation" ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30"}`}>
                  <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4" />
                </div>
                <span className="font-medium text-xs lg:text-sm hidden sm:block">Confirmation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col xl:flex-row flex-1 min-h-0 overflow-y-auto">
          {/* Left Content Area */}
          <div className="flex-1 p-3 lg:p-6">
            <div className="max-w-4xl mx-auto">
              {currentStep === "details" && (
                <form onSubmit={handleSubmitDetails} className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg lg:text-xl font-semibold">Personal Information</h3>
                          <p className="text-xs lg:text-sm text-muted-foreground">Tell us about yourself</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 lg:p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-semibold">First Name *</Label>
                          <Input
                            id="firstName"
                            required
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            className="h-10 text-sm"
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-semibold">Last Name *</Label>
                          <Input
                            id="lastName"
                            required
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            className="h-10 text-sm"
                            placeholder="Enter your last name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-semibold">Email Address *</Label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              className="h-12 pl-12 text-base"
                              placeholder="your.email@example.com"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-semibold">Phone Number *</Label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+256 700 123 456"
                              required
                              value={formData.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              className="h-12 pl-12 text-base"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <MapPin className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg lg:text-xl font-semibold">Delivery Address</h3>
                          <p className="text-xs lg:text-sm text-muted-foreground">Where should we deliver your order?</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 lg:p-6">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-sm font-semibold">Street Address *</Label>
                          <div className="relative">
                            <Home className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                            <Textarea
                              id="address"
                              placeholder="Enter your complete street address, building name, apartment number"
                              required
                              value={formData.address}
                              onChange={(e) => handleInputChange("address", e.target.value)}
                              className="pl-12 min-h-[100px] resize-none text-base"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="city" className="text-sm font-semibold">City</Label>
                            <Input
                              id="city"
                              value={formData.city}
                              onChange={(e) => handleInputChange("city", e.target.value)}
                              className="h-10 text-sm"
                              placeholder="Enter city"
                            />
                          </div>
                          <SearchableSelect
                            label="District *"
                            options={ugandanDistricts}
                            value={formData.district}
                            onValueChange={(value) => handleInputChange("district", value)}
                            placeholder="Select your district"
                            className="space-y-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="deliveryNotes" className="text-sm font-semibold">Delivery Instructions (Optional)</Label>
                          <div className="relative">
                            <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                            <Textarea
                              id="deliveryNotes"
                              placeholder="Any special instructions for delivery (gate code, landmarks, etc.)"
                              value={formData.deliveryNotes}
                              onChange={(e) => handleInputChange("deliveryNotes", e.target.value)}
                              className="pl-12 min-h-[80px] resize-none text-base"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <Button type="submit" className="px-12 h-12 text-base font-semibold">
                      Continue to Payment
                    </Button>
                  </div>
                </form>
              )}

              {currentStep === "payment" && (
                <form onSubmit={handleSubmitPayment} className="space-y-8">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <CreditCard className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg lg:text-xl font-semibold">Payment Method</h3>
                          <p className="text-xs lg:text-sm text-muted-foreground">Choose your preferred payment method</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 lg:p-6">
                    <Tabs
                      value={formData.paymentMethod}
                      onValueChange={(value) => handleInputChange("paymentMethod", value)}
                    >
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="mobile-money" className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Mobile Money
                        </TabsTrigger>
                        <TabsTrigger value="cash" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Cash on Delivery
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="mobile-money" className="space-y-4">
                        <div className="p-4 border rounded-lg bg-blue-50/50 border-blue-200">
                          <div className="flex items-center gap-3">
                            <Smartphone className="h-6 w-6 text-blue-600" />
                            <div>
                              <p className="font-semibold text-blue-900">Mobile Money</p>
                              <p className="text-sm text-blue-700">Pay with MTN Mobile Money or Airtel Money</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mobileNumber" className="text-sm font-medium">Mobile Money Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="mobileNumber" 
                              placeholder="+256 700 123 456" 
                              required 
                              className="h-11 pl-10"
                            />
                          </div>
                        </div>
                      </TabsContent>


                      <TabsContent value="cash" className="space-y-4">
                        <div className="p-4 border rounded-lg bg-orange-50/50 border-orange-200">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-6 w-6 text-orange-600" />
                            <div>
                              <p className="font-semibold text-orange-900">Cash on Delivery</p>
                              <p className="text-sm text-orange-700">Pay when your order is delivered</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            💡 <strong>Tip:</strong> Please have the exact amount ready when your order arrives. 
                            Our delivery team will collect payment upon delivery.
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                    </div>
                  </div>

                  {orderError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">!</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-red-800 font-medium mb-2">Oops! There's an issue with your order</p>
                          <p className="text-red-700 text-sm leading-relaxed">{orderError}</p>
                          {orderError.includes("Insufficient stock") && (
                            <div className="mt-3 p-3 bg-red-100 rounded-lg">
                              <p className="text-red-800 text-sm font-medium mb-1">💡 What you can do:</p>
                              <ul className="text-red-700 text-sm space-y-1">
                                <li>• Reduce the quantity in your cart</li>
                                <li>• Remove the item and try again later</li>
                                <li>• Contact us for availability updates</li>
                              </ul>
                            </div>
                          )}
                          {orderError.includes("out of stock") && (
                            <div className="mt-3 p-3 bg-red-100 rounded-lg">
                              <p className="text-red-800 text-sm font-medium mb-1">💡 What you can do:</p>
                              <ul className="text-red-700 text-sm space-y-1">
                                <li>• Remove this item from your cart</li>
                                <li>• Check back later for restocking</li>
                                <li>• Browse similar products instead</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-6 pt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCurrentStep("details")} 
                      className="flex-1 h-10 text-sm font-semibold"
                    >
                      Back to Details
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-10 text-sm font-semibold" 
                      disabled={!formData.paymentMethod || isPlacingOrder}
                    >
                      {isPlacingOrder ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        "Complete Order"
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {currentStep === "confirmation" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold mb-3">Order Confirmed!</h2>
                  <p className="text-muted-foreground mb-6 text-lg">
                    Thank you for your order. We'll send you a confirmation email shortly.
                  </p>
                  <div className="bg-muted/50 rounded-xl p-6 mb-6 max-w-md mx-auto">
                    <p className="font-semibold text-lg">Order #JC-{Date.now().toString().slice(-6)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Estimated delivery: 2-3 business days within Kampala
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You'll receive updates via SMS and email. For questions, contact us at +256 700 123 456.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full xl:w-80 bg-gray-50 border-t xl:border-t-0 xl:border-l border-gray-200 p-3 lg:p-4">
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <h3 className="text-lg font-semibold">Order Summary</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{state.itemCount} {state.itemCount === 1 ? 'item' : 'items'} in your order</p>
                </div>
                <div className="p-4">
                  {/* Items */}
                  <div className="space-y-4">
                    {state.items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/placeholder.svg'
                              target.onerror = null
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2 mb-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground mb-1">
                            {item.category ? item.category.replace("-", " ") : "General"}
                          </p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(item.price)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  {/* Totals */}
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatPrice(state.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">{formatPrice(10000)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (18%)</span>
                      <span className="font-medium">{formatPrice(Math.round(state.total * 0.18))}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(state.total + 10000 + Math.round(state.total * 0.18))}</span>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="pt-6 border-t mt-6">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <span>🔒 Secure checkout • Free delivery in Kampala</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </Dialog>
  )
}
