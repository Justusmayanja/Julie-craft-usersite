"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/cart-context"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CheckoutModal } from "@/components/checkout-modal"

export function ShoppingCartPage() {
  const { state, removeItem, updateQuantity, clearCart } = useCart()
  const [promoCode, setPromoCode] = useState("")
  const [showCheckout, setShowCheckout] = useState(false)

  const formatPrice = (price: number) => {
    return `UGX ${price.toLocaleString()}`
  }

  const handleQuantityChange = (id: number, newQuantity: number) => {
    // Validate quantity range
    const validatedQuantity = Math.max(1, Math.min(99, newQuantity))
    
    if (validatedQuantity <= 0) {
      removeItem(id)
    } else {
      updateQuantity(id, validatedQuantity)
    }
  }

  const applyPromoCode = () => {
    // Promo code logic would go here
    console.log("Applying promo code:", promoCode)
  }

  if (state.items.length === 0) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-muted rounded-full mb-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Looks like you haven't added any items to your cart yet. Explore our beautiful collection of authentic
              Ugandan crafts.
            </p>
            <Link href="/products">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/products">
              <Button variant="ghost" size="icon" className="hover:bg-gray-200">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-lg text-gray-600 mt-1">
                {state.itemCount} {state.itemCount === 1 ? "item" : "items"} in your cart
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Cart Items */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Cart Items</h2>
          <p className="text-sm text-gray-600">Review and modify your selected items</p>
          <p className="text-xs text-gray-500 mt-1">💡 Tip: You can adjust quantities using the +/- buttons or type directly in the input field (1-99)</p>
        </div>
              <div className="p-6">
                <div className="space-y-6">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex flex-col lg:flex-row gap-6 p-6 bg-gray-50 rounded-xl">
                      {/* Product Image */}
                      <div className="w-full lg:w-40 h-40 flex-shrink-0">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg shadow-sm"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <Badge variant="outline" className="capitalize text-xs">
                              {item.category ? item.category.replace("-", " ") : "General"}
                            </Badge>
                            <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                            <p className="text-lg font-bold text-primary">{formatPrice(item.price)} each</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>

                        {!(item.inStock ?? true) && (
                          <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
                            Out of Stock
                          </Badge>
                        )}

                        {/* Quantity Controls and Total */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">Quantity:</span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleQuantityChange(item.id, item.quantity - 1)
                                }}
                                disabled={!(item.inStock ?? true) || item.quantity <= 1}
                                className="h-10 w-10 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                title="Decrease quantity"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value) || 1
                                    if (newQuantity >= 1 && newQuantity <= 99) {
                                      handleQuantityChange(item.id, newQuantity)
                                    }
                                  }}
                                  className="w-16 h-10 text-center font-semibold border-gray-300 focus:border-primary focus:ring-primary"
                                  disabled={!(item.inStock ?? true)}
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleQuantityChange(item.id, item.quantity + 1)
                                }}
                                disabled={!(item.inStock ?? true) || item.quantity >= 99}
                                className="h-10 w-10 hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                                title="Increase quantity"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                            <p className="text-xs text-gray-500">({formatPrice(item.price)} each)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clear Cart Button */}
                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="xl:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900">Order Summary</h3>
                  <p className="text-sm text-gray-600">{state.itemCount} items</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Promo Code */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">Promo Code</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter promo code" 
                        value={promoCode} 
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="h-11"
                      />
                      <Button variant="outline" onClick={applyPromoCode} className="h-11 px-6">
                        Apply
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({state.itemCount} items)</span>
                      <span className="font-medium">{formatPrice(state.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">{formatPrice(10000)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (18%)</span>
                      <span className="font-medium">{formatPrice(Math.round(state.total * 0.18))}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-primary">{formatPrice(state.total + 10000 + Math.round(state.total * 0.18))}</span>
                  </div>

                  <Button 
                    className="w-full h-12 text-base font-semibold" 
                    onClick={() => setShowCheckout(true)}
                  >
                    Proceed to Checkout
                  </Button>

                  <div className="text-center">
                    <Link href="/products">
                      <Button variant="ghost" className="text-primary hover:text-primary/80">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>

                  {/* Security Notice */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
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
      </div>

      {/* Checkout Modal */}
      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} />}
    </div>
  )
}
