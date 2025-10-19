"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/cart-context"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Maximize2 } from "lucide-react"
import Link from "next/link"
import { CheckoutModal } from "@/components/checkout-modal"

export function ShoppingCartPage() {
  const { state, removeItem, updateQuantity, clearCart, hasOutOfStockItems, removeOutOfStockItems } = useCart()
  const [promoCode, setPromoCode] = useState("")
  const [showCheckout, setShowCheckout] = useState(false)

  const formatPrice = (price: number) => {
    return `UGX ${price.toLocaleString()}`
  }

  const handleQuantityChange = (id: string, newQuantity: number) => {
    // Validate quantity range - only enforce minimum of 1, no maximum limit
    const validatedQuantity = Math.max(1, newQuantity)
    
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
      <div className="container mx-auto px-3 sm:px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
            <Link href="/products">
              <Button variant="ghost" size="icon" className="hover:bg-gray-200 h-9 w-9 lg:h-10 lg:w-10">
                <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 truncate">Shopping Cart</h1>
              <p className="text-sm lg:text-lg text-gray-600 mt-1">
                {state.itemCount} {state.itemCount === 1 ? "item" : "items"} in your cart
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-4 lg:space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Cart Items</h2>
          <p className="text-xs lg:text-sm text-gray-600">Review and modify your selected items</p>
          <p className="text-xs text-gray-500 mt-1 hidden sm:block">💡 Tip: You can adjust quantities using the +/- buttons or type directly in the input field (minimum 1)</p>
        </div>
              <div className="p-4 lg:p-6">
                <div className="space-y-4 lg:space-y-6">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-4 lg:gap-6 p-4 lg:p-6 bg-gray-50 rounded-xl">
                      {/* Product Image */}
                      <div className="w-full sm:w-32 lg:w-40 h-32 sm:h-32 lg:h-40 flex-shrink-0 mx-auto sm:mx-0">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg shadow-sm"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 space-y-3 lg:space-y-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1 lg:space-y-2 flex-1 min-w-0">
                            <Badge variant="outline" className="capitalize text-xs">
                              {item.category ? item.category.replace("-", " ") : "General"}
                            </Badge>
                            <h3 className="font-semibold text-base lg:text-lg text-gray-900 line-clamp-2">{item.name}</h3>
                            <p className="text-sm lg:text-lg font-bold text-primary">{formatPrice(item.price)} each</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-8 w-8 lg:h-10 lg:w-10"
                          >
                            <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                          </Button>
                        </div>

                        {!(item.inStock ?? true) && (
                          <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
                            Out of Stock
                          </Badge>
                        )}

                        {/* Quantity Controls and Total */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
                          <div className="flex items-center gap-2 lg:gap-3">
                            <span className="text-xs lg:text-sm font-medium text-gray-700">Quantity:</span>
                            <div className="flex items-center gap-1 lg:gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleQuantityChange(item.id, item.quantity - 1)
                                }}
                                disabled={!(item.inStock ?? true) || item.quantity <= 1}
                                className="h-8 w-8 lg:h-10 lg:w-10 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                title="Decrease quantity"
                              >
                                <Minus className="h-3 w-3 lg:h-4 lg:w-4" />
                              </Button>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value) || 1
                                    if (newQuantity >= 1) {
                                      handleQuantityChange(item.id, newQuantity)
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const newQuantity = parseInt(e.target.value) || 1
                                    handleQuantityChange(item.id, Math.max(1, newQuantity))
                                  }}
                                  className="w-12 lg:w-16 h-8 lg:h-10 text-center font-semibold border-gray-300 focus:border-primary focus:ring-primary text-sm lg:text-base"
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
                                disabled={!(item.inStock ?? true)}
                                className="h-8 w-8 lg:h-10 lg:w-10 hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                                title="Increase quantity"
                              >
                                <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              💡 Type any number above 1
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-base lg:text-lg font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                            <p className="text-xs text-gray-500">({formatPrice(item.price)} each)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-3 mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-gray-200">
                  {hasOutOfStockItems() && (
                    <Button
                      variant="outline"
                      onClick={removeOutOfStockItems}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300 text-sm lg:text-base"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Out of Stock Items
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 text-sm lg:text-base"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 xl:col-span-1">
            <div className="sticky top-4 lg:top-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100">
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Order Summary</h3>
                  <p className="text-xs lg:text-sm text-gray-600">{state.itemCount} items</p>
                </div>
                <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                  {/* Promo Code */}
                  <div className="space-y-2 lg:space-y-3">
                    <label className="text-xs lg:text-sm font-semibold text-gray-700">Promo Code</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter promo code" 
                        value={promoCode} 
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="h-9 lg:h-11 text-sm lg:text-base"
                      />
                      <Button variant="outline" onClick={applyPromoCode} className="h-9 lg:h-11 px-3 lg:px-6 text-sm lg:text-base">
                        Apply
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex justify-between text-xs lg:text-sm">
                      <span className="text-gray-600">Subtotal ({state.itemCount} items)</span>
                      <span className="font-medium">{formatPrice(state.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs lg:text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">{formatPrice(10000)}</span>
                    </div>
                    <div className="flex justify-between text-xs lg:text-sm">
                      <span className="text-gray-600">Tax (18%)</span>
                      <span className="font-medium">{formatPrice(Math.round(state.total * 0.18))}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg lg:text-xl font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-primary">{formatPrice(state.total + 10000 + Math.round(state.total * 0.18))}</span>
                  </div>

                  <Button 
                    className="w-full h-10 lg:h-12 text-sm lg:text-base font-semibold" 
                    onClick={() => setShowCheckout(true)}
                    disabled={hasOutOfStockItems() || state.items.length === 0}
                  >
                    {hasOutOfStockItems() ? 'Remove Out of Stock Items First' : 'Proceed to Checkout'}
                  </Button>

                  <div className="text-center">
                    <Link href="/products">
                      <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm lg:text-base">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>

                  {/* Security Notice */}
                  <div className="pt-3 lg:pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-3 h-3 lg:w-4 lg:h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-xs">🔒 Secure checkout • Free delivery in Kampala</span>
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
