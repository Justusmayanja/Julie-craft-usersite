"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, ArrowLeft, Star, Package } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string
  category: string
  stock_quantity: number
  featured: boolean
  materials?: string
  dimensions?: string
  care?: string
  cultural?: string
  isNew?: boolean
  onSale?: boolean
  inStock: boolean
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`)
        if (!response.ok) {
          throw new Error('Product not found')
        }
        const data = await response.json()
        setProduct(data.product)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Product not found')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const handleAddToCart = async () => {
    if (!product) return
    
    try {
      await addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        inStock: product.inStock
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/products">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={product.image || '/placeholder-product.jpg'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Product Badges */}
          <div className="flex flex-wrap gap-2">
            {product.featured && (
              <Badge className="bg-yellow-500 text-white">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}
            {product.isNew && (
              <Badge variant="secondary">New</Badge>
            )}
            {product.onSale && (
              <Badge variant="destructive">On Sale</Badge>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-lg text-gray-600 capitalize">{product.category}</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-primary">
              UGX {product.price.toLocaleString()}
            </span>
            <Badge variant={product.inStock ? "default" : "destructive"}>
              {product.inStock ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600">{product.description}</p>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.materials && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Materials</h4>
                <p className="text-gray-600 text-sm">{product.materials}</p>
              </div>
            )}
            {product.dimensions && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Dimensions</h4>
                <p className="text-gray-600 text-sm">{product.dimensions}</p>
              </div>
            )}
            {product.care && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Care Instructions</h4>
                <p className="text-gray-600 text-sm">{product.care}</p>
              </div>
            )}
            {product.cultural && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Cultural Significance</h4>
                <p className="text-gray-600 text-sm">{product.cultural}</p>
              </div>
            )}
          </div>

          {/* Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label htmlFor="quantity" className="font-semibold">Quantity:</label>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= product.stock_quantity}
                >
                  +
                </Button>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="w-full h-12 text-lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
