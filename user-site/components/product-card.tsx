"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Heart, Eye, Star } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/contexts/toast-context"
import { formatPriceNumber, calculateDiscount } from "@/lib/utils/format-price"
import { truncateText } from "@/lib/utils/truncate-text"
import { cn } from "@/lib/utils"

export interface ProductCardProps {
  id: string
  name: string
  price: number
  sale_price?: number | null
  description?: string | null
  image?: string | null
  images?: string[] | null
  featured_image?: string | null
  category?: string | null
  stock_quantity: number | null
  featured?: boolean
  slug?: string | null
  rating?: number | null
  total_sold?: number | null
  className?: string
}

export function ProductCard({
  id,
  name,
  price,
  sale_price,
  description,
  image,
  images,
  featured_image,
  category,
  stock_quantity,
  featured,
  slug,
  rating,
  total_sold,
  className,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [hoveredImage, setHoveredImage] = useState<string | null>(null)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { addItem } = useCart()
  const toast = useToast()

  // Determine which image to show
  const primaryImage = hoveredImage || featured_image || image || images?.[0] || '/placeholder.svg'
  const secondaryImage = images?.[1] || images?.[0] || null
  const hasMultipleImages = images && images.length > 1

  // Stock status
  // Treat null/undefined as in stock (stock tracking might not be set up)
  // Only mark as out of stock if stock_quantity is explicitly 0
  const isInStock = stock_quantity === null || stock_quantity === undefined || stock_quantity > 0
  const isLowStock = stock_quantity !== null && stock_quantity !== undefined && stock_quantity > 0 && stock_quantity <= 5
  const isBestSeller = total_sold && total_sold > 50

  // Price calculations
  const displayPrice = sale_price && sale_price < price ? sale_price : price
  const hasDiscount = sale_price && sale_price < price
  const discountPercent = hasDiscount ? calculateDiscount(price, sale_price) : 0

  // Product URL
  const productUrl = slug ? `/product/${slug}` : `/product/${id}`

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isInStock) {
      toast.showError("Out of Stock", "This product is currently unavailable.")
      return
    }

    try {
      const success = await addItem({
        id,
        name,
        price: displayPrice,
        image: primaryImage,
        category: category || '',
        inStock: isInStock,
      })

      if (success) {
        toast.showSuccess("Added to Cart!", `${name} has been added to your cart.`)
      } else {
        toast.showError("Unable to Add", "This item is currently out of stock or unavailable.")
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.showError("Error", "Failed to add item to cart. Please try again.")
    }
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
    toast.showSuccess(
      isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
      `${name} has been ${isWishlisted ? 'removed from' : 'added to'} your wishlist.`
    )
  }

  return (
    <div className={cn("group", className)}>
      <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col hover:bg-gray-50/40">
        <Link href={productUrl} className="flex-1 flex flex-col">
          {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={imageError ? '/placeholder.svg' : primaryImage}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-300",
              "group-hover:scale-105"
            )}
            onError={() => setImageError(true)}
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {hasDiscount && (
              <Badge className="bg-red-500 text-white font-semibold px-2 py-1">
                -{discountPercent}%
              </Badge>
            )}
            {featured && (
              <Badge className="bg-yellow-500 text-white font-semibold px-2 py-1">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}
            {isBestSeller && (
              <Badge className="bg-blue-500 text-white font-semibold px-2 py-1">
                Best Seller
              </Badge>
            )}
          </div>

          {/* Stock Badge */}
          {isLowStock && stock_quantity !== null && stock_quantity !== undefined && (
            <Badge className="absolute top-3 right-3 bg-orange-500 text-white font-semibold px-2 py-1 z-10">
              Only {stock_quantity} left
            </Badge>
          )}

          {/* Only show "Out of Stock" badge if stock_quantity is explicitly 0 */}
          {stock_quantity === 0 && (
            <Badge className="absolute top-3 right-3 bg-gray-500 text-white font-semibold px-2 py-1 z-10">
              Out of Stock
            </Badge>
          )}

          {/* Hover Overlay with Quick Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button
                size="sm"
                className="rounded-full bg-white/90 hover:bg-white shadow-lg"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = productUrl
                }}
                aria-label="Quick view"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className={cn(
                  "rounded-full bg-white/90 hover:bg-white shadow-lg",
                  isWishlisted && "bg-red-50 hover:bg-red-100"
                )}
                onClick={handleWishlistToggle}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={cn("w-4 h-4", isWishlisted && "fill-red-500 text-red-500")} />
              </Button>
            </div>
          </div>

          {/* Image Swap on Hover */}
          {hasMultipleImages && secondaryImage && (
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onMouseEnter={() => setHoveredImage(secondaryImage)}
              onMouseLeave={() => setHoveredImage(null)}
            >
              <Image
                src={secondaryImage}
                alt={`${name} - alternate view`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4 sm:p-5">
          {/* Product Name */}
          <h3 className="font-bold text-lg mb-2 line-clamp-1 text-gray-900 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
              {truncateText(description, 100)}
            </p>
          )}

          {/* Rating (if available) */}
          {rating && rating > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < Math.round(rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({rating.toFixed(1)})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold text-gray-900">
              UGX {formatPriceNumber(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                UGX {formatPriceNumber(price)}
              </span>
            )}
          </div>
        </div>
        </Link>
      
        {/* Add to Cart Button - Outside Link to prevent navigation */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <Button
            className="w-full rounded-xl font-semibold py-3 transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleAddToCart}
            disabled={!isInStock}
            aria-label={`Add ${name} to cart`}
            type="button"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}

