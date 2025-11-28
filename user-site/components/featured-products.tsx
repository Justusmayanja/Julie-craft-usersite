"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/contexts/toast-context"
import { ShoppingCart, Star, Eye } from "lucide-react"
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
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addItem } = useCart()
  const toast = useToast()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?featured=true')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        const data = await response.json()
        
        // Check if we got products from the API, otherwise use fallback data
        if (data.products && data.products.length > 0) {
          // Filter out out-of-stock products
          const inStockProducts = data.products.filter((p: Product) => 
            (p.stock_quantity > 0) || (p.inStock === true)
          )
          setProducts(inStockProducts)
        } else {
          // Use fallback data when API returns empty results (only in-stock products)
          console.log('API returned empty products, using fallback data')
          const fallbackProducts = [
            {
              id: '1',
              name: 'Handmade Ceramic Vase',
              price: 45000,
              description: 'Beautiful handcrafted ceramic vase with traditional Ugandan patterns',
              image: '/placeholder.svg',
              category: 'ceramics',
              stock_quantity: 10,
              featured: true,
              inStock: true
            },
            {
              id: '2',
              name: 'Traditional Beaded Necklace',
              price: 25000,
              description: 'Exquisite beaded necklace made with traditional techniques',
              image: '/placeholder.svg',
              category: 'jewelry',
              stock_quantity: 15,
              featured: true,
              inStock: true
            },
            {
              id: '3',
              name: 'Woven Textile Wall Hanging',
              price: 35000,
              description: 'Colorful woven textile perfect for home decoration',
              image: '/placeholder.svg',
              category: 'textiles',
              stock_quantity: 8,
              featured: true,
              inStock: true
            },
            {
              id: '4',
              name: 'Wooden Carved Bowl',
              price: 30000,
              description: 'Hand-carved wooden bowl from local artisans',
              image: '/placeholder.svg',
              category: 'woodwork',
              stock_quantity: 12,
              featured: true,
              inStock: true
            },
            {
              id: '5',
              name: 'Batik Print Scarf',
              price: 20000,
              description: 'Beautiful batik print scarf with African motifs',
              image: '/placeholder.svg',
              category: 'textiles',
              stock_quantity: 20,
              featured: true,
              inStock: true
            },
            {
              id: '6',
              name: 'Clay Pottery Set',
              price: 55000,
              description: 'Complete set of traditional clay pottery for cooking',
              image: '/placeholder.svg',
              category: 'ceramics',
              stock_quantity: 6,
              featured: true,
              inStock: true
            }
          ].filter(p => p.stock_quantity > 0 && p.inStock !== false)
          setProducts(fallbackProducts)
        setError('Using sample data - database not configured')
      }
    } catch (err) {
        console.error('Error fetching products:', err)
        // Fallback to sample products when API fails (only in-stock products)
        const fallbackProducts = [
          {
            id: '1',
            name: 'Handmade Ceramic Vase',
            price: 45000,
            description: 'Beautiful handcrafted ceramic vase with traditional Ugandan patterns',
            image: '/placeholder.svg',
            category: 'ceramics',
            stock_quantity: 10,
            featured: true,
            inStock: true
          },
          {
            id: '2',
            name: 'Traditional Beaded Necklace',
            price: 25000,
            description: 'Exquisite beaded necklace made with traditional techniques',
            image: '/placeholder.svg',
            category: 'jewelry',
            stock_quantity: 15,
            featured: true,
            inStock: true
          },
          {
            id: '3',
            name: 'Woven Textile Wall Hanging',
            price: 35000,
            description: 'Colorful woven textile perfect for home decoration',
            image: '/placeholder.svg',
            category: 'textiles',
            stock_quantity: 8,
            featured: true,
            inStock: true
          },
          {
            id: '4',
            name: 'Wooden Carved Bowl',
            price: 30000,
            description: 'Hand-carved wooden bowl from local artisans',
            image: '/placeholder.svg',
            category: 'woodwork',
            stock_quantity: 12,
            featured: true,
            inStock: true
          },
          {
            id: '5',
            name: 'Batik Print Scarf',
            price: 20000,
            description: 'Beautiful batik print scarf with African motifs',
            image: '/placeholder.svg',
            category: 'textiles',
            stock_quantity: 20,
            featured: true,
            inStock: true
          },
          {
            id: '6',
            name: 'Clay Pottery Set',
            price: 55000,
            description: 'Complete set of traditional clay pottery for cooking',
            image: '/placeholder.svg',
            category: 'ceramics',
            stock_quantity: 6,
            featured: true,
            inStock: true
          }
        ].filter(p => p.stock_quantity > 0 && p.inStock !== false)
        setProducts(fallbackProducts)
        setError('Using sample data - API error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleAddToCart = async (product: Product) => {
    if (!product.inStock) {
      toast.showError("Out of Stock", "This product is currently unavailable.")
      return
    }

    try {
      const success = await addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        inStock: product.stock_quantity > 0
      })

      if (success) {
        toast.showSuccess("Added to Cart!", `${product.name} has been added to your cart.`)
      } else {
        toast.showError("Unable to Add", "This item is currently out of stock or unavailable.")
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.showError("Error", "Failed to add item to cart. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse h-full">
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && products.length === 0) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked collection of the finest handmade artisan products
          </p>
          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Note:</span> Showing sample products. Database connection will be configured for live data.
              </p>
            </div>
          )}
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No featured products available at the moment.</p>
            <Link href="/products">
              <Button className="mt-4">Browse All Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id}>
                  <Card className="group hover:shadow-lg transition-all duration-300 h-full">
                    <div className="relative overflow-hidden rounded-t-lg bg-gray-100">
                      <img
                        src={product.image || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder.svg'
                          target.onerror = null
                        }}
                      />
                      {product.featured && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500 text-white z-10">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                        <Link href={`/product/${product.id}`}>
                          <Button variant="secondary" size="sm" onClick={(e) => e.stopPropagation()}>
                            <Eye className="w-4 h-4 mr-2" />
                            Quick View
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-primary">
                          UGX {product.price.toLocaleString()}
                        </span>
                        <Badge variant={(product.stock_quantity > 0 || product.inStock) ? "default" : "destructive"}>
                          {(product.stock_quantity > 0 || product.inStock) ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock_quantity === 0 && !product.inStock}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Link href={`/product/${product.id}`}>
                          <Button variant="outline" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-center mt-12">
          <Link href="/products">
            <Button variant="outline" size="lg">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}