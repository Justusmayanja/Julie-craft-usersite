"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Package, Palette, Gem, TreePine, Home, Sparkles, Image as ImageIcon } from "lucide-react"

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
      <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          {/* Section Header Skeleton */}
          <div className="text-center mb-16">
            <div className="h-10 bg-gray-200 rounded-lg w-80 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          
          {/* Categories Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-pulse">
                <div className="w-24 h-24 bg-gray-200 rounded-2xl mx-auto mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && categories.length === 0) {
    return (
      <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 max-w-md mx-auto">
              <Package className="w-16 h-16 mx-auto mb-6 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load categories</h3>
              <p className="text-gray-600">Please try again later or refresh the page.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our carefully curated collection of handmade crafts, each category representing the finest in traditional artistry
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {categories.map((category) => {
            const IconComponent = getCategoryIcon(category.name)
            const colorClasses = getCategoryColor(category.name)
            
            return (
                <Link 
                key={category.id} 
                href={`/categories/${category.id}`}
                className="group block"
              >
                <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 hover:-translate-y-2 cursor-pointer h-full overflow-hidden">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Category Image or Icon */}
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    {category.image_url ? (
                      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-100 group-hover:border-primary/20 transition-all duration-500 shadow-sm">
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          fill
                          sizes="96px"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`w-full h-full ${colorClasses} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 border-2 border-gray-100 shadow-sm group-hover:shadow-md`}>
                        <IconComponent className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  
                  {/* Category Content */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300 mb-3">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-gray-600 leading-relaxed line-clamp-2 text-sm">
                        {category.description}
                      </p>
                    )}
                    
                    {/* Explore Button */}
                    <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="inline-flex items-center text-sm font-medium text-primary group-hover:text-primary/80 transition-colors duration-300">
                        Explore Collection
                        <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  )
}
