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
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && categories.length === 0) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Unable to load categories at the moment.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {categories.map((category) => {
            const IconComponent = getCategoryIcon(category.name)
            const colorClasses = getCategoryColor(category.name)
            
            return (
              <Link 
                key={category.id} 
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer h-full">
                  {/* Category Image or Icon */}
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    {category.image_url ? (
                      <div className="relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 group-hover:border-primary/20 transition-colors duration-300">
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          fill
                          sizes="80px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`w-full h-full ${colorClasses} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-gray-200`}>
                        <IconComponent className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors duration-300 mb-2">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
