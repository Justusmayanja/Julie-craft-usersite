"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Package } from "lucide-react"
import { normalizeImageUrl } from "@/lib/utils/image-url"

interface CategoryCardProps {
  id: string
  name: string
  description?: string
  image_url?: string | null
  slug?: string | null
  className?: string
}

/**
 * Reusable Category Card Component
 * Displays a single category with image, name, description, and CTA
 */
export function CategoryCard({
  id,
  name,
  description,
  image_url,
  slug,
  className = ""
}: CategoryCardProps) {
  // Use slug if available, otherwise fall back to id
  const categoryPath = slug ? `/categories/${slug}` : `/categories/${id}`
  const normalizedImageUrl = normalizeImageUrl(image_url || null)

  return (
    <Link
      href={categoryPath}
      className={`group block h-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl transition-all duration-300 ${className}`}
      aria-label={`Browse ${name} category`}
    >
      <article className="relative h-full bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
        {/* Image Container - Fixed Aspect Ratio (4:5) */}
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {normalizedImageUrl ? (
            <>
              <Image
                src={normalizedImageUrl}
                alt={name}
                fill
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
                onError={(e) => {
                  // Hide image on error, show fallback
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const container = target.closest('.relative')
                  if (container) {
                    const fallback = container.querySelector('.image-fallback')
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'flex'
                    }
                  }
                }}
              />
              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            // Fallback when no image
            <div className="image-fallback absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Package className="w-16 h-16 text-gray-400" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-4 sm:p-5 md:p-6">
          {/* Category Name */}
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-1">
            {name}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm sm:text-base text-gray-600 mb-4 flex-1 line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">
              {description}
            </p>
          )}

          {/* CTA Button */}
          <div className="mt-auto pt-4 border-t border-gray-100 group-hover:border-primary/20 transition-colors duration-300">
            <span className="inline-flex items-center text-sm sm:text-base font-semibold text-primary group-hover:text-primary/80 transition-colors duration-300">
              Shop Now
              <ArrowRight 
                className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

