"use client"

import { useState, useEffect, useRef } from "react"
import { CategoryCard } from "./category-card"
import { Loader2, Package } from "lucide-react"

interface Category {
  id: string
  name: string
  description?: string
  image_url?: string | null
  is_active: boolean
  sort_order?: number
  slug?: string | null
  created_at: string
  updated_at: string
}

/**
 * Modern Categories Section Component
 * Displays a responsive grid of category cards with fade-in animation
 */
export function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set())
  const sectionRef = useRef<HTMLElement>(null)

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/categories', {
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })
        
        if (!response.ok) {
          // Check if it's a network error or server error
          if (response.status >= 500) {
            throw new Error('Service temporarily unavailable. Please try again later.')
          }
          throw new Error('Failed to fetch categories')
        }

        const data = await response.json()
        
        // Debug logging
        console.log('Categories API response:', {
          hasCategories: !!data.categories,
          categoriesCount: data.categories?.length || 0,
          total: data.total,
          message: data.message
        })
        
        // Check if we got fallback data
        if (data.message && data.message.includes('fallback')) {
          console.warn('Using fallback data:', data.message)
        }
        
        // API already filters for active categories, but we'll do a final check
        // and sort by sort_order
        const allCategories = data.categories || []
        const activeCategories = allCategories
          .filter((cat: Category) => cat.is_active !== false) // Final safety check
          .sort((a: Category, b: Category) => (a.sort_order || 0) - (b.sort_order || 0))

        console.log('Filtered categories:', {
          total: allCategories.length,
          active: activeCategories.length,
          categories: activeCategories.map(c => ({ id: c.id, name: c.name, is_active: c.is_active }))
        })

        setCategories(activeCategories)
      } catch (err: any) {
        console.error('Error fetching categories:', err)
        
        // Handle different error types
        if (err.name === 'AbortError' || err.name === 'TimeoutError') {
          setError('Request timed out. Please check your connection and try again.')
        } else if (err.message?.includes('fetch')) {
          setError('Unable to connect to server. Please check your internet connection.')
        } else {
          setError(err.message || 'Failed to load categories')
        }
        
        // Fallback to empty array instead of static data
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Intersection Observer for fade-in animation
  useEffect(() => {
    if (loading || categories.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10)
            setVisibleCards((prev) => {
              const newSet = new Set(prev)
              newSet.add(index)
              return newSet
            })
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    const cards = sectionRef.current?.querySelectorAll('[data-index]')
    cards?.forEach((card) => observer.observe(card))

    return () => {
      cards?.forEach((card) => observer.unobserve(card))
    }
  }, [loading, categories])

  // Loading State
  if (loading) {
    return (
      <section 
        className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50"
        aria-label="Categories section loading"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Header Skeleton */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <div className="h-8 sm:h-10 md:h-12 bg-gray-200 rounded-lg w-48 sm:w-64 md:w-80 mx-auto mb-4 animate-pulse" />
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-72 sm:w-80 md:w-96 mx-auto animate-pulse" />
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/5] bg-gray-200" />
                <div className="p-4 sm:p-5 md:p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Error State
  if (error && categories.length === 0) {
    return (
      <section 
        className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50"
        aria-label="Categories section"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Shop by Category
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 max-w-md mx-auto">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-gray-300" aria-hidden="true" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Unable to load categories
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Please try again later or refresh the page.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Empty State (only show if not loading and no error)
  if (!loading && !error && categories.length === 0) {
    return (
      <section 
        className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50"
        aria-label="Categories section"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Shop by Category
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 max-w-md mx-auto">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-gray-300" aria-hidden="true" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No categories available
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Check back soon for new categories.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Main Content
  return (
    <section 
      ref={sectionRef}
      className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50"
      aria-label="Shop by category"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <header className="text-center mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
            Shop by Category
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Discover our carefully curated collection of handmade crafts, each category representing the finest in traditional artistry
          </p>
        </header>

        {/* Categories Grid */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8"
          role="list"
        >
          {categories.map((category, index) => (
            <div
              key={category.id}
              data-index={index}
              role="listitem"
              className={`transition-all duration-700 ease-out ${
                visibleCards.has(index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <CategoryCard
                id={category.id}
                name={category.name}
                description={category.description}
                image_url={category.image_url}
                slug={category.slug}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

