"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Package, Palette, Gem, TreePine, Home, Sparkles, Image as ImageIcon } from "lucide-react"
import { normalizeImageUrl } from "@/lib/utils/image-url"

interface Category {
  id: string
  name: string
  description?: string
  image_url?: string
  is_active: boolean
  sort_order?: number
  created_at: string
  updated_at: string
}

// Icon mapping for categories
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase()
  if (name.includes('ceramic') || name.includes('pottery')) return Palette
  if (name.includes('textile') || name.includes('fabric') || name.includes('mat')) return Home
  if (name.includes('jewelry') || name.includes('jewellery') || name.includes('bead')) return Gem
  if (name.includes('wood') || name.includes('carving') || name.includes('sculpture')) return TreePine
  return Package // Default icon
}

// Color mapping for categories
const getCategoryColor = (categoryName: string) => {
  const name = categoryName.toLowerCase()
  if (name.includes('ceramic') || name.includes('pottery')) return 'bg-blue-100 text-blue-600'
  if (name.includes('textile') || name.includes('fabric') || name.includes('mat')) return 'bg-green-100 text-green-600'
  if (name.includes('jewelry') || name.includes('jewellery') || name.includes('bead')) return 'bg-purple-100 text-purple-600'
  if (name.includes('wood') || name.includes('carving') || name.includes('sculpture')) return 'bg-yellow-100 text-yellow-600'
  return 'bg-gray-100 text-gray-600' // Default color
}

/**
 * @deprecated Use CategoriesSection instead for a modern, responsive design
 * This component is kept for backward compatibility
 */
export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const data = await response.json()
        setCategories(data.categories || [])
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError('Failed to load categories')
        // Fallback to static categories
        setCategories([
          { id: '1', name: 'Ceramics', description: 'Handmade pottery and ceramic items', image_url: null, is_active: true, created_at: '', updated_at: '' },
          { id: '2', name: 'Textiles', description: 'Traditional fabrics and textiles', image_url: null, is_active: true, created_at: '', updated_at: '' },
          { id: '3', name: 'Jewelry', description: 'Handcrafted jewelry and accessories', image_url: null, is_active: true, created_at: '', updated_at: '' },
          { id: '4', name: 'Woodwork', description: 'Wooden crafts and carvings', image_url: null, is_active: true, created_at: '', updated_at: '' }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Section Header Skeleton */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="h-7 sm:h-8 md:h-10 bg-gray-200 rounded-lg w-48 sm:w-64 md:w-80 mx-auto mb-3 sm:mb-4 animate-pulse"></div>
            <div className="h-4 sm:h-5 md:h-6 bg-gray-200 rounded w-72 sm:w-80 md:w-96 mx-auto animate-pulse"></div>
          </div>
          
          {/* Categories Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center animate-pulse">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-xl sm:rounded-2xl mx-auto mb-5 sm:mb-6"></div>
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2 sm:mb-3"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-full mx-auto mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3 mx-auto mb-4 sm:mb-5"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error && categories.length === 0) {
    return (
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">Shop by Category</h2>
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 max-w-md mx-auto">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-gray-300" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Unable to load categories</h3>
              <p className="text-sm sm:text-base text-gray-600">Please try again later or refresh the page.</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Shop by Category
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Discover our carefully curated collection of handmade crafts, each category representing the finest in traditional artistry
          </p>
        </div>

        {/* Categories Grid - Mobile-first responsive design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {categories.map((category) => {
            const IconComponent = getCategoryIcon(category.name)
            const colorClasses = getCategoryColor(category.name)
            
            return (
              <Link 
                key={category.id} 
                href={`/categories/${category.id}`}
                className="group block w-full"
              >
                <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 text-center hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col overflow-hidden">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                  
                  {/* Category Image or Icon */}
                  <div className="relative w-full mb-4 sm:mb-5 md:mb-6 flex-shrink-0">
                    <div className="relative w-full aspect-square max-w-full mx-auto" style={{ maxWidth: '200px' }}>
                      {category.image_url ? (
                        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-200 transition-all duration-300">
                          {/* Shadow/Glow Effect */}
                          <div className="absolute inset-0 rounded-2xl shadow-md shadow-gray-200/50 group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-300"></div>
                          
                          {/* Image Container with rounded top corners */}
                          <div className="relative w-full h-full overflow-hidden rounded-2xl">
                            {category.image_url && (
                              <Image
                                src={normalizeImageUrl(category.image_url) || '/placeholder.svg'}
                                alt={category.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  // Show icon fallback
                                  const container = target.closest('.relative')
                                  if (container) {
                                    const iconContainer = container.querySelector('.icon-fallback')
                                    if (iconContainer) {
                                      (iconContainer as HTMLElement).style.display = 'flex'
                                    }
                                  }
                                }}
                              />
                            )}
                            
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            {/* Icon Fallback (hidden by default, shown on image error) */}
                            <div className="icon-fallback absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl">
                              <div className={`p-4 sm:p-5 ${colorClasses} rounded-full`}>
                                <IconComponent className="w-10 h-10 sm:w-12 sm:h-12" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`relative w-full h-full rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-md shadow-gray-200/50 group-hover:shadow-xl group-hover:shadow-primary/20 ${colorClasses}`}>
                          {/* Border Ring */}
                          <div className="absolute inset-0 rounded-2xl ring-2 ring-white/50 group-hover:ring-primary/30 transition-all duration-300 pointer-events-none"></div>
                          
                          {/* Icon */}
                          <div className="relative z-10">
                            <IconComponent className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" />
                          </div>
                          
                          {/* Decorative Background Pattern */}
                          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                            <div className="absolute inset-0" style={{
                              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                              backgroundSize: '16px 16px'
                            }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Category Content */}
                  <div className="relative z-10 flex-1 flex flex-col">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300 mb-2 sm:mb-3">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4 sm:mb-5 flex-1">
                        {category.description}
                      </p>
                    )}
                    
                    {/* Explore Button - Orange/primary color with arrow */}
                    <div className="mt-auto pt-3 sm:pt-4 md:pt-6 border-t border-gray-100 group-hover:border-primary/20 transition-colors duration-300">
                      <span className="inline-flex items-center text-sm sm:text-base font-medium text-orange-600 group-hover:text-orange-700 transition-colors duration-300">
                        Explore Collection
                        <svg className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
