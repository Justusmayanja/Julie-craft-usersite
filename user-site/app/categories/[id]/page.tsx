"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Loader2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/contexts/toast-context"

interface Category {
  id: string
  name: string
  description?: string
  image_url?: string
  is_active: boolean
  sort_order?: number
  tags?: string[]
  created_at: string
  updated_at: string
}

export default function CategoryPage() {
  const params = useParams()
  const categoryId = params.id as string
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch(`/api/categories/${categoryId}`)
        if (!response.ok) {
          throw new Error('Category not found')
        }
        const data = await response.json()
        setCategory(data.category)
      } catch (err) {
        console.error('Error fetching category:', err)
        setError('Category not found')
      } finally {
        setLoading(false)
      }
    }

    if (categoryId) {
      fetchCategory()
    }
  }, [categoryId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Loading category...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h1>
          <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Link href="/products">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Category Image */}
            <div className="relative aspect-square max-w-md mx-auto lg:mx-0 rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder.svg'
                    target.onerror = null
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Package className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Category Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-lg text-gray-600 leading-relaxed mb-6">
                    {category.description}
                  </p>
                )}
                {category.tags && category.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {category.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products in this Category */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Products in {category.name}
          </h2>
          <p className="text-gray-600">
            Explore our collection of {category.name.toLowerCase()} products
          </p>
        </div>
        
        {/* Custom filtered products view */}
        <CategoryProducts categoryId={category.id} categoryName={category.name} />
      </div>
    </div>
  )
}

// Component to display products filtered by category
function CategoryProducts({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch products filtered by category_id
        const response = await fetch(`/api/products?category_id=${categoryId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        const data = await response.json()
        
        setProducts(data.products || [])
      } catch (err) {
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [categoryId])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-0">
              <div className="aspect-square w-full bg-gray-200 rounded-t-lg" />
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-600 mb-4">There are no products in this category at the moment.</p>
        <Link href="/products">
          <Button variant="outline">Browse All Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link key={product.id} href={`/product/${product.id}`}>
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
            <CardContent className="p-0 h-full flex flex-col">
              <div className="relative aspect-square w-full rounded-t-lg overflow-hidden bg-gray-100">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder.svg'
                    target.onerror = null
                  }}
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                  {product.isNew && (
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                      New
                    </Badge>
                  )}
                  {product.onSale && (
                    <Badge variant="destructive" className="bg-destructive text-destructive-foreground">
                      Sale
                    </Badge>
                  )}
                  {!product.inStock && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 capitalize">
                    {product.category ? product.category.replace("-", " ") : "General"}
                  </p>
                  <h3 className="font-semibold mb-2 text-balance">{product.name}</h3>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-bold text-primary">
                    UGX {product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      UGX {product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

