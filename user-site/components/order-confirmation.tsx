"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/contexts/cart-context"
import { CheckCircle, Package, Truck, Mail, ArrowLeft, Home } from "lucide-react"
import type { OrderConfirmation as OrderConfirmationType } from "@/lib/types/order"

export function OrderConfirmation() {
  const { state } = useCart()
  const router = useRouter()
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmationType | null>(null)

  useEffect(() => {
    // Get order confirmation from cart context
    if (state.lastOrder) {
      setOrderConfirmation(state.lastOrder)
    } else {
      // If no order found, redirect to cart
      router.push('/cart')
    }
  }, [state.lastOrder, router])

  if (!orderConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading order confirmation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-pulse">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-3 text-green-700">🎉 Order Confirmed!</h1>
          <p className="text-xl text-green-600 mb-2">
            Thank you for choosing Julie Crafts! 
          </p>
          <p className="text-lg text-muted-foreground">
            Your order has been successfully placed and we're already preparing it for you. 
            You'll receive a confirmation email with all the details shortly.
          </p>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Order Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-semibold">{orderConfirmation.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{orderConfirmation.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg">UGX {orderConfirmation.total_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Payment on Delivery
                  </Badge>
                </div>
              </div>

              {orderConfirmation.estimated_delivery && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                      <p className="font-semibold">{orderConfirmation.estimated_delivery}</p>
                    </div>
                  </div>
                </>
              )}

              {orderConfirmation.tracking_info && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tracking Information</p>
                      <p className="font-semibold">{orderConfirmation.tracking_info}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="text-green-800">✨ What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-green-700">1</span>
                </div>
                <div>
                  <p className="font-semibold text-green-800">Order Processing</p>
                  <p className="text-sm text-green-600">
                    Our team is already working on preparing your beautiful handcrafted items with care
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-green-700">2</span>
                </div>
                <div>
                  <p className="font-semibold text-green-800">Email Confirmation</p>
                  <p className="text-sm text-green-600">
                    You'll receive a detailed confirmation email within the next few minutes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-green-700">3</span>
                </div>
                <div>
                  <p className="font-semibold text-green-800">Delivery</p>
                  <p className="text-sm text-green-600">
                    Your order will be carefully delivered to your address within 3-5 business days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Information */}
        <Card className="mb-8 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Mail className="h-5 w-5" />
              📋 Important Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                💳 Payment on Delivery
              </h4>
              <p className="text-sm text-blue-800">
                No need to worry about payment now! You'll pay for your beautiful handcrafted items when they arrive at your doorstep. Please have the exact amount ready for a smooth delivery experience.
              </p>
            </div>
            
            <div className="bg-green-50 p-5 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                📞 We're Here to Help!
              </h4>
              <p className="text-sm text-green-800">
                Have any questions about your order or need to make changes? Don't hesitate to reach out! We're always happy to help.
                <br />
                <br />
                📧 Email us at{" "}
                <a href="mailto:hello@juliecrafts.ug" className="underline font-medium">
                  hello@juliecrafts.ug
                </a>
                <br />
                📱 Call us at{" "}
                <a href="tel:+256700123456" className="underline font-medium">
                  +256 700 123 456
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/products">
            <Button variant="outline" className="w-full sm:w-auto hover:bg-green-50 hover:border-green-300">
              <ArrowLeft className="mr-2 h-4 w-4" />
              🛍️ Discover More Crafts
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              <Home className="mr-2 h-4 w-4" />
              🏠 Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
