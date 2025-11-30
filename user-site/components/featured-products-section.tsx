"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProductCard, type ProductCardProps } from "@/components/product-card"
import { RefreshCw, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeaturedProduct {
  id: string
  name: string
  price: number
  sale_price?: number | null
  description?: string | null
  image?: string | null
  images?: string[] | null
  featured_image?: string | null
  category?: string | null
  category_name?: string | null
  stock_quantity: number | null
  featured: boolean
  slug?: string | null
  rating?: number | null
  total_sold?: number | null
  inStock?: boolean
  status?: string
}

interface FeaturedProductsSectionProps {
  limit?: number
  showViewAll?: boolean
  className?: string
}

export function FeaturedProductsSection({
  limit = 8,
  showViewAll = true,
  className,
}: FeaturedProductsSectionProps) {
  const [products, setProducts] = useState<FeaturedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/products?featured=true&limit=${limit}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured products')
        }

        const data = await response.json()
        
        if (data.products && data.products.length > 0) {
          // Filter to only show active products (don't filter by stock - show all active products)
          // Treat null/undefined stock_quantity as available
          const activeProducts = data.products
            .filter((p: any) => 
              (p.status === 'active' || !p.status) &&
              (p.stock_quantity === null || p.stock_quantity === undefined || p.stock_quantity >= 0)
            )
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              sale_price: p.sale_price || null,
              description: p.description || null,
              image: p.image || p.image_url || p.featured_image || null,
              images: p.images || null,
              featured_image: p.featured_image || p.image || p.image_url || null,
              category: p.category?.name || p.category_name || p.category || null,
              category_name: p.category?.name || p.category_name || null,
              // Preserve null/undefined, only default to 0 if explicitly needed
              stock_quantity: p.stock_quantity !== null && p.stock_quantity !== undefined ? p.stock_quantity : null,
              featured: p.featured || p.is_featured || false,
              slug: p.slug || null,
              rating: p.rating || null,
              total_sold: p.total_sold || null,
              inStock: p.stock_quantity === null || p.stock_quantity === undefined || p.stock_quantity > 0 || p.inStock === true,
              status: p.status || 'active',
            }))
          setProducts(activeProducts.slice(0, limit))
        } else {
          setProducts([])
        }
      } catch (err) {
        console.error('Error fetching featured products:', err)
        setError(err instanceof Error ? err.message : 'Failed to load featured products')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [limit])

  if (loading) {
    return (
      <section className={cn("py-12 sm:py-16 lg:py-20 bg-white", className)}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="text-center mb-10 sm:mb-12">
            <div className="h-8 w-64 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
          </div>

          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse"
              >
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error && products.length === 0) {
    return (
      <section className={cn("py-12 sm:py-16 lg:py-20 bg-white", className)}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className={cn("py-12 sm:py-16 lg:py-20 bg-white", className)}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-6">No featured products available at the moment.</p>
            {showViewAll && (
              <Link href="/products">
                <Button variant="outline" size="lg">
                  Browse All Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={cn("py-12 sm:py-16 lg:py-20 bg-white", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Discover our handpicked collection of the finest handmade artisan products
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              sale_price={product.sale_price}
              description={product.description}
              image={product.image || product.featured_image}
              images={product.images}
              featured_image={product.featured_image}
              category={product.category || product.category_name}
              stock_quantity={product.stock_quantity}
              featured={product.featured}
              slug={product.slug}
              rating={product.rating}
              total_sold={product.total_sold}
            />
          ))}
        </div>

        {/* View All Button */}
        {showViewAll && (
          <div className="text-center mt-10 sm:mt-12 lg:mt-16">
            <Link href="/products">
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl px-8 py-6 text-base font-semibold hover:bg-gray-50 transition-colors"
              >
                View All Products
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

